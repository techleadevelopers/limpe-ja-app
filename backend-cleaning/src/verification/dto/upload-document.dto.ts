// src/verification/dto/upload-document.dto.ts
import { IsOptional, IsString, IsEnum } from 'class-validator';

// Define um enum para o tipo de foto do documento (frente/verso)
export enum DocumentPhotoType {
  FRONT = 'FRONT',
  BACK = 'BACK',
}

export class UploadDocumentDto {
  // O arquivo em si será injetado pelo @UploadedFile() no controller,
  // então não precisamos de uma propriedade para ele aqui no DTO para validação de corpo.
  // No entanto, podemos adicionar campos para metadados se necessário.

  @IsOptional()
  @IsEnum(DocumentPhotoType, {
    message: 'Tipo de documento inválido. Use FRONT ou BACK.',
  })
  type?: DocumentPhotoType; // Exemplo: para especificar se é frente ou verso
}
