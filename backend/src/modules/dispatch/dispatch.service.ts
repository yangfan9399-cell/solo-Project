import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DispatchOrder, DispatchStatus, DispatchSampleType } from '../../entities/dispatch-order.entity';
import { HistoryNode, NodeType } from '../../entities/history-node.entity';
import { Station, StationStatus } from '../../entities/station.entity';
import { StationService } from '../station/station.service';

export interface CreateDispatchDto {
  stationCode?: string;
  stationId?: string;
  reportedStationCode?: string;
  requiredQuantity: number;
  sampleType?: DispatchSampleType;
  remark?: string;
}

export interface AssignDispatcherDto {
  dispatcherId: string;
  dispatcherName: string;
  dispatchedQuantity: number;
}

export interface ArriveStationDto {
  arrivedAt?: Date;
}

@Injectable()
export class DispatchService {
  constructor(
    @InjectRepository(DispatchOrder)
    private dispatchOrderRepository: Repository<DispatchOrder>,
    @InjectRepository(HistoryNode)
    private historyNodeRepository: Repository<HistoryNode>,
    private stationService: StationService,
    private dataSource: DataSource,
  ) {}

  private generateOrderNo(): string {
    const date = new Date();
    const prefix = `DD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${random}`;
  }

  async findAll(status?: DispatchStatus, sampleType?: DispatchSampleType, stationId?: string): Promise<DispatchOrder[]> {
    const query = this.dispatchOrderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.station', 'station')
      .leftJoinAndSelect('order.repairOrder', 'repairOrder')
      .leftJoinAndSelect('order.historyNodes', 'historyNodes');

    if (status) {
      query.andWhere('order.status = :status', { status });
    }
    if (sampleType) {
      query.andWhere('order.sampleType = :sampleType', { sampleType });
    }
    if (stationId) {
      query.andWhere('order.stationId = :stationId', { stationId });
    }

    query.orderBy('order.createdAt', 'DESC');
    query.addOrderBy('historyNodes.createdAt', 'ASC');

    return query.getMany();
  }

  async findOne(id: string): Promise<DispatchOrder> {
    const order = await this.dispatchOrderRepository.findOne({
      where: { id },
      relations: ['station', 'station.bikes', 'repairOrder', 'repairOrder.bike', 'historyNodes'],
    });
    if (!order) {
      throw new NotFoundException('调度单不存在');
    }
    return order;
  }

  async create(dto: CreateDispatchDto): Promise<DispatchOrder> {
    return this.dataSource.transaction(async (manager) => {
      let station: Station | null = null;
      let stationCodeError = false;
      let stationCodeErrorMessage: string | null = null;
      const reportedCode = dto.reportedStationCode || dto.stationCode;

      const isForcedError = dto.sampleType === DispatchSampleType.STATION_ERROR;

      if (isForcedError) {
        stationCodeError = true;
        stationCodeErrorMessage = `站点编号 ${reportedCode} 不存在，请检查或重新绑定站点`;
      } else if (dto.stationId) {
        station = await this.stationService.findOne(dto.stationId);
      } else if (dto.stationCode) {
        const validation = await this.stationService.validateStationCode(dto.stationCode);
        if (validation.valid && validation.station) {
          station = validation.station;
        } else {
          stationCodeError = true;
          stationCodeErrorMessage = validation.message || '站点编号错误';
        }
      } else if (dto.reportedStationCode) {
        stationCodeError = true;
        stationCodeErrorMessage = `站点编号 ${dto.reportedStationCode} 不存在，请检查或重新绑定站点`;
      }

      if (!station && !stationCodeError) {
        throw new BadRequestException('请提供有效的站点信息');
      }

      const order = manager.create(DispatchOrder, {
        orderNo: this.generateOrderNo(),
        stationId: station?.id,
        station,
        reportedStationCode: reportedCode,
        requiredQuantity: dto.requiredQuantity,
        status: DispatchStatus.PENDING,
        sampleType: dto.sampleType,
        stationCodeError,
        stationCodeErrorMessage: stationCodeErrorMessage || undefined,
        remark: dto.remark,
        timeoutMinutes: dto.sampleType === DispatchSampleType.TIMEOUT ? 5 : 30,
      });

      const savedOrder = await manager.save(DispatchOrder, order);

      const historyNode = manager.create(HistoryNode, {
        dispatchOrderId: savedOrder.id,
        nodeType: stationCodeError ? NodeType.STATION_ERROR : NodeType.ALERT,
        title: stationCodeError ? '站点编号错误' : '缺车告警',
        description: stationCodeError
          ? `${stationCodeErrorMessage}\n上报站点编号：${reportedCode}`
          : `站点缺车，需补充 ${dto.requiredQuantity} 辆自行车`,
        operatorName: '系统',
      });
      await manager.save(HistoryNode, historyNode);

      return savedOrder;
    });
  }

