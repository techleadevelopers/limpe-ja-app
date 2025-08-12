// src/referrals/referrals.module.ts
import { Module } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LoyaltyModule } from '../loyalty/loyalty.module'; // Importa o LoyaltyModule

@Module({
  imports: [
    PrismaModule,
    LoyaltyModule, // <--- CORREÇÃO: Adicione o LoyaltyModule para resolver a dependência de LoyaltyService
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
