import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { StationService } from './station.service';
import { Station, StationStatus } from '../../entities/station.entity';

@Controller('api/stations')
export class StationController {
  constructor(private readonly stationService: StationService) {}

  @Get()
  async findAll(
    @Query('district') district?: string,
    @Query('status') status?: StationStatus,
  ): Promise<Station[]> {
    return this.stationService.findAll(district, status);
  }

  @Get('districts')
  async getDistricts(): Promise<string[]> {
    return this.stationService.getDistricts();
  }

  @Get('low-stock')
  async getLowStockStations(): Promise<Station[]> {
    return this.stationService.getLowStockStations();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Station> {
    return this.stationService.findOne(id);
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string): Promise<Station | null> {
    return this.stationService.findByCode(code);
  }

  @Post('validate-code')
  async validateCode(@Body('stationCode') stationCode: string) {
    return this.stationService.validateStationCode(stationCode);
  }

  @Post()
  async create(@Body() data: Partial<Station>): Promise<Station> {
    return this.stationService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Station>): Promise<Station> {
    return this.stationService.update(id, data);
  }
}
