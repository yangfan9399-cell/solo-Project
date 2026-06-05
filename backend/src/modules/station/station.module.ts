import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StationController } from './station.controller';
import { StationService } from './station.service';
import { Station } from '../../entities/station.entity';
import { Bike } from '../../entities/bike.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Station, Bike])],
  controllers: [StationController],
  providers: [StationService],
  exports: [StationService],
})
export class StationModule {}
