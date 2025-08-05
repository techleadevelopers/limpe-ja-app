// backend-cleaning/src/pricing/pricing.module.ts
import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { PrismaService } from '../prisma/prisma.service';
import { GeocodingModule } from '../geocoding/geocoding.module'; // Assuming GeocodingModule exists
import { BookingsModule } from '../bookings/bookings.module'; // Assuming BookingsModule exists

@Module({
  imports: [
    GeocodingModule, // For zone lookup
    BookingsModule,  // For demand sensing
  ],
  controllers: [PricingController],
  providers: [PricingService, PrismaService],
  exports: [PricingService], // Export so other modules (e.g., Bookings) can use it
})
export class PricingModule {}