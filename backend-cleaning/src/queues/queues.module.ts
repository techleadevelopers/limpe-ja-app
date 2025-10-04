import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module, forwardRef } from '@nestjs/common';
import { DisputeModule } from '../disputes/dispute.module';
import { DocumentProcessingModule } from '../document-processing/document-processing.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProvidersModule } from '../providers/providers.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { VerificationModule } from '../verification/verification.module';
import { QueuesService } from './queues.service';
import { DisputeWorker } from './workers/dispute.worker';
import { PayoutWorker } from './workers/payout.worker';
import { PayoutsModule } from '../payouts/payouts.module';
import { NotificationWorker } from './workers/notification.worker';
import { VerificationWorker } from './workers/verification.worker';
// ✅ importe seu módulo de i18n
import { I18nModule } from '../common/i18n/i18n.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'verification' },
      { name: 'notifications' },
      { name: 'disputes' },
      { name: 'data_export' },
      { name: 'subscription-generation' },
      { name: 'emails' }, // FIX: Adicionada a fila 'emails'
      { name: 'support-escalations' }, // <-- ADICIONADO: Registro da fila de escalonamento de suporte
      { name: 'payouts' },
    ),
    PrismaModule,
    HttpModule,
    forwardRef(() => ProvidersModule),
    DocumentProcessingModule,
    NotificationsModule,
    forwardRef(() => VerificationModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => DisputeModule),
    forwardRef(() => PayoutsModule),
    I18nModule, // ✅ garante I18nService aqui também
  ],
  controllers: [],
  providers: [QueuesService, VerificationWorker, NotificationWorker, DisputeWorker, PayoutWorker],
  exports: [QueuesService, BullModule],
})
export class QueuesModule {}
