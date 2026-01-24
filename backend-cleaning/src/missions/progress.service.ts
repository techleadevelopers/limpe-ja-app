// src/missions/progress.service.ts
import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  MissionKind,
  MissionStatus,
  MissionAudience,
  RewardType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface TrackEventResult {
  eventId: string;
  updated: Array<{
    missionId: string;
    status: MissionStatus;
    currentValue: number;
    targetValue: number;
    canClaim: boolean;
    percent: number; // 0..100
    completedAt?: Date | null;
  }>;
}

// ATUALIZADO: MissionWithProgressView para alinhar com o schema.prisma (timeWindowDays e couponTemplateId são opcionais/null)
export interface MissionWithProgressView {
  mission: {
    id: string;
    code: string;
    title: string;
    description: string;
    audience: MissionAudience;
    kind: MissionKind;
    eventName: string;
    targetValue: number;
    timeWindowDays?: number | null; // <<-- DEVE SER OPCIONAL/NULLABLE, conforme o schema.prisma
    rewardType: RewardType;
    rewardValue: number;
    couponTemplateId?: string | null; // <<-- DEVE SER OPCIONAL/NULLABLE, conforme o schema.prisma
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  progress: {
    id: string;
    status: MissionStatus;
    currentValue: number;
    completedAt?: Date | null;
    claimedAt?: Date | null;
    lastEventAt?: Date | null;
  } | null;
  percent: number; // 0..100
  canClaim: boolean; // COMPLETED && !CLAIMED
}

@Injectable()
export class MissionsProgressService {
  private readonly logger = new Logger(MissionsProgressService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =========================
  // Public API
  // =========================

  /**
   * Registra um evento (ex.: booking.completed) e propaga progresso para todas
   * as missões ativas que observam esse evento para esse usuário.
   */
  async trackEvent(
    userId: string,
    eventName: string,
    meta?: Prisma.InputJsonValue,
    occurredAt: Date = new Date(),
  ): Promise<TrackEventResult> {
    // 1) Loga o evento
    const event = await this.prisma.missionEvent.create({
      data: { userId, name: eventName, meta, createdAt: occurredAt },
    });

    // 2) Descobre missões afetadas
    const missions = await this.prisma.mission.findMany({
      where: { isActive: true, eventName },
    });

    const resultUpdates: TrackEventResult['updated'] = [];

    // 3) Para cada missão, aplica a lógica de progresso
    for (const mission of missions) {
      const progress = await this.getOrCreateProgress(userId, mission.id);
      const updated = await this.applyEventToMission(
        userId,
        mission.id,
        occurredAt,
      );

      if (updated) {
        const percent = this.calcPercent(
          updated.currentValue,
          mission.targetValue,
        );
        resultUpdates.push({
          missionId: mission.id,
          status: updated.status,
          currentValue: updated.currentValue,
          targetValue: mission.targetValue,
          canClaim: updated.status === MissionStatus.COMPLETED,
          percent,
          completedAt: updated.completedAt ?? null,
        });
      }
    }

    return { eventId: event.id, updated: resultUpdates };
  }

  /**
   * Lista todas as missões ativas + progresso do usuário.
   * (útil para GET /missions/my)
   */
  async getUserMissionsWithProgress(
    userId: string,
  ): Promise<MissionWithProgressView[]> {
    const [missions, progresses] = await Promise.all([
      this.prisma.mission.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.missionProgress.findMany({ where: { userId } }),
    ]);

    return missions.map((m) => {
      const pr = progresses.find((p) => p.missionId === m.id) || null;
      const percent = this.calcPercent(pr?.currentValue ?? 0, m.targetValue);
      const canClaim = pr?.status === MissionStatus.COMPLETED;
      return {
        mission: {
          id: m.id,
          code: m.code,
          title: m.title,
          description: m.description,
          audience: m.audience,
          kind: m.kind,
          eventName: m.eventName,
          targetValue: m.targetValue,
          timeWindowDays: m.timeWindowDays, // Não usar '!' aqui, pois o tipo é 'number | null'
          rewardType: m.rewardType,
          rewardValue: m.rewardValue,
          couponTemplateId: m.couponTemplateId, // Não usar '!' aqui, pois o tipo é 'string | null'
          isActive: m.isActive,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        },
        progress: pr
          ? {
              id: pr.id,
              status: pr.status,
              currentValue: pr.currentValue,
              completedAt: pr.completedAt ?? null,
              claimedAt: pr.claimedAt ?? null,
              lastEventAt: pr.lastEventAt ?? null,
            }
          : null,
        percent,
        canClaim,
      };
    });
  }

  /**
   * Recalcula o progresso de uma missão específica a partir do histórico de eventos.
   * Útil para correções/higienizações.
   */
  async recomputeMissionForUser(
    userId: string,
    missionId: string,
  ): Promise<MissionWithProgressView> {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
    });
    if (!mission) throw new Error('Mission not found');

