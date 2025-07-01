// src/search/search.service.ts
import { Injectable } from '@nestjs/common';
import { SearchQueryDto, SortByOption } from './dto/search-query.dto'; // <-- Importar SortByOption também
import { ProvidersService } from '../providers/providers.service';
import { ServicesService } from '../services/services.service';
import { ProviderDetailsDto } from '../providers/dto/provider-details.dto';
import { ServiceDetailsDto } from '../services/dto/service-details.dto';
import { ProviderSearchDto } from '../providers/dto/provider-search.dto';
// import { OffersService } from '../offers/offers.service'; // Importe o OffersService se ele existir
// import { OfferDetailsDto } from '../offers/dto/offer-details.dto'; // Importe o DTO de ofertas

@Injectable()
export class SearchService {
  constructor(
    private readonly providersService: ProvidersService,
    private readonly servicesService: ServicesService,
    // private readonly offersService: OffersService, // Se houver um OffersService, descomente
  ) {}

  async performSearch(searchQueryDto: SearchQueryDto): Promise<{ providers: ProviderDetailsDto[], services: ServiceDetailsDto[], offers?: any[] }> { // Adicionado 'offers?: any[]'
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

    const results: { providers: ProviderDetailsDto[], services: ServiceDetailsDto[], offers?: any[] } = { // Adicionado 'offers?: any[]'
      providers: [],
      services: [],
      // offers: [], // Descomente se for incluir ofertas
    };

    // Busca por Provedores
    if (!type || type === 'providers' || type === 'all') {
      // Mapear SearchQueryDto para ProviderSearchDto
      const providerSearchDto: ProviderSearchDto = {
        searchTerm: query, // Mapeia query para searchTerm
        location: location,
        limit: limit,
        offset: offset,
        latitude: latitude,
        longitude: longitude,
        radius: radius,
        sortBy: sortBy, // Passa o sortBy diretamente
        // serviceId e minRating não vêm diretamente do SearchQueryDto neste exemplo,
        // mas se viessem, você os adicionaria aqui.
      };

      const providers = await this.providersService.search(providerSearchDto);
      // CORREÇÃO: O construtor do ProviderDetailsDto deve ser ajustado para aceitar ProviderWithCalculatedRating
      // Se ProviderDetailsDto não puder ser modificado, o 'as any' é uma solução temporária.
      // A melhor prática é garantir que o DTO seja compatível com o tipo retornado pelo serviço.
      results.providers = providers.map(p => new ProviderDetailsDto(p as any));
    }

    // Busca por Tipos de Serviço
    if (!type || type === 'services' || type === 'all') {
      const services = await this.servicesService.findAll();
      results.services = services
        .filter(s => query ? s.name.toLowerCase().includes(query.toLowerCase()) || (s.description && s.description.toLowerCase().includes(query.toLowerCase())) : true)
        .map(s => new ServiceDetailsDto(s as any)); // <-- CORREÇÃO: Cast temporário (melhorar construtor DTO)
    }

    // TODO: Busca por Ofertas (se OffersService e OfferDetailsDto existirem)
    /*
    if (!type || type === 'offers' || type === 'all') {
      // Exemplo de como buscar ofertas, adaptando conforme a API do OffersService
      const offers = await this.offersService.searchOffers({ searchTerm: query, limit, offset });
      results.offers = offers.map(o => new OfferDetailsDto(o));
    }
    */

    return results;
  }
}