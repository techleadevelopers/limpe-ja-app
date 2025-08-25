// app/services/rankingService.ts
import api from './api';
import type {
  LeaderboardPeriod,
  LeaderboardResponse,
  LeaderboardEntry,
} from '../types/backend/ranking';

// cache simples em memória por período
const cache = new Map<LeaderboardPeriod, { t: number; data: LeaderboardResponse }>();
const STALE_MS = 60_000; // 1 min

async function fetchLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardResponse> {
  const { data } = await api.get<LeaderboardResponse>('/ranking/leaderboard', {
    params: { period },
  });
  return data;
}

class RankingService {
  async getLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardResponse> {
    const hit = cache.get(period);
    if (hit && Date.now() - hit.t < STALE_MS) return hit.data;

    try {
      const data = await fetchLeaderboard(period);
      cache.set(period, { t: Date.now(), data });
      return data;
    } catch (err) {
      // fallback de DEV p/ não travar UI
      console.warn('[RankingService] usando mock por erro:', (err as any)?.message);
      const now = new Date().toISOString();
      const mockTop: LeaderboardEntry[] = [
        { userId: '3', displayName: 'Você', handle: '@voce', score: 3000, rank: 1, delta: +2, badges: ['SLA_90'], slaResponseRate: 0.94, avgResponseMinutes: 7, isCurrentUser: true },
        { userId: '2', displayName: 'Analista Pro', handle: '@capsicle', score: 2500, rank: 2, delta: -1, badges: ['TOP_NEIGHBORHOOD'] },
        { userId: '4', displayName: 'Speed Cleaner', handle: '@point_break', score: 2490, rank: 3, delta: 0, badges: ['STREAK_10'] },
        { userId: '5', displayName: 'Underoos', handle: '@underoos', score: 2400, rank: 4, delta: +1 },
        { userId: '6', displayName: 'Jolly Green', handle: '@jolly_green', score: 2300, rank: 5, delta: -1 },
        { userId: '7', displayName: 'Triple Imposter', handle: '@triple', score: 2299, rank: 6, delta: 0 },
        { userId: '8', displayName: 'The Wizard', handle: '@wizard', score: 2230, rank: 7, delta: +3 },
      ];
      const mock: LeaderboardResponse = { period, updatedAt: now, top: mockTop, myRank: mockTop[0], totalUsers: 124 };
      cache.set(period, { t: Date.now(), data: mock });
      return mock;
    }
  }

  // útil se quiser “minha posição” separada
  async getMyRank(period: LeaderboardPeriod): Promise<LeaderboardEntry | null> {
    try {
      const { data } = await api.get<LeaderboardEntry | null>('/ranking/me', { params: { period } });
      return data ?? null;
    } catch {
      return null;
    }
  }

  // prefetch de períodos vizinhos para UX mais rápida
  async prefetchNeighbors(current: LeaderboardPeriod) {
    const nexts: LeaderboardPeriod[] =
      current === 'day' ? ['week', 'month']
      : current === 'week' ? ['day', 'month']
      : ['day', 'week'];
    await Promise.allSettled(nexts.map(async (p) => {
      try {
        const d = await fetchLeaderboard(p);
        cache.set(p, { t: Date.now(), data: d });
      } catch { /* ignora */ }
    }));
  }

  // expõe cache (opcional)
  getCached(period: LeaderboardPeriod) {
    const hit = cache.get(period);
    return hit?.data;
  }
}

export default new RankingService();
