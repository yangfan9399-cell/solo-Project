import { Controller, Get, Param } from '@nestjs/common'
import { EvidencesService } from '../services/evidences.service.js'

@Controller('evidences')
export class EvidencesController {
  constructor(private readonly service: EvidencesService) {}

  @Get(':orderId')
  findByOrder(@Param('orderId') orderId: string) {
    return this.service.findByOrder(orderId)
  }
}
