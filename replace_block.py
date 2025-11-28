# -*- coding: utf-8 -*-
from pathlib import Path
path = Path('backend-cleaning/src/providers/providers.service.ts')
text = path.read_text(encoding='utf-8', errors='ignore')
old = '''    this.logger.log(`[ProvidersService] findTopRatedOrExperiencedProviders: Encontrados ${providers.length} provedores.`);

    const providersWithCalculatedRating: ProviderWithCalculatedRating[] = await Promise.all(providers.map(async provider => {
      let distance = undefined;
      if (latitude && longitude && typeof provider === 'object' && 'distance_m' in provider) {
        distance = parseFloat(provider.distance_m); // Em metros
      }
      const mapped = this.mapProviderToCalculatedRating(provider as ProviderWithIncludes, distance);
      // O cA!lculo de nextAvailable A? feito aqui, pois mapProviderToCalculatedRating A? sA?ncrona
      mapped.nextAvailable = await this.calculateNextAvailable(provider.id);
      return mapped;
    }));
'''
new = '''    this.logger.log(`[ProvidersService] findTopRatedOrExperiencedProviders: Encontrados ${providers.length} provedores.`);

    const providersWithCalculatedRating: ProviderWithCalculatedRating[] = await Promise.all(providers.map(async (provider: any) => {
      // Ajusta resultados de raw query para o formato esperado (providerServices/address)
      if (!provider.providerServices && (provider as any).providerServicesAgg) {
        (provider as any).providerServices = (provider as any).providerServicesAgg.map((ps: any) => ({
          id: ps.id,
          providerId: ps.providerId,
          serviceId: ps.serviceId,
          price: ps.price != null ? new Decimal(ps.price) : new Decimal(0),
          durationMinutes: ps.durationMinutes,
          description: ps.description,
          createdAt: ps.createdAt,
          updatedAt: ps.updatedAt,
          pricingType: ps.pricingType,
          pricePerSquareMeter: ps.pricePerSquareMeter ? new Decimal(ps.pricePerSquareMeter) : null,
          pricePerRoom: ps.pricePerRoom ? new Decimal(ps.pricePerRoom) : null,
          service: {
            id: ps.service.id,
            name: ps.service.name,
            description: ps.service.description,
            icon: ps.service.icon,
            price: ps.service.price != null ? new Decimal(ps.service.price) : new Decimal(0),
            createdAt: ps.service.createdAt,
            updatedAt: ps.service.updatedAt,
          },
        }));
      }
      if (!provider.address && (provider as any).addressId) {
        (provider as any).address = {
          id: (provider as any).addressId,
          cep: (provider as any).cep,
          street: (provider as any).street,
          number: (provider as any).number,
          complement: (provider as any).complement,
          neighborhood: (provider as any).neighborhood,
          city: (provider as any).city,
          state: (provider as any).state,
          clientId: null,
          providerId: (provider as any).providerId,
          latitude: (provider as any).latitude_val ?? (provider as any).latitude ?? null,
          longitude: (provider as any).longitude_val ?? (provider as any).longitude ?? null,
          location: null,
        } as Address;
      }

      let distance = undefined;
      if (latitude !== undefined && longitude !== undefined) {
        if (typeof provider === 'object' && 'distance_m' in provider && provider.distance_m !== null && provider.distance_m !== undefined) {
          distance = parseFloat(provider.distance_m); // Em metros
        } else {
          const targetLat = (provider as any).latitude_val ?? (provider as any).address?.latitude ?? null;
          const targetLon = (provider as any).longitude_val ?? (provider as any).address?.longitude ?? null;
          distance = this.calculateDistanceMeters(latitude, longitude, targetLat, targetLon);
        }
      }

      const mapped = this.mapProviderToCalculatedRating(provider as ProviderWithIncludes, distance);
      // O cálculo de nextAvailable é feito aqui, pois mapProviderToCalculatedRating é síncrona
      mapped.nextAvailable = await this.calculateNextAvailable(provider.id);
      return mapped;
    }));
'''
if old not in text:
    raise SystemExit('pattern not found')
path.write_text(text.replace(old, new), encoding='utf-8')
