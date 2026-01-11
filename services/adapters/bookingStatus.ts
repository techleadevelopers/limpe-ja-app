// services/adapters/bookingStatus.ts
// Drop-in adapter to align BE/FE BookingStatus naming without changing UI code.

export type FEStatus =
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'PENDING_PROVIDER_CONFIRMATION'
  | 'PENDING_DISPUTE'
  | 'CONFIRMED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'STARTED'
  | 'FINISHED'
  | 'EXPIRED'
  | 'CANCELED'
  | 'RESCHEDULED'
  | 'REJECTED'
  | 'NO_SHOW';

export type BEStatus = FEStatus;

export const toFE = (be: BEStatus): FEStatus => {
  return be;
};

export const toBE = (fe: FEStatus): BEStatus => {
  return fe;
};

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
