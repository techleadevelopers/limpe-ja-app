// services/missionService.ts
import { api } from './api';

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

// NOTE: A tipagem Mission aqui reflete a estrutura da missão em si, sem o progresso do usuário
export type Mission = {
  id: string;
  code: string;
  title: string; // Usado como 'name' em alguns componentes antigos
  description: string;
  audience: MissionAudience;
  kind: MissionKind;
  eventName: string;
  targetValue: number;
  timeWindowDays?: number | null;
  rewardType: RewardType;
  rewardValue: number;
  couponTemplateId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// NOTE: MissionProgress é o progresso de um usuário em uma missão específica
export type MissionProgress = {
  id: string; // ID do registro de progresso
  userId: string;
  missionId: string;
  currentValue: number; // Progresso atual (e.g., 2 de 3 limpezas)
  status: MissionStatus; // Status do progresso (ACTIVE, COMPLETED, CLAIMED)
  lastEventAt?: string | null;
  completedAt?: string | null;
  claimedAt?: string | null;
  mission: Mission; // A missão associada, incluída no progresso
};

// NOTE: MissionItem é o tipo que o frontend deve consumir, combinando Mission e MissionProgress
export type MissionItem = {
  mission: Mission; // Detalhes da missão
  progress: MissionProgress | null; // Progresso do usuário nesta missão (pode ser null se não houver progresso)
  progressPct: number; // Percentual de progresso (0-100)
  progressLabel: string; // Texto de progresso (e.g., "2/3" ou "5 dias")
  canClaim: boolean; // Se a recompensa pode ser resgatada
  isClaimed: boolean; // Se a recompensa já foi resgatada
};

export interface ClaimMissionResponse {
  missionId: string;
  rewardType: RewardType;
  coupon?: {
    id: string;
    code: string;
    valueType: 'PERCENT' | 'FIXED' | string;
    value: number;
    validUntil: string;
  };
  pointsGranted?: number;
  message?: string;
  /** Compatibilidade com telas antigas: indica sucesso explícito */
  ok?: boolean;
  /** Compatibilidade com telas antigas: motivo de falha (quando ok=false) */
  reason?: string;
}

/** ==== Helpers internos ==== */
const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

// Coerce possibly undefined/invalid numbers to safe finite values
function toSafeNumber(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function computeProgressPct(progress: MissionProgress | null, mission: Mission): number {
  if (!progress) return 0;
  if (progress.status === MissionStatus.CLAIMED) return 100;
  const current = toSafeNumber(progress.currentValue, 0);
  const targetRaw = toSafeNumber((mission as any)?.targetValue, 1);
  const target = targetRaw > 0 ? targetRaw : 1;
  const pct = (current / target) * 100;
  const rounded = Number.isFinite(pct) ? Math.round(pct) : 0;
  return clamp(rounded);
}

function computeProgressLabel(progress: MissionProgress | null, mission: Mission): string {
  const targetRaw = toSafeNumber((mission as any)?.targetValue, 1);
  const target = targetRaw > 0 ? targetRaw : 1;
  const currentRaw = progress ? toSafeNumber(progress.currentValue, 0) : 0;
  const current = Math.max(0, Math.min(currentRaw, target));

  if (mission.kind === MissionKind.STREAK_DAYS) {
    return `${current} dia${current === 1 ? '' : 's'}`;
  }
  return `${current}/${target}`;
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
 * Backend esperado: GET /missions -> MissionProgress[] (com mission incluída) ou {missions:[], progress:[]}.
 */
export async function getMyMissions(audience: MissionAudience = MissionAudience.CLIENT): Promise<MissionItem[]> {
  // Backend consolidado expõe GET /missions/my para usuário autenticado
  // 'audience' é determinado no backend via role; manter param local é inócuo
  const { data } = await api.get('/missions/my');

  // O backend pode retornar um array de MissionProgress ou um objeto com 'missions' e 'progress'
  if (Array.isArray(data)) {
    const items: MissionItem[] = data.map((p: MissionProgress) => {
      const mission = p.mission;
      const progressPct = computeProgressPct(p, mission);
      const progressLabel = computeProgressLabel(p, mission);
      const { canClaim, isClaimed } = deriveFlags(p);
      return { mission, progress: p, progressPct, progressLabel, canClaim, isClaimed };
    });
    return items;
  }

  // Caso o backend retorne { missions: [], progress: [] }
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

  throw new Error('Formato inesperado da resposta de /missions');
}

/**
 * Resgata a recompensa de uma missão concluída.
 * Backend: POST /missions/:id/claim
 * Em caso de erro, lança para a UI tratar via i18n/messageKey.
 */
export async function claimMission(missionId: string): Promise<ClaimMissionResponse> {
  try {
    // Backend consolidado: POST /missions/claim com body { missionId }
    const { data } = await api.post(`/missions/claim`, { missionId });

    // Shape esperado do backend: { mission, reward }
    // reward: { type: 'COUPON', ...couponFields } | { type: 'POINTS', points: number }
    const mission = data?.mission ?? {};
    const reward = data?.reward ?? {};
    const rewardType = (reward?.type ?? mission?.rewardType) as RewardType;

    return {
      ok: true,
      missionId: mission?.id ?? missionId,
      rewardType,
      coupon: rewardType === RewardType.COUPON ? reward : undefined,
      pointsGranted: rewardType === RewardType.POINTS ? reward?.points : undefined,
      message: data?.message ?? undefined,
    };
  } catch (err: any) {
    throw (err?.response?.data ?? err);
  }
}

/**
 * Envia um evento de rastreamento para o backend.
 * Backend: POST /missions/track
 * Em caso de erro, lança para a UI tratar.
 */
export async function trackMissionEvent(event: string, payload: unknown): Promise<void> {
  try {
    await api.post('/missions/track', { event, payload });
  } catch (err: any) {
    throw (err?.response?.data ?? err);
  }
}

/**
 * Lista cupons do usuário para a tela "Meus Cupons".
 * Backend: GET /coupons/my
 */
export async function getMyCoupons(): Promise<
  Array<{ id: string; code: string; description?: string; validUntil: string; value: number; valueType: string }>
> {
  const { data } = await api.get('/coupons/my');
  return data;
}
