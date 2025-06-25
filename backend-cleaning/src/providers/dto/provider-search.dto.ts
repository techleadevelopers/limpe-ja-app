// src/providers/dto/provider-search.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { SortByOption } from '../../search/dto/search-query.dto'; // Importe o enum de ordenação do módulo de busca

export class ProviderSearchDto {
  @ApiPropertyOptional({ description: 'Termo de busca (nome do provedor, email, serviço)', example: 'limpeza' })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional({ description: 'ID do tipo de serviço para filtrar', example: 'uuid-do-servico' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Localização para filtrar provedores (cidade, bairro)', example: 'São Paulo' })
  @IsOptional()
  @IsString()
  location?: string; // Mantido para busca por nome de cidade/bairro

  @ApiPropertyOptional({ description: 'Avaliação mínima do provedor', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minRating?: number;

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

  // --- NOVOS CAMPOS PARA BUSCA GEOSPACIAL E ORDENAÇÃO ---

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