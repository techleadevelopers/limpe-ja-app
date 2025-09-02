import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsInt, Min, IsOptional, IsString, IsEnum } from 'class-validator';
import { PricingType } from '@prisma/client'; // Importar o enum PricingType

export class UpdateProviderServiceDto {
  @ApiPropertyOptional({ description: 'Novo preço cobrado pelo provedor para este serviço', example: 130.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Preço por hora (se pricingType for HOURLY)', example: 48.00 }) // Adicionado
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerHour?: number; // Adicionado

  @ApiPropertyOptional({ description: 'Nova duração estimada do serviço em minutos', example: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'Nova descrição específica do provedor para este serviço', example: 'Serviço premium com foco em detalhes.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: PricingType, description: 'Novo tipo de precificação do serviço', example: PricingType.HOURLY })
  @IsOptional()
  @IsEnum(PricingType)
  pricingType?: PricingType;

  @ApiPropertyOptional({ description: 'Novo preço por metro quadrado (se pricingType for BY_SIZE)', example: 12.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerSquareMeter?: number;

  @ApiPropertyOptional({ description: 'Novo preço por cômodo (se pricingType for BY_SIZE)', example: 55.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerRoom?: number;
}