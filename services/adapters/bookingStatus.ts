// services/adapters/bookingStatus.ts
// Drop-in adapter to align BE/FE BookingStatus naming without changing UI code.

export type FEStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'REJECTED'
  | 'NO_SHOW'
  | 'PENDING_PROVIDER_CONFIRMATION';

export type BEStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'RESCHEDULED'
  | 'REJECTED'
  | 'NO_SHOW'
  | 'PENDING_PROVIDER_CONFIRMATION';

export const toFE = (be: BEStatus): FEStatus =>
  (be === 'CANCELED' ? 'CANCELLED' : be) as FEStatus;

export const toBE = (fe: FEStatus): BEStatus =>
  (fe === 'CANCELLED' ? 'CANCELED' : fe) as BEStatus;

// Helpers to map arrays/objects non-destructively
export function mapBookingStatusIn<T extends { status: any }>(obj: T): T {
  try {
    if (!obj || !obj.status) return obj;
    const mapped = { ...obj, status: toFE(obj.status as BEStatus) };
    return mapped;
  } catch {
    return obj;
  }
}

export function mapBookingStatusArray<T extends { status: any }>(arr: T[]): T[] {
  return Array.isArray(arr) ? arr.map(mapBookingStatusIn) : arr;
}

