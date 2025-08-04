// backend-cleaning/src/bookings/dto/report-dispute.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DisputeReason {
  SERVICE_NOT_PERFORMED = 'SERVICE_NOT_PERFORMED',
  SERVICE_INCOMPLETE = 'SERVICE_INCOMPLETE',
  QUALITY_ISSUES = 'QUALITY_ISSUES',
  PROVIDER_DID_NOT_SHOW = 'PROVIDER_DID_NOT_SHOW',
  CLIENT_DID_NOT_SHOW = 'CLIENT_DID_NOT_SHOW',
  OTHER = 'OTHER',
}

export class ReportDisputeDto {
  @ApiProperty({
    description: 'Motivo principal da disputa.',
    enum: DisputeReason,
  })
  @IsEnum(DisputeReason)
  @IsNotEmpty()
  reason: DisputeReason;

  @ApiProperty({
    description: 'Descrição detalhada do problema ou disputa.',
    example: 'O provedor não realizou a limpeza completa da cozinha.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Valor solicitado para reembolso, se aplicável.',
    example: 50.00,
    required: false,
  })
  @IsOptional()
  refundAmount?: number;

  @ApiProperty({
    description: 'Anexos ou evidências (URLs de imagens, documentos, etc.).',
    type: [String],
    example: ['https://example.com/image1.jpg', 'https://example.com/doc1.pdf'],
    required: false,
  })
  @IsOptional()
  @IsString({ each: true })
  attachments?: string[];
}