// types/backend/ranking.ts
export type LeaderboardPeriod = 'day' | 'week' | 'month';

export type RankingBadgeType = 'TOP_NEIGHBORHOOD' | 'STREAK_10' | 'SLA_90';

export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  handle?: string;                 // ex.: @maria_souza
  avatarUrl?: string | null;
  score: number;                   // pontos
  rank: number;                    // posição (1..N)
  delta?: number;                  // variação de posição (+/-) vs período anterior
  badges?: RankingBadgeType[];     // selos exibíveis
  slaResponseRate?: number;        // 0..1
  avgResponseMinutes?: number;     // tempo médio de resposta
  isCurrentUser?: boolean;         // destaque do usuário logado
}

export interface LeaderboardResponse {
  period: LeaderboardPeriod;
  updatedAt: string;               // ISO datetime do snapshot
  top: LeaderboardEntry[];         // ordenado por rank ASC
  myRank?: LeaderboardEntry | null;
  totalUsers?: number;
}