  async assignDispatcher(id: string, dto: AssignDispatcherDto): Promise<DispatchOrder> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(DispatchOrder, { where: { id } });
      if (!order) {
        throw new NotFoundException('调度单不存在');
      }
      if (order.stationCodeError) {
        throw new BadRequestException('站点编号错误，无法调度，请先重新绑定站点');
      }
      if (order.status !== DispatchStatus.PENDING) {
        throw new BadRequestException('当前状态不允许分配调度员');
      }

      order.dispatcherId = dto.dispatcherId;
      order.dispatcherName = dto.dispatcherName;
      order.dispatchedQuantity = dto.dispatchedQuantity;
      order.status = DispatchStatus.DISPATCHING;
      const savedOrder = await manager.save(DispatchOrder, order);

      const historyNode = manager.create(HistoryNode, {
        dispatchOrderId: savedOrder.id,
        nodeType: NodeType.DISPATCH_ASSIGNED,
        title: '调度员已分配',
        description: `调度员：${dto.dispatcherName}，调度车辆数：${dto.dispatchedQuantity} 辆`,
        operatorId: dto.dispatcherId,
        operatorName: dto.dispatcherName,
      });
      await manager.save(HistoryNode, historyNode);

      const dispatchStartNode = manager.create(HistoryNode, {
        dispatchOrderId: savedOrder.id,
        nodeType: NodeType.DISPATCH_STARTED,
        title: '开始调度',
        description: '调度员已出发前往站点',
        operatorId: dto.dispatcherId,
        operatorName: dto.dispatcherName,
      });
      await manager.save(HistoryNode, dispatchStartNode);

