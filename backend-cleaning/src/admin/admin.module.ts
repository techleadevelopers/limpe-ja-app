import { Module, forwardRef } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueuesModule } from '../queues/queues.module';
import { AdminQueuesController } from './admin-queues.controller';
import { SettingsModule } from '../settings/settings.module';
import { AdminSettingsController } from './admin-settings.controller';
import { PaymentsModule } from '../payments/payments.module';
import { BookingsModule } from '../bookings/bookings.module';
import { AdminPaymentsController } from './admin-payments.controller';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => QueuesModule),
    SettingsModule,
    forwardRef(() => PaymentsModule),
    forwardRef(() => BookingsModule),
  ],
  controllers: [
    AdminDashboardController,
    AdminQueuesController,
    AdminSettingsController,
    AdminPaymentsController,
  ],
  providers: [AdminDashboardService],
})
export class AdminModule {}
