// backend-cleaning/src/referrals/referrals.service.ts
import { Injectable, ConflictException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { Referral } from '@prisma/client'; // Importe o tipo Referral do Prisma

// Importar LoyaltyService e LoyaltyTransactionType
import { LoyaltyService } from '../loyalty/loyalty.service'; // <--- NOVA LINHA
import { LoyaltyTransactionType } from '@prisma/client'; // <--- NOVA LINHA: Assumindo que LoyaltyTransactionType está no seu schema.prisma

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private prisma: PrismaService,
    private loyaltyService: LoyaltyService, // <--- NOVA LINHA: Injetar LoyaltyService
  ) {}

  async createReferral(dto: CreateReferralDto): Promise<Referral> {
    this.logger.log(`[ReferralsService] createReferral: Tentando criar indicação para referredUser ${dto.referredUserId} por referrerUser ${dto.referrerUserId}.`);

    if (dto.referredUserId === dto.referrerUserId) {
      throw new BadRequestException('Um usuário não pode indicar a si mesmo.');
    }

    // Verificar se o referredUser e o referrerUser existem
    const [referredUser, referrerUser] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.referredUserId } }),
      this.prisma.user.findUnique({ where: { id: dto.referrerUserId } }),
    ]);

    if (!referredUser) {
      throw new NotFoundException(`Usuário indicado com ID "${dto.referredUserId}" não encontrado.`);
    }
    if (!referrerUser) {
      throw new NotFoundException(`Usuário indicador com ID "${dto.referrerUserId}" não encontrado.`);
    }

    // Verificar se a indicação já existe
    const existingReferral = await this.prisma.referral.findFirst({
      where: {
        referredUserId: dto.referredUserId,
        referrerUserId: dto.referrerUserId,
      },
    });

    if (existingReferral) {
      throw new ConflictException('Esta indicação já foi registrada.');
    }

    try {
      const referral = await this.prisma.referral.create({
        data: {
          referredUserId: dto.referredUserId,
          referrerUserId: dto.referrerUserId,
          referralCode: dto.referralCode,
        },
      });
      this.logger.log(`[ReferralsService] Indicação criada com sucesso: ${referral.id}`);

      // ADICIONAR PONTOS AO INDICADOR PELA INDICAÇÃO
      // NOTA: A lógica ideal para pontos de indicação é quando o amigo indicado CONCLUI seu PRIMEIRO SERVIÇO.
      // Este é um exemplo de adição no momento do registro da indicação, que pode ser ajustado.
      await this.loyaltyService.addPoints({
        userId: dto.referrerUserId,
        points: 50, // Exemplo: +50 pontos por indicar um amigo
        type: LoyaltyTransactionType.REFERRAL,
        referenceId: referral.id,
      });
      this.logger.log(`[ReferralsService] Usuário ${dto.referrerUserId} recebeu pontos por indicação.`);

      return referral;
    } catch (error) {
      this.logger.error(`[ReferralsService] Erro ao criar indicação: ${error.message}`);
      throw error;
    }
  }

  async findReferralsByReferrer(referrerUserId: string): Promise<Referral[]> {
    this.logger.log(`[ReferralsService] findReferralsByReferrer: Buscando indicações feitas por userId: ${referrerUserId}`);
    return this.prisma.referral.findMany({
      where: { referrerUserId },
      include: { referredUser: { select: { email: true, id: true } } }, // Inclui dados básicos do usuário indicado
    });
  }

  async findOne(id: string): Promise<Referral | null> {
    this.logger.log(`[ReferralsService] findOne: Buscando indicação por ID: ${id}`);
    return this.prisma.referral.findUnique({
      where: { id },
      include: {
        referredUser: { select: { email: true, id: true } },
        referrerUser: { select: { email: true, id: true } },
      },
    });
  }
}