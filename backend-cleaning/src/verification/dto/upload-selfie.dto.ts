// src/verification/dto/upload-selfie.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class UploadSelfieDto {
  // Similar ao UploadDocumentDto, o arquivo será tratado pelo @UploadedFile()
  // No momento, não há campos adicionais necessários para a selfie além do arquivo.
  // Poderíamos adicionar um campo para 'consentimento' se fosse um requisito.
}