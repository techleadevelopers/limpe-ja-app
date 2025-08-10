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
import { ProvidersModule } from '../providers/providers.module';
import { DocumentProcessingModule } from '../document-processing/document-processing.module';
import { HttpModule } from '@nestjs/axios';

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
    NotificationsModule, // Importado para que NotificationsService possa ser injetado
    PrismaModule,
    forwardRef(() => VerificationModule),
    forwardRef(() => SubscriptionsModule),
    HttpModule,
    ProvidersModule, // Importado para que ProvidersService possa ser injetado no worker
    DocumentProcessingModule,
  ],
  controllers: [],
  providers: [
    QueuesService,
    VerificationWorker, // O worker agora terá acesso a NotificationsService e ProvidersService
    NotificationWorker,
  ],
  exports: [QueuesService, BullModule],
})
export class QueuesModule {}