import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  Min,
  IsOptional,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { PricingType } from '@prisma/client';
import { MIN_HOURLY_MINUTES } from '../../common/constants/pricing';

export class CreateProviderServiceDto {
  @ApiProperty({
    description:
      'ID do tipo de serviço (Service) que o provedor está oferecendo',
    example: 'uuid-do-tipo-servico',
  })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiPropertyOptional({
    description:
      'Preço cobrado pelo provedor para este serviço (quando aplicável, e.g., FIXED_PRICE)',
    example: 120.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Preço por hora (se pricingType for HOURLY)',
    example: 45.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerHour?: number; // <--- ESTE CAMPO É CRÍTICO

  @ApiPropertyOptional({
    description: 'Duração estimada do serviço em minutos',
    example: 180,
  })
  @IsOptional()
  @IsInt()
  @ValidateIf(
    (o: CreateProviderServiceDto) => o.pricingType === PricingType.HOURLY,
  )
  @Min(MIN_HOURLY_MINUTES)
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Descrição específica do provedor para este serviço',
    example: 'Limpeza detalhada com produtos ecológicos.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: PricingType,
    description: 'Tipo de precificação do serviço',
    example: PricingType.FIXED_PRICE,
  })
  @IsEnum(PricingType)
  @IsNotEmpty()
  pricingType: PricingType;

  @ApiPropertyOptional({
    description: 'Preço por metro quadrado (se pricingType for BY_SIZE)',
    example: 10.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerSquareMeter?: number;

  @ApiPropertyOptional({
    description: 'Preço por cômodo (se pricingType for BY_SIZE)',
    example: 50.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerRoom?: number;
}
