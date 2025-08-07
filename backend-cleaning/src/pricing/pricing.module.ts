// backend-cleaning/src/pricing/pricing.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    PrismaModule,
    GeocodingModule,
    forwardRef(() => BookingsModule),
  ],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService], // PricingService é exportado aqui
})
export class PricingModule {}