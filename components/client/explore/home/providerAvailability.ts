import { ProviderDisplayInfo } from '../../../../types/backend/providers';

const normalizeNextAvailable = (
  next?: ProviderDisplayInfo['nextAvailable'],
): ProviderDisplayInfo['nextAvailable'] | undefined => {
  if (!next) return undefined;
  return {
    date: next.date instanceof Date ? next.date.toISOString() : next.date,
    time: next.time instanceof Date ? next.time.toISOString() : next.time,
  };
};

const normalizeNextSlot = (nextSlot?: ProviderDisplayInfo['nextSlot']): ProviderDisplayInfo['nextSlot'] | undefined => {
  if (!nextSlot) return undefined;
  return nextSlot instanceof Date ? nextSlot.toISOString() : nextSlot;
};

export const normalizeProviderAvailability = (
  provider?: ProviderDisplayInfo | null,
): ProviderDisplayInfo | null => {
  if (!provider) return null;
  return {
    ...provider,
    nextAvailable: normalizeNextAvailable(provider.nextAvailable),
    nextSlot: normalizeNextSlot(provider.nextSlot),
  };
};

export const normalizeProviderList = (providers?: ProviderDisplayInfo[]): ProviderDisplayInfo[] => {
  if (!Array.isArray(providers)) return [];
  return providers.map((provider) => normalizeProviderAvailability(provider) ?? provider);
};
