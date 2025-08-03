// src/verification/verification.module.ts
import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { CriminalBackgroundCheckService } from './criminal-background-check.service';
import { DocumentProcessingService } from './document-processing.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';

@Module({
  controllers: [VerificationController],
  providers: [
    VerificationService,
    CriminalBackgroundCheckService,
    DocumentProcessingService,
    PrismaService,
    ProvidersService,
  ],
  // CORREÇÃO: Exportar DocumentProcessingService para que ele seja acessível ao ProvidersModule
  exports: [
    VerificationService,
    DocumentProcessingService, // <-- Adicionado DocumentProcessingService aqui
  ],
})
export class VerificationModule {}