import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Accident, AccidentStatus, StatusLog, Vehicle } from '../../database/entities';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { UpdateAccidentStatusDto } from './dto/update-accident-status.dto';
import { ScheduleOutOfServiceDto } from './dto/schedule-out-of-service.dto';
import { ConfirmResumeDto } from './dto/confirm-resume.dto';
import { PaginatedResultDto } from '../../shared/dto/paginated-result.dto';

@Injectable()
export class AccidentsService {
  constructor(
    @InjectRepository(Accident)
    private accidentRepository: Repository<Accident>,
    @InjectRepository(StatusLog)
    private statusLogRepository: Repository<StatusLog>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    private dataSource: DataSource,
  ) {}

  async create(createAccidentDto: CreateAccidentDto, reporterId: string): Promise<Accident> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: createAccidentDto.vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException('车辆不存在');
    }

    const reportNo = `ACC${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const accident = this.accidentRepository.create({
      ...createAccidentDto,
      reporterId,
      reportNo,
      accidentTime: new Date(createAccidentDto.accidentTime),
      status: 'pending_review',
    });

    return this.accidentRepository.save(accident);
  }

  async findAll(
    page = 1,
    limit = 10,
    status?: AccidentStatus,
    reporterId?: string,
  ): Promise<PaginatedResultDto<Accident>> {
    const query = this.accidentRepository
      .createQueryBuilder('accident')
      .leftJoinAndSelect('accident.vehicle', 'vehicle')
      .leftJoinAndSelect('accident.reporter', 'reporter')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('accident.createdAt', 'DESC');

    if (status) {
      query.andWhere('accident.status = :status', { status });
    }

    if (reporterId) {
      query.andWhere('accident.reporterId = :reporterId', { reporterId });
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

  async findOne(id: string): Promise<Accident> {
    const accident = await this.accidentRepository
      .createQueryBuilder('accident')
      .leftJoinAndSelect('accident.vehicle', 'vehicle')
      .leftJoinAndSelect('vehicle.dispatcher', 'dispatcher')
      .leftJoinAndSelect('accident.reporter', 'reporter')
      .where('accident.id = :id', { id })
      .getOne();

    if (!accident) {
      throw new NotFoundException('事故记录不存在');
    }

    return accident;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateAccidentStatusDto,
    operatorId: string,
  ): Promise<Accident> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const accident = await this.accidentRepository.findOne({
        where: { id },
      });
      if (!accident) {
        throw new NotFoundException('事故记录不存在');
      }

      const fromStatus = accident.status;
      accident.status = updateStatusDto.status;
      await queryRunner.manager.save(accident);

      const statusLog = this.statusLogRepository.create({
        accidentId: id,
        operatorId,
        fromStatus,
        toStatus: updateStatusDto.status,
        remark: updateStatusDto.remark,
      });
      await queryRunner.manager.save(statusLog);

      if (updateStatusDto.status === 'in_repair' || updateStatusDto.status === 'reviewed') {
        await queryRunner.manager.update(Vehicle, accident.vehicleId, {
          status: 'in_repair',
        });
      } else if (updateStatusDto.status === 'completed') {
        await queryRunner.manager.update(Vehicle, accident.vehicleId, {
          status: 'active',
        });
      }

      await queryRunner.commitTransaction();
      return accident;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getStatusLogs(accidentId: string): Promise<StatusLog[]> {
    return this.statusLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.operator', 'operator')
      .where('log.accidentId = :accidentId', { accidentId })
      .orderBy('log.createdAt', 'DESC')
      .getMany();
  }

  async scheduleOutOfService(
    id: string,
    dto: ScheduleOutOfServiceDto,
    operatorId: string,
  ): Promise<Accident> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const accident = await queryRunner.manager.findOne(Accident, {
        where: { id },
        relations: ['vehicle'],
      });
      if (!accident) {
        throw new NotFoundException('事故记录不存在');
      }

      if (accident.status !== 'reviewed') {
        throw new BadRequestException('只有已审核的事故才能安排停运');
      }

      const fromStatus = accident.status;
      accident.status = 'in_repair';
      await queryRunner.manager.save(accident);

      const vehicleUpdate: Partial<Vehicle> = {
        status: 'in_repair',
        outOfServiceReason: dto.outOfServiceReason,
        outOfServiceTime: new Date(),
        dispatcherId: operatorId,
      };
      if (dto.expectedResumeTime) {
        vehicleUpdate.expectedResumeTime = new Date(dto.expectedResumeTime);
      }

      await queryRunner.manager.update(Vehicle, accident.vehicleId, vehicleUpdate);

      const statusLog = this.statusLogRepository.create({
        accidentId: id,
        operatorId,
        fromStatus,
        toStatus: 'in_repair',
        remark: dto.remark || `停运安排：${dto.outOfServiceReason}`,
      });
      await queryRunner.manager.save(statusLog);

      await queryRunner.commitTransaction();
      return accident;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async confirmResume(
    id: string,
    dto: ConfirmResumeDto,
    operatorId: string,
  ): Promise<Accident> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const accident = await queryRunner.manager.findOne(Accident, {
        where: { id },
        relations: ['vehicle'],
      });
      if (!accident) {
        throw new NotFoundException('事故记录不存在');
      }

      if (accident.status !== 'pending_resume') {
        throw new BadRequestException('只有待复运确认状态的事故才能确认复运');
      }

      const fromStatus = accident.status;
      accident.status = 'completed';
      await queryRunner.manager.save(accident);

      await queryRunner.manager.update(Vehicle, accident.vehicleId, {
        status: 'active',
      });

      const statusLog = this.statusLogRepository.create({
        accidentId: id,
        operatorId,
        fromStatus,
        toStatus: 'completed',
        remark: dto.remark || '确认复运，车辆恢复运营',
      });
      await queryRunner.manager.save(statusLog);

      await queryRunner.commitTransaction();
      return accident;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getStats(): Promise<any> {
    const statusCounts = await this.accidentRepository
      .createQueryBuilder('accident')
      .select('accident.status, COUNT(*) as count')
      .groupBy('accident.status')
      .getRawMany();

    const result: Record<string, number> = {};
    statusCounts.forEach(item => {
      result[item.status] = parseInt(item.count);
    });

    const total = await this.accidentRepository.count();

    return {
      total,
      byStatus: result,
    };
  }
}
