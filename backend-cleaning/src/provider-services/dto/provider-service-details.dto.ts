// backend-cleaning/src/provider-services/dto/provider-service-details.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ServiceEntity } from '../../services/entities/service.entity';

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

  @ApiProperty({ description: 'Preço por hora vigente', example: 150.0 })
  @IsNumber()
  pricePerHour: number;

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
    description: 'Indica quando o valor do serviço precisa de revisão manual',
    example: false,
  })
  @IsBoolean()
  needsReview: boolean;

  @ApiProperty({
    type: () => ServiceEntity,
    description: 'Detalhes do tipo de serviço global',
  })
  service: ServiceEntity;
}
