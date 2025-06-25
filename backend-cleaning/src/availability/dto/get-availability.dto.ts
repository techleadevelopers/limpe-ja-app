import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsDateString, IsString, IsNotEmpty } from 'class-validator'; // Adicionado IsString, IsNotEmpty
import { Type } from 'class-transformer';

export class GetAvailabilityDto {
  @ApiPropertyOptional({ description: 'Filtrar por dia da semana (0 para Domingo, 1 para Segunda, ..., 6 para Sábado)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({ description: 'Data específica para buscar disponibilidade (formato YYYY-MM-DD)', example: '2025-06-10' })
  @IsOptional()
  @IsDateString({ strict: true }) // Garante formato ISO 8601 (YYYY-MM-DD é um subconjunto válido)
  @IsString() // Assegura que é uma string
  @IsNotEmpty() // Assegura que não é uma string vazia
  date?: string; // <<<< ADICIONADO: Campo 'date' para a query
}