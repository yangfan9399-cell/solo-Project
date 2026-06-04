import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WorkOrdersModule } from './modules/work-orders.module.js'
import { PartsFeesModule } from './modules/parts-fees.module.js'
import { ProcessNodesModule } from './modules/process-nodes.module.js'
import { EvidencesModule } from './modules/evidences.module.js'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'yangfan',
      password: '',
      database: 'charging_pile_platform',
      synchronize: true,
      autoLoadEntities: true
    }),
    WorkOrdersModule,
    PartsFeesModule,
    ProcessNodesModule,
    EvidencesModule
  ]
})
export class AppModule {}
