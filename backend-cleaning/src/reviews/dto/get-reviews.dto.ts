import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetReviewsDto {
  @ApiPropertyOptional({
    description: 'Filtrar avaliações por ID do provedor',
    example: 'uuid-do-provedor',
  })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar avaliações por ID do cliente',
    example: 'uuid-do-cliente',
  })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar avaliações com pontuação mínima (1 a 5)',
    example: 4,
  })
  @IsOptional()
  @Type(() => Number) // Garante que o valor seja tratado como número
  @IsInt()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Filtrar avaliações com pontuação máxima (1 a 5)',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  maxRating?: number;
}
