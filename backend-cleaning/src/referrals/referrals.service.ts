// backend-cleaning/src/referrals/referrals.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { Referral, BookingStatus, LoyaltyTransactionType } from '@prisma/client';

// Fidelidade (pontos)
import { LoyaltyService } from '../loyalty/loyalty.service';

// Missões (para progresso e recompensas)
import { MissionsService } from '../missions/missions.service';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private prisma: PrismaService,
    private loyaltyService: LoyaltyService,
    private missionsService: MissionsService,
  ) {}

  /**
   * Cria o vínculo de indicação entre indicador e indicado.
   * ❗ Não dá recompensa principal aqui — o bônus “de verdade” acontece
   * quando o indicado conclui o 1º serviço (referral.converted).
   */
  async createReferral(dto: CreateReferralDto): Promise<Referral> {
    this.logger.log(
      `[ReferralsService] createReferral: Criando indicação. referredUser=${dto.referredUserId} referrerUser=${dto.referrerUserId}`,
    );

    if (dto.referredUserId === dto.referrerUserId) {
      throw new BadRequestException('Um usuário não pode indicar a si mesmo.');
    }

    const [referredUser, referrerUser] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.referredUserId } }),
      this.prisma.user.findUnique({ where: { id: dto.referrerUserId } }),
    ]);

    if (!referredUser) {
      throw new NotFoundException(
        `Usuário indicado com ID "${dto.referredUserId}" não encontrado.`,
      );
    }
    if (!referrerUser) {
      throw new NotFoundException(
        `Usuário indicador com ID "${dto.referrerUserId}" não encontrado.`,
      );
    }

    const existingReferral = await this.prisma.referral.findFirst({
      where: {
        referredUserId: dto.referredUserId,
        referrerUserId: dto.referrerUserId,
      },
    });
    if (existingReferral) {
      throw new ConflictException('Esta indicação já foi registrada.');
    }

    const referral = await this.prisma.referral.create({
      data: {
        referredUserId: dto.referredUserId,
        referrerUserId: dto.referrerUserId,
        referralCode: dto.referralCode,
      },
    });

    this.logger.log(
      `[ReferralsService] Indicação criada com sucesso: ${referral.id}`,
    );

    // (Opcional) Pequeno “agradecimento” imediato — se quiser manter, deixe baixo.
    // Caso não queira nenhum ponto aqui, remova este bloco.
    // await this.loyaltyService.addPoints({
    //   userId: dto.referrerUserId,
    //   points: 5,
    //   type: LoyaltyTransactionType.REFERRAL,
    //   referenceId: referral.id,
    // });

    return referral;
  }

  /**
   * Deve ser chamado quando um booking muda para COMPLETED.
   * Se for o PRIMEIRO booking COMPLETED do usuário indicado,
   * então convertemos a indicação:
   *  - Disparamos evento de missão: referral.converted (para o INDICADOR)
   *  - (Opcional) Concedemos pontos de fidelidade ao indicador
   */
  async handleBookingCompletedForReferral(
    referredUserId: string,
    bookingId: string,
  ): Promise<{ converted: boolean }> {
    this.logger.log(
      `[ReferralsService] handleBookingCompletedForReferral: user=${referredUserId} booking=${bookingId}`,
    );

    // Existe referral para esse usuário?
    const referral = await this.prisma.referral.findUnique({
      where: { referredUserId: referredUserId },
    });

    if (!referral) {
      this.logger.log(
        `[ReferralsService] Nenhuma indicação encontrada para referredUser=${referredUserId}. Nada a fazer.`,
      );
      return { converted: false };
    }

    // Encontrar o CLIENT (perfil) do indicado
    const client = await this.prisma.client.findUnique({
      where: { userId: referredUserId },
      select: { id: true },
    });

    if (!client) {
      this.logger.warn(
        `[ReferralsService] Usuário indicado não possui perfil de cliente. userId=${referredUserId}`,
      );
      return { converted: false };
    }

    // Contar bookings COMPLETED desse cliente
    const completedCount = await this.prisma.booking.count({
      where: { clientId: client.id, status: BookingStatus.COMPLETED },
    });

    this.logger.log(
      `[ReferralsService] completedCount para referredUser=${referredUserId} = ${completedCount}`,
    );

    // Só converte no PRIMEIRO COMPLETED
    if (completedCount !== 1) {
      return { converted: false };
    }

    // Disparar evento de missão para o INDICADOR
    await this.missionsService.trackEvent(referral.referrerUserId, 'referral.converted', {
      bookingId,
      referredUserId,
      referralId: referral.id,
    });

    // (Opcional) Conceder pontos ao indicador na conversão da indicação
    await this.loyaltyService.addPoints({
      userId: referral.referrerUserId,
      points: 100, // ex.: bônus de conversão
      type: LoyaltyTransactionType.REFERRAL,
      referenceId: bookingId,
    });

    this.logger.log(
      `[ReferralsService] Indicação convertida! referrer=${referral.referrerUserId} -> referred=${referredUserId}`,
    );

    return { converted: true };
  }

  async findReferralsByReferrer(
    referrerUserId: string,
  ): Promise<Referral[]> {
    this.logger.log(
      `[ReferralsService] findReferralsByReferrer: referrer=${referrerUserId}`,
    );
    return this.prisma.referral.findMany({
      where: { referrerUserId },
      include: {
        referredUser: { select: { email: true, id: true, fullName: true } },
      },
    });
  }

  async findOne(id: string): Promise<Referral | null> {
    this.logger.log(`[ReferralsService] findOne: id=${id}`);
    return this.prisma.referral.findUnique({
      where: { id },
      include: {
        referredUser: { select: { email: true, id: true, fullName: true } },
        referrerUser: { select: { email: true, id: true, fullName: true } },
      },
    });
  }
}
