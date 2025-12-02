import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { DisputeReason } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDisputeDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID do agendamento que está sendo disputado.',
    example: 'uuid-do-agendamento',
  })
  bookingId: string;

  @IsEnum(DisputeReason)
  @IsNotEmpty()
  @ApiProperty({ enum: DisputeReason, description: 'Motivo da disputa.' })
  reason: DisputeReason;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Descrição detalhada do problema.',
    example: 'O provedor não concluiu o serviço de acordo com o combinado.',
  })
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({
    description: 'URLs de anexos/evidências (fotos, vídeos).',
    type: [String],
  })
  attachments?: string[];

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @ApiPropertyOptional({
    description: 'Valor de reembolso proposto.',
    example: 50.5,
  })
  refundAmountProposed?: number;
}
