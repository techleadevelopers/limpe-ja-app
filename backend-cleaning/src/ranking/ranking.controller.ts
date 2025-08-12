// src/modules/ranking/ranking.controller.ts
import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common'; // Adicione 'Param' aqui
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RankingService } from './ranking.service';
import { ProviderRankingDto } from './dto/provider-ranking.dto';
import { SortByOption } from '../search/dto/search-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Ranking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('providers/local')
  @ApiOperation({ summary: 'Obter o ranking de provedores locais' })
  @ApiQuery({ name: 'latitude', type: Number, description: 'Latitude da localização central', example: -23.55052, required: true })
  @ApiQuery({ name: 'longitude', type: Number, description: 'Longitude da localização central', example: -46.63330, required: true })
  @ApiQuery({ name: 'radius', type: Number, description: 'Raio de busca em KM (padrão: 10)', example: 5, required: false })
  @ApiQuery({ name: 'sortBy', enum: SortByOption, description: 'Critério de ordenação (padrão: Rating)', example: SortByOption.Rating, required: false })
  @ApiQuery({ name: 'limit', type: Number, description: 'Limite de resultados (padrão: 10)', example: 5, required: false })
  async getLocalProviderRanking(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
    @Query('sortBy') sortBy?: SortByOption,
    @Query('limit') limit?: number,
  ): Promise<ProviderRankingDto[]> {
    return this.rankingService.getProviderRanking(latitude, longitude, radius, sortBy, limit);
  }

  @Get('providers/:providerId/position')
  @ApiOperation({ summary: 'Obter a posição de um provedor específico no ranking local' })
  @ApiQuery({ name: 'latitude', type: Number, description: 'Latitude da localização central', example: -23.55052, required: true })
  @ApiQuery({ name: 'longitude', type: Number, description: 'Longitude da localização central', example: -46.63330, required: true })
  @ApiQuery({ name: 'radius', type: Number, description: 'Raio de busca em KM (padrão: 10)', example: 5, required: false })
  @ApiQuery({ name: 'sortBy', enum: SortByOption, description: 'Critério de ordenação (padrão: Rating)', example: SortByOption.Rating, required: false })
  async getProviderPosition(
    @Param('providerId') providerId: string, // Esta linha agora funcionará
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
    @Query('sortBy') sortBy?: SortByOption,
  ) {
    return this.rankingService.getProviderPositionInRanking(providerId, latitude, longitude, radius, sortBy);
  }
}