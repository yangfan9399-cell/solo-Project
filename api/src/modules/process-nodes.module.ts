import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProcessNode } from '../entities/process-node.entity.js'
import { ProcessNodesService } from '../services/process-nodes.service.js'
import { ProcessNodesController } from '../controllers/process-nodes.controller.js'

@Module({
  imports: [TypeOrmModule.forFeature([ProcessNode])],
  controllers: [ProcessNodesController],
  providers: [ProcessNodesService],
  exports: [ProcessNodesService]
})
export class ProcessNodesModule {}
