// services/incentiveService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IncentiveMessage } from '../types/backend/incentives';
// clientService exports are named (no default export)
import * as clientService from './clientService';

const DISMISS_KEY = 'incentive:dismiss:';

/** Returns true if this incentive is snoozed/dismissed (until a stored date). */
async function isDismissed(id: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(DISMISS_KEY + id);
    if (!value) return false;
    const until = new Date(value).getTime();
    return Date.now() < until;
  } catch {
    return false;
  }
}

/** Dismiss an incentive for N hours (default 48h). */
export async function dismissIncentive(id: string, hours = 48): Promise<void> {
  const until = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  await AsyncStorage.setItem(DISMISS_KEY + id, until);
}

/**
 * Compose incentives for the Home screen.
 * This does NOT change backend logic — it combines existing offers/profile
 * into a prioritized list for display in the front-end.
 */
export async function getIncentivesForHome(): Promise<IncentiveMessage[]> {
  // Gather sources already available in your app layer
  const [offers, profile] = await Promise.all([
    clientService.getOffers?.().catch(() => []),
    clientService.getUserProfile?.().catch(() => null),
  ]);

  const list: IncentiveMessage[] = [];

  // 1) Welcome coupon (priority 1)
  const welcome: any = Array.isArray(offers)
    ? offers.find((o: any) => o?.type === 'NEW_CLIENTS')
    : null;

  if (welcome?.code) {
    list.push({
      id: `welcome:${welcome.code}`,
      kind: 'COUPON_WELCOME',
      title: 'Welcome coupon',
      subtitle: 'Save up to 30% on your first booking',
      priority: 1,
      payload: {
        code: welcome.code,
        expiresAt: welcome.expiresAt ?? null,
        percentOff: 30,
      },
    } as IncentiveMessage);
  }

  // 2) Referral (priority 2)
  if ((profile as any)?.referralCode) {
    list.push({
      id: `ref:${(profile as any).referralCode}`,
      kind: 'REFERRAL',
      title: 'Refer & earn',
      subtitle: 'You and your friend get rewards',
      priority: 2,
      payload: {
        myCode: (profile as any).referralCode,
        rewardReferrer: 'R$25',
        rewardReferred: 'R$20',
      },
    } as IncentiveMessage);
  }

  // 3) Return coupon (priority 3)
  const ret: any = Array.isArray(offers)
    ? offers.find((o: any) => o?.type === 'RETURN_COUPON')
    : null;

  if (ret?.code) {
    list.push({
      id: `return:${ret.code}`,
      kind: 'COUPON_RETURN',
      title: 'Come back & save',
      subtitle: 'Special coupon for your next cleaning',
      priority: 3,
      payload: {
        code: ret.code,
        expiresAt: ret.expiresAt ?? null,
        percentOff: ret.percentOff ?? 20,
      },
    } as IncentiveMessage);
  }

  // 4) Loyalty/Cashback (priority 4) — light message (no backend change)
  // Safe fallback: loyaltyPoints | points | loyalty.points
  const loyaltyPoints: number =
    (typeof (profile as any)?.loyaltyPoints === 'number' && (profile as any).loyaltyPoints) ||
    (typeof (profile as any)?.points === 'number' && (profile as any).points) ||
    (typeof (profile as any)?.loyalty?.points === 'number' && (profile as any).loyalty.points) ||
    0;

  if (loyaltyPoints > 0) {
    list.push({
      id: `cashback:${Math.ceil(loyaltyPoints)}`,
      kind: 'CASHBACK',
      title: 'Earn cashback with missions',
      subtitle: 'Complete tasks and trade for up to 30% OFF',
      priority: 4,
    } as IncentiveMessage);
  }

  // Filter dismissed items (snoozed)
  const filtered: IncentiveMessage[] = [];
  for (const m of list.sort((a: any, b: any) => a.priority - b.priority)) {
    const dismissed = await isDismissed(m.id);
    if (!dismissed) filtered.push(m);
  }
  return filtered;
}

export default {
  getIncentivesForHome,
  dismissIncentive,
};
