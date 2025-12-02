import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ProvidersModule } from '../providers/providers.module';
import { BookingsModule } from '../bookings/bookings.module';
import { EarningsModule } from '../earnings/earnings.module';
import { ReviewsModule } from '../reviews/reviews.module'; // Importe o ReviewsModule aqui
import { NotificationsModule } from '../notifications/notifications.module'; // Import NotificationsModule

@Module({
  imports: [
    ProvidersModule,
    BookingsModule,
    EarningsModule,
    ReviewsModule, // Adicione o ReviewsModule à lista de imports
    NotificationsModule, // Add NotificationsModule
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
