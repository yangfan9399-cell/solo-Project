import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Repair, RepairItem, RepairStatus, Accident, Claim, Vehicle } from '../../database/entities';

export interface CreateRepairDto {
  accidentId: string;
  estimatedCost?: number;
  estimatedEndTime?: string;
  notes?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface UpdateRepairDto {
  estimatedCost?: number;
  actualCost?: number;
  startTime?: string;
  estimatedEndTime?: string;
  actualEndTime?: string;
  status?: RepairStatus;
  notes?: string;
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
}

@Injectable()
export class RepairsService {
  constructor(
    @InjectRepository(Repair)
    private repairRepository: Repository<Repair>,
    @InjectRepository(RepairItem)
    private repairItemRepository: Repository<RepairItem>,
    @InjectRepository(Accident)
    private accidentRepository: Repository<Accident>,
    @InjectRepository(Claim)
    private claimRepository: Repository<Claim>,
    private dataSource: DataSource,
  ) {}

  async create(createRepairDto: CreateRepairDto, repairManagerId: string): Promise<Repair> {
    const items = createRepairDto.items.map(item => ({
      ...item,
      subtotal: item.quantity * item.unitPrice,
    }));

    const estimatedCost = items.reduce((sum, item) => sum + item.subtotal, 0);

    const repair = this.repairRepository.create({
      accidentId: createRepairDto.accidentId,
      repairManagerId,
      estimatedCost,
      estimatedEndTime: createRepairDto.estimatedEndTime ? new Date(createRepairDto.estimatedEndTime) : null,
      notes: createRepairDto.notes,
      status: 'pending',
      items,
    });

    return this.repairRepository.save(repair);
  }

  async findByAccident(accidentId: string): Promise<Repair[]> {
    return this.repairRepository
      .createQueryBuilder('repair')
      .leftJoinAndSelect('repair.items', 'items')
      .leftJoinAndSelect('repair.repairManager', 'repairManager')
      .where('repair.accidentId = :accidentId', { accidentId })
      .orderBy('repair.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Repair> {
    const repair = await this.repairRepository
      .createQueryBuilder('repair')
      .leftJoinAndSelect('repair.items', 'items')
      .leftJoinAndSelect('repair.repairManager', 'repairManager')
      .where('repair.id = :id', { id })
      .getOne();

    if (!repair) {
      throw new NotFoundException('维修记录不存在');
    }

    return repair;
  }

  async update(id: string, updateRepairDto: UpdateRepairDto): Promise<Repair> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repair = await queryRunner.manager.findOne(Repair, { where: { id }, relations: ['items', 'accident'] });
      if (!repair) {
        throw new NotFoundException('维修记录不存在');
      }

      if (updateRepairDto.startTime) {
        repair.startTime = new Date(updateRepairDto.startTime);
      }
      if (updateRepairDto.actualEndTime) {
        repair.actualEndTime = new Date(updateRepairDto.actualEndTime);
      }
      if (updateRepairDto.actualCost !== undefined) {
        repair.actualCost = updateRepairDto.actualCost;
      }
      if (updateRepairDto.status) {
        repair.status = updateRepairDto.status;
      }
      if (updateRepairDto.notes !== undefined) {
        repair.notes = updateRepairDto.notes;
      }
      if (updateRepairDto.estimatedCost !== undefined) {
        repair.estimatedCost = updateRepairDto.estimatedCost;
      }
      if (updateRepairDto.estimatedEndTime) {
        repair.estimatedEndTime = new Date(updateRepairDto.estimatedEndTime);
      }

      if (updateRepairDto.items) {
        await queryRunner.manager.delete(RepairItem, { repairId: id });
        
        const newItems = updateRepairDto.items.map(item => ({
          ...item,
          subtotal: item.quantity * item.unitPrice,
          repairId: id,
        }));
        
        await queryRunner.manager.save(RepairItem, newItems);
        
        const newEstimatedCost = newItems.reduce((sum, item) => sum + item.subtotal, 0);
        repair.estimatedCost = newEstimatedCost;
      }

      const savedRepair = await queryRunner.manager.save(repair);

      if (updateRepairDto.status === 'in_progress') {
        await queryRunner.manager.update(Vehicle, { id: repair.accident.vehicleId }, {
          status: 'in_repair',
        });
      }

      if (updateRepairDto.status === 'completed') {
        const claim = await queryRunner.manager.findOne(Claim, {
          where: { accidentId: repair.accidentId },
        });

        if (claim && claim.status === 'paid') {
          await queryRunner.manager.update(Accident, repair.accidentId, {
            status: 'pending_resume',
          });
        }
      }

      await queryRunner.commitTransaction();
      return savedRepair;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(page = 1, limit = 10, status?: RepairStatus) {
    const query = this.repairRepository
      .createQueryBuilder('repair')
      .leftJoinAndSelect('repair.items', 'items')
      .leftJoinAndSelect('repair.repairManager', 'repairManager')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('repair.createdAt', 'DESC');

    if (status) {
      query.andWhere('repair.status = :status', { status });
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
