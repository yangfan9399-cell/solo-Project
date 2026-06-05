import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { DispatchService, CreateDispatchDto, AssignDispatcherDto, ArriveStationDto } from './dispatch.service';
import { DispatchOrder, DispatchStatus, DispatchSampleType } from '../../entities/dispatch-order.entity';
import { HistoryNode } from '../../entities/history-node.entity';

@Controller('api/dispatch-orders')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Get()
  async findAll(
    @Query('status') status?: DispatchStatus,
    @Query('sampleType') sampleType?: DispatchSampleType,
    @Query('stationId') stationId?: string,
  ): Promise<DispatchOrder[]> {
    return this.dispatchService.findAll(status, sampleType, stationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<DispatchOrder> {
    return this.dispatchService.findOne(id);
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string): Promise<HistoryNode[]> {
    return this.dispatchService.getHistoryNodes(id);
  }

  @Post()
  async create(@Body() dto: CreateDispatchDto): Promise<DispatchOrder> {
    return this.dispatchService.create(dto);
  }

  @Put(':id/assign')
  async assignDispatcher(
    @Param('id') id: string,
    @Body() dto: AssignDispatcherDto,
  ): Promise<DispatchOrder> {
    return this.dispatchService.assignDispatcher(id, dto);
  }

  @Put(':id/arrive')
  async arriveStation(
    @Param('id') id: string,
    @Body() dto?: ArriveStationDto,
  ): Promise<DispatchOrder> {
    return this.dispatchService.arriveStation(id, dto);
  }

  @Put(':id/pending-review')
  async markAsPendingReview(@Param('id') id: string): Promise<DispatchOrder> {
    return this.dispatchService.markAsPendingReview(id);
  }

  @Put(':id/rebind-station')
  async rebindStation(
    @Param('id') id: string,
    @Body('newStationCode') newStationCode: string,
  ): Promise<DispatchOrder> {
    return this.dispatchService.rebindStation(id, newStationCode);
  }

  @Put(':id/review-pass')
  async reviewPass(
    @Param('id') id: string,
    @Body('reviewerId') reviewerId: string,
    @Body('reviewerName') reviewerName: string,
  ): Promise<DispatchOrder> {
    return this.dispatchService.reviewPass(id, reviewerId, reviewerName);
  }

  @Put(':id/review-return')
  async reviewReturn(
    @Param('id') id: string,
    @Body('reviewerId') reviewerId: string,
    @Body('reviewerName') reviewerName: string,
    @Body('reason') reason: string,
  ): Promise<DispatchOrder> {
    return this.dispatchService.reviewReturn(id, reviewerId, reviewerName, reason);
  }
}
