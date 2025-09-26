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
      console.error('[RankingService] Erro ao buscar leaderboard:', (err as any)?.message);
      // Em um ambiente de produção "premium", não devemos retornar dados mockados em caso de erro.
      // O erro deve ser propagado para que a UI possa lidar com ele (ex: exibir uma mensagem de erro).
      throw err;
    }
  }

  // útil se quiser “minha posição” separada
  async getMyRank(period: LeaderboardPeriod): Promise<LeaderboardEntry | null> {
    try {
      const { data } = await api.get<LeaderboardEntry | null>('/ranking/me', { params: { period } });
      return data ?? null;
    } catch (err) {
      console.error('[RankingService] Erro ao buscar meu ranking:', (err as any)?.message);
      throw err; // Propagar o erro
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
      } catch (err) {
        console.warn(`[RankingService] Erro ao prefetch leaderboard para período ${p}:`, (err as any)?.message);
        // Não relançar erro para não interromper outros prefetches
      }
    }));
  }

  // expõe cache (opcional)
  getCached(period: LeaderboardPeriod) {
    const hit = cache.get(period);
    return hit?.data;
  }
}

export default new RankingService();