// src/search/search.service.ts
import { Injectable } from '@nestjs/common';
import { SearchQueryDto, SortByOption } from './dto/search-query.dto'; // <-- Importar SortByOption também
import { ProvidersService } from '../providers/providers.service';
import { ServicesService } from '../services/services.service';
import { ProviderDetailsDto } from '../providers/dto/provider-details.dto';
import { ServiceDetailsDto } from '../services/dto/service-details.dto';
import { ProviderSearchDto } from '../providers/dto/provider-search.dto';

@Injectable()
export class SearchService {
  constructor(
    private readonly providersService: ProvidersService,
    private readonly servicesService: ServicesService,
    // private readonly offersService: OffersService, // Se houver um OffersService
  ) {}

  async performSearch(searchQueryDto: SearchQueryDto): Promise<{ providers: ProviderDetailsDto[], services: ServiceDetailsDto[] }> {
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

    const results: { providers: ProviderDetailsDto[], services: ServiceDetailsDto[] } = {
      providers: [],
      services: [],
      // offers: [],
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
      // CORREÇÃO: O construtor do ProviderDetailsDto agora espera ProviderWithRelations
      // A saída do providersService.search é ProviderWithCalculatedRating
      // Vamos adicionar um cast 'as any' temporário aqui ou ajustar o construtor do DTO
      // para aceitar ProviderWithCalculatedRating ou ProviderWithRelations.
      // A melhor solução é ajustar o construtor do ProviderDetailsDto para aceitar o ProviderWithCalculatedRating
      // ou um tipo mais genérico que englobe os campos que ele precisa.
      // Por enquanto, usarei 'as any' para compilar, mas a tipagem real do construtor é a solução.
      results.providers = providers.map(p => new ProviderDetailsDto(p as any)); // <-- CORREÇÃO: Cast temporário (melhorar o construtor do DTO)
    }

    // Busca por Tipos de Serviço
    if (!type || type === 'services' || type === 'all') {
      const services = await this.servicesService.findAll();
      results.services = services
        .filter(s => query ? s.name.toLowerCase().includes(query.toLowerCase()) || (s.description && s.description.toLowerCase().includes(query.toLowerCase())) : true)
        .map(s => new ServiceDetailsDto(s as any)); // <-- CORREÇÃO: Cast temporário (melhorar construtor DTO)
    }

    return results;
  }
}