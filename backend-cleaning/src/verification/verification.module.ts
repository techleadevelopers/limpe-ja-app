// src/verification/verification.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { DocumentProcessingService } from '../document-processing/document-processing.service';
// REMOVIDO: import { CriminalBackgroundCheckService } from './criminal-background-check.service';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

import { PrismaModule } from '../prisma/prisma.module';
import { ProvidersModule } from '../providers/providers.module';
import { QueuesModule } from '../queues/queues.module'; // Importa o QueuesModule

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => ProvidersModule), // Quebra a dependência circular com ProvidersModule
    forwardRef(() => QueuesModule), // CORREÇÃO: Quebra a dependência circular com QueuesModule
  ],
  controllers: [VerificationController],
  providers: [
    VerificationService,
    // REMOVIDO: CriminalBackgroundCheckService,
    DocumentProcessingService,
  ],
  exports: [
    VerificationService,
    DocumentProcessingService,
  ],
})
export class VerificationModule {}