// relax-app/types/backend/missions.ts
// Este arquivo parece definir tipos simplificados para uso no frontend ou DTOs específicos.
// A interface 'Mission' aqui é uma representação reduzida e não inclui todos os campos do modelo Prisma.

export type MissionStatus = 'ACTIVE' | 'COMPLETED' | 'CLAIMED';
export type RewardType = 'POINTS' | 'COUPON';

export interface Mission {
  id: string;
  title: string;
  description: string;
  currentProgress: number;
  targetValue: number;
  rewardType: RewardType;
  rewardValue: number;
  status: MissionStatus;
}

export interface MissionProgress {
  userId: string;
  missionId: string;
  currentValue: number;
  status: MissionStatus;
  completedAt?: string | null;
  claimedAt?: string | null;
}

export interface MissionItem {
  mission: Mission;
  progress: MissionProgress | null;
  progressPct: number;
  progressLabel: string;
  canClaim: boolean;
  isClaimed: boolean;
}

/**
 * NOVO: Categoria da missão.
 */
export type MissionCategory = 'VOLUME' | 'FREQUENCY' | 'DIVERSITY';

/**
 * NOVO: Interface para uma missão do cliente.
 */
export interface ClientMission {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  progress: number;
  goal: number;
  reward: {
    kind: 'COUPON' | 'CREDITS';
    value: number | string;
  };
  completed: boolean;
  claimable: boolean;
}

/**
 * NOVO: Interface para uma recompensa do cliente.
 */
export interface ClientReward {
  id: string;
  kind: 'COUPON' | 'CREDITS';
  code?: string;
  value: number;
}