import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsInt, Min, IsOptional, IsEnum } from 'class-validator';
import { PricingType } from '@prisma/client'; // Importar o enum PricingType

export class CreateProviderServiceDto {
  @ApiProperty({ description: 'ID do tipo de serviço (Service) que o provedor está oferecendo', example: 'uuid-do-tipo-servico' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ description: 'Preço cobrado pelo provedor para este serviço', example: 120.50 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Duração estimada do serviço em minutos', example: 180 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'Descrição específica do provedor para este serviço', example: 'Limpeza detalhada com produtos ecológicos.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: PricingType, description: 'Tipo de precificação do serviço', example: PricingType.FIXED_PRICE })
  @IsEnum(PricingType)
  @IsNotEmpty()
  pricingType: PricingType;

  @ApiPropertyOptional({ description: 'Preço por metro quadrado (se pricingType for BY_SIZE)', example: 10.50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerSquareMeter?: number;

  @ApiPropertyOptional({ description: 'Preço por cômodo (se pricingType for BY_SIZE)', example: 50.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerRoom?: number;
}