import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Evidence } from '../entities/evidence.entity.js'

@Injectable()
export class EvidencesService {
  constructor(
    @InjectRepository(Evidence)
    private readonly repo: Repository<Evidence>
  ) {}

  async findByOrder(orderId: string) {
    return this.repo.find({ where: { orderId }, order: { createdAt: 'DESC' } })
  }
}
