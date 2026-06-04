import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common'
import { PartsFeesService } from '../services/parts-fees.service.js'
import { CreatePartsFeeDto } from '../dto/work-order.dto.js'

@Controller('parts-fees')
export class PartsFeesController {
  constructor(private readonly service: PartsFeesService) {}

  @Get(':orderId')
  findByOrder(@Param('orderId') orderId: string) {
    return this.service.findByOrder(orderId)
  }

  @Post()
  create(@Body() dto: CreatePartsFeeDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.service.update(id, body)
  }
}
