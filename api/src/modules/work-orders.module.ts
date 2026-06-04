import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WorkOrder } from '../entities/work-order.entity.js'
import { PartsFee } from '../entities/parts-fee.entity.js'
import { LaborFee } from '../entities/labor-fee.entity.js'
import { ProcessNode } from '../entities/process-node.entity.js'
import { Evidence } from '../entities/evidence.entity.js'
import { WorkOrdersService } from '../services/work-orders.service.js'
import { WorkOrdersController } from '../controllers/work-orders.controller.js'

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder, PartsFee, LaborFee, ProcessNode, Evidence])],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService]
})
export class WorkOrdersModule {}
