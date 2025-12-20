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
import { Referral, LoyaltyTransactionType } from '@prisma/client';

// Fidelidade (pontos)
import { LoyaltyService } from '../loyalty/loyalty.service';

// Missões (para progresso e recompensas)
import { MissionsService } from '../missions/missions.service';

// Cupons (para recompensas de indicação)
import { CouponsService } from '../coupons/coupons.service';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  private formatError(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    try {
      return JSON.stringify(err);
    } catch {
      return 'Unknown error';
    }
  }

  constructor(
    private prisma: PrismaService,
    private loyaltyService: LoyaltyService,
    private missionsService: MissionsService,
    private couponsService: CouponsService, // INJETADO
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

    // --- NOVO: Lógica Antifraude Mínima ---
    // Esta é uma implementação básica. Em um cenário real, exigiria:
    // 1. Acesso a dados mais sensíveis (CPF, PIX, Telefone, Endereço) do User/Client/Provider.
    // 2. Acesso a dados da requisição (IP, User-Agent, Device Fingerprint).
    // 3. Um serviço de antifraude dedicado ou integração com um sistema externo.

    // Exemplo: Bloquear se o indicado já tem um CPF cadastrado (assumindo que o CPF está no User/Client)
    const referredClient = await this.prisma.client.findUnique({
      where: { userId: dto.referredUserId },
      select: { cpf: true },
    });
    const referrerClient = await this.prisma.client.findUnique({
      where: { userId: dto.referrerUserId },
      select: { cpf: true },
    });

    if (
      referredClient?.cpf &&
      referrerClient?.cpf &&
      referredClient.cpf === referrerClient.cpf
    ) {
      throw new BadRequestException(
        'Indicação inválida: Indicado e indicador possuem o mesmo CPF.',
      );
    }

    // Exemplo: Limite de convites válidos/mês por usuário (simples, apenas conta referrals existentes)
    const activeReferralsCount = await this.prisma.referral.count({
      where: {
        referrerUserId: dto.referrerUserId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Últimos 30 dias
        // status: 'PENDING' ou 'CONVERTED' - exigiria um campo de status na Referral
      },
    });
    if (activeReferralsCount >= 5) {
      // Limite de 5 convites válidos por mês
      throw new BadRequestException(
        'Você atingiu o limite de indicações válidas por mês.',
      );
    }

    // TODO: Adicionar checagens de IP/Device Fingerprint (requer passar essas informações do Controller)
    // const requestIp = req.ip; // Vindo do controller
    // const deviceFingerprint = req.headers['x-device-fingerprint']; // Vindo do controller
    // if (await this.antifraudService.isSuspiciousReferral(dto.referredUserId, dto.referrerUserId, requestIp, deviceFingerprint)) {
    //   throw new BadRequestException('Indicação suspeita detectada.');
    // }
    // --- Fim da Lógica Antifraude Mínima ---

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

    // --- NOVO: Recompensa para o Indicado (REFERRAL_REFERRED) ---
    try {
      await this.couponsService.issueReferralReferredCoupon(
        dto.referredUserId,
        referral.id,
      );
      this.logger.log(
        `[ReferralsService] Cupom REFERRAL_REFERRED emitido para o indicado ${dto.referredUserId}.`,
      );
      // Telemetria: referral_coupon_issued_referred
      this.logger.log(
        `[TELEMETRY] referral_coupon_issued_referred: { userId: ${dto.referredUserId}, referralId: ${referral.id} }`,
      );
    } catch (e) {
      this.logger.error(
        `[ReferralsService] Falha ao emitir cupom REFERRAL_REFERRED para ${dto.referredUserId}: ${this.formatError(e)}`,
      );
      // Não quebrar a criação da indicação se a emissão do cupom falhar
    }
    // --- Fim da Recompensa para o Indicado ---

    // Telemetria: referral_created
    this.logger.log(
      `[TELEMETRY] referral_created: { referralId: ${referral.id}, referredUserId: ${dto.referredUserId}, referrerUserId: ${dto.referrerUserId} }`,
    );

    return referral;
  }

  /**
   * Deve ser chamado quando um booking muda para COMPLETED.
   * Se for o PRIMEIRO booking COMPLETED do usuário indicado,
   * então convertemos a indicação:
   *  - Disparamos evento de missão: referral.converted (para o INDICADOR)
   *  - Concedemos pontos de fidelidade ou cupom ao indicador
   */
  async handleBookingCompletedForReferral(
    referredUserId: string,
    bookingId: string,
  ): Promise<{ converted: boolean }> {
    this.logger.log(
      `[ReferralsService] handleBookingCompletedForReferral: user=${referredUserId} booking=${bookingId}`,
    );

    // Telemetria: referral_conversion_attempt
    this.logger.log(
      `[TELEMETRY] referral_conversion_attempt: { referredUserId: ${referredUserId}, bookingId: ${bookingId} }`,
    );

    const referral = await this.prisma.referral.findUnique({
      where: { referredUserId: referredUserId },
    });

    // É importante verificar se há uma indicação *antes* de verificar o completedBookingsCount,
    // pois o referido pode completar um booking sem ter sido indicado.
    // A lógica de recompensa do referido pelo primeiro booking pode ser independente de indicação.
    // Vou manter a estrutura atual, mas adicionar a recompensa do referido aqui.

    const client = await this.prisma.client.findUnique({
      where: { userId: referredUserId },
      select: { id: true, completedBookingsCount: true }, // Incluir completedBookingsCount
    });

    if (!client) {
      this.logger.warn(
        `[ReferralsService] Usuário indicado não possui perfil de cliente. userId=${referredUserId}`,
      );
      return { converted: false }; // Ou { converted: false, message: 'Client profile not found' }
    }

    // Usar completedBookingsCount do Client para verificar se é o PRIMEIRO COMPLETED
    // O BookingsService já incrementa completedBookingsCount quando o booking é COMPLETED.
    // Então, se o count for 1, significa que este é o primeiro booking COMPLETED.
    if (client.completedBookingsCount !== 1) {
      this.logger.log(
        `[ReferralsService] completedBookingsCount para referredUser=${referredUserId} = ${client.completedBookingsCount}. Não é o primeiro booking COMPLETED. Não converter.`,
      );
      return { converted: false }; // Ou { converted: false, message: 'Not first completed booking' }
    }

    this.logger.log(
      `[ReferralsService] Indicação elegível para conversão! referredUser=${referredUserId} completedBookingsCount=${client.completedBookingsCount}`,
    );

    // --- NOVO: Recompensa para o Indicado (REFERRED_USER) por seu primeiro booking ---
    try {
      await this.loyaltyService.addPoints({
        userId: referredUserId,
        points: 10, // Pontos para o indicado pelo primeiro booking
        type: LoyaltyTransactionType.SERVICE_COMPLETED, // Ou um tipo mais específico como FIRST_BOOKING_COMPLETED se existir
        referenceId: bookingId,
      });
      this.logger.log(
        `[ReferralsService] Indicado ${referredUserId} recebeu 10 pontos pelo primeiro agendamento concluído.`,
      );
      // Telemetria: first_booking_points_earned_referred
      this.logger.log(
        `[TELEMETRY] first_booking_points_earned_referred: { userId: ${referredUserId}, bookingId: ${bookingId}, points: 10 }`,
      );
    } catch (e) {
      this.logger.error(
        `[ReferralsService] Falha ao adicionar pontos para o indicado ${referredUserId} no primeiro booking: ${this.formatError(e)}`,
      );
    }

    // Disparar evento de missão para o INDICADO (first_booking_completed)
    try {
      await this.missionsService.trackEvent(
        referredUserId,
        'first_booking_completed',
        {
          bookingId,
        },
      );
      this.logger.log(
        `[ReferralsService] Evento de missão 'first_booking_completed' disparado para o indicado ${referredUserId}.`,
      );
    } catch (e) {
      this.logger.error(
        `[ReferralsService] Falha ao trackear missão first_booking_completed para ${referredUserId}: ${this.formatError(e)}`,
      );
    }

    // Processar a indicação se ela existir
    if (referral) {
      // Disparar evento de missão para o INDICADOR
      try {
        await this.missionsService.trackEvent(
          referral.referrerUserId,
          'referral.converted',
          {
            bookingId,
            referredUserId,
            referralId: referral.id,
          },
        );
        this.logger.log(
          `[ReferralsService] Evento de missão 'referral.converted' disparado para o indicador ${referral.referrerUserId}.`,
        );
      } catch (e) {
        this.logger.error(
          `[ReferralsService] Falha ao trackear missão referral.converted para ${referral.referrerUserId}: ${this.formatError(e)}`,
        );
      }

      // --- NOVO: Recompensa para o Indicador (REFERRAL_REFERRER) ---
      // Opção A: +300 pontos
      // Opção B: cupom REFERRAL_REFERRER R$20 (expira em 14d)
      const rewardOption = 'POINTS'; // Pode ser configurável (ex: via DB ou feature flag)

      if (rewardOption === 'POINTS') {
        await this.loyaltyService.addPoints({
          userId: referral.referrerUserId,
          points: 300, // Definido como 300 pontos
          type: LoyaltyTransactionType.REFERRAL_CONVERSION, // Usar tipo mais específico
          referenceId: bookingId,
        });
        this.logger.log(
          `[ReferralsService] Indicação convertida! Indicador ${referral.referrerUserId} recebeu 300 pontos.`,
        );
        // Telemetria: referral_points_earned_referrer
        this.logger.log(
          `[TELEMETRY] referral_points_earned_referrer: { userId: ${referral.referrerUserId}, referralId: ${referral.id}, points: 300 }`,
        );
      } else if (rewardOption === 'COUPON') {
        try {
          await this.couponsService.issueReferralReferrerCoupon(
            referral.referrerUserId,
            referral.id,
          );
          this.logger.log(
            `[ReferralsService] Indicação convertida! Indicador ${referral.referrerUserId} recebeu cupom REFERRAL_REFERRER.`,
          );
          // Telemetria: referral_coupon_issued_referrer
          this.logger.log(
            `[TELEMETRY] referral_coupon_issued_referrer: { userId: ${referral.referrerUserId}, referralId: ${referral.id} }`,
          );
        } catch (e) {
          this.logger.error(
            `[ReferralsService] Falha ao emitir cupom REFERRAL_REFERRER para ${referral.referrerUserId}: ${this.formatError(e)}`,
          );
        }
      }
      // --- Fim da Recompensa para o Indicador ---

      this.logger.log(
        `[ReferralsService] Indicação convertida! referrer=${referral.referrerUserId} -> referred=${referredUserId}`,
      );
      // Telemetria: referral_converted
      this.logger.log(
        `[TELEMETRY] referral_converted: { referralId: ${referral.id}, referredUserId: ${referredUserId}, referrerUserId: ${referral.referrerUserId} }`,
      );
    } else {
      this.logger.log(
        `[ReferralsService] Nenhuma indicação encontrada para referredUser=${referredUserId}. Apenas pontos de primeiro booking concedidos.`,
      );
    }

    return { converted: true };
  }

  /**
   * Gera um código de indicação único para um usuário.
   * Pode ser um endpoint GET /referrals/me/code
   */
  async generateReferralCode(userId: string): Promise<string> {
    // Em um sistema real, você pode querer armazenar o código de indicação gerado
    // para que o usuário possa vê-lo e compartilhá-lo.
    // Por simplicidade, vamos gerar um UUID curto.
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID "${userId}" não encontrado.`);
    }

    // Gerar um código único. Pode ser baseado no ID do usuário ou um hash.
    // Para este exemplo, um UUID curto.
    const shortUuid = Math.random().toString(36).substring(2, 10).toUpperCase();
    const referralCode = `LIMPEJA-${shortUuid}`;

    // Opcional: Persistir este código no modelo Referral ou em um novo modelo UserReferralCode
    // await this.prisma.user.update({
    //   where: { id: userId },
    //   data: { referralCode: referralCode } // Assumindo um campo referralCode no User
    // });

    this.logger.log(
      `[ReferralsService] Código de indicação gerado para ${userId}: ${referralCode}`,
    );
    return referralCode;
  }

  async findReferralsByReferrer(referrerUserId: string): Promise<Referral[]> {
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
