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
    const sqmPrice = typeof rawPricePerSqm === 'number'
      ? rawPricePerSqm
      : (rawPricePerSqm as any)?.toNumber?.() ?? 0;
    if (sqmPrice > 0) price = sqmPrice;
  }
  return price;
};

export const getFormattedServicePrice = (service: ProviderServiceOffering, t: (key: string) => string) => {
  const priceValue = getNumericPriceValue(service);
  let unit = "";

  switch (service.pricingType) {
    case PricingType.HOURLY: unit = t('common.per_hour_short'); break;
    case PricingType.BY_SIZE: unit = t('common.per_sqm_short'); break;
    case PricingType.FIXED_PRICE: unit = ""; break;
    case PricingType.CUSTOM_QUOTE: return t('provider_details.price_not_available');
  }

  const formatted = formatServicePrice(priceValue, unit);
  return formatted === 'Consultar' ? t('provider_details.price_not_available') : formatted;
};