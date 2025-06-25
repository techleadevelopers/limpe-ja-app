// src/search/dto/search-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt, Min, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

enum SearchType {
  PROVIDERS = 'providers',
  SERVICES = 'services',
  OFFERS = 'offers',
  ALL = 'all',
}

export enum SortByOption { // Este enum é importante e deve ser exportado
  Rating = 'rating',
  Distance = 'distance',
  Experience = 'experience', // <-- CORRIGIDO: Agora 'experience' está aqui em minúsculas
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  FullName = 'fullName',
  // Adicione outras opções de ordenação se necessário, seguindo o padrão
}

export class SearchQueryDto {
  @ApiPropertyOptional({ description: 'Termo de busca geral', example: 'limpeza de casa' })
  @IsOptional()
  @IsString()
  query?: string; // Mantido 'query' para o campo de busca geral

  @ApiPropertyOptional({ enum: SearchType, description: 'Tipo de entidade a ser buscada', example: SearchType.ALL })
  @IsOptional()
  @IsEnum(SearchType)
  type?: SearchType;

  @ApiPropertyOptional({ description: 'Localização para filtrar resultados (cidade, bairro)', example: 'São Paulo' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Data para filtrar resultados (formato ISO 8601)', example: '2025-07-01' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Número máximo de resultados a retornar', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Número de resultados a pular (para paginação)', example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({ description: 'Latitude da localização de busca', example: -22.9099 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude da localização de busca', example: -47.0626 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Raio de busca em quilômetros', example: 50 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  radius?: number;

  @ApiPropertyOptional({ enum: SortByOption, description: 'Critério de ordenação dos resultados', example: SortByOption.Rating })
  @IsOptional()
  @IsEnum(SortByOption)
  sortBy?: SortByOption;
}