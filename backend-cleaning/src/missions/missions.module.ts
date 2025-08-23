// src/missions/missions.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CouponsModule } from '../coupons/coupons.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [
    forwardRef(() => CouponsModule),
    forwardRef(() => LoyaltyModule),
  ],
  controllers: [MissionsController],
  providers: [PrismaService, MissionsService],
  exports: [MissionsService],
})
export class MissionsModule {}
