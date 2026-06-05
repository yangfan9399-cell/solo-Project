import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RepairOrder, FaultType, RepairStatus } from '../../entities/repair-order.entity';
import { DispatchOrder, DispatchStatus } from '../../entities/dispatch-order.entity';
import { HistoryNode, NodeType } from '../../entities/history-node.entity';
import { Bike, BikeStatus } from '../../entities/bike.entity';

export interface CreateRepairDto {
  dispatchOrderId: string;
  bikeId?: string;
  bikeCode?: string;
  faultType: FaultType;
  faultDescription: string;
  evidenceImages?: string[];
  repairerId: string;
  repairerName: string;
}

export interface StartRepairDto {
  repairerId: string;
  repairerName: string;
}

export interface CompleteRepairDto {
  repairRemark: string;
  cannotRepair?: boolean;
}

@Injectable()
export class RepairService {
  constructor(
    @InjectRepository(RepairOrder)
    private repairOrderRepository: Repository<RepairOrder>,
    @InjectRepository(DispatchOrder)
    private dispatchOrderRepository: Repository<DispatchOrder>,
    @InjectRepository(HistoryNode)
    private historyNodeRepository: Repository<HistoryNode>,
    @InjectRepository(Bike)
    private bikeRepository: Repository<Bike>,
    private dataSource: DataSource,
  ) {}

  private generateRepairNo(): string {
    const date = new Date();
    const prefix = `WX${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${random}`;
  }

  async findAll(status?: RepairStatus, faultType?: FaultType): Promise<RepairOrder[]> {
    const query = this.repairOrderRepository.createQueryBuilder('repair')
      .leftJoinAndSelect('repair.dispatchOrder', 'dispatchOrder')
      .leftJoinAndSelect('repair.bike', 'bike')
      .leftJoinAndSelect('dispatchOrder.station', 'station');

    if (status) {
      query.andWhere('repair.status = :status', { status });
    }
    if (faultType) {
      query.andWhere('repair.faultType = :faultType', { faultType });
    }

    query.orderBy('repair.createdAt', 'DESC');
    return query.getMany();
  }

  async findOne(id: string): Promise<RepairOrder> {
    const repair = await this.repairOrderRepository.findOne({
      where: { id },
      relations: ['dispatchOrder', 'dispatchOrder.station', 'bike'],
    });
    if (!repair) {
      throw new NotFoundException('维修单不存在');
    }
    return repair;
  }

  async findByDispatchOrderId(dispatchOrderId: string): Promise<RepairOrder | null> {
    return this.repairOrderRepository.findOne({
      where: { dispatchOrderId },
      relations: ['dispatchOrder', 'bike'],
    });
  }

  async create(dto: CreateRepairDto): Promise<RepairOrder> {
    return this.dataSource.transaction(async (manager) => {
      const dispatchOrder = await manager.findOne(DispatchOrder, {
        where: { id: dto.dispatchOrderId },
        relations: ['station'],
      });
      if (!dispatchOrder) {
        throw new NotFoundException('调度单不存在');
      }
      if (dispatchOrder.status !== DispatchStatus.ARRIVED && dispatchOrder.status !== DispatchStatus.IN_REPAIR) {
        throw new BadRequestException('当前调度状态不允许创建维修单');
      }

      let bike: Bike | null = null;
      if (dto.bikeId) {
        bike = await manager.findOne(Bike, { where: { id: dto.bikeId } });
      } else if (dto.bikeCode) {
        bike = await manager.findOne(Bike, { where: { bikeCode: dto.bikeCode } });
      }

      const repairOrder = manager.create(RepairOrder, {
        repairNo: this.generateRepairNo(),
        dispatchOrderId: dto.dispatchOrderId,
        dispatchOrder,
        bikeId: bike?.id,
        bike,
        faultType: dto.faultType,
        faultDescription: dto.faultDescription,
        evidenceImages: dto.evidenceImages || [],
        repairerId: dto.repairerId,
        repairerName: dto.repairerName,
        status: RepairStatus.PENDING,
      });

      const savedRepair = await manager.save(RepairOrder, repairOrder);

      dispatchOrder.status = DispatchStatus.IN_REPAIR;
      await manager.save(DispatchOrder, dispatchOrder);

      if (bike) {
        bike.status = BikeStatus.FAULTY;
        await manager.save(Bike, bike);
      }

      const faultHistory = manager.create(HistoryNode, {
        dispatchOrderId: dto.dispatchOrderId,
        nodeType: NodeType.FAULT_REPORTED,
        title: '发现故障',
        description: `故障类型：${this.getFaultTypeLabel(dto.faultType)}\n故障描述：${dto.faultDescription}`,
        operatorId: dto.repairerId,
        operatorName: dto.repairerName,
      });
      await manager.save(HistoryNode, faultHistory);

      return savedRepair;
    });
  }

