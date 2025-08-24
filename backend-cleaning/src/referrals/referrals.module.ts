// src/referrals/referrals.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { MissionsModule } from '../missions/missions.module';
import { CouponsModule } from '../coupons/coupons.module'; // NOVO: Importar CouponsModule

@Module({
  imports: [
    PrismaModule,
    LoyaltyModule,
    forwardRef(() => MissionsModule),
    forwardRef(() => CouponsModule), // NOVO: Adicionar forwardRef para CouponsModule
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}