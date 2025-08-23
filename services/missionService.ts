// services/missionService.ts
import api from './api';

/** ==== Tipos (espelham o Prisma/backend) ==== */
export enum MissionAudience {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
}

export enum MissionKind {
  COUNT_EVENT = 'COUNT_EVENT',
  STREAK_DAYS = 'STREAK_DAYS',
  WITHIN_WINDOW = 'WITHIN_WINDOW',
}

export enum RewardType {
  COUPON = 'COUPON',
  POINTS = 'POINTS',
}

export enum MissionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CLAIMED = 'CLAIMED',
}

export type Mission = {
  id: string;
  code: string;
  title: string;
  description: string;
  audience: MissionAudience;
  kind: MissionKind;
  eventName: string;
  targetValue: number;
  timeWindowDays?: number | null;
  rewardType: RewardType;
  rewardValue: number; // % quando COUPON, pontos quando POINTS
  couponTemplateId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MissionProgress = {
  id: string;
  userId: string;
  missionId: string;
  currentValue: number;
  status: MissionStatus;
  lastEventAt?: string | null;
  completedAt?: string | null;
  claimedAt?: string | null;
  mission: Mission; // backend já pode incluir a missão no /missions/my
};

export type MissionItem = {
  mission: Mission;
  progress: MissionProgress | null;
  // helpers calculados para UI
  progressPct: number;      // 0..100
  progressLabel: string;    // "2/3", "5 dias", etc
  canClaim: boolean;        // COMPLETED e não CLAIMED
  isClaimed: boolean;       // CLAIMED
};

export type ClaimMissionResponse =
  | {
      ok: true;
      missionId: string;
      rewardType: RewardType;
      // quando COUPON
      coupon?: {
        id: string;
        code: string;
        valueType: 'PERCENT' | 'FIXED' | string;
        value: number;
        validUntil: string;
      };
      // quando POINTS
      pointsGranted?: number;
      message?: string;
    }
  | {
      ok: false;
      missionId: string;
      reason: string;
    };

/** ==== Helpers internos ==== */
const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

function computeProgressPct(progress: MissionProgress | null, mission: Mission): number {
  if (!progress) return 0;
  if (progress.status === MissionStatus.CLAIMED) return 100;
  const pct = (progress.currentValue / Math.max(1, mission.targetValue)) * 100;
  return clamp(Math.round(pct));
}

function computeProgressLabel(progress: MissionProgress | null, mission: Mission): string {
  if (!progress) return `0/${mission.targetValue}`;
  if (mission.kind === MissionKind.STREAK_DAYS) {
    return `${progress.currentValue} dia${progress.currentValue === 1 ? '' : 's'}`;
  }
  return `${Math.min(progress.currentValue, mission.targetValue)}/${mission.targetValue}`;
}

function deriveFlags(progress: MissionProgress | null): { canClaim: boolean; isClaimed: boolean } {
  if (!progress) return { canClaim: false, isClaimed: false };
  const isClaimed = progress.status === MissionStatus.CLAIMED;
  const canClaim = progress.status === MissionStatus.COMPLETED && !isClaimed;
  return { canClaim, isClaimed };
}

/** ==== API ==== */

/**
 * Lista as missões do usuário logado com progresso.
 * Backend esperado: GET /missions/my -> MissionProgress[] (com mission incluída) ou {missions:[], progress:[]}.
 */
export async function getMyMissions(): Promise<MissionItem[]> {
  // Suporta dois formatos de resposta: array de progressos com mission incluída
  // ou um objeto { items: MissionItemLike[] }. Ajusta automaticamente.
  const { data } = await api.get('/missions/my');

  // Caso 1: backend retorna um array de progressos com mission
  if (Array.isArray(data)) {
    const items: MissionItem[] = data.map((p: MissionProgress) => {
      const mission = p.mission;
      const progressPct = computeProgressPct(p, mission);
      const progressLabel = computeProgressLabel(p, mission);
      const { canClaim, isClaimed } = deriveFlags(p);
      return { mission, progress: p, progressPct, progressLabel, canClaim, isClaimed };
    });
    // Pode haver missões ativas sem progress record ainda — opcionalmente o backend já envia.
    return items;
  }

  // Caso 2: backend retorna { missions: Mission[], progress: MissionProgress[] }
  if (data?.missions && data?.progress) {
    const progressMap: Record<string, MissionProgress> = {};
    (data.progress as MissionProgress[]).forEach((p) => (progressMap[p.missionId] = p));

    const items: MissionItem[] = (data.missions as Mission[]).map((m) => {
      const p = progressMap[m.id] ?? null;
      const progressPct = computeProgressPct(p, m);
      const progressLabel = computeProgressLabel(p, m);
      const { canClaim, isClaimed } = deriveFlags(p);
      return { mission: m, progress: p, progressPct, progressLabel, canClaim, isClaimed };
    });

    return items;
  }

  // Fallback: resposta inesperada
  throw new Error('Formato inesperado da resposta de /missions/my');
}

/**
 * Resgata a recompensa de uma missão concluída.
 * Backend: POST /missions/claim { missionId }
 */
export async function claimMission(missionId: string): Promise<ClaimMissionResponse> {
  try {
    const { data } = await api.post('/missions/claim', { missionId });
    // Normaliza resposta esperada do backend que montamos
    return {
      ok: true,
      missionId,
      rewardType: data.rewardType as RewardType,
      coupon: data.coupon ?? undefined,
      pointsGranted: data.pointsGranted ?? undefined,
      message: data.message ?? undefined,
    };
  } catch (err: any) {
    const reason =
      err?.response?.data?.message ||
      err?.message ||
      'Não foi possível resgatar a missão. Tente novamente.';
    return { ok: false, missionId, reason };
  }
}

/**
 * (Opcional, mas útil na UI) Lista cupons do usuário para a tela "Meus Cupons".
 * Backend: GET /coupons/my
 */
export async function getMyCoupons(): Promise<
  Array<{ id: string; code: string; description?: string; validUntil: string; value: number; valueType: string }>
> {
  const { data } = await api.get('/coupons/my');
  return data;
}
