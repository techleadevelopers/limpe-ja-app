// src/modules/ranking/ranking.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderRankingDto } from './dto/provider-ranking.dto';
import { ProvidersService, ProviderWithCalculatedRating } from '../providers/providers.service';
import { SortByOption } from '../search/dto/search-query.dto'; // Reutilizar o enum de ordenação

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService, // Injetar ProvidersService para reutilizar lógica de busca
  ) {}

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
    radius: number = 10, // Padrão de 10km
    sortBy: SortByOption = SortByOption.Rating, // Padrão por avaliação
    limit: number = 10,
  ): Promise<ProviderRankingDto[]> {
    this.logger.log(`Gerando ranking de provedores para lat: ${latitude}, lon: ${longitude}, raio: ${radius}km, ordenar por: ${sortBy}.`);

    // Reutilizar o método search do ProvidersService que já lida com busca geoespacial e ordenação
    const providers = await this.providersService.search({
      latitude,
      longitude,
      radius,
      sortBy,
      limit,
      offset: 0, // Sempre começa do início para rankings
    });

    // Mapear para o DTO de Ranking
    return providers.map((p, index) => ({
      providerId: p.id,
      fullName: p.fullName,
      avatarUrl: p.avatarUrl,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
      position: index + 1, // Posição no ranking
      distance: p.distance, // Distância se sortBy for Distance
      yearsOfExperience: p.yearsOfExperience, // Anos de experiência se sortBy for Experience
    }));
  }

  /**
   * Obtém a posição de um provedor específico no ranking.
   * Isso pode ser mais complexo e exigir uma query otimizada ou pré-cálculo do ranking.
   * Por simplicidade, vamos simular a busca e encontrar a posição.
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

    // Busca todos os provedores no raio para calcular a posição
    const allRankedProviders = await this.getProviderRanking(latitude, longitude, radius, sortBy, 9999); // Busca todos para encontrar a posição

    const providerEntry = allRankedProviders.find(p => p.providerId === providerId);

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