// src/search/search.service.ts
import { Injectable, Logger } from '@nestjs/common'; // CORREÇÃO: Importar Logger
import {
  SearchQueryDto,
  SortByOption,
  SearchType,
} from './dto/search-query.dto'; // Import SearchType
import { ProvidersService } from '../providers/providers.service';
import { ServicesService } from '../services/services.service';
import { ProviderServicesService } from '../provider-services/provider-services.service'; // NOVO: Importar
import { ProviderDetailsDto } from '../providers/dto/provider-details.dto';
import { ServiceDetailsDto } from '../services/dto/service-details.dto'; // Assuming ServiceDetailsDto is Service
import { ProviderSearchDto } from '../providers/dto/provider-search.dto';
import { OffersService } from '../offers/offers.service'; // Importe o OffersService se ele existir
// import { OfferDetailsDto } from '../offers/dto/offer-details.dto'; // Importe o DTO de ofertas
import { PricingService } from '../pricing/pricing.service'; // NEW: Import PricingService
import { DynamicPriceResult } from '../pricing/dto/calculate-price.dto'; // CORREÇÃO: Importar DynamicPriceResult para tipagem

// Supondo que você crie um DTO para os detalhes de um ProviderService
import { ProviderServiceDetailsDto } from '../provider-services/dto/provider-service-details.dto'; // Exemplo
import { ProviderServiceSearchResultDto } from './dto/provider-service-search-result.dto'; // Exemplo

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name); // CORREÇÃO: Adicionar logger

  constructor(
    private readonly providersService: ProvidersService,
    private readonly servicesService: ServicesService,
    private readonly providerServicesService: ProviderServicesService, // NOVO: Injetar
    private readonly offersService: OffersService, // Se houver um OffersService, descomente
    private readonly pricingService: PricingService, // NEW: Inject PricingService
  ) {}

  async performSearch(searchQueryDto: SearchQueryDto): Promise<{
    providerServices: ProviderServiceSearchResultDto[]; // NOVO: Resultado principal
    providers: ProviderDetailsDto[];
    services: ServiceDetailsDto[];
    offers?: any[];
  }> {
    const {
      query,
      type,
      location,
      date,
      limit,
      offset,
      latitude,
      longitude,
      radius,
      sortBy,
    } = searchQueryDto;

    const results: {
      providerServices: ProviderServiceSearchResultDto[];
      providers: ProviderDetailsDto[];
      services: ServiceDetailsDto[];
      offers?: any[];
    } = {
      providerServices: [],
      providers: [],
      services: [],
      offers: [], // Initialize offers array
    };

    // 1. Busca Principal: Serviços específicos oferecidos por provedores (ProviderService)
    // Esta seria a busca mais relevante para o usuário final
    // CORREÇÃO: Comparação correta do enum
    if (
      !type ||
      type === SearchType.PROVIDER_SERVICES ||
      type === SearchType.ALL
    ) {
      // The providerServicesService.search() would need to be implemented to:
      // - Filter by 'query' (in service name/description or provider bio)
      // - Filter by 'location' and geospatial (latitude, longitude, radius)
      // - Sort by 'sortBy' (rating, distance, experience)
      // - Return a combination of Provider and ProviderService
      // Placeholder method for ProviderServicesService.search
      const providerServicesResults = await (
        this.providerServicesService as any
      ).search({
        // <--- CORREÇÃO: Cast para 'any' para simular o método 'search'
        searchTerm: query,
        location,
        latitude,
        longitude,
        radius,
        sortBy,
        limit,
        offset,
        // Adicionar outros filtros necessários, como serviceId, minRating, etc.
      });

      // NEW: Apply dynamic pricing to provider services results
      results.providerServices = await Promise.all(
        providerServicesResults.map(async (psResult: any) => {
          let dynamicPrice: DynamicPriceResult = {
            originalPrice: psResult.price,
            surgeFactor: 1.0,
            finalPrice: psResult.price,
            appliedRules: [],
          };
          if (latitude && longitude && date) {
            try {
              dynamicPrice = await this.pricingService.calculatePrice({
                serviceId: psResult.serviceId,
                providerId: psResult.providerId,
                latitude,
                longitude,
                scheduledDate: date,
                cityCode: psResult.provider?.address?.city,
                categoryId: psResult.service?.categoryId,
              });
            } catch (e: any) {
              // CORREÇÃO: Tipar 'e' como 'any'
              this.logger.error(
                `Error calculating dynamic price for providerService ${psResult.id}: ${e.message}`,
              );
            }
          }
          return {
            ...psResult,
            dynamicPrice,
            // Include badges from provider if available in psResult.provider
            provider: {
              ...psResult.provider,
              badges: psResult.provider?.badges || [],
            },
          };
        }),
      );
    }

    // 2. Busca Complementar: Provedores (se o tipo de busca for explicitamente 'providers' ou 'all')
    if (type === SearchType.PROVIDERS || type === SearchType.ALL) {
      // <--- CORREÇÃO: Comparação correta do enum
      const providers = await this.providersService.search({
        searchTerm: query,
        location: location,
        limit: limit,
        offset: offset,
        latitude: latitude,
        longitude: longitude,
        radius: radius,
        sortBy: sortBy,
      });
      results.providers = providers.map(
        (p) => new ProviderDetailsDto(p as any),
      );
    }

    // 3. Busca Complementar: Tipos de Serviço (se o tipo de busca for explicitamente 'services' ou 'all')
    // O servicesService.search() deve ser implementado para fazer a filtragem no DB
    if (type === SearchType.SERVICES || type === SearchType.ALL) {
      // <--- CORREÇÃO: Comparação correta do enum
      // Placeholder method for ServicesService.search
      const services = await (this.servicesService as any).search(query); // <--- CORREÇÃO: Cast para 'any' para simular o método 'search'
      results.services = services.map((s) => new ServiceDetailsDto(s));
    }

    // 4. Busca Complementar: Ofertas (se OffersService e OfferDetailsDto existirem)
    if (!type || type === SearchType.OFFERS || type === SearchType.ALL) {
      // <--- CORREÇÃO: Comparação correta do enum
      const offers = await this.offersService.searchOffers(
        query,
        limit,
        offset,
      );
      results.offers = offers; // Assuming offersService.searchOffers returns the correct DTO
    }

    return results;
  }
}
