// src/document-processing/document-processing.module.ts
import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { DocumentProcessingService } from './document-processing.service';

@Module({
  imports: [UploadModule],
  providers: [DocumentProcessingService],
  exports: [DocumentProcessingService],
})
export class DocumentProcessingModule {}
