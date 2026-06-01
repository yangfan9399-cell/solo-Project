import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairsService } from './repairs.service';
import { RepairsController } from './repairs.controller';
import { Repair, RepairItem, Accident, Claim } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Repair, RepairItem, Accident, Claim])],
  controllers: [RepairsController],
  providers: [RepairsService],
  exports: [RepairsService],
})
export class RepairsModule {}
