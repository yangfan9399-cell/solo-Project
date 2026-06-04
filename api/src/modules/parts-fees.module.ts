import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PartsFee } from '../entities/parts-fee.entity.js'
import { PartsFeesService } from '../services/parts-fees.service.js'
import { PartsFeesController } from '../controllers/parts-fees.controller.js'

@Module({
  imports: [TypeOrmModule.forFeature([PartsFee])],
  controllers: [PartsFeesController],
  providers: [PartsFeesService],
  exports: [PartsFeesService]
})
export class PartsFeesModule {}
