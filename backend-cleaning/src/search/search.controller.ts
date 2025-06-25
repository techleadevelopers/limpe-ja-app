import { ApiOperation, ApiResponse, ApiTags, ApiProperty } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { ProviderDetailsDto } from '../providers/dto/provider-details.dto';
import { ServiceDetailsDto } from '../services/dto/service-details.dto';
// Define um tipo de resposta combinada para a busca
class SearchResultDto {
  @ApiProperty({ type: [ProviderDetailsDto], description: 'Resultados de provedores' })
  providers: ProviderDetailsDto[];

  @ApiProperty({ type: [ServiceDetailsDto], description: 'Resultados de tipos de serviço' })
  services: ServiceDetailsDto[];

  // Adicione outros tipos de resultados conforme necessário
  // @ApiProperty({ type: [OfferDetailsDto], description: 'Resultados de ofertas' })
  // offers: OfferDetailsDto[];
}

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Realizar uma busca abrangente por provedores, serviços, etc.' })
  @ApiResponse({ status: 200, description: 'Resultados da busca.', type: SearchResultDto })
  async search(@Query() searchQueryDto: SearchQueryDto): Promise<SearchResultDto> {
    const results = await this.searchService.performSearch(searchQueryDto);
    return results;
  }
}