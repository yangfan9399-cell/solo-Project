import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { DispatchOrder } from '../../entities/dispatch-order.entity';
import { HistoryNode } from '../../entities/history-node.entity';
import { Station } from '../../entities/station.entity';
import { Bike } from '../../entities/bike.entity';
import { StationModule } from '../station/station.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DispatchOrder, HistoryNode, Station, Bike]),
    StationModule,
  ],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
