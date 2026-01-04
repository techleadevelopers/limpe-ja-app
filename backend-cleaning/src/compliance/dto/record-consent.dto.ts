import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { ConsentDocumentType } from '../compliance.constants';

export class RecordConsentDto {
  @ApiProperty({
    description: 'Tipo do documento consentido',
    enum: ConsentDocumentType,
  })
  @IsEnum(ConsentDocumentType)
  consentType: ConsentDocumentType;

  @ApiProperty({
    description: 'Versão do documento aceita',
    example: 'terms-v1',
  })
  @IsString()
  version: string;

  @ApiPropertyOptional({
    description: 'Instantâneo ISO 8601 da aceitação',
    example: '2025-01-01T09:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  acceptedAt?: string;
}
