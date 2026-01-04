// src/utils/service-helpers.ts
import { formatServicePrice } from "./formatters";
import { ProviderServiceOffering } from "../types/backend/provider-service";

const normalizeDecimal = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (value && typeof (value as any)?.toNumber === 'function') {
    const num = (value as any).toNumber();
    return typeof num === 'number' && Number.isFinite(num) ? num : 0;
  }
  return 0;
};

export const getNumericPriceValue = (service: ProviderServiceOffering): number => {
  const pricePerHour = normalizeDecimal(service.pricePerHour);
  if (pricePerHour > 0) {
    return pricePerHour;
  }
  const legacyPrice = normalizeDecimal(service.price);
  return Math.max(0, legacyPrice);
};

export const getFormattedServicePrice = (service: ProviderServiceOffering, t: (key: string) => string) => {
  const priceValue = getNumericPriceValue(service);
  const formatted = formatServicePrice(priceValue, t('common.per_hour_short'));
  if (formatted === 'Consultar') {
    return t('provider_details.price_not_available');
  }
  return formatted;
};
