import { ProviderDisplayInfo } from '../../../types/backend/providers';

export type CityStateHint = {
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
};

export const normalizeLocationText = (value?: string | null) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export const filterByRadiusOrCity = (
  items: ProviderDisplayInfo[],
  radiusMeters: number,
  hint: CityStateHint,
): ProviderDisplayInfo[] => {
  if (!Array.isArray(items)) return [];
  const hasCityState = !!(hint.city && hint.state);
  return items.filter((item) => {
    if (!item) return false;
    const dist = Number(item.distance);
    if (Number.isFinite(dist) && radiusMeters > 0) {
      return dist <= radiusMeters;
    }
    if (hasCityState) {
      const providerCity = normalizeLocationText(item.address?.city);
      const providerState = normalizeLocationText(item.address?.state);
      if (providerCity && providerState) {
        return providerCity === hint.city && providerState === hint.state;
      }
      return true;
    }
    return true;
  });
};
