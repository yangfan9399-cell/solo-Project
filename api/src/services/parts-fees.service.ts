import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PartsFee } from '../entities/parts-fee.entity.js'
import { CreatePartsFeeDto } from '../dto/work-order.dto.js'

@Injectable()
export class PartsFeesService {
  constructor(
    @InjectRepository(PartsFee)
    private readonly repo: Repository<PartsFee>
  ) {}

  async findByOrder(orderId: string) {
    return this.repo.find({ where: { orderId } })
  }

  async create(dto: CreatePartsFeeDto) {
    const subtotal = dto.quantity * dto.unitPrice
    const fee = this.repo.create({
      orderId: dto.orderId,
      partName: dto.partName,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      subtotal,
      isDisputed: dto.isDisputed || false,
      disputeReason: dto.disputeReason || null
    })
    return this.repo.save(fee)
  }

  async update(id: string, data: Record<string, any>) {
    const fee = await this.repo.findOne({ where: { id } })
    if (!fee) throw new Error('配件费用记录不存在')

    if (data.partName !== undefined) fee.partName = data.partName
    if (data.quantity !== undefined) fee.quantity = data.quantity
    if (data.unitPrice !== undefined) fee.unitPrice = data.unitPrice
    if (data.isDisputed !== undefined) fee.isDisputed = data.isDisputed
    if (data.disputeReason !== undefined) fee.disputeReason = data.disputeReason

    fee.subtotal = fee.quantity * fee.unitPrice
    return this.repo.save(fee)
  }
}
