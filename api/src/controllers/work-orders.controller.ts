import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common'
import { WorkOrdersService } from '../services/work-orders.service.js'
import {
  CreateWorkOrderDto,
  AssignWorkOrderDto,
  RepairWorkOrderDto,
  DisputeDto,
  AdjustFeeDto
} from '../dto/work-order.dto.js'

@Controller('orders')
export class WorkOrdersController {
  constructor(private readonly service: WorkOrdersService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('faultType') faultType?: string,
    @Query('stationId') stationId?: string,
    @Query('keyword') keyword?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ) {
    return this.service.findAll({ status, faultType, stationId, keyword, startDate, endDate, page, pageSize })
  }

  @Get('stats')
  getStats() {
    return this.service.getStats()
  }

  @Get('review/by-fault-type')
  getReviewByFaultType() {
    return this.service.getReviewByFaultType()
  }

  @Get('review/by-station')
  getReviewByStation() {
    return this.service.getReviewByStation()
  }

  @Get('review/by-repair-duration')
  getReviewByRepairDuration() {
    return this.service.getReviewByRepairDuration()
  }

  @Get('review/by-repeat-count')
  getReviewByRepeatCount() {
    return this.service.getReviewByRepeatCount()
  }

  @Get('review/summary')
  getReviewSummary() {
    return this.service.getReviewSummary()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateWorkOrderDto) {
    return this.service.create(dto)
  }

  @Put(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignWorkOrderDto) {
    return this.service.assign(id, dto)
  }

  @Put(':id/repair')
  repair(@Param('id') id: string, @Body() dto: RepairWorkOrderDto) {
    return this.service.repair(id, dto)
  }

  @Put(':id/submit-settlement')
  submitSettlement(@Param('id') id: string, @Body() body: { operator: string }) {
    return this.service.submitSettlement(id, body.operator)
  }

  @Put(':id/confirm')
  confirm(@Param('id') id: string, @Body() body: { operator: string }) {
    return this.service.confirm(id, body.operator)
  }

  @Put(':id/dispute')
  dispute(@Param('id') id: string, @Body() dto: DisputeDto) {
    return this.service.dispute(id, dto)
  }

  @Put(':id/adjust')
  adjustFee(@Param('id') id: string, @Body() dto: AdjustFeeDto) {
    return this.service.adjustFee(id, dto)
  }

  @Put(':id/return')
  returnOrder(@Param('id') id: string, @Body() body: { operator: string }) {
    return this.service.returnOrder(id, body.operator)
  }
}
