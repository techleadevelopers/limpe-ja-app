// types/backend/incentives.ts
export type IncentiveKind =
  | 'COUPON_WELCOME'
  | 'COUPON_RETURN'
  | 'REFERRAL'
  | 'CASHBACK'
  | 'MISSION_PUSH';

export interface IncentiveBase {
  id: string;
  kind: IncentiveKind;
  title: string;
  subtitle?: string;
  priority: number;     // menor = mais prioritário
  startsAt?: string;
  endsAt?: string;
  dismissUntil?: string;
}

export interface CouponPayload {
  code: string;
  expiresAt?: string | null;
  percentOff?: number;     // ex.: 30
  valueOff?: number;       // ex.: 25 (R$)
}

export interface ReferralPayload {
  myCode: string;
  rewardReferrer: string;  // "R$25" ou "15% OFF"
  rewardReferred: string;  // idem
}

export interface IncentiveMessage extends IncentiveBase {
  payload?: CouponPayload | ReferralPayload | Record<string, unknown>;
}
