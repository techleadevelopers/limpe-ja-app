// src/utils/service-helpers.ts
import { PricingType } from "../types/backend/services";
import { formatServicePrice } from "./formatters";
import { ProviderServiceOffering } from "../types/backend/provider-service";

export const getNumericPriceValue = (service: ProviderServiceOffering): number => {
  let rawPrice = service.price;
  let price = typeof rawPrice === 'number'
    ? rawPrice
    : (rawPrice as any)?.toNumber?.() ?? 0;

  if (service.pricingType === PricingType.BY_SIZE) {
    const rawPricePerSqm = service.pricePerSquareMeter;
    const rawPricePerRoom = (service as any).pricePerRoom;

    const sqmPrice = typeof rawPricePerSqm === 'number'
      ? rawPricePerSqm
      : (rawPricePerSqm as any)?.toNumber?.() ?? 0;
    const roomPrice = typeof rawPricePerRoom === 'number'
      ? rawPricePerRoom
      : (rawPricePerRoom as any)?.toNumber?.() ?? 0;

    // Preferir m² se existir; senão usar por quarto
    if (sqmPrice > 0) price = sqmPrice;
    else if (roomPrice > 0) price = roomPrice;
  }
  return price;
};

export const getFormattedServicePrice = (service: ProviderServiceOffering, t: (key: string) => string) => {
  const priceValue = getNumericPriceValue(service);
  let unit = "";

  switch (service.pricingType) {
    case PricingType.HOURLY: unit = t('common.per_hour_short'); break;
    case PricingType.BY_SIZE: {
      // Escolher unidade conforme o campo de preço disponível
      const hasSqm = (typeof service.pricePerSquareMeter === 'number' ? service.pricePerSquareMeter : (service.pricePerSquareMeter as any)?.toNumber?.()) > 0;
      const hasRoom = (typeof (service as any).pricePerRoom === 'number' ? (service as any).pricePerRoom : ((service as any).pricePerRoom as any)?.toNumber?.()) > 0;
      if (hasSqm) unit = t('common.per_sqm_short');
      else if (hasRoom) unit = t('common.per_room_short');
      else unit = '';
      break;
    }
    case PricingType.FIXED_PRICE: unit = ""; break;
    case PricingType.CUSTOM_QUOTE: return t('provider_details.price_not_available');
  }

  const formatted = formatServicePrice(priceValue, unit);
  return formatted === 'Consultar' ? t('provider_details.price_not_available') : formatted;
};
