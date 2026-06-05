import { Controller, Get } from '@nestjs/common';
import { AnalyticsService, OverallStats, DistrictStats, FaultTypeStats, ResponseTimeStats } from './analytics.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overall')
  async getOverallStats(): Promise<OverallStats> {
    return this.analyticsService.getOverallStats();
  }

  @Get('district')
  async getDistrictStats(): Promise<DistrictStats[]> {
    return this.analyticsService.getDistrictStats();
  }

  @Get('fault-type')
  async getFaultTypeStats(): Promise<FaultTypeStats[]> {
    return this.analyticsService.getFaultTypeStats();
  }

  @Get('response-time')
  async getResponseTimeStats(): Promise<ResponseTimeStats[]> {
    return this.analyticsService.getResponseTimeStats();
  }
}
