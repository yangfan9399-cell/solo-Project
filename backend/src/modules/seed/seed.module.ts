import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Station } from '../../entities/station.entity';
import { Bike } from '../../entities/bike.entity';
import { User } from '../../entities/user.entity';
import { DispatchOrder } from '../../entities/dispatch-order.entity';
import { RepairOrder } from '../../entities/repair-order.entity';
import { HistoryNode } from '../../entities/history-node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Station, Bike, User, DispatchOrder, RepairOrder, HistoryNode])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