    // Estratégia: zera currentValue e reconta a partir dos eventos
    await this.prisma.missionProgress.deleteMany({
      where: { userId, missionId },
    });
    const progress = await this.getOrCreateProgress(userId, missionId);

    // Pega todos eventos do tipo observado pela missão
    const events = await this.prisma.missionEvent.findMany({
      where: { userId, name: mission.eventName },
      orderBy: { createdAt: 'asc' },
    });

    for (const ev of events) {
      await this.applyEventToMission(userId, missionId, ev.createdAt);
    }

    const finalProgress = await this.prisma.missionProgress.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });

    return {
      mission: {
        id: mission.id,
        code: mission.code,
        title: mission.title,
        description: mission.description,
        audience: mission.audience,
        kind: mission.kind,
        eventName: mission.eventName,
        targetValue: mission.targetValue,
        timeWindowDays: mission.timeWindowDays, // Não usar '!' aqui
        rewardType: mission.rewardType,
        rewardValue: mission.rewardValue,
        couponTemplateId: mission.couponTemplateId, // Não usar '!' aqui
        isActive: mission.isActive,
        createdAt: mission.createdAt,
        updatedAt: mission.updatedAt,
      },
      progress: finalProgress
        ? {
            id: finalProgress.id,
            status: finalProgress.status,
            currentValue: finalProgress.currentValue,
            completedAt: finalProgress.completedAt ?? null,
            claimedAt: finalProgress.claimedAt ?? null,
            lastEventAt: finalProgress.lastEventAt ?? null,
          }
        : null,
      percent: this.calcPercent(
        finalProgress?.currentValue ?? 0,
        mission.targetValue,
      ),
      canClaim: finalProgress?.status === MissionStatus.COMPLETED,
    };
  }

  // =========================
  // Core: applyEventToMission
  // =========================

  private async applyEventToMission(
    userId: string,
    missionId: string,
    occurredAt: Date,
  ) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
    });
    if (!mission || !mission.isActive) return null;

    let progress = await this.getOrCreateProgress(userId, missionId);

    // Se já foi CLAIMED, não atualiza mais
    if (progress.status === MissionStatus.CLAIMED) return progress;

    switch (mission.kind) {
      case MissionKind.COUNT_EVENT:
        progress = await this.applyCountEvent(
          missionId,
          userId,
          progress,
          occurredAt,
        );
        break;

      case MissionKind.WITHIN_WINDOW:
        // Se timeWindowDays é opcional, precisamos garantir que ele não é null/undefined aqui
        if (
          mission.timeWindowDays === null ||
          mission.timeWindowDays === undefined
        ) {
          this.logger.error(
            `Mission ${missionId} (kind: WITHIN_WINDOW) has null/undefined timeWindowDays. This might be an error in mission setup.`,
          );
          // Decida como lidar com isso: lançar um erro, usar um valor padrão, ou pular.
          // Por simplicidade, vou usar um valor padrão de 0, mas o ideal é validar a configuração da missão.
          // Ou, se a lógica de WITHIN_WINDOW sempre requer um valor, o campo no DB não deveria ser opcional para este tipo de missão.
          mission.timeWindowDays = 0; // Fallback para evitar erro de tipo
        }
        progress = await this.applyWithinWindow(
          missionId,
          userId,
          progress,
          occurredAt,
          mission.timeWindowDays,
        );
        break;

      case MissionKind.STREAK_DAYS:
        progress = await this.applyStreakDays(
          missionId,
          userId,
          progress,
          occurredAt,
        );
        break;

      default:
        return progress;
    }

    // Checagem de conclusão
    if (
      progress.currentValue >= mission.targetValue &&
      progress.status !== MissionStatus.CLAIMED
    ) {
      progress = await this.prisma.missionProgress.update({
        where: { userId_missionId: { userId, missionId } },
        data: {
          status: MissionStatus.COMPLETED,
          completedAt: progress.completedAt ?? occurredAt,
          lastEventAt: occurredAt,
        },
      });
      try {
        await this.pruneMissionEvents(userId, mission.eventName, occurredAt);
      } catch (error) {
        this.logger.warn(
          `[MissionsProgressService] Falha ao limpar MissionEvent após missão ${missionId} COMPLETED: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
      }
    }

    return progress;
  }

  async pruneMissionEvents(
    userId: string,
    eventName: string,
    before?: Date,
    options?: { prisma?: Prisma.TransactionClient },
  ): Promise<Prisma.BatchPayload> {
    const prisma = options?.prisma ?? this.prisma;
    return prisma.missionEvent.deleteMany({
      where: {
        userId,
        name: eventName,
        createdAt: { lte: before ?? new Date() },
      },
    });
  }

  async cleanupStaleMissionEvents({
    olderThanHours = 24,
    limit = 200,
  }: { olderThanHours?: number; limit?: number } = {}): Promise<number> {
    const cutoff = new Date(
      Date.now() - (olderThanHours ?? 24) * 60 * 60 * 1000,
    );
    const progresses = await this.prisma.missionProgress.findMany({
      where: {
        status: { in: [MissionStatus.COMPLETED, MissionStatus.CLAIMED] },
        lastEventAt: { lt: cutoff },
      },
      take: limit,
      orderBy: { lastEventAt: 'asc' },
      select: { userId: true, missionId: true, lastEventAt: true },
    });
    if (!progresses.length) return 0;
    const missionIds = Array.from(
      new Set(progresses.map((progress) => progress.missionId)),
    );
    const missions = await this.prisma.mission.findMany({
      where: { id: { in: missionIds } },
      select: { id: true, eventName: true },
    });
    const eventNameByMission = new Map(
      missions.map((mission) => [mission.id, mission.eventName]),
    );
    let deleted = 0;
    for (const progress of progresses) {
      const eventName = eventNameByMission.get(progress.missionId);
      if (!eventName) continue;
      const cutoffForProgress = progress.lastEventAt ?? cutoff;
      const result = await this.pruneMissionEvents(
        progress.userId,
        eventName,
        cutoffForProgress,
      );
      deleted += result.count;
    }
    return deleted;
  }

  // =========================
  // Kind implementations
  // =========================

  /**
   * COUNT_EVENT: soma 1 a cada evento.
   */
  private async applyCountEvent(
    missionId: string,
    userId: string,
    progress: { id: string; currentValue: number },
    occurredAt: Date,
  ) {
    return this.prisma.missionProgress.update({
      where: { userId_missionId: { userId, missionId } },
      data: {
        currentValue: { increment: 1 },
        lastEventAt: occurredAt,
      },
    });
  }

  /**
   * WITHIN_WINDOW: conta eventos dentro de uma janela (ex.: 3 no mês).
   * Estratégia: reconta do zero apenas os eventos dentro da janela e atualiza o currentValue.
   */
  private async applyWithinWindow(
    missionId: string,
    userId: string,
    progress: { id: string },
    occurredAt: Date,
    windowDays: number,
  ) {
    const from = new Date(occurredAt);
    from.setDate(from.getDate() - windowDays + 1); // janela inclusiva

    // Busca missão (para recuperar eventName)
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
    });
    if (!mission) return progress as any;

    const countInWindow = await this.prisma.missionEvent.count({
      where: {
        userId,
        name: mission.eventName,
        createdAt: { gte: from, lte: occurredAt },
      },
    });

    return this.prisma.missionProgress.update({
      where: { userId_missionId: { userId, missionId } },
      data: {
        currentValue: countInWindow,
        lastEventAt: occurredAt,
      },
    });
  }

  /**
   * STREAK_DAYS: incrementa se o evento ocorrer em dias consecutivos.
   * Se “quebrar” a sequência, reseta para 1 (dia atual).
   */
  private async applyStreakDays(
    missionId: string,
    userId: string,
    progress: { id: string; currentValue: number; lastEventAt: Date | null },
    occurredAt: Date,
  ) {
    const last = progress.lastEventAt ? new Date(progress.lastEventAt) : null;

    let nextValue = 1;
    if (last) {
      const isConsecutive = this.isYesterday(last, occurredAt);
      nextValue = isConsecutive ? (progress.currentValue || 0) + 1 : 1;
    }

    return this.prisma.missionProgress.update({
      where: { userId_missionId: { userId, missionId } },
      data: {
        currentValue: nextValue,
        lastEventAt: occurredAt,
      },
    });
  }

  // =========================
  // Helpers
  // =========================

  private async getOrCreateProgress(userId: string, missionId: string) {
    const existing = await this.prisma.missionProgress.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });
    if (existing) return existing;

    return this.prisma.missionProgress.create({
      data: {
        userId,
        missionId,
        currentValue: 0,
        status: MissionStatus.ACTIVE,
      },
    });
  }

  private calcPercent(value: number, target: number) {
    if (!target || target <= 0) return 0;
    const pct = Math.floor((value / target) * 100);
    return Math.max(0, Math.min(100, pct));
  }

  private isSameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private isYesterday(prev: Date, now: Date) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return this.isSameDay(prev, yesterday);
  }
}
