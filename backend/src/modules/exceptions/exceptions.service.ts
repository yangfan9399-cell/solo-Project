import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExceptionEntity, ExceptionStatus } from '../../database/entities';

export interface CreateExceptionDto {
  title: string;
  description?: string;
  accidentId?: string;
}

export interface UpdateExceptionDto {
  status?: ExceptionStatus;
  handlerId?: string;
  description?: string;
}

@Injectable()
export class ExceptionsService {
  constructor(
    @InjectRepository(ExceptionEntity)
    private exceptionRepository: Repository<ExceptionEntity>,
  ) {}

  async create(createExceptionDto: CreateExceptionDto, reporterId: string): Promise<ExceptionEntity> {
    const exception = this.exceptionRepository.create({
      ...createExceptionDto,
      reporterId,
      status: 'pending',
    });

    return this.exceptionRepository.save(exception);
  }

  async findAll(page = 1, limit = 10, status?: ExceptionStatus) {
    const query = this.exceptionRepository
      .createQueryBuilder('exception')
      .leftJoinAndSelect('exception.reporter', 'reporter')
      .leftJoinAndSelect('exception.handler', 'handler')
      .leftJoinAndSelect('exception.accident', 'accident')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('exception.createdAt', 'DESC');

    if (status) {
      query.andWhere('exception.status = :status', { status });
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

  async findOne(id: string): Promise<ExceptionEntity> {
    const exception = await this.exceptionRepository
      .createQueryBuilder('exception')
      .leftJoinAndSelect('exception.reporter', 'reporter')
      .leftJoinAndSelect('exception.handler', 'handler')
      .leftJoinAndSelect('exception.accident', 'accident')
      .where('exception.id = :id', { id })
      .getOne();

    if (!exception) {
      throw new NotFoundException('异常记录不存在');
    }

    return exception;
  }

  async update(id: string, updateExceptionDto: UpdateExceptionDto): Promise<ExceptionEntity> {
    const exception = await this.exceptionRepository.findOne({ where: { id } });
    if (!exception) {
      throw new NotFoundException('异常记录不存在');
    }

    Object.assign(exception, updateExceptionDto);
    return this.exceptionRepository.save(exception);
  }
}
