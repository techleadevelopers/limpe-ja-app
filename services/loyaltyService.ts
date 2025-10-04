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
