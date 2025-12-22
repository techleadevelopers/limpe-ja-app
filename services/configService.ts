import { api } from './api';

export type PricingConfig = {
  minHourlyMinutes: number;
};

const DEFAULT_PRICING_CONFIG: PricingConfig = {
  minHourlyMinutes: 240,
};

let cachedConfig: PricingConfig | null = null;

export async function getPricingConfig(): Promise<PricingConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await api.get<PricingConfig>('/config/pricing');
    const payload = response.data;
    if (payload && typeof payload.minHourlyMinutes === 'number' && payload.minHourlyMinutes > 0) {
      cachedConfig = payload;
      return payload;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[configService] Falha ao buscar config de pricing', (error as any)?.message ?? error);
    }
  }

  cachedConfig = DEFAULT_PRICING_CONFIG;
  return DEFAULT_PRICING_CONFIG;
}
