import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccidentsService } from './accidents.service';
import { AccidentsController } from './accidents.controller';
import { Accident, StatusLog, Vehicle } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Accident, StatusLog, Vehicle])],
  controllers: [AccidentsController],
  providers: [AccidentsService],
  exports: [AccidentsService],
})
export class AccidentsModule {}
