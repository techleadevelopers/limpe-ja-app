// src/referrals/referrals.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { MissionsModule } from '../missions/missions.module';

@Module({
  imports: [
    PrismaModule,
    LoyaltyModule,                           // para LoyaltyService
    forwardRef(() => MissionsModule),        // para MissionsService (evita ciclo)
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
