// src/modules/loyalty/loyalty.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { CouponsModule } from '../coupons/coupons.module';
import { MissionsModule } from '../missions/missions.module';
import { ServicesModule } from '../services/services.module';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => UsersModule),
    forwardRef(() => CouponsModule), // Adicionado forwardRef para CouponsModule
    forwardRef(() => MissionsModule), // Adicionado forwardRef para MissionsModule
    ServicesModule,
    ObservabilityModule,
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
