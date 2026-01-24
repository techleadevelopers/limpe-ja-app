import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClaimStatus, InsuranceClaim, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentClaimDto } from './dto/create-incident.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { PayoutsService } from '../payouts/payouts.service';

const CLAIM_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payoutsService: PayoutsService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  async createClaim(userId: string, dto: CreateIncidentClaimDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        client: { select: { userId: true } },
        provider: { select: { userId: true } },
        bookingInsurance: true,
        bookingProofs: { select: { type: true, videoUrl: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    const isParticipant =
      booking.client?.userId === userId || booking.provider?.userId === userId;

    if (!isParticipant) {
      throw new ForbiddenException(
        'Você não pode abrir sinistro para este agendamento.',
      );
    }

    if (!booking.completedAt) {
      throw new BadRequestException('Agendamento ainda não foi concluído.');
    }

    const elapsed = Date.now() - booking.completedAt.getTime();
    if (elapsed > CLAIM_WINDOW_MS) {
      throw new BadRequestException(
        'Janela de 24h para abrir sinistro expirou.',
      );
    }

    const insurance = booking.bookingInsurance;
    if (!insurance) {
      throw new BadRequestException('Agendamento não possui seguro ativo.');
    }

    if (insurance.proofRequired) {
      const checkoutProof = booking.bookingProofs?.find(
        (proof) => proof.type === 'CHECKOUT',
      );

      if (!checkoutProof) {
        throw new BadRequestException('Checkout ainda não foi comprovado.');
      }

      const requiresVideo =
        insurance.planId === 'PREMIUM' || insurance.planId === 'TOTAL';
      if (requiresVideo && !checkoutProof.videoUrl) {
        throw new BadRequestException(
          'Vídeo é obrigatório para o checkout deste plano.',
        );
      }
    }

    const deductible = insurance.deductibleCents;
    let status: ClaimStatus = ClaimStatus.PENDING;
    let rejectionReason: string | null = null;

    if (dto.amountCents < deductible) {
      status = ClaimStatus.REJECTED;
      rejectionReason = 'Valor abaixo da franquia contratada.';
    }

    const attachments = this.sanitizeAttachments(dto.attachments);

    const claim = await this.prisma.insuranceClaim.create({
      data: {
        bookingId: dto.bookingId,
        reporterId: userId,
        description: dto.description,
        amountCents: dto.amountCents,
        attachments: attachments ?? [],
        deductibleCents: deductible,
        coverageCents: insurance.coverageCents,
        planId: insurance.planId,
        status,
        rejectionReason,
      },
    });

    await this.payoutsService.holdBookingForClaim(dto.bookingId, claim.id);

    try {
      await this.notifySupportSla(claim);
    } catch (error) {
      this.logger.warn(
        `[IncidentsService] failed to alert support for claim ${claim.id}: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
      );
    }

    return claim;
  }

  async getClaim(id: string, requesterId: string, requesterRole: UserRole) {
    const claim = await this.prisma.insuranceClaim.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            client: { select: { userId: true } },
            provider: { select: { userId: true } },
          },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException('Sinistro não encontrado.');
    }

    const isParticipant =
      claim.reporterId === requesterId ||
      claim.booking?.client?.userId === requesterId ||
      claim.booking?.provider?.userId === requesterId;

    if (!isParticipant && requesterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Você não tem acesso a este sinistro.');
    }

    return claim;
  }

  private sanitizeAttachments(attachments?: string[]): string[] | undefined {
    if (!attachments || attachments.length === 0) {
      return undefined;
    }
    const bucketName = this.configService
      .get<string>('GCS_BUCKET_NAME')
      ?.trim();
    if (!bucketName) {
      throw new BadRequestException(
        'Bucket GCS não configurado. Anexos não são permitidos.',
      );
    }
    const normalizedBucket = bucketName.toLowerCase();
    const cleaned: string[] = [];
    for (const attachment of attachments) {
      if (!attachment) {
        continue;
      }
      const trimmed = attachment.trim();
      if (!trimmed) {
        continue;
      }
      if (!this.isAttachmentFromGcs(trimmed, normalizedBucket)) {
        throw new BadRequestException(
          'Anexos devem apontar exclusivamente para o bucket GCS autorizado.',
        );
      }
      cleaned.push(trimmed);
    }
    return cleaned.length > 0 ? cleaned : undefined;
  }

  private isAttachmentFromGcs(
    value: string,
    normalizedBucket: string,
  ): boolean {
    try {
      const parsed = new URL(value);
      const host = parsed.hostname.toLowerCase();
      if (host === 'storage.googleapis.com') {
        return parsed.pathname.toLowerCase().startsWith(
          `/${normalizedBucket}/`,
        );
      }
      if (host === 'storage.cloud.google.com') {
        return parsed.pathname.toLowerCase().startsWith(
          `/${normalizedBucket}/`,
        );
      }
      if (host === `${normalizedBucket}.storage.googleapis.com`) {
        return parsed.pathname.length > 1;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async notifySupportSla(claim: InsuranceClaim): Promise<void> {
    const watchers = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.SUPPORT_AGENT, UserRole.ADMIN] },
      },
      select: { id: true },
    });
    if (!watchers.length) {
      this.logger.warn(
        `[IncidentsService] no support agents/admins available to notify for claim ${claim.id}.`,
      );
      return;
    }

    const amountFormatted = (claim.amountCents / 100).toFixed(2);
    const message = `Sinistro ${claim.id} para o agendamento ${claim.bookingId} (R$ ${amountFormatted}).`;
    const title = 'SLA Crítico – novo sinistro';
    const payload = {
      claimId: claim.id,
      bookingId: claim.bookingId,
      reporterId: claim.reporterId,
      amountCents: claim.amountCents,
      status: claim.status,
    };
    await Promise.all(
      watchers.map((watcher) =>
        this.notificationsService.createNotification({
          userId: watcher.id,
          type: 'CLAIM_SLA_CRITICAL',
          title,
          message,
          priority: 1,
          category: 'support',
          relatedId: claim.id,
          idempotencyKey: `claim-sla:${claim.id}:${watcher.id}`,
          payload,
        }),
      ),
    );
  }
}
