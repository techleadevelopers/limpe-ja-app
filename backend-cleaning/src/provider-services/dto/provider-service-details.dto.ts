// backend-cleaning/src/provider-services/dto/provider-service-details.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ServiceEntity } from '../../services/entities/service.entity'; // <--- CORREÇÃO AQUI
import { PricingType } from '../../common/enums/pricing-type.enum'; // Supondo que você tenha este enum no backend

export class ProviderServiceDetailsDto {
  @ApiProperty({ description: 'ID do serviço oferecido pelo provedor' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'ID do provedor' })
  @IsString()
  providerId: string;

  @ApiProperty({ description: 'ID do tipo de serviço global' })
  @IsString()
  serviceId: string;

  @ApiProperty({ description: 'Preço do serviço', example: 150.0 })
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Duração estimada em minutos',
    example: 120,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number | null;

  @ApiProperty({
    description: 'Descrição detalhada do serviço oferecido',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    enum: PricingType,
    description: 'Tipo de precificação do serviço',
    example: PricingType.FIXED_PRICE,
  })
  @IsEnum(PricingType)
  pricingType: PricingType;

  @ApiProperty({
    description: 'Preço por metro quadrado (se pricingType for BY_SIZE)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  pricePerSquareMeter?: number | null;

  @ApiProperty({
    description: 'Preço por cômodo (se pricingType for BY_SIZE)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  pricePerRoom?: number | null;

  @ApiProperty({
    type: () => ServiceEntity,
    description: 'Detalhes do tipo de serviço global',
  }) // <--- CORREÇÃO AQUI
  service: ServiceEntity; // Ou um DTO simplificado para Service, se preferir
}
