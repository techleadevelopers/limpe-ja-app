// backend-cleaning/src/search/dto/provider-service-search-result.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsArray } from 'class-validator';
import { ProviderDetailsDto } from '../../providers/dto/provider-details.dto'; // Importe o DTO de detalhes do provedor
import { ProviderServiceDetailsDto } from '../../provider-services/dto/provider-service-details.dto'; // Importe o DTO de detalhes do serviço do provedor

export class ProviderServiceSearchResultDto {
  @ApiProperty({
    type: () => ProviderDetailsDto,
    description: 'Detalhes do provedor (com sinais premium opcionais)',
  })
  provider: ProviderDetailsDto;

  @ApiProperty({
    type: () => ProviderServiceDetailsDto,
    description: 'Detalhes do serviço específico oferecido pelo provedor',
  })
  providerService: ProviderServiceDetailsDto;

  @ApiProperty({
    description:
      'Distância do provedor em relação à localização da busca (em km)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  distance?: number;

  // NOVOS CAMPOS OPCIONAIS PARA ALINHAMENTO COM RELATÓRIO (sinais premium)
  @ApiPropertyOptional({
    description: 'Status de verificação (para selo nos cards)',
    enum: ['APPROVED', 'PENDING', 'REJECTED'],
  })
  @IsOptional()
  @IsString()
  verificationStatus?: string;

  @ApiPropertyOptional({
    description: 'Taxa de aceitação (para métricas mini)',
    example: 90,
  })
  @IsOptional()
  @IsNumber()
  acceptanceRate?: number;

  @ApiPropertyOptional({
    description: 'Tempo médio de resposta (para métricas mini)',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  averageResponseTime?: number;

  @ApiPropertyOptional({
    description: 'Próximo horário disponível (para chip nos cards)',
    example: { date: '2025-09-29', time: '09:00' },
  })
  @IsOptional()
  nextAvailable?: { date: string; time: string };

  @ApiPropertyOptional({
    description: 'Badges do provedor (opcional)',
    type: [String],
    example: ['TOP_RATED'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badges?: string[];
}
