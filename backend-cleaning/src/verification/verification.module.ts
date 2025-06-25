// src/verification/verification.module.ts
import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { CriminalBackgroundCheckService } from './criminal-background-check.service';
import { DocumentProcessingService } from './document-processing.service';
import { PrismaService } from '../prisma/prisma.service'; // Importar PrismaService
import { ProvidersService } from '../providers/providers.service'; // Para interagir com o modelo Provider

@Module({
  controllers: [VerificationController],
  providers: [
    VerificationService,
    CriminalBackgroundCheckService,
    DocumentProcessingService,
    PrismaService, // Prover PrismaService para os serviços
    ProvidersService, // Prover ProvidersService para interagir com o provedor
  ],
  exports: [VerificationService], // Exportar se outros módulos precisarem usar VerificationService
})
export class VerificationModule {}