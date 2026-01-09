// src/support/dto/create-ticket.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupportTicketCategory } from '@prisma/client'; // Assumindo enum do Prisma

export class CreateTicketDto {
  @ApiProperty({ description: 'Assunto do ticket de suporte' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({
    description: 'Categoria do ticket de suporte',
    enum: SupportTicketCategory,
    example: SupportTicketCategory.QUALITY,
  })
  @IsOptional()
  @IsEnum(SupportTicketCategory)
  category?: SupportTicketCategory;

  @ApiProperty({ description: 'Descrição detalhada do problema ou dúvida' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'ID do agendamento relacionado (se houver)',
  })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'URLs de anexos no Google Cloud Storage',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[]; // URLs para arquivos no GCS

  @ApiPropertyOptional({
    description: 'Prioridade (severity) do ticket de suporte',
    example: 'NORMAL',
  })
  @IsOptional()
  @IsString()
  severity?: string;
}
