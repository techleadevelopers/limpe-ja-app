// src/providers/providers.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ProvidersController } from './providers.controller';
import { VerificationModule } from '../verification/verification.module';
import { CacheModule } from '../cache/cache.module';
import { DocumentProcessingModule } from '../document-processing/document-processing.module';
import { SettingsModule } from '../settings/settings.module';
import { MissionsModule } from '../missions/missions.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { EarningsModule } from '../earnings/earnings.module';
import { ProviderPromotionsService } from './provider-promotions.service';
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => UsersModule),
    forwardRef(() => VerificationModule),
    CacheModule,
    DocumentProcessingModule,
    SettingsModule,
    MissionsModule,
    LoyaltyModule,
    forwardRef(() => EarningsModule),
    forwardRef(() => AvailabilityModule),
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService, ProviderPromotionsService],
  exports: [ProvidersService, ProviderPromotionsService],
})
export class ProvidersModule {}
