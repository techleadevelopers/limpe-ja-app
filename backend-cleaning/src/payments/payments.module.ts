// src/payments/payments.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsWebhooksController } from './payments.webhooks.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProvidersModule } from '../providers/providers.module';
import { BookingsModule } from '../bookings/bookings.module';
import { CouponsModule } from '../coupons/coupons.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { QueuesModule } from '../queues/queues.module';
import { PayoutsModule } from '../payouts/payouts.module';
import { ConnectModule } from '../connect/connect.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => ProvidersModule),
    forwardRef(() => BookingsModule),
    CouponsModule,
    NotificationsModule,
    EmailModule,
    CacheModule,
    forwardRef(() => QueuesModule),
    forwardRef(() => PayoutsModule),
    ConnectModule,
  ],
  controllers: [PaymentsController, PaymentsWebhooksController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
