// backend-cleaning/src/guarantee/guarantee.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SubmitClaimDto } from './dto/submit-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { NotificationsService } from '../notifications/notifications.service'; // Assuming NotificationsService
import { Decimal } from '@prisma/client/runtime/library'; // CORREÇÃO: Importar Decimal

@Injectable()
export class GuaranteeService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async submitClaim(clientId: string, submitClaimDto: SubmitClaimDto) {
    const { bookingId, description, attachments, estimatedValue } =
      submitClaimDto;

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true, provider: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found.`);
    }

    if (booking.clientId !== clientId) {
      throw new ForbiddenException(
        'You can only submit claims for your own bookings.',
      );
    }

    const newClaim = await this.prisma.guaranteeClaim.create({
      data: {
        bookingId,
        clientId: booking.clientId,
        providerId: booking.providerId,
        description,
        attachments: attachments || [],
        estimatedValue: estimatedValue ? new Decimal(estimatedValue) : null, // CORREÇÃO: Usar new Decimal
        status: 'PENDING',
      },
    });

    // Notify administrators/support team about the new claim
    const adminUsers = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
    });
    await Promise.all(
      adminUsers.map((admin) =>
        // CORREÇÃO: Assumindo que NotificationsService.sendPushNotification existe
        this.notificationsService.sendPushNotification(
          admin.id,
          'Nova Solicitação de Garantia',
          `Uma nova solicitação de garantia foi enviada para o agendamento ${bookingId}.`,
          { type: 'guarantee_claim', claimId: newClaim.id },
        ),
      ),
    );

    return newClaim;
  }

  async getClaimsForUser(clientId: string) {
    return this.prisma.guaranteeClaim.findMany({
      where: { clientId },
      include: { booking: true, provider: true },
      orderBy: { createdAt: 'desc' as Prisma.SortOrder },
    });
  }

  async getClaimDetails(id: string, userId: string, userRole: string) {
    const claim = await this.prisma.guaranteeClaim.findUnique({
      where: { id },
      include: {
        booking: { select: { id: true, scheduledDate: true, status: true } },
        client: { select: { id: true, fullName: true } }, // CORREÇÃO: 'name' para 'fullName'
        provider: { select: { id: true, fullName: true } }, // CORREÇÃO: 'name' para 'fullName'
      },
    });

    if (!claim) {
      throw new NotFoundException(`Guarantee claim with ID ${id} not found.`);
    }

    // Authorization check
    if (userRole === 'CLIENT' && claim.clientId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this claim.',
      );
    }

    return claim;
  }

  async updateClaimStatus(
    id: string,
    updateClaimDto: UpdateClaimDto,
    adminId: string,
  ) {
    const existingClaim = await this.prisma.guaranteeClaim.findUnique({
      where: { id },
    });

    if (!existingClaim) {
      throw new NotFoundException(`Guarantee claim with ID ${id} not found.`);
    }

    const updatedClaim = await this.prisma.guaranteeClaim.update({
      where: { id },
      data: {
        status: updateClaimDto.status,
        resolutionNotes: updateClaimDto.resolutionNotes,
        resolvedValue: updateClaimDto.resolvedValue
          ? new Decimal(updateClaimDto.resolvedValue)
          : undefined, // CORREÇÃO: Usar new Decimal
        resolvedAt:
          updateClaimDto.status === 'SETTLED' ||
          updateClaimDto.status === 'REJECTED' ||
          updateClaimDto.status === 'APPROVED'
            ? new Date()
            : undefined,
      },
    });

    // Notify the client about the status update
    // CORREÇÃO: Assumindo que NotificationsService.sendPushNotification existe
    await this.notificationsService.sendPushNotification(
      updatedClaim.clientId,
      'Atualização da Sua Solicitação de Garantia',
      `Sua solicitação de garantia para o agendamento ${updatedClaim.bookingId} foi atualizada para: ${updatedClaim.status}.`,
      { type: 'guarantee_claim_update', claimId: updatedClaim.id },
    );

    return updatedClaim;
  }
}