      return savedOrder;
    });
  }

  async arriveStation(id: string, dto: ArriveStationDto = {}): Promise<DispatchOrder> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(DispatchOrder, { where: { id }, relations: ['station'] });
      if (!order) {
        throw new NotFoundException('调度单不存在');
      }
      if (order.status !== DispatchStatus.DISPATCHING) {
        throw new BadRequestException('当前状态不允许标记到达');
      }

      order.status = DispatchStatus.ARRIVED;
      order.arrivedAt = dto.arrivedAt || new Date();
      const savedOrder = await manager.save(DispatchOrder, order);

      const historyNode = manager.create(HistoryNode, {
        dispatchOrderId: savedOrder.id,
        nodeType: NodeType.ARRIVED,
        title: '调度到达',
        description: `调度车辆已到达站点，准备补车`,
        operatorId: order.dispatcherId,
        operatorName: order.dispatcherName,
      });
      await manager.save(HistoryNode, historyNode);

      return savedOrder;
    });
  }

  async markAsPendingReview(id: string): Promise<DispatchOrder> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(DispatchOrder, { where: { id }, relations: ['station'] });
      if (!order) {
        throw new NotFoundException('调度单不存在');
      }
      if (order.status !== DispatchStatus.ARRIVED) {
        throw new BadRequestException('当前状态不允许提交复核');
      }

      order.status = DispatchStatus.PENDING_REVIEW;
      const savedOrder = await manager.save(DispatchOrder, order);

      if (savedOrder.station) {
        savedOrder.station.status = StationStatus.NORMAL;
        savedOrder.station.currentBikes = Math.min(
          savedOrder.station.capacity,
          savedOrder.station.currentBikes + order.dispatchedQuantity,
        );
        await manager.save(Station, savedOrder.station);
      }

      const historyNode = manager.create(HistoryNode, {
        dispatchOrderId: savedOrder.id,
        nodeType: NodeType.PENDING_REVIEW,
        title: '补车完成，待复核',
        description: `已完成补车 ${order.dispatchedQuantity} 辆，等待复核人确认`,
        operatorId: order.dispatcherId,
        operatorName: order.dispatcherName,
      });
      await manager.save(HistoryNode, historyNode);

      return savedOrder;
    });
  }

  async rebindStation(id: string, newStationCode: string): Promise<DispatchOrder> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(DispatchOrder, { where: { id } });
      if (!order) {
        throw new NotFoundException('调度单不存在');
      }
      if (!order.stationCodeError) {
        throw new BadRequestException('当前调度单不存在站点编号错误');
      }

      const validation = await this.stationService.validateStationCode(newStationCode);
      if (!validation.valid || !validation.station) {
        throw new BadRequestException(validation.message || '新的站点编号仍然无效');
      }

      order.stationId = validation.station.id;
      order.station = validation.station;
      order.stationCodeError = false;
      order.stationCodeErrorMessage = null;
      order.status = DispatchStatus.PENDING;
      const savedOrder = await manager.save(DispatchOrder, order);

      const historyNode = manager.create(HistoryNode, {
        dispatchOrderId: savedOrder.id,
        nodeType: NodeType.STATION_REBIND,
        title: '重新绑定站点',
        description: `原站点编号：${order.reportedStationCode}，新站点：${validation.station.name} (${newStationCode})`,
        operatorName: '系统',
      });
      await manager.save(HistoryNode, historyNode);

      const alertNode = manager.create(HistoryNode, {
        dispatchOrderId: savedOrder.id,
        nodeType: NodeType.ALERT,
        title: '缺车告警',
        description: `站点缺车，需补充 ${order.requiredQuantity} 辆自行车`,
        operatorName: '系统',
      });
      await manager.save(HistoryNode, alertNode);

      return savedOrder;
    });
  }

  async reviewPass(id: string, reviewerId: string, reviewerName: string): Promise<DispatchOrder> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(DispatchOrder, { where: { id }, relations: ['station'] });
      if (!order) {
        throw new NotFoundException('调度单不存在');
      }
      if (order.status !== DispatchStatus.PENDING_REVIEW) {
        throw new BadRequestException('当前状态不允许复核通过');
      }

      order.status = DispatchStatus.COMPLETED;
      order.reviewerId = reviewerId;
      order.reviewerName = reviewerName;
      order.completedAt = new Date();
      const savedOrder = await manager.save(DispatchOrder, order);

      const historyNode = manager.create(HistoryNode, {
        dispatchOrderId: savedOrder.id,
        nodeType: NodeType.REVIEW_PASSED,
        title: '复核通过，已归档',
        description: '复核人确认站点已恢复正常，调度单归档',
        operatorId: reviewerId,
        operatorName: reviewerName,
      });
      await manager.save(HistoryNode, historyNode);

      return savedOrder;
    });
  }

  async reviewReturn(id: string, reviewerId: string, reviewerName: string, reason: string): Promise<DispatchOrder> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(DispatchOrder, { where: { id } });
      if (!order) {
        throw new NotFoundException('调度单不存在');
      }
      if (order.status !== DispatchStatus.PENDING_REVIEW) {
        throw new BadRequestException('当前状态不允许退回');
      }

      order.status = DispatchStatus.RETURNED;
      order.reviewerId = reviewerId;
      order.reviewerName = reviewerName;
      const savedOrder = await manager.save(DispatchOrder, order);

      const historyNode = manager.create(HistoryNode, {
        dispatchOrderId: savedOrder.id,
        nodeType: NodeType.REVIEW_RETURNED,
        title: '复核退回',
        description: `退回原因：${reason}`,
        operatorId: reviewerId,
        operatorName: reviewerName,
      });
      await manager.save(HistoryNode, historyNode);

      return savedOrder;
    });
  }

  async getHistoryNodes(dispatchOrderId: string): Promise<HistoryNode[]> {
    return this.historyNodeRepository.find({
      where: { dispatchOrderId },
      order: { createdAt: 'ASC' },
    });
  }
}
