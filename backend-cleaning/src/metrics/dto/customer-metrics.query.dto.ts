// src/metrics/dto/customer-metrics.query.dto.ts

import { IsOptional, IsDateString, IsIn, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum MetricsGranularity {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export enum MetricsType {
  BOOKINGS = 'bookings',
  SPENT = 'spent',
  // Adicione outros tipos de métricas aqui
}

export class CustomerMetricsQueryDto {
  @ApiPropertyOptional({
    description: 'Data de início para o filtro (ISO 8601, e.g., 2023-01-01)',
    example: '2023-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Data de fim para o filtro (ISO 8601, e.g., 2023-12-31)',
    example: '2023-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Granularidade para série temporal (day, week, month)',
    enum: MetricsGranularity,
    example: MetricsGranularity.DAY,
  })
  @IsOptional()
  @IsEnum(MetricsGranularity)
  granularity?: MetricsGranularity;

  @ApiPropertyOptional({
    description: 'Tipo de métrica para série temporal (bookings, spent)',
    enum: MetricsType,
    example: MetricsType.BOOKINGS,
  })
  @IsOptional()
  @IsEnum(MetricsType)
  metric?: MetricsType;
}