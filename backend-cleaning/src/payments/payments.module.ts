// src/payments/payments.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller2';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProvidersModule } from '../providers/providers.module';
import { BookingsModule } from '../bookings/bookings.module';
import { CouponsModule } from '../coupons/coupons.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { QueuesModule } from '../queues/queues.module';
import { PayoutsModule } from '../payouts/payouts.module';

@Module({
  imports: [
    PrismaModule,
    ProvidersModule,
    forwardRef(() => BookingsModule),
    CouponsModule,
    NotificationsModule,
    EmailModule,
    forwardRef(() => QueuesModule),
    forwardRef(() => PayoutsModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
