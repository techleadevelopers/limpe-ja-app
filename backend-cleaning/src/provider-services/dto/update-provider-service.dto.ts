import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsInt, Min, IsOptional, IsString } from 'class-validator';

export class UpdateProviderServiceDto {
  @ApiPropertyOptional({ description: 'Novo preço cobrado pelo provedor para este serviço', example: 130.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Nova duração estimada do serviço em minutos', example: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'Nova descrição específica do provedor para este serviço', example: 'Serviço premium com foco em detalhes.' })
  @IsOptional()
  @IsString()
  description?: string;
}