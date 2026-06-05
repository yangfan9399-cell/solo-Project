import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairController } from './repair.controller';
import { RepairService } from './repair.service';
import { RepairOrder } from '../../entities/repair-order.entity';
import { DispatchOrder } from '../../entities/dispatch-order.entity';
import { HistoryNode } from '../../entities/history-node.entity';
import { Bike } from '../../entities/bike.entity';
import { DispatchModule } from '../dispatch/dispatch.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RepairOrder, DispatchOrder, HistoryNode, Bike]),
    DispatchModule,
  ],
  controllers: [RepairController],
  providers: [RepairService],
  exports: [RepairService],
})
export class RepairModule {}
