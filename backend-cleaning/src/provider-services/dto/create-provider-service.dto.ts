import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsInt,
  ValidateIf,
} from 'class-validator';
import { PricingType } from '@prisma/client';
import { MIN_HOURLY_MINUTES } from '../../common/constants/pricing';

export class CreateProviderServiceDto {
  @ApiProperty({
    description:
      'ID do tipo de servico (Service) que o provedor esta oferecendo',
    example: 'uuid-do-tipo-servico',
  })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    description: 'Preco por hora (obrigatorio e sempre HOURLY)',
    example: 45.0,
  })
  @IsNumber()
  @Min(0.01)
  pricePerHour: number;

  @ApiPropertyOptional({
    description: 'Duracao estimada do servico em minutos (>= 240)',
    example: 180,
  })
  @IsOptional()
  @IsInt()
  @Min(MIN_HOURLY_MINUTES)
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Descricao especifica do provedor para este servico',
    example: 'Limpeza detalhada com produtos ecologicos.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: PricingType,
    description: 'Se fornecido, deve ser HOURLY.',
    example: PricingType.HOURLY,
  })
  @IsOptional()
  @ValidateIf((o: CreateProviderServiceDto) => o.pricingType !== undefined)
  pricingType?: PricingType;
}
