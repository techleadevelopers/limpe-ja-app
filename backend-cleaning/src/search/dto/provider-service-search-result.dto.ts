// backend-cleaning/src/search/dto/provider-service-search-result.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { ProviderDetailsDto } from '../../providers/dto/provider-details.dto'; // Importe o DTO de detalhes do provedor
import { ProviderServiceDetailsDto } from '../../provider-services/dto/provider-service-details.dto'; // Importe o DTO de detalhes do serviço do provedor

export class ProviderServiceSearchResultDto {
  @ApiProperty({ type: () => ProviderDetailsDto, description: 'Detalhes do provedor' })
  provider: ProviderDetailsDto;

  @ApiProperty({ type: () => ProviderServiceDetailsDto, description: 'Detalhes do serviço específico oferecido pelo provedor' })
  providerService: ProviderServiceDetailsDto;

  @ApiProperty({ description: 'Distância do provedor em relação à localização da busca (em km)', required: false })
  @IsOptional()
  @IsNumber()
  distance?: number;
}