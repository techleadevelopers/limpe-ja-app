import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export interface BookingLocationInput {
  lat: number;
  lng: number;
  accuracyM?: number;
  capturedAt?: string;
}

export class BookingLocationDto implements BookingLocationInput {
  @ApiProperty({
    description: 'Latitude do ponto GPS (decimal)',
    example: -23.55052,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'Longitude do ponto GPS (decimal)',
    example: -46.633308,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({
    description: 'Margem de erro do GPS em metros',
    example: 12.5,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(2000)
  accuracyM?: number;

  @ApiPropertyOptional({
    description: 'Timestamp ISO 8601 da captura do ponto GPS',
    example: '2025-01-01T09:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  capturedAt?: string;
}
