// src/modules/ranking/dto/provider-ranking.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUrl,
  IsArray,
  IsEnum,
} from 'class-validator';
import { VerificationStatus } from '@prisma/client'; // Para verificationStatus

export class ProviderRankingDto {
  @ApiProperty({ description: 'ID do provedor.' })
  @IsString()
  providerId: string;

  @ApiProperty({ description: 'Nome completo do provedor.' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: 'URL do avatar do provedor.' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string | null;

  @ApiProperty({ description: 'Média de avaliação do provedor.' })
  @IsNumber()
  averageRating: number;

  @ApiProperty({ description: 'Número total de avaliações.' })
  @IsNumber()
  reviewCount: number;

  @ApiProperty({ description: 'Posição do provedor no ranking.' })
  @IsNumber()
  position: number;

  @ApiPropertyOptional({
    description: 'Distância do provedor em KM (se aplicável).',
  })
  @IsOptional()
  @IsNumber()
  distance?: number;

  @ApiPropertyOptional({
    description: 'Anos de experiência do provedor (se aplicável).',
  })
  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number | null;

  // NOVOS CAMPOS OPCIONAIS PARA ALINHAMENTO COM RELATÓRIO (sinais premium no ranking)
  @ApiPropertyOptional({
    description: 'Status de verificação (para selo)',
    enum: VerificationStatus,
  })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional({
    description: 'Taxa de aceitação (para métricas)',
    example: 90,
  })
  @IsOptional()
  @IsNumber()
  acceptanceRate?: number;

  @ApiPropertyOptional({
    description: 'Tempo médio de resposta (em minutos)',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  averageResponseTime?: number;

  @ApiPropertyOptional({
    description: 'Próximo horário disponível',
    example: { date: '2025-09-29', time: '09:00' },
  })
  @IsOptional()
  nextAvailable?: { date: string; time: string };

  @ApiPropertyOptional({
    description: 'Badges do provedor',
    type: [String],
    example: ['TOP_RATED'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badges?: string[];
}
