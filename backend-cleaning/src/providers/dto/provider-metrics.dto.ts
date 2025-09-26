// src/providers/dto/provider-metrics.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ProviderMetricsDto {
  @ApiProperty({ description: 'Taxa de aceitação de agendamentos', example: 95 })
  acceptanceRate: number;

  @ApiProperty({ description: 'Tempo médio de resposta em minutos', example: 15 })
  averageResponseTime: number;

  @ApiProperty({ description: 'Total de agendamentos concluídos', example: 120 })
  totalBookings: number;
}