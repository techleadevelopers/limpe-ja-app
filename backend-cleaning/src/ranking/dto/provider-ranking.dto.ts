// src/modules/ranking/dto/provider-ranking.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUrl } from 'class-validator';

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

  @ApiPropertyOptional({ description: 'Distância do provedor em KM (se aplicável).' })
  @IsOptional()
  @IsNumber()
  distance?: number;

  @ApiPropertyOptional({ description: 'Anos de experiência do provedor (se aplicável).' })
  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number | null;
}