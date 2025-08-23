// relax-app/types/backend/missions.ts (ou o caminho correto)

export type MissionStatus = 'ACTIVE' | 'COMPLETED' | 'CLAIMED';
export type RewardType = 'POINTS' | 'COUPON';

export interface Mission {
  id: string;
  title: string;
  description: string;
  currentProgress: number; // Progressão atual do usuário PARA esta missão
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
  completedAt?: string | null; // ISO
  claimedAt?: string | null;   // ISO
}

export interface MissionItem {
  mission: Mission;
  progress: MissionProgress | null;
  progressPct: number;     // 0..100 (clamp)
  progressLabel: string;   // "2/3", "5 dias", etc.
  canClaim: boolean;       // COMPLETED e não CLAIMED
  isClaimed: boolean;      // CLAIMED
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