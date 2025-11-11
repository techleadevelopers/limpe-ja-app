// src/document-processing/document-processing.module.ts
import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { DocumentProcessingService } from './document-processing.service'; // Importe o serviço do diretório correto

@Module({
  imports: [UploadModule],
  providers: [DocumentProcessingService],
  exports: [DocumentProcessingService], // Exporta o serviço para que outros módulos possam injetá-lo
})
export class DocumentProcessingModule {}
