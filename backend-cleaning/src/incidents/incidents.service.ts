import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClaimStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentClaimDto } from './dto/create-incident.dto';

const CLAIM_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.insuranceClaim.create({
      data: {
        bookingId: dto.bookingId,
        reporterId: userId,
        description: dto.description,
        amountCents: dto.amountCents,
        attachments: dto.attachments ?? [],
        deductibleCents: deductible,
        coverageCents: insurance.coverageCents,
        planId: insurance.planId,
        status,
        rejectionReason,
      },
    });
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
}
