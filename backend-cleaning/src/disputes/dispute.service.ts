// backend-cleaning/src/disputes/dispute.service.ts

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BookingStatus,
  DisputeStatus,
  Prisma,
  UserRole,
  PolicyEnforcement,
  PolicySource,
  SupportTicketCategory,
  SupportTicketStatus,
  LedgerEntryType,
} from '@prisma/client';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingsService } from '../bookings/bookings.service';
import * as Sentry from '@sentry/node'; // NEW: Import Sentry (conceptual, requires setup)
import { ContactLeakPolicyService } from '../common/services/contact-leak-policy.service';

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

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
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly contactLeakPolicyService: ContactLeakPolicyService,
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
  async createDispute(
    createDisputeDto: CreateDisputeDto,
    reporterUserId: string,
    reporterRole: UserRole,
  ) {
    this.logger.log(
      `[DisputeService] createDispute: Iniciando criação de disputa para booking ${createDisputeDto.bookingId} por user ${reporterUserId}.`,
    );

    const booking = await this.prisma.booking.findUnique({
      where: { id: createDisputeDto.bookingId },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException(
        `Agendamento com ID "${createDisputeDto.bookingId}" não encontrado.`,
      );
    }

    const isClientOfBooking = booking.client.userId === reporterUserId;
    const isProviderOfBooking = booking.provider.userId === reporterUserId;

    if (
      !isClientOfBooking &&
      !isProviderOfBooking &&
      reporterRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para abrir uma disputa neste agendamento.',
      );
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
      throw new BadRequestException(
        `Já existe uma disputa ativa (${existingActiveDispute.id}) para o agendamento ${createDisputeDto.bookingId}.`,
      );
    }

    try {
      const newDispute = await this.prisma.$transaction(async (prisma) => {
        // NEW: Atomic transaction
        const createdDispute = await prisma.dispute.create({
          data: {
            bookingId: createDisputeDto.bookingId,
            reporterUserId: reporterUserId,
            reason: createDisputeDto.reason,
            description: createDisputeDto.description,
            status: DisputeStatus.PENDING,
            attachments: createDisputeDto.attachments || [],
            refundAmountProposed: createDisputeDto.refundAmountProposed
              ? new Prisma.Decimal(createDisputeDto.refundAmountProposed)
              : null,
          },
        });

        // Update booking status
        await this.bookingsService.updateStatus(
          booking.id,
          BookingStatus.PENDING_DISPUTE,
          UserRole.ADMIN,
        );

        // Ledger HOLD (cap no totalPrice)
        try {
          const providerUserId = booking.provider.userId;
          const bookingTotal = Number(booking.totalPrice.toFixed(2));
          const proposed = createDisputeDto.refundAmountProposed
            ? Number(createDisputeDto.refundAmountProposed)
            : bookingTotal;
          const holdAmount = Math.max(0, Math.min(bookingTotal, proposed));
          if (holdAmount > 0) {
            await prisma.ledgerEntry.create({
              data: {
                userId: providerUserId,
                bookingId: booking.id,
                amount: new Prisma.Decimal(-holdAmount),
                type: LedgerEntryType.HOLD,
                note: `Dispute HOLD for booking ${booking.id}`,
              },
            });
          }
        } catch (ledgerError) {
          this.logger.warn(
            `Falha ao registrar HOLD para disputa ${booking.id}: ${this.formatError(
              ledgerError,
            )}`,
          );
        }

        // Send notification to admin
        await this.notificationsService.createNotification({
          // Using createNotification for consistency
          userId: 'ADMIN_USER_ID', // Placeholder for admin user ID
          type: 'DISPUTE_CREATED',
          title: 'Nova Disputa Aberta',
          message: `Uma nova disputa foi aberta para o agendamento ${createdDispute.bookingId}. Motivo: ${createdDispute.reason}.`,
          targetUrl: `/app/disputes/${createdDispute.id}`,
          category: 'dispute', // NEW: Added category
          actionButtons: {
            primary: {
              text: 'Ver Disputa',
              action: 'view_dispute',
              data: { disputeId: createdDispute.id },
            },
          },
        });
        this.logger.error(
          `[DisputeService] Abertura de Disputa ${createdDispute.id} para booking ${createdDispute.bookingId} (motivo: ${createdDispute.reason}). Notificação enviada para admins.`,
        );

        return createdDispute;
      });

      return newDispute;
    } catch (error) {
      this.logger.error(
        `Erro ao criar disputa para booking ${createDisputeDto.bookingId}: ${this.formatError(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      Sentry.captureException(error); // NEW: Capture exception with Sentry
      throw error;
    }
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
          include: { sender: true },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException(
        `Disputa com ID "${disputeId}" não encontrada.`,
      );
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

  async countPendingDisputes(): Promise<number> {
    return this.prisma.dispute.count({
      where: {
        status: {
          in: [DisputeStatus.PENDING, DisputeStatus.IN_REVIEW],
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
  async addMessageToDispute(
    disputeId: string,
    senderUserId: string,
    content: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      select: { id: true, bookingId: true, reporterUserId: true },
    });
    if (!dispute) {
      throw new NotFoundException(
        `Disputa com ID "${disputeId}" não encontrada.`,
      );
    }

    const policyResult = await this.contactLeakPolicyService.evaluatePolicy({
      userId: senderUserId,
      content,
      disputeId,
      bookingId: dispute.bookingId,
      source: PolicySource.DISPUTE,
    });

    if (policyResult?.enforcement === PolicyEnforcement.BLOCKED) {
      this.logger.warn(
        `[DisputeService] addMessageToDispute: Bloqueio por política para disputeId=${disputeId}, sender=${senderUserId}`,
      );
      throw new ForbiddenException(
        'Sua mensagem foi bloqueada pela política de contato.',
      );
    }

    if (policyResult?.enforcement === PolicyEnforcement.SANITIZED) {
      content = '***';
    }

    try {
      const message = await this.prisma.$transaction(async (prisma) => {
        // NEW: Atomic transaction
        // --- Lógica para encontrar ou criar o SupportTicket associado ---
        let supportTicket = await prisma.supportTicket.findFirst({
          where: {
            bookingId: dispute.bookingId,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!supportTicket) {
          const reporter = await prisma.user.findUnique({
            where: { id: dispute.reporterUserId },
            select: { role: true },
          });

          supportTicket = await prisma.supportTicket.create({
            data: {
              user: { connect: { id: dispute.reporterUserId } },
              role: reporter?.role || UserRole.SYSTEM,
              subject: `Disputa referente ao Agendamento ${dispute.bookingId}`,
              category: SupportTicketCategory.OTHER,
              description: `Este ticket foi gerado automaticamente para gerenciar as mensagens da disputa ${dispute.id}.`,
              booking: { connect: { id: dispute.bookingId } },
              status: SupportTicketStatus.OPEN,
            },
          });
        }
        // --- Fim da lógica do SupportTicket ---

        const createdMessage = await prisma.disputeMessage.create({
          data: {
            dispute: {
              connect: { id: disputeId },
            },
            sender: {
              connect: { id: senderUserId },
            },
            ticket: {
              connect: { id: supportTicket.id },
            },
            content,
          },
        });
        return createdMessage;
      });

      const booking = await this.prisma.booking.findUnique({
        where: { id: dispute.bookingId },
        select: {
          client: { select: { userId: true } },
          provider: { select: { userId: true } },
        },
      });

      const recipientUserId =
        booking.client.userId === senderUserId
          ? booking.provider.userId
          : booking.client.userId;

      await this.notificationsService.createNotification({
        // Using createNotification
        userId: recipientUserId,
        type: 'DISPUTE_MESSAGE',
        title: 'Nova Mensagem na Disputa',
        message: `Você tem uma nova mensagem na disputa ${dispute.bookingId}.`,
        targetUrl: `/app/disputes/${dispute.id}`,
        category: 'dispute',
        actionButtons: {
          primary: {
            text: 'Ver Mensagem',
            action: 'view_dispute_message',
            data: { disputeId: dispute.id },
          },
        },
      });
      await this.notificationsService.createNotification({
        // Using createNotification
        userId: 'ADMIN_USER_ID', // Placeholder for admin user ID
        type: 'DISPUTE_MESSAGE_ADMIN',
        title: 'Nova Mensagem na Disputa (Admin)',
        message: `Nova mensagem na disputa ${dispute.bookingId}.`,
        targetUrl: `/app/disputes/${dispute.id}`,
        category: 'dispute',
        actionButtons: {
          primary: {
            text: 'Ver Disputa',
            action: 'view_dispute',
            data: { disputeId: dispute.id },
          },
        },
      });

      return message;
    } catch (error) {
      this.logger.error(
        `Erro ao adicionar mensagem à disputa ${disputeId}: ${this.formatError(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      Sentry.captureException(error); // NEW: Capture exception with Sentry
      throw error;
    }
  }

  /**
   * Atualiza o status de uma disputa e, opcionalmente, processa um reembolso.
   * @param disputeId ID da disputa.
   * @param updateDisputeDto Dados para atualização da disputa.
   * @param adminUserId ID do administrador que está resolvendo a disputa.
   * @returns A disputa atualizada.
   */
  async updateDisputeStatus(
    disputeId: string,
    updateDisputeDto: UpdateDisputeDto,
    adminUserId: string,
  ) {
    this.logger.log(
      `[DisputeService] updateDisputeStatus: Atualizando disputa ${disputeId} para status ${updateDisputeDto.status}.`,
    );

    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { booking: true },
    });
    if (!dispute) {
      throw new NotFoundException(
        `Disputa com ID "${disputeId}" não encontrada.`,
      );
    }

    if (
      updateDisputeDto.status === DisputeStatus.RESOLVED &&
      !updateDisputeDto.resolutionNotes
    ) {
      throw new BadRequestException(
        'As notas de resolução são obrigatórias ao definir o status como RESOLVED.',
      );
    }

    try {
      const updatedDispute = await this.prisma.$transaction(async (prisma) => {
        // NEW: Atomic transaction
        const updated = await prisma.dispute.update({
          where: { id: disputeId },
          data: {
            status: updateDisputeDto.status,
            resolutionNotes: updateDisputeDto.resolutionNotes,
            resolvedByUserId:
              updateDisputeDto.status === DisputeStatus.RESOLVED
                ? adminUserId
                : null,
            resolvedAt:
              updateDisputeDto.status === DisputeStatus.RESOLVED
                ? new Date()
                : null,
          },
        });

        // Ledger RELEASE/REFUND conforme decisão
        try {
          const bkg = await prisma.booking.findUnique({
            where: { id: dispute.bookingId },
            include: { provider: { include: { user: true } } },
          });
          if (bkg?.provider?.userId) {
            // RELEASE total de HOLD somado
            const holds = await prisma.ledgerEntry.aggregate({
              _sum: { amount: true },
              where: {
                bookingId: bkg.id,
                userId: bkg.provider.userId,
                type: LedgerEntryType.HOLD,
              },
            });
            const holdSum = holds._sum.amount
              ? Math.abs(Number(holds._sum.amount))
              : 0;
            if (holdSum > 0) {
              await prisma.ledgerEntry.create({
                data: {
                  userId: bkg.provider.userId,
                  bookingId: bkg.id,
                  amount: new Prisma.Decimal(holdSum),
                  type: LedgerEntryType.RELEASE,
                  note: `Dispute RELEASE for booking ${bkg.id}`,
                },
              });
            }
            // Se RESOLVED com refund definido, lança REFUND (negativo)
            if (
              updated.status === DisputeStatus.RESOLVED &&
              updateDisputeDto.refundAmount &&
              updateDisputeDto.refundAmount > 0
            ) {
              await prisma.ledgerEntry.create({
                data: {
                  userId: bkg.provider.userId,
                  bookingId: bkg.id,
                  amount: new Prisma.Decimal(
                    -Number(updateDisputeDto.refundAmount),
                  ),
                  type: LedgerEntryType.REFUND,
                  note: `Dispute REFUND for booking ${bkg.id}`,
                },
              });
            }
          }
        } catch (ledgerError) {
          this.logger.warn(
            `Falha ao processar ledger para disputa ${disputeId}: ${this.formatError(
              ledgerError,
            )}`,
          );
        }

        if (updated.status === DisputeStatus.RESOLVED) {
          await this.bookingsService.updateStatus(
            dispute.bookingId,
            BookingStatus.FINISHED,
            UserRole.ADMIN,
          );
        }
        return updated;
      });

      const booking = await this.prisma.booking.findUnique({
        where: { id: dispute.bookingId },
        select: {
          client: { select: { userId: true } },
          provider: { select: { userId: true } },
        },
      });
      await this.notificationsService.createNotification({
        // Using createNotification
        userId: booking.client.userId,
        type: 'DISPUTE_RESOLVED',
        title: 'Disputa Resolvida',
        message: `Sua disputa para o agendamento ${dispute.bookingId} foi resolvida. Status: ${updatedDispute.status}.`,
        targetUrl: `/app/disputes/${updatedDispute.id}`,
        category: 'dispute',
        actionButtons: {
          primary: {
            text: 'Ver Resolução',
            action: 'view_dispute_resolution',
            data: { disputeId: updatedDispute.id },
          },
        },
      });
      await this.notificationsService.createNotification({
        // Using createNotification
        userId: booking.provider.userId,
        type: 'DISPUTE_RESOLVED',
        title: 'Disputa Resolvida',
        message: `A disputa para o agendamento ${dispute.bookingId} foi resolvida. Status: ${updatedDispute.status}.`,
        targetUrl: `/app/disputes/${updatedDispute.id}`,
        category: 'dispute',
        actionButtons: {
          primary: {
            text: 'Ver Resolução',
            action: 'view_dispute_resolution',
            data: { disputeId: updatedDispute.id },
          },
        },
      });
      this.logger.log(
        `[DisputeService] Notificações de resolução enviadas para cliente e provedor da disputa ${disputeId}.`,
      );

      return updatedDispute;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar status da disputa ${disputeId}: ${this.formatError(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      Sentry.captureException(error); // NEW: Capture exception with Sentry
      throw error;
    }
  }
}
