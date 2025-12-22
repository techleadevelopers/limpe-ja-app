import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class AnalyticsEventDto {
  @ApiProperty({
    description: 'Nome do evento de analytics',
    example: 'booking_completed',
  })
  @IsString()
  @IsNotEmpty()
  event: string;

  @ApiPropertyOptional({
    description: 'Dados adicionais relacionados ao evento',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Timestamp ISO 8601 do evento',
    example: new Date().toISOString(),
  })
  @IsOptional()
  @IsISO8601()
  timestamp?: string;
}
