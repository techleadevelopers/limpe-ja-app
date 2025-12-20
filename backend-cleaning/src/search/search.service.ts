/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
// src/search/search.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SearchQueryDto, SearchType } from './dto/search-query.dto';
import { ProvidersService } from '../providers/providers.service';
import { ServicesService } from '../services/services.service';
import { ProviderServicesService } from '../provider-services/provider-services.service';
import { ProviderDetailsDto } from '../providers/dto/provider-details.dto';
import { ServiceDetailsDto } from '../services/dto/service-details.dto';
import { OffersService } from '../offers/offers.service';
import { PricingService } from '../pricing/pricing.service';
import { DynamicPriceResult } from '../pricing/dto/calculate-price.dto';
import { ProviderServiceSearchResultDto } from './dto/provider-service-search-result.dto';

type ProviderServicesSearcher = {
  search?: (params: Record<string, unknown>) => Promise<unknown>;
};

type ServicesSearcher = {
  search?: (term?: string) => Promise<unknown>;
};

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly providersService: ProvidersService,
    private readonly servicesService: ServicesService,
    private readonly providerServicesService: ProviderServicesService,
    private readonly offersService: OffersService,
    private readonly pricingService: PricingService,
  ) {}

  async performSearch(searchQueryDto: SearchQueryDto): Promise<{
    providerServices: ProviderServiceSearchResultDto[];
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
      offers: [],
    };

    // 1. Provider services
    if (
      !type ||
      type === SearchType.PROVIDER_SERVICES ||
      type === SearchType.ALL
    ) {
      const providerSearchFn = (
        this.providerServicesService as ProviderServicesSearcher
      ).search;
      const providerServicesResults =
        (providerSearchFn &&
          (await providerSearchFn({
            searchTerm: query,
            location,
            latitude,
            longitude,
            radius,
            sortBy,
            limit,
            offset,
          }))) ||
        [];
      const rawProviderServices = Array.isArray(providerServicesResults)
        ? providerServicesResults
        : [];

      results.providerServices = await Promise.all(
        rawProviderServices.map(async (psResult) => {
          const priceValue =
            typeof (psResult as any)?.price === 'number'
              ? (psResult as any).price
              : 0;
          let dynamicPrice: DynamicPriceResult = {
            originalPrice: priceValue,
            surgeFactor: 1.0,
            finalPrice: priceValue,
            appliedRules: [],
          };
          if (latitude && longitude && date) {
            try {
              dynamicPrice = await this.pricingService.calculatePrice({
                serviceId: (psResult as any)?.serviceId,
                providerId: (psResult as any)?.providerId,
                latitude,
                longitude,
                scheduledDate: date,
                cityCode: (psResult as any)?.provider?.address?.city,
                categoryId: (psResult as any)?.service?.categoryId,
              });
            } catch (e) {
              const message = e instanceof Error ? e.message : String(e);
              this.logger.error(
                `Error calculating dynamic price for providerService ${(psResult as any)?.id}: ${message}`,
              );
            }
          }
          return {
            ...(psResult as ProviderServiceSearchResultDto),
            dynamicPrice,
            provider: {
              ...(psResult as any)?.provider,
              badges: (psResult as any)?.provider?.badges || [],
            },
          };
        }),
      );
    }

    // 2. Providers
    if (type === SearchType.PROVIDERS || type === SearchType.ALL) {
      const providers = await this.providersService.search({
        searchTerm: query,
        location,
        limit,
        offset,
        latitude,
        longitude,
        radius,
        sortBy,
      });
      const providersArray = Array.isArray(providers) ? providers : [];
      results.providers = providersArray.map((p) => new ProviderDetailsDto(p));
    }

    // 3. Services
    if (type === SearchType.SERVICES || type === SearchType.ALL) {
      const servicesSearchFn = (this.servicesService as ServicesSearcher)
        .search;
      const services =
        (servicesSearchFn && (await servicesSearchFn(query))) || [];
      const servicesArray = Array.isArray(services) ? services : [];
      results.services = servicesArray.map((s) => new ServiceDetailsDto(s));
    }

    // 4. Offers
    if (!type || type === SearchType.OFFERS || type === SearchType.ALL) {
      const offers = await this.offersService.searchOffers(
        query,
        limit,
        offset,
      );
      results.offers = offers;
    }

    return results;
  }
}