  async startRepair(id: string, dto: StartRepairDto): Promise<RepairOrder> {
    return this.dataSource.transaction(async (manager) => {
      const repair = await manager.findOne(RepairOrder, { where: { id }, relations: ['dispatchOrder'] });
      if (!repair) {
        throw new NotFoundException('维修单不存在');
      }
      if (repair.status !== RepairStatus.PENDING) {
        throw new BadRequestException('当前状态不允许开始维修');
      }

      repair.status = RepairStatus.IN_PROGRESS;
      repair.repairerId = dto.repairerId;
      repair.repairerName = dto.repairerName;
      const savedRepair = await manager.save(RepairOrder, repair);

      const historyNode = manager.create(HistoryNode, {
        dispatchOrderId: repair.dispatchOrderId,
        nodeType: NodeType.REPAIR_STARTED,
        title: '开始维修',
        description: `维修员：${dto.repairerName}，开始处理故障`,
        operatorId: dto.repairerId,
        operatorName: dto.repairerName,
      });
      await manager.save(HistoryNode, historyNode);

      return savedRepair;
    });
  }

  async completeRepair(id: string, dto: CompleteRepairDto): Promise<RepairOrder> {
    return this.dataSource.transaction(async (manager) => {
      const repair = await manager.findOne(RepairOrder, {
        where: { id },
        relations: ['dispatchOrder', 'bike'],
      });
      if (!repair) {
        throw new NotFoundException('维修单不存在');
      }
      if (repair.status !== RepairStatus.IN_PROGRESS) {
        throw new BadRequestException('当前状态不允许完成维修');
      }

      repair.status = dto.cannotRepair ? RepairStatus.CANNOT_REPAIR : RepairStatus.COMPLETED;
      repair.repairRemark = dto.repairRemark;
      repair.repairedAt = new Date();
      const savedRepair = await manager.save(RepairOrder, repair);

      const dispatchOrder = await manager.findOne(DispatchOrder, {
        where: { id: repair.dispatchOrderId },
      });
      if (dispatchOrder && !dto.cannotRepair) {
        dispatchOrder.status = DispatchStatus.PENDING_REVIEW;
        await manager.save(DispatchOrder, dispatchOrder);
      }

      if (repair.bike && !dto.cannotRepair) {
        repair.bike.status = BikeStatus.NORMAL;
        await manager.save(Bike, repair.bike);
      }

      const historyNode = manager.create(HistoryNode, {
        dispatchOrderId: repair.dispatchOrderId,
        nodeType: dto.cannotRepair ? NodeType.REMARK : NodeType.REPAIR_COMPLETED,
        title: dto.cannotRepair ? '无法维修' : '维修完成',
        description: `维修备注：${dto.repairRemark}`,
        operatorId: repair.repairerId,
        operatorName: repair.repairerName,
      });
      await manager.save(HistoryNode, historyNode);

      if (!dto.cannotRepair) {
        const pendingReviewNode = manager.create(HistoryNode, {
          dispatchOrderId: repair.dispatchOrderId,
          nodeType: NodeType.PENDING_REVIEW,
          title: '待复核',
          description: '维修完成，等待复核人确认',
          operatorId: repair.repairerId,
          operatorName: repair.repairerName,
        });
        await manager.save(HistoryNode, pendingReviewNode);
      }

      return savedRepair;
    });
  }

  private getFaultTypeLabel(type: FaultType): string {
    const labels: Record<FaultType, string> = {
      [FaultType.BRAKE]: '刹车故障',
      [FaultType.TIRE]: '轮胎故障',
      [FaultType.CHAIN]: '链条故障',
      [FaultType.ELECTRIC]: '电气故障',
      [FaultType.STRUCTURE]: '结构故障',
      [FaultType.OTHER]: '其他故障',
    };
    return labels[type] || type;
  }
}
