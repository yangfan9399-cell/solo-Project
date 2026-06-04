import { Controller, Get, Param } from '@nestjs/common'
import { ProcessNodesService } from '../services/process-nodes.service.js'

@Controller('process-nodes')
export class ProcessNodesController {
  constructor(private readonly service: ProcessNodesService) {}

  @Get(':orderId')
  findByOrder(@Param('orderId') orderId: string) {
    return this.service.findByOrder(orderId)
  }
}
