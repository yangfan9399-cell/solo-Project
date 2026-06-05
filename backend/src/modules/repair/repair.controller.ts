import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { RepairService, CreateRepairDto, StartRepairDto, CompleteRepairDto } from './repair.service';
import { RepairOrder, FaultType, RepairStatus } from '../../entities/repair-order.entity';

@Controller('api/repair-orders')
export class RepairController {
  constructor(private readonly repairService: RepairService) {}

  @Get()
  async findAll(
    @Query('status') status?: RepairStatus,
    @Query('faultType') faultType?: FaultType,
  ): Promise<RepairOrder[]> {
    return this.repairService.findAll(status, faultType);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RepairOrder> {
    return this.repairService.findOne(id);
  }

  @Get('dispatch/:dispatchOrderId')
  async findByDispatchOrderId(@Param('dispatchOrderId') dispatchOrderId: string): Promise<RepairOrder | null> {
    return this.repairService.findByDispatchOrderId(dispatchOrderId);
  }

  @Post()
  async create(@Body() dto: CreateRepairDto): Promise<RepairOrder> {
    return this.repairService.create(dto);
  }

  @Put(':id/start')
  async startRepair(
    @Param('id') id: string,
    @Body() dto: StartRepairDto,
  ): Promise<RepairOrder> {
    return this.repairService.startRepair(id, dto);
  }

  @Put(':id/complete')
  async completeRepair(
    @Param('id') id: string,
    @Body() dto: CompleteRepairDto,
  ): Promise<RepairOrder> {
    return this.repairService.completeRepair(id, dto);
  }
}
