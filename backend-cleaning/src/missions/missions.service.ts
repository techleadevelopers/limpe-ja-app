// src/missions/missions.service.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MissionStatus,
  RewardType,
  MissionKind,
  UserRole,
  MissionAudience,
  LoyaltyTransactionType,
  Prisma,
} from '@prisma/client';
import { CouponsService } from '../coupons/coupons.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
// <<-- CORREÇÃO: Importar MissionWithProgressView do progress.service.ts
import {
  MissionsProgressService,
  MissionWithProgressView,
} from './progress.service';
import { MissionViewDto } from './dto/mission-view.dto';

// <<-- CORREÇÃO: REMOVER esta definição. Ela não é mais necessária aqui
// type MissionProgressWithMission = Prisma.MissionProgressGetPayload<{
//   include: {
//     mission: true;
//   };
// }>;

@Injectable()
export class MissionsService {
  private readonly logger = new Logger(MissionsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => CouponsService))
    private couponsService: CouponsService,
    @Inject(forwardRef(() => LoyaltyService))
    private loyaltyService: LoyaltyService,
    private missionsProgressService: MissionsProgressService,
  ) {}

  /**
   * Registra um evento de missão (ex.: booking.completed, review.created, referral.converted)
   * e recalcula o progresso do usuário para todas as missões ativas relacionadas ao evento.
   * DELEGA PARA MissionsProgressService.
   */
  async trackEvent(userId: string, name: string, meta?: any) {
    this.logger.log(
      `[MissionsService] trackEvent: userId=${userId}, event=${name}`,
    );
    const result = await this.missionsProgressService.trackEvent(
      userId,
      name,
      meta,
    );

    this.logger.log(
      `[TELEMETRY] mission_event_tracked: { userId: ${userId}, eventName: ${name}, meta: ${JSON.stringify(meta)} }`,
    );

    result.updated.forEach((update) => {
      this.logger.log(
        `[trackEvent] user=${userId} missionId=${update.missionId} -> ${update.currentValue}/${update.targetValue} ${update.status === MissionStatus.COMPLETED ? '(COMPLETED)' : ''}`,
      );
      this.logger.log(
        `[TELEMETRY] mission_progress_updated: { userId: ${userId}, missionId: ${update.missionId}, status: ${update.status}, percent: ${update.percent} }`,
      );

      if (update.status === MissionStatus.COMPLETED) {
        this.logger.log(
          `[MissionsService] Missão ${update.missionId} COMPLETED para userId ${userId}. Notificar para resgate.`,
        );
      }
    });
  }

  /** Lista missões ativas + progresso do usuário */
  async getMyMissions(userId: string, userRole: UserRole): Promise<MissionViewDto[]> {
    // <<-- CORREÇÃO: Mudar o tipo esperado para MissionWithProgressView[]
    const missionsWithProgress: MissionWithProgressView[] =
      await this.missionsProgressService.getUserMissionsWithProgress(userId);

    // Filtrar por audience (se MissionsProgressService não o fizer)
    return missionsWithProgress
      .filter((mp) => {
        // Agora, mp.mission é corretamente tipado como Mission, que inclui 'audience'
        const missionAudience = mp.mission.audience;
        return (
          missionAudience === MissionAudience.GENERAL ||
          missionAudience === userRole
        );
      })
      .map((mp) => new MissionViewDto(mp));
  }

  /**
   * Resgata recompensa de missão COMPLETED.
   * - COUPON: emite cupom individual para o usuário (val. padrão 30 dias)
   * - POINTS: credita pontos de fidelidade
   * - Outros tipos (ex: destaque para provedor)
   */
  async claimMission(userId: string, missionId: string) {
    const progress = await this.prisma.missionProgress.findUnique({
      where: { userId_missionId: { userId, missionId } },
      include: { mission: true },
    });

    if (!progress)
      throw new NotFoundException('Progresso da missão não encontrado.');
    if (progress.status !== MissionStatus.COMPLETED || progress.claimedAt) {
      throw new BadRequestException('Missão não está disponível para resgate.');
    }

    const mission = progress.mission; // Este 'mission' é do tipo Prisma.MissionGetPayload
    let reward: any = null;

    this.logger.log(
      `[TELEMETRY] mission_claim_attempt: { userId: ${userId}, missionId: ${missionId}, rewardType: ${mission.rewardType} }`,
    );

    if (mission.rewardType === RewardType.COUPON) {
      reward = await this.couponsService.issueCouponFromMission({
        userId,
        mission: {
          id: mission.id,
          code: mission.code,
          title: mission.title,
          rewardType: mission.rewardType as 'COUPON' | 'POINTS', // Cast necessário se RewardType do Prisma for 'string' e não o enum
          rewardValue: mission.rewardValue,
          couponTemplateId: mission.couponTemplateId ?? null, // Usa ?? null para lidar com String? do Prisma
        },
        validityDays: 30,
      });
    } else if (mission.rewardType === RewardType.POINTS) {
      await this.loyaltyService.addPoints({
        userId,
        points: mission.rewardValue,
        type: LoyaltyTransactionType.MISSION_COMPLETED,
        referenceId: mission.id,
      });
      reward = { type: 'POINTS', points: mission.rewardValue };
    } else {
      this.logger.warn(
        `[MissionsService] Tipo de recompensa ${mission.rewardType} não suportado para resgate.`,
      );
      throw new BadRequestException(
        'Tipo de recompensa não suportado para resgate.',
      );
    }

    await this.prisma.missionProgress.update({
      where: { userId_missionId: { userId, missionId } },
      data: { status: MissionStatus.CLAIMED, claimedAt: new Date() },
    });

    this.logger.log(
      `[MissionsService] Missão ${mission.code} resgatada por ${userId}. Recompensa: ${mission.rewardType}.`,
    );
    this.logger.log(
      `[TELEMETRY] mission_claimed: { userId: ${userId}, missionId: ${mission.id}, rewardType: ${mission.rewardType}, rewardValue: ${mission.rewardValue} }`,
    );

    return { mission, reward };
  }
}
