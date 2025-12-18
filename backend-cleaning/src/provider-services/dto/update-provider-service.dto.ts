import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsInt,
  Min,
  IsOptional,
  IsString,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { PricingType } from '@prisma/client'; // Importar o enum PricingType
import { MIN_HOURLY_MINUTES } from '../../common/constants/pricing';

export class UpdateProviderServiceDto {
  @ApiPropertyOptional({
    description: 'Novo preço cobrado pelo provedor para este serviço',
    example: 130.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Preço por hora (se pricingType for HOURLY)',
    example: 48.0,
  }) // Adicionado
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerHour?: number; // Adicionado

  @ApiPropertyOptional({
    description: 'Nova duração estimada do serviço em minutos',
    example: 200,
  })
  @IsOptional()
  @IsInt()
  @ValidateIf((o) => o.pricingType === PricingType.HOURLY)
  @Min(MIN_HOURLY_MINUTES)
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Nova descrição específica do provedor para este serviço',
    example: 'Serviço premium com foco em detalhes.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: PricingType,
    description: 'Novo tipo de precificação do serviço',
    example: PricingType.HOURLY,
  })
  @IsOptional()
  @IsEnum(PricingType)
  pricingType?: PricingType;

  @ApiPropertyOptional({
    description: 'Novo preço por metro quadrado (se pricingType for BY_SIZE)',
    example: 12.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerSquareMeter?: number;

  @ApiPropertyOptional({
    description: 'Novo preço por cômodo (se pricingType for BY_SIZE)',
    example: 55.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerRoom?: number;
}
