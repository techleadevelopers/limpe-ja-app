// LimpeJaApp/src/types/backend/coupons.ts
export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum CouponStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  USED = 'USED',
}

export enum CouponTarget {
  ALL = 'ALL',
  NEW_CLIENTS = 'NEW_CLIENTS',
  SPECIFIC_SERVICE = 'SPECIFIC_SERVICE',
  SPECIFIC_PROVIDER = 'SPECIFIC_PROVIDER',
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number; // e.g., 0.10 for 10% or 10.00 for R$10
  validFrom: string; // ISO date string
  validUntil: string; // ISO date string
  maxUses?: number;
  usesCount: number;
  target: CouponTarget;
  targetId?: string; // ID of service or provider if target is specific
  status: string; // ACTIVE, INACTIVE, EXPIRED, USED_UP
  createdAt: string;
  updatedAt: string;
}

export interface CouponApplicationResult {
  discountAmount: number;
  newTotalPrice: number;
  message: string;
  coupon?: Coupon; // Optionally return the applied coupon details
}