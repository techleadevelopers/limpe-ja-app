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
  USED_UP = 'USED_UP', // CORREÇÃO: Adicionado USED_UP
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
  value: number; // e.g., 0.10 for 10% or 10.00 for R$10 (CORREÇÃO: Decimal no Prisma é number aqui)
  validFrom: string; // ISO date string
  validUntil: string; // ISO date string
  maxUses?: number;
  usesCount: number;
  target: CouponTarget;
  targetId?: string; // ID of service or provider if target is specific
  status: CouponStatus; // CORREÇÃO: Usar o enum CouponStatus
  createdAt: string;
  updatedAt: string;
}

export interface CouponApplicationResult {
  discountAmount: number;
  newTotalPrice: number;
  message: string;
  coupon?: Coupon; // Optionally return the applied coupon details
}