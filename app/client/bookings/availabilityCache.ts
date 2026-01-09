import { ProviderAvailability } from '../../../types/backend/providers';
import { getProviderAvailability } from '../../../services/providerService';

const MIN_AVAILABILITY_COOLDOWN = 1200;

export const availabilityCache = new Map<
  string,
  {
    available: ProviderAvailability[];
    occupiedTimes: string[];
    requestedDate?: string;
    timestamp: number;
  }
>();
export const availabilityCooldownMap = new Map<string, number>();
export const availabilityPendingRequests = new Map<
  string,
  Promise<{ available: ProviderAvailability[]; occupiedTimes: string[] }>
>();

const buildCacheKey = (providerId: string, dateString: string) => `${providerId}-${dateString}`;

export const fetchAvailabilityWithCooldown = async (
  provId: string,
  dateString: string,
): Promise<{ available: ProviderAvailability[]; occupiedTimes: string[] }> => {
  const cacheKey = buildCacheKey(provId, dateString);
  const cached = availabilityCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached;
  }

  if (availabilityPendingRequests.has(cacheKey)) {
    return availabilityPendingRequests.get(cacheKey)!;
  }

  const now = Date.now();
  const lastRun = availabilityCooldownMap.get(cacheKey) ?? 0;
  const waitMs = Math.max(0, MIN_AVAILABILITY_COOLDOWN - (now - lastRun));
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  availabilityCooldownMap.set(cacheKey, Date.now());

  const promise = (async () => {
    try {
      const response = await getProviderAvailability(provId, dateString);
      availabilityCache.set(cacheKey, { ...response, timestamp: Date.now() });
      return response;
    } finally {
      availabilityPendingRequests.delete(cacheKey);
    }
  })();
  availabilityPendingRequests.set(cacheKey, promise);
  return promise;
};

export const invalidateAvailabilityCache = (providerId?: string, dateString?: string) => {
  if (providerId && dateString) {
    const cacheKey = buildCacheKey(providerId, dateString);
    availabilityCache.delete(cacheKey);
    availabilityCooldownMap.delete(cacheKey);
    availabilityPendingRequests.delete(cacheKey);
    return;
  }

  if (providerId) {
    for (const key of Array.from(availabilityCache.keys())) {
      if (key.startsWith(`${providerId}-`)) {
        availabilityCache.delete(key);
        availabilityCooldownMap.delete(key);
        availabilityPendingRequests.delete(key);
      }
    }
    return;
  }

  availabilityCache.clear();
  availabilityCooldownMap.clear();
  availabilityPendingRequests.clear();
};
