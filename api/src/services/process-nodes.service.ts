import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProcessNode } from '../entities/process-node.entity.js'

@Injectable()
export class ProcessNodesService {
  constructor(
    @InjectRepository(ProcessNode)
    private readonly repo: Repository<ProcessNode>
  ) {}

  async findByOrder(orderId: string) {
    return this.repo.find({ where: { orderId }, order: { createdAt: 'ASC' } })
  }
}
