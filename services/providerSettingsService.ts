import { fetchApi } from './api';

export type DayKey = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type TimeRange = { start: string; end: string };
export type WeeklyTemplate = Partial<Record<DayKey, TimeRange[]>>;

export interface ProviderSettingsPayload {
  serviceRadiusKm: number;
  weeklyTemplate?: WeeklyTemplate;
}

export interface BulkAvailabilityPayload {
  dates: Array<{
    date: string; // YYYY-MM-DD
    ranges: TimeRange[];
  }>;
}

export async function saveProviderSettings(payload: ProviderSettingsPayload) {
  return fetchApi('/providers/me/settings', {
    method: 'PUT',
    data: payload,
  });
}

export async function getProviderSettings(): Promise<{ serviceRadiusKm?: number }> {
  return fetchApi('/providers/me/settings', {
    method: 'GET',
  });
}

export async function bulkSetAvailability(payload: BulkAvailabilityPayload) {
  return fetchApi('/providers/me/availability/bulk', {
    method: 'POST',
    data: payload,
  });
}

export async function generateSlotsFromWeeklyTemplate(monthIso: string) {
  // monthIso ex.: '2025-11'
  return fetchApi(`/providers/me/availability/generate-slots?month=${encodeURIComponent(monthIso)}`, {
    method: 'POST',
  });
}
