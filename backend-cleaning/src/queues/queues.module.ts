// backend-cleaning/src/queues/queues.module.ts
import { Module, forwardRef } from '@nestjs/common'; // Adicionar forwardRef aqui
import { BullModule } from '@nestjs/bull';
import { QueuesService } from './queues.service';
import { VerificationWorker } from './workers/verification.worker';
import { NotificationWorker } from './workers/notification.worker';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VerificationModule } from '../verification/verification.module';

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
    ),
    NotificationsModule,
    PrismaModule,
    forwardRef(() => VerificationModule), // CORREÇÃO: Usar forwardRef aqui para quebrar o ciclo
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