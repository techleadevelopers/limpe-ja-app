// src/missions/missions.service.ts
import { Injectable, Logger, BadRequestException, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MissionStatus, RewardType, MissionKind, UserRole, MissionAudience } from '@prisma/client'; // Importar UserRole, MissionAudience
import { CouponsService } from '../coupons/coupons.service';
import { LoyaltyService } from '../loyalty/loyalty.service';

@Injectable()
export class MissionsService {
  private readonly logger = new Logger(MissionsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => CouponsService))
    private couponsService: CouponsService,
    @Inject(forwardRef(() => LoyaltyService))
    private loyaltyService: LoyaltyService,
  ) {}

  /**
   * Registra um evento de missão (ex.: booking.completed, review.created, referral.converted)
   * e recalcula o progresso do usuário para todas as missões ativas relacionadas ao evento.
   */
  async trackEvent(userId: string, name: string, meta?: any) {
    // Salva o evento
    await this.prisma.missionEvent.create({
      data: { userId, name, meta: meta ?? undefined },
    });

    // Recalcula progresso das missões que ouvem este evento
    // Agora busca missões para CLIENT ou PROVIDER
    const missions = await this.prisma.mission.findMany({
      where: {
        isActive: true,
        // audience: 'CLIENT', // Removido filtro fixo para CLIENT
        eventName: name,
        // TODO: Adicionar filtro por audience se o evento for específico (ex: booking.completed pode ser para CLIENT e PROVIDER)
        // Isso exigiria que o 'trackEvent' recebesse o role do usuário ou que o evento fosse mais granular.
        // Por enquanto, ele processará para todas as missões ativas com o eventName correspondente.
      },
    });

    for (const mission of missions) {
      // Garante progress row
      const progress = await this.prisma.missionProgress.upsert({
        where: { userId_missionId: { userId, missionId: mission.id } },
        update: {},
        create: { userId, missionId: mission.id },
      });

      // Recalcular currentValue conforme a missão
      let currentValue = progress.currentValue;

      if (mission.kind === MissionKind.COUNT_EVENT) {
        // Se tiver janela de tempo, reconta pelos eventos dentro do range
        if (mission.timeWindowDays && mission.timeWindowDays > 0) {
          const since = new Date(Date.now() - mission.timeWindowDays * 24 * 60 * 60 * 1000);
          const count = await this.prisma.missionEvent.count({
            where: { userId, name: mission.eventName, createdAt: { gte: since } },
          });
          currentValue = count;
        } else {
          currentValue = progress.currentValue + 1;
        }
      } else if (mission.kind === MissionKind.WITHIN_WINDOW) {
        // Interpretação simples: contar eventos no período e comparar com target
        const since = mission.timeWindowDays
          ? new Date(Date.now() - mission.timeWindowDays * 24 * 60 * 60 * 1000)
          : new Date(0);
        const count = await this.prisma.missionEvent.count({
          where: { userId, name: mission.eventName, createdAt: { gte: since } },
        });
        currentValue = count;
      } else if (mission.kind === MissionKind.STREAK_DAYS) {
        // (opcional) Implementação simplificada: contar dias únicos com evento
        const since = mission.timeWindowDays
          ? new Date(Date.now() - mission.timeWindowDays * 24 * 60 * 60 * 1000)
          : new Date(0);
        const events = await this.prisma.missionEvent.findMany({
          where: { userId, name: mission.eventName, createdAt: { gte: since } },
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
        });
        const uniqueDays = new Set(
          events.map(e => new Date(e.createdAt).toISOString().substring(0, 10)),
        );
        currentValue = uniqueDays.size;
      }

      const completed = currentValue >= mission.targetValue;

      await this.prisma.missionProgress.update({
        where: { userId_missionId: { userId, missionId: mission.id } },
        data: {
          currentValue,
          lastEventAt: new Date(),
          status: completed ? MissionStatus.COMPLETED : MissionStatus.ACTIVE,
          completedAt: completed ? new Date() : progress.completedAt,
        },
      });

      this.logger.log(
        `[trackEvent] user=${userId} mission=${mission.code} -> ${currentValue}/${mission.targetValue} ${completed ? '(COMPLETED)' : ''}`,
      );
    }
  }

  /** Lista missões ativas + progresso do usuário */
  async getMyMissions(userId: string, userRole: UserRole) { // Adicionado userRole
    const missions = await this.prisma.mission.findMany({
      where: {
        isActive: true,
        OR: [ // Filtra por audiência do usuário
          { audience: MissionAudience.GENERAL },
          { audience: userRole as unknown as MissionAudience }, // Cast para MissionAudience
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    const progresses = await this.prisma.missionProgress.findMany({
      where: { userId, missionId: { in: missions.map(m => m.id) } },
    });

    const progressByMission = new Map(progresses.map(p => [p.missionId, p]));

    return missions.map(m => {
      const p = progressByMission.get(m.id);
      const current = p?.currentValue ?? 0;
      const status = p?.status ?? MissionStatus.ACTIVE;
      const percent = Math.min(100, Math.round((current / m.targetValue) * 100));
      const canClaim = status === MissionStatus.COMPLETED;
      return {
        mission: m,
        progress: {
          currentValue: current,
          targetValue: m.targetValue,
          status,
          percent,
          completedAt: p?.completedAt ?? null,
          claimedAt: p?.claimedAt ?? null,
        },
        canClaim,
      };
    });
  }

  /**
   * Resgata recompensa de missão COMPLETED.
   * - COUPON: emite cupom individual para o usuário (val. padrão 30 dias)
   * - POINTS: credita pontos de fidelidade
   */
  async claimMission(userId: string, missionId: string) {
    const progress = await this.prisma.missionProgress.findUnique({
      where: { userId_missionId: { userId, missionId } },
      include: { mission: true },
    });

    if (!progress) throw new NotFoundException('Progresso da missão não encontrado.');
    if (progress.status !== MissionStatus.COMPLETED || progress.claimedAt) {
      throw new BadRequestException('Missão não está disponível para resgate.');
    }

    const mission = progress.mission;
    let reward: any = null;

    if (mission.rewardType === RewardType.COUPON) {
      // <<< FIX: passar um ÚNICO objeto para issueCouponFromMission >>>
      reward = await this.couponsService.issueCouponFromMission({
        userId,
        mission: {
          id: mission.id,
          code: mission.code,
          title: mission.title,
          rewardType: mission.rewardType,      // 'COUPON'
          rewardValue: mission.rewardValue,    // ex.: 20 (%)
          couponTemplateId: mission.couponTemplateId ?? null,
        },
        validityDays: 30, // opcional (default 30)
      });
    } else if (mission.rewardType === RewardType.POINTS) {
      await this.loyaltyService.addPoints({
        userId,
        points: mission.rewardValue,
        type: 'MISSION_COMPLETED',
        referenceId: mission.id,
      });
      reward = { type: 'POINTS', points: mission.rewardValue };
    }

    await this.prisma.missionProgress.update({
      where: { userId_missionId: { userId, missionId } },
      data: { status: MissionStatus.CLAIMED, claimedAt: new Date() },
    });

    return { mission, reward };
  }
}