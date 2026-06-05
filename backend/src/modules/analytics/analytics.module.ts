import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DispatchOrder } from '../../entities/dispatch-order.entity';
import { RepairOrder } from '../../entities/repair-order.entity';
import { Station } from '../../entities/station.entity';
import { HistoryNode } from '../../entities/history-node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DispatchOrder, RepairOrder, Station, HistoryNode])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
