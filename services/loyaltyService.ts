import { api } from './api';

export interface LoyaltyBalance {
  userId: string;
  currentPoints: number;
  nextReward?: {
    id: string;
    name: string;
    costPoints: number;
  } | null;
}

export interface LoyaltyHistoryItem {
  id: string;
  type: string;
  points: number;
  referenceId?: string | null;
  createdAt: string;
}

export async function getMyLoyaltyBalance(): Promise<LoyaltyBalance> {
  const { data } = await api.get('/loyalty/me', { headers: { 'x-silent': '1' } });
  return data;
}

export async function getMyLoyaltyHistory(): Promise<LoyaltyHistoryItem[]> {
  const { data } = await api.get('/loyalty/me/history', { headers: { 'x-silent': '1' } });
  return data;
}

// Rewards catalog (optional backend). If the endpoint is missing, return an empty list gracefully.
export type LoyaltyRewardItem = {
  id: string;
  name: string;
  description?: string | null;
  costPoints: number;
  value: number; // if <=1 -> percent, otherwise fixed currency
  isActive: boolean;
};

export async function getLoyaltyRewards(params?: { limit?: number; offset?: number; type?: string; q?: string }): Promise<LoyaltyRewardItem[]> {
  try {
    const { data } = await api.get('/loyalty/rewards', { headers: { 'x-silent': '1' }, params });
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    // If backend doesn't expose rewards yet, return empty
    if (err?.response?.status === 404) return [];
    return [];
  }
}

export async function redeemLoyaltyPoints(params: { rewardId: string; pointsToRedeem: number; rewardType?: string }): Promise<{ success: boolean; couponCode?: string; expiresAt?: string }>{
  const payload = {
    rewardId: params.rewardId,
    pointsToRedeem: params.pointsToRedeem,
    rewardType: params.rewardType || 'DISCOUNT_COUPON',
  };
  const { data } = await api.post('/loyalty/redeem', payload);
  return data;
}

