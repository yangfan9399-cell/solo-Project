import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Claim, ClaimStatus, Accident, Repair } from '../../database/entities';

export interface CreateClaimDto {
  accidentId: string;
  policyNo?: string;
  claimAmount?: number;
  notes?: string;
}

export interface UpdateClaimDto {
  policyNo?: string;
  claimAmount?: number;
  paidAmount?: number;
  status?: ClaimStatus;
  notes?: string;
}

@Injectable()
export class ClaimsService {
  constructor(
    @InjectRepository(Claim)
    private claimRepository: Repository<Claim>,
    @InjectRepository(Accident)
    private accidentRepository: Repository<Accident>,
    @InjectRepository(Repair)
    private repairRepository: Repository<Repair>,
    private dataSource: DataSource,
  ) {}

  async create(createClaimDto: CreateClaimDto, insuranceSpecialistId: string): Promise<Claim> {
    const claim = this.claimRepository.create({
      ...createClaimDto,
      insuranceSpecialistId,
      status: 'pending_materials',
    });

    return this.claimRepository.save(claim);
  }

  async findByAccident(accidentId: string): Promise<Claim[]> {
    return this.claimRepository
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.insuranceSpecialist', 'insuranceSpecialist')
      .where('claim.accidentId = :accidentId', { accidentId })
      .orderBy('claim.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Claim> {
    const claim = await this.claimRepository
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.insuranceSpecialist', 'insuranceSpecialist')
      .where('claim.id = :id', { id })
      .getOne();

    if (!claim) {
      throw new NotFoundException('理赔记录不存在');
    }

    return claim;
  }

  async update(id: string, updateClaimDto: UpdateClaimDto): Promise<Claim> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const claim = await queryRunner.manager.findOne(Claim, { where: { id } });
      if (!claim) {
        throw new NotFoundException('理赔记录不存在');
      }

      Object.assign(claim, updateClaimDto);
      const savedClaim = await queryRunner.manager.save(claim);

      if (updateClaimDto.status === 'paid') {
        const repair = await queryRunner.manager.findOne(Repair, {
          where: { accidentId: claim.accidentId },
        });

        if (repair && repair.status === 'completed') {
          await queryRunner.manager.update(Accident, claim.accidentId, {
            status: 'pending_resume',
          });
        }
      }

      await queryRunner.commitTransaction();
      return savedClaim;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(page = 1, limit = 10, status?: ClaimStatus) {
    const query = this.claimRepository
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.insuranceSpecialist', 'insuranceSpecialist')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('claim.createdAt', 'DESC');

    if (status) {
      query.andWhere('claim.status = :status', { status });
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
