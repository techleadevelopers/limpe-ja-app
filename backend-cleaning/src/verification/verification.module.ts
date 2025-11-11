// src/verification/verification.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { DocumentProcessingService } from '../document-processing/document-processing.service';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

import { PrismaModule } from '../prisma/prisma.module';
import { ProvidersModule } from '../providers/providers.module';
import { QueuesModule } from '../queues/queues.module';
import { NotificationsModule } from '../notifications/notifications.module'; // Importar NotificationsModule

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => ProvidersModule),
    forwardRef(() => QueuesModule),
    NotificationsModule, // Adicionar NotificationsModule aqui
    UploadModule,
  ],
  controllers: [VerificationController],
  providers: [
    VerificationService,
    DocumentProcessingService,
  ],
  exports: [
    VerificationService,
    DocumentProcessingService,
  ],
})
export class VerificationModule {}
