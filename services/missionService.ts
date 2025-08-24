// services/missionService.ts
import api from './api'; // Assumindo que 'api' é sua instância do Axios configurada

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

export type ClaimMissionResponse =
  | {
      ok: true;
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
 * Backend esperado: GET /missions -> MissionProgress[] (com mission incluída) ou {missions:[], progress:[]}.
 */
export async function getMyMissions(audience: MissionAudience = MissionAudience.CLIENT): Promise<MissionItem[]> {
  const { data } = await api.get('/missions', { params: { audience } });

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
 */
export async function claimMission(missionId: string): Promise<ClaimMissionResponse> {
  try {
    const { data } = await api.post(`/missions/${missionId}/claim`);
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
 * (Placeholder) Envia um evento de rastreamento para o backend.
 * Backend: POST /missions/track
 */
export async function trackMissionEvent(event: string, payload: any) {
  try {
    await api.post('/missions/track', { event, payload });
    return { ok: true };
  } catch (err: any) {
    console.error('Erro ao rastrear evento de missão:', err);
    return { ok: false, reason: err?.response?.data?.message || err?.message || 'Erro ao rastrear evento.' };
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