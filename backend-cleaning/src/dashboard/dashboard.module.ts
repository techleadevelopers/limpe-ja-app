import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ProvidersModule } from '../providers/providers.module';
import { BookingsModule } from '../bookings/bookings.module';
import { EarningsModule } from '../earnings/earnings.module';

@Module({
  imports: [
    ProvidersModule,
    BookingsModule,
    EarningsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}