// src/verification/verification.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { DocumentProcessingModule } from '../document-processing/document-processing.module';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

import { PrismaModule } from '../prisma/prisma.module';
import { ProvidersModule } from '../providers/providers.module';
import { QueuesModule } from '../queues/queues.module';
import { NotificationsModule } from '../notifications/notifications.module'; // Importar NotificationsModule
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => ProvidersModule),
    forwardRef(() => QueuesModule),
    NotificationsModule, // Adicionar NotificationsModule aqui
    UploadModule,
    DocumentProcessingModule,
    CacheModule,
  ],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
