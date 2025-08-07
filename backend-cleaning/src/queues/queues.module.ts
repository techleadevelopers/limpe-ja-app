// backend-cleaning/src/queues/queues.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueuesService } from './queues.service';
import { VerificationWorker } from './workers/verification.worker';
import { NotificationWorker } from './workers/notification.worker';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VerificationModule } from '../verification/verification.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ProvidersModule } from '../providers/providers.module'; // <-- ADICIONEI ESTA LINHA
import { DocumentProcessingModule } from '../document-processing/document-processing.module'; // <-- ADICIONEI ESTA LINHA
import { HttpModule } from '@nestjs/axios'; // <-- ADICIONEI ESTA LINHA

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'verification' },
      { name: 'notifications' },
      { name: 'disputes' },
      { name: 'data_export' },
      { name: 'subscription-generation' },
    ),
    NotificationsModule,
    PrismaModule,
    forwardRef(() => VerificationModule),
    forwardRef(() => SubscriptionsModule),
    HttpModule, // <-- ADICIONEI ESTA LINHA
    ProvidersModule, // <-- ADICIONEI ESTA LINHA
    DocumentProcessingModule, // <-- ADICIONEI ESTA LINHA
  ],
  controllers: [],
  providers: [
    QueuesService,
    VerificationWorker,
    NotificationWorker,
  ],
  exports: [QueuesService, BullModule],
})
export class QueuesModule {}