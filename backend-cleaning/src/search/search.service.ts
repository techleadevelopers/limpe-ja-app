// src/search/search.service.ts
import { Injectable } from '@nestjs/common';
import { SearchQueryDto, SortByOption, SearchType } from './dto/search-query.dto'; // Import SearchType
import { ProvidersService } from '../providers/providers.service';
import { ServicesService } from '../services/services.service';
import { ProviderServicesService } from '../provider-services/provider-services.service'; // NOVO: Importar
import { ProviderDetailsDto } from '../providers/dto/provider-details.dto';
import { ServiceDetailsDto } from '../services/dto/service-details.dto'; // Assuming ServiceDetailsDto is Service
import { ProviderSearchDto } from '../providers/dto/provider-search.dto';
// import { OffersService } from '../offers/offers.service'; // Importe o OffersService se ele existir
// import { OfferDetailsDto } from '../offers/dto/offer-details.dto'; // Importe o DTO de ofertas

// Supondo que você crie um DTO para os detalhes de um ProviderService
import { ProviderServiceDetailsDto } from '../provider-services/dto/provider-service-details.dto'; // Exemplo
import { ProviderServiceSearchResultDto } from './dto/provider-service-search-result.dto'; // Exemplo

@Injectable()
export class SearchService {
  constructor(
    private readonly providersService: ProvidersService,
    private readonly servicesService: ServicesService,
    private readonly providerServicesService: ProviderServicesService, // NOVO: Injetar
    // private readonly offersService: OffersService, // Se houver um OffersService, descomente
  ) {}

  async performSearch(searchQueryDto: SearchQueryDto): Promise<{
    providerServices: ProviderServiceSearchResultDto[], // NOVO: Resultado principal
    providers: ProviderDetailsDto[],
    services: ServiceDetailsDto[],
    offers?: any[]
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
      sortBy
    } = searchQueryDto;

    const results: {
      providerServices: ProviderServiceSearchResultDto[],
      providers: ProviderDetailsDto[],
      services: ServiceDetailsDto[],
      offers?: any[]
    } = {
      providerServices: [],
      providers: [],
      services: [],
      // offers: [],
    };

    // 1. Busca Principal: Serviços específicos oferecidos por provedores (ProviderService)
    // Esta seria a busca mais relevante para o usuário final
    // CORREÇÃO: Comparação correta do enum
    if (!type || type === SearchType.PROVIDER_SERVICES || type === SearchType.ALL) {
      // O providerServicesService.search() precisaria ser implementado para:
      // - Filtrar por 'query' (no nome/descrição do serviço ou bio do provedor)
      // - Filtrar por 'location' e geoespacial (latitude, longitude, radius)
      // - Ordenar por 'sortBy' (rating, distance, experience)
      // - Retornar uma combinação de Provider e ProviderService
      // Placeholder method for ProviderServicesService.search
      const providerServices = await (this.providerServicesService as any).search({ // <--- CORREÇÃO: Cast para 'any' para simular o método 'search'
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
      results.providerServices = providerServices; // Assumindo que o serviço já retorna o DTO correto
    }

    // 2. Busca Complementar: Provedores (se o tipo de busca for explicitamente 'providers' ou 'all')
    if (type === SearchType.PROVIDERS || type === SearchType.ALL) { // <--- CORREÇÃO: Comparação correta do enum
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
        results.providers = providers.map(p => new ProviderDetailsDto(p as any));
    }

    // 3. Busca Complementar: Tipos de Serviço (se o tipo de busca for explicitamente 'services' ou 'all')
    // O servicesService.search() deve ser implementado para fazer a filtragem no DB
    if (type === SearchType.SERVICES || type === SearchType.ALL) { // <--- CORREÇÃO: Comparação correta do enum
      // Placeholder method for ServicesService.search
      const services = await (this.servicesService as any).search(query); // <--- CORREÇÃO: Cast para 'any' para simular o método 'search'
      results.services = services.map(s => new ServiceDetailsDto(s as any));
    }

    // 4. Busca Complementar: Ofertas (se OffersService e OfferDetailsDto existirem)
    /*
    if (!type || type === SearchType.OFFERS || type === SearchType.ALL) { // <--- CORREÇÃO: Comparação correta do enum
      const offers = await this.offersService.searchOffers({ searchTerm: query, limit, offset });
      results.offers = offers.map(o => new OfferDetailsDto(o));
    }
    */

    return results;
  }
}