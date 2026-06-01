import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database/database.module';
import { SeedService } from './database/seed.service';
import { AuthModule } from './modules/auth/auth.module';
import { AccidentsModule } from './modules/accidents/accidents.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { RepairsModule } from './modules/repairs/repairs.module';
import { ClaimsModule } from './modules/claims/claims.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { ExceptionsModule } from './modules/exceptions/exceptions.module';
import * as entities from './database/entities';

const entityList = Object.values(entities).filter(
  (e) => typeof e === 'function' && e.prototype !== undefined,
);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    TypeOrmModule.forFeature(entityList),
    AuthModule,
    AccidentsModule,
    VehiclesModule,
    RepairsModule,
    ClaimsModule,
    AttachmentsModule,
    ExceptionsModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
