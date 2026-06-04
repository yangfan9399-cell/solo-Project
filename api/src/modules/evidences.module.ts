import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Evidence } from '../entities/evidence.entity.js'
import { EvidencesService } from '../services/evidences.service.js'
import { EvidencesController } from '../controllers/evidences.controller.js'

@Module({
  imports: [TypeOrmModule.forFeature([Evidence])],
  controllers: [EvidencesController],
  providers: [EvidencesService],
  exports: [EvidencesService]
})
export class EvidencesModule {}
