import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, DisputeStatus, Prisma, TransactionType, UserRole } from '@prisma/client'; // Importação do UserRole corrigida
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingsService } from '../bookings/bookings.service'; // Importar BookingsService

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
  ) {}

  /**
   * Cria uma nova disputa.
   * @param createDisputeDto Dados para criar a disputa.
   * @param reporterUserId ID do usuário que está reportando a disputa.
   * @param reporterRole Função do usuário que está reportando.
   * @returns A disputa criada.
   */
  async createDispute(createDisputeDto: CreateDisputeDto, reporterUserId: string, reporterRole: UserRole) {
    this.logger.log(`[DisputeService] createDispute: Iniciando criação de disputa para booking ${createDisputeDto.bookingId} por user ${reporterUserId}.`);

    const booking = await this.prisma.booking.findUnique({
      where: { id: createDisputeDto.bookingId },
      include: { client: { include: { user: true } }, provider: { include: { user: true } } } // Incluindo User para verificar a relação
    });

    if (!booking) {
      throw new NotFoundException(`Agendamento com ID "${createDisputeDto.bookingId}" não encontrado.`);
    }

    const isClientOfBooking = booking.client.userId === reporterUserId;
    const isProviderOfBooking = booking.provider.userId === reporterUserId;

    if (!isClientOfBooking && !isProviderOfBooking && reporterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Você não tem permissão para abrir uma disputa neste agendamento.');
    }

    const existingActiveDispute = await this.prisma.dispute.findFirst({
      where: {
        bookingId: createDisputeDto.bookingId,
        status: {
          in: [DisputeStatus.PENDING, DisputeStatus.IN_REVIEW],
        },
      },
    });

    if (existingActiveDispute) {
      throw new BadRequestException(`Já existe uma disputa ativa (${existingActiveDispute.id}) para o agendamento ${createDisputeDto.bookingId}.`);
    }

    const newDispute = await this.prisma.dispute.create({
      data: {
        bookingId: createDisputeDto.bookingId,
        reporterUserId: reporterUserId,
        reason: createDisputeDto.reason,
        description: createDisputeDto.description,
        status: DisputeStatus.PENDING,
        attachments: createDisputeDto.attachments || [],
        refundAmountProposed: createDisputeDto.refundAmountProposed ? new Prisma.Decimal(createDisputeDto.refundAmountProposed) : null,
      },
    });

    await this.bookingsService.updateStatus(booking.id, BookingStatus.PENDING_DISPUTE, UserRole.ADMIN);

    await this.notificationsService.sendPushNotification(
      'ADMIN_USER_ID',
      'Nova Disputa Aberta',
      `Uma nova disputa foi aberta para o agendamento ${newDispute.bookingId}. Motivo: ${newDispute.reason}.`,
      { type: 'new_dispute', disputeId: newDispute.id }
    );
    this.logger.log(`[DisputeService] createDispute: Disputa ${newDispute.id} criada e notificação enviada para admins.`);

    return newDispute;
  }

  /**
   * Obtém os detalhes de uma disputa específica.
   * @param disputeId ID da disputa.
   * @returns A disputa encontrada.
   */
  async getDisputeDetails(disputeId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: {
            client: { include: { user: true } },
            provider: { include: { user: true } },
            providerService: { include: { service: true } },
            address: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: true } // Incluir o remetente para ter os dados do usuário
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException(`Disputa com ID "${disputeId}" não encontrada.`);
    }
    return dispute;
  }

  /**
   * Lista disputas com filtros e paginação.
   * @param status Status da disputa para filtrar.
   * @param limit Limite de resultados.
   * @param offset Offset para paginação.
   * @returns Lista de disputas.
   */
  async listDisputes(status?: DisputeStatus, limit?: number, offset?: number) {
    const where: Prisma.DisputeWhereInput = status ? { status } : {};
    return this.prisma.dispute.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          select: {
            id: true,
            scheduledDate: true,
            scheduledTime: true,
            totalPrice: true,
            client: { select: { user: { select: { fullName: true } } } },
            provider: { select: { user: { select: { fullName: true } } } },
          },
        },
      },
    });
  }

  /**
   * Adiciona uma mensagem a uma disputa.
   * @param disputeId ID da disputa.
   * @param senderUserId ID do remetente da mensagem.
   * @param content Conteúdo da mensagem.
   * @returns A mensagem criada.
   */
  async addMessageToDispute(disputeId: string, senderUserId: string, content: string) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) {
      throw new NotFoundException(`Disputa com ID "${disputeId}" não encontrada.`);
    }

    const message = await this.prisma.disputeMessage.create({
      data: {
        disputeId,
        senderUserId,
        content,
      },
    });

    const booking = await this.prisma.booking.findUnique({ 
      where: { id: dispute.bookingId }, 
      select: { 
        client: { select: { userId: true } }, 
        provider: { select: { userId: true } } 
      } 
    });

    const recipientUserId = (booking.client.userId === senderUserId) ? booking.provider.userId : booking.client.userId;
    
    await this.notificationsService.sendPushNotification(
      recipientUserId,
      'Nova Mensagem na Disputa',
      `Você tem uma nova mensagem na disputa ${dispute.bookingId}.`,
      { type: 'dispute_message', disputeId: dispute.id }
    );
    await this.notificationsService.sendPushNotification(
      'ADMIN_USER_ID',
      'Nova Mensagem na Disputa (Admin)',
      `Nova mensagem na disputa ${dispute.bookingId}.`,
      { type: 'dispute_message', disputeId: dispute.id }
    );

    return message;
  }

  /**
   * Atualiza o status de uma disputa e, opcionalmente, processa um reembolso.
   * @param disputeId ID da disputa.
   * @param updateDisputeDto Dados para atualização da disputa.
   * @param adminUserId ID do administrador que está resolvendo a disputa.
   * @returns A disputa atualizada.
   */
  async updateDisputeStatus(disputeId: string, updateDisputeDto: UpdateDisputeDto, adminUserId: string) {
    this.logger.log(`[DisputeService] updateDisputeStatus: Atualizando disputa ${disputeId} para status ${updateDisputeDto.status}.`);

    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId }, include: { booking: true } });
    if (!dispute) {
      throw new NotFoundException(`Disputa com ID "${disputeId}" não encontrada.`);
    }

    if (updateDisputeDto.status === DisputeStatus.RESOLVED && !updateDisputeDto.resolutionNotes) {
      throw new BadRequestException('As notas de resolução são obrigatórias ao definir o status como RESOLVED.');
    }

    const updatedDispute = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: updateDisputeDto.status,
        resolutionNotes: updateDisputeDto.resolutionNotes,
        resolvedByUserId: updateDisputeDto.status === DisputeStatus.RESOLVED ? adminUserId : null,
        resolvedAt: updateDisputeDto.status === DisputeStatus.RESOLVED ? new Date() : null,
      },
    });

    if (updatedDispute.status === DisputeStatus.RESOLVED && updateDisputeDto.refundAmount && updateDisputeDto.refundAmount > 0) {
      const booking = await this.prisma.booking.findUnique({ where: { id: dispute.bookingId } });
      const provider = await this.prisma.provider.findUnique({ where: { userId: booking.providerId } });
      
      await this.prisma.transaction.create({
        data: {
          bookingId: dispute.bookingId,
          providerId: provider.id, // Adicionado o providerId
          amount: new Prisma.Decimal(updateDisputeDto.refundAmount).neg(),
          type: TransactionType.REFUND,
          status: 'COMPLETED',
          description: `Reembolso da disputa ${dispute.id}`,
        },
      });
      this.logger.log(`[DisputeService] Reembolso de ${updateDisputeDto.refundAmount} processado para disputa ${disputeId}.`);
    }

    if (updatedDispute.status === DisputeStatus.RESOLVED) {
      await this.bookingsService.updateStatus(dispute.bookingId, BookingStatus.COMPLETED, UserRole.ADMIN);
    }

    const booking = await this.prisma.booking.findUnique({ where: { id: dispute.bookingId }, select: { client: { select: { userId: true } }, provider: { select: { userId: true } } } });
    await this.notificationsService.sendPushNotification(
      booking.client.userId,
      'Disputa Resolvida',
      `Sua disputa para o agendamento ${dispute.bookingId} foi resolvida. Status: ${updatedDispute.status}.`,
      { type: 'dispute_resolved', disputeId: updatedDispute.id }
    );
    await this.notificationsService.sendPushNotification(
      booking.provider.userId,
      'Disputa Resolvida',
      `A disputa para o agendamento ${dispute.bookingId} foi resolvida. Status: ${updatedDispute.status}.`,
      { type: 'dispute_resolved', disputeId: updatedDispute.id }
    );
    this.logger.log(`[DisputeService] Notificações de resolução enviadas para cliente e provedor da disputa ${disputeId}.`);

    return updatedDispute;
  }
}