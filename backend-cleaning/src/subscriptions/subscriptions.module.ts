// backend-cleaning/src/subscriptions/subscriptions.module.ts
import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaService } from '../prisma/prisma.service'; // Assuming PrismaService is global or imported
import { BookingsModule } from '../bookings/bookings.module'; // Import if BookingsService is not global
import { PaymentsModule } from '../payments/payments.module'; // Import if PaymentsService is not global
import { QueuesModule } from '../queues/queues.module'; // Import QueuesModule for BullMQ integration

@Module({
  imports: [
    BookingsModule, // Ensure BookingsService is available
    PaymentsModule, // Ensure PaymentsService is available
    QueuesModule,   // Ensure QueuesService and BullMQ are available
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, PrismaService], // PrismaService should be provided here or globally
  exports: [SubscriptionsService], // Export if other modules need to inject SubscriptionsService
})
export class SubscriptionsModule {}