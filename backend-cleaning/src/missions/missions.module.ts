// src/missions/missions.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CouponsModule } from '../coupons/coupons.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { MissionEventCleanupJob } from './mission-event-cleanup.job';
import { MissionsProgressService } from './progress.service'; // Importar MissionsProgressService
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    // PrismaModule, // <<-- FIXED: Removed PrismaModule as it's not a module to import this way
    forwardRef(() => CouponsModule),
    forwardRef(() => LoyaltyModule),
    ServicesModule,
  ],
  controllers: [MissionsController],
  providers: [
    MissionsService,
    MissionsProgressService, // ADICIONAR MissionsProgressService
    MissionEventCleanupJob,
    PrismaService, // Garantir que PrismaService esteja disponível para MissionsProgressService
  ],
  exports: [MissionsService],
})
export class MissionsModule {}
