// src/document-processing/document-processing.module.ts
import { Module } from '@nestjs/common';
import { DocumentProcessingService } from './document-processing.service'; // Importe o serviço do diretório correto

@Module({
  providers: [DocumentProcessingService],
  exports: [DocumentProcessingService], // Exporta o serviço para que outros módulos possam injetá-lo
})
export class DocumentProcessingModule {}