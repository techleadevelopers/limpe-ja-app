import { ProviderAvailability } from '../../../types/backend/providers';

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

export type AvailabilityFetcher = (
  providerId: string,
  dateString: string,
  options?: { signal?: AbortSignal },
) => Promise<{ available: ProviderAvailability[]; occupiedTimes: string[] }>;

let availabilityFetcher: AvailabilityFetcher | null = null;

export const registerAvailabilityFetcher = (fetcher: AvailabilityFetcher) => {
  availabilityFetcher = fetcher;
};

export const fetchAvailabilityWithCooldown = async (
  provId: string,
  dateString: string,
  options?: { signal?: AbortSignal; sharePending?: boolean },
): Promise<{ available: ProviderAvailability[]; occupiedTimes: string[] }> => {
  const cacheKey = buildCacheKey(provId, dateString);
  const cached = availabilityCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached;
  }

  const shouldSharePending = options?.sharePending !== false;
  if (shouldSharePending && availabilityPendingRequests.has(cacheKey)) {
    return availabilityPendingRequests.get(cacheKey)!;
  }

  const now = Date.now();
  const lastRun = availabilityCooldownMap.get(cacheKey) ?? 0;
  const waitMs = Math.max(0, MIN_AVAILABILITY_COOLDOWN - (now - lastRun));
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  availabilityCooldownMap.set(cacheKey, Date.now());

  if (!availabilityFetcher) {
    throw new Error('Availability fetcher is not registered.');
  }

  const promise = (async () => {
    try {
      const response = await availabilityFetcher(provId, dateString, {
        signal: options?.signal,
      });
      availabilityCache.set(cacheKey, { ...response, timestamp: Date.now() });
      return response;
    } finally {
      if (shouldSharePending) {
        availabilityPendingRequests.delete(cacheKey);
      }
    }
  })();

  if (shouldSharePending) {
    availabilityPendingRequests.set(cacheKey, promise);
  }

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
