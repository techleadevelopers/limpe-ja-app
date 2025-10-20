// backend-cleaning/src/pricing/pricing.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { CacheModule } from '../cache/cache.module';
import { BookingsModule } from '../bookings/bookings.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    PrismaModule,
    GeocodingModule,
    CacheModule,
    forwardRef(() => BookingsModule),
    SettingsModule,
  ],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService], // PricingService é exportado aqui
})
export class PricingModule {}
