// src/modules/ranking/ranking.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderRankingDto } from './dto/provider-ranking.dto';
import { ProvidersService, ProviderWithCalculatedRating } from '../providers/providers.service';
import { SortByOption } from '../search/dto/search-query.dto';

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
  ) {}

  /**
   * Calcula o score de ranking de um provedor com base em múltiplos fatores.
   * Esta é a fórmula central de ranking.
   * @param provider O objeto ProviderWithCalculatedRating.
   * @returns O score de ranking calculado.
   */
  private calculateProviderScore(provider: ProviderWithCalculatedRating): number {
    // Normalizações (simplificadas para o exemplo)
    const rating_norm = provider.averageRating / 5; // Normaliza de 0 a 1
    const share5Star_norm = provider.reviewCount > 0 ? provider.fiveStarReviewCount / provider.reviewCount : 0;
    const recency_norm = 1.0; // Placeholder, exigiria lógica de data do último booking/review
    const distance_norm = provider.distance ? Math.min(provider.distance / 50, 1) : 0; // Normaliza distância (ex: até 50km)
    const acceptanceRate_norm = provider.acceptanceRate / 100; // Normaliza de 0 a 1
    const avgResponseTime_norm = provider.averageResponseTime ? Math.min(provider.averageResponseTime / 60, 1) : 1; // Normaliza tempo de resposta (ex: até 60min)

    // Boosts de gamificação (já incluído no provider.rankingBoostScore)
    const boosts_gamificacao = provider.rankingBoostScore || 0;

    // Fórmula de score:
    // score = 0.35·rating_norm + 0.2·share5⭐ + 0.15·recency_norm + 0.15·(1 - distance_norm) + 0.1·acceptanceRate + 0.05·(1/avgResponseTime_norm) + boosts_gamificação
    // Nota: (1/avgResponseTime_norm) pode ser problemático se avgResponseTime_norm for 0. Usar (1 - avgResponseTime_norm) ou uma função inversa mais robusta.
    // Usando (1 - avgResponseTime_norm) para simplicidade e garantir que quanto menor o tempo, maior o score.

    let score =
      0.35 * rating_norm +
      0.2 * share5Star_norm +
      0.15 * recency_norm +
      0.15 * (1 - distance_norm) +
      0.1 * acceptanceRate_norm +
      0.05 * (1 - avgResponseTime_norm) + // Quanto menor o tempo, maior (1-x)
      boosts_gamificacao;

    // Garantir que o score não seja negativo
    score = Math.max(0, score);

    return score;
  }

  /**
   * Obtém o ranking de provedores para uma determinada localização e critério.
   * @param latitude Latitude da localização central.
   * @param longitude Longitude da localização central.
   * @param radius Raio em KM para a busca.
   * @param sortBy Critério de ordenação (e.g., Rating, Experience, Distance).
   * @param limit Limite de resultados.
   */
  async getProviderRanking(
    latitude: number,
    longitude: number,
    radius: number = 10,
    sortBy: SortByOption = SortByOption.Rating,
    limit: number = 10,
  ): Promise<ProviderRankingDto[]> {
    this.logger.log(`Gerando ranking de provedores para lat: ${latitude}, lon: ${longitude}, raio: ${radius}km, ordenar por: ${sortBy}.`);

    // Reutilizar o método search do ProvidersService que já lida com busca geoespacial e ordenação
    const providers = await this.providersService.search({
      latitude,
      longitude,
      radius,
      sortBy: SortByOption.Distance, // Buscar por distância primeiro para calcular o score corretamente
      limit: limit * 2, // Buscar mais provedores para ter uma base maior para o ranking
      offset: 0,
    });

    // Calcular o score para cada provedor
    const providersWithScore = providers.map(p => ({
      provider: p,
      score: this.calculateProviderScore(p),
    }));

    // Ordenar pelo score calculado
    providersWithScore.sort((a, b) => b.score - a.score);

    // Aplicar o limite final
    const finalRankedProviders = providersWithScore.slice(0, limit);

    // Mapear para o DTO de Ranking
    return finalRankedProviders.map((entry, index) => ({
      providerId: entry.provider.id,
      fullName: entry.provider.fullName,
      avatarUrl: entry.provider.avatarUrl,
      averageRating: entry.provider.averageRating,
      reviewCount: entry.provider.reviewCount,
      position: index + 1,
      distance: entry.provider.distance,
      yearsOfExperience: entry.provider.yearsOfExperience,
      // Telemetria: provider_ranked
      // this.logger.log(`[TELEMETRY] provider_ranked: { providerId: ${entry.provider.id}, position: ${index + 1}, score: ${entry.score.toFixed(2)} }`);
    }));
  }

  /**
   * Obtém a posição de um provedor específico no ranking.
   * @param providerId ID do provedor.
   * @param latitude Latitude da localização central.
   * @param longitude Longitude da localização central.
   * @param radius Raio em KM para a busca.
   * @param sortBy Critério de ordenação.
   */
  async getProviderPositionInRanking(
    providerId: string,
    latitude: number,
    longitude: number,
    radius: number = 10,
    sortBy: SortByOption = SortByOption.Rating,
  ): Promise<{ position: number | null; totalProvidersInRanking: number; currentProviderData?: ProviderRankingDto }> {
    this.logger.log(`Buscando posição do provedor ${providerId} no ranking.`);

    const allRankedProviders = await this.getProviderRanking(latitude, longitude, radius, sortBy, 9999);

    const providerEntry = allRankedProviders.find(p => p.providerId === providerId);

    // Telemetria: provider_position_queried
    this.logger.log(`[TELEMETRY] provider_position_queried: { providerId: ${providerId}, position: ${providerEntry?.position || null} }`);

    return {
      position: providerEntry ? providerEntry.position : null,
      totalProvidersInRanking: allRankedProviders.length,
      currentProviderData: providerEntry,
    };
  }

  // Futuras melhorias:
  // - getClientRanking (para clientes que mais avaliam, agendam, etc.)
  // - Ranking por categoria de serviço
  // - Ranking por período (semana/mês)
}