import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StationModule } from './modules/station/station.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { RepairModule } from './modules/repair/repair.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UserModule } from './modules/user/user.module';
import { SeedModule } from './modules/seed/seed.module';
import { Station, Bike, DispatchOrder, RepairOrder, HistoryNode, User } from './entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqljs',
      autoSave: false,
      entities: [Station, Bike, DispatchOrder, RepairOrder, HistoryNode, User],
      synchronize: true,
      logging: false,
    }),
    StationModule,
    DispatchModule,
    RepairModule,
    AnalyticsModule,
    UserModule,
    SeedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
