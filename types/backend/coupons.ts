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
  USED_UP = 'USED_UP',
}

export enum CouponTarget {
  ALL = 'ALL',
  NEW_CLIENTS = 'NEW_CLIENTS',
  SPECIFIC_SERVICE = 'SPECIFIC_SERVICE',
  SPECIFIC_PROVIDER = 'SPECIFIC_PROVIDER',
  NEW_CUSTOMER = 'NEW_CUSTOMER', // NOVO
  REFERRAL_REFERRED = 'REFERRAL_REFERRED', // NOVO
  REFERRAL_REFERRER = 'REFERRAL_REFERRER', // NOVO
  MISSION_REWARD = 'MISSION_REWARD', // NOVO
  REPEAT_CUSTOMER = 'REPEAT_CUSTOMER', // NOVO
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  validFrom: string;
  validUntil: string;
  maxUses?: number;
  usesCount: number;
  target: CouponTarget;
  targetId?: string;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CouponApplicationResult {
  discountAmount: number;
  newTotalPrice: number;
  message: string;
  coupon?: Coupon;
  errorCode?: string;
}
