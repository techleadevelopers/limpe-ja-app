// src/support/support.service.ts

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import {
  SupportTicketStatus,
  SupportTicketCategory,
  UserRole,
  Prisma,
} from '@prisma/client'; // Assumindo enums do Prisma
import { SupportSlaPolicy } from './policies/sla.policy';
import { SupportStateMachine } from './states/support.state-machine';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { NotificationService } from '../services/NotificationService';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private slaPolicy: SupportSlaPolicy,
    private stateMachine: SupportStateMachine,
    @InjectQueue('support-escalations') private escalationsQueue: Queue, // Injetar fila de escalonamento
  ) {}

  private async notifyAdmins(
    title: string,
    body: string,
    payload?: Record<string, unknown>,
  ) {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    if (!admins.length) {
      this.logger.warn(
        '[SupportService] Nenhum admin encontrado para notificação.',
      );
      return;
    }

    await Promise.all(
      admins.map((admin) =>
        this.notificationService.sendToUser(admin.id, title, body, payload),
      ),
    );
  }

  async createTicket(
    userId: string,
    userRole: UserRole,
    createTicketDto: CreateTicketDto,
  ) {
    const {
      subject,
      category: requestedCategory,
      description,
      bookingId,
      attachments,
      severity,
    } = createTicketDto;

    const sanitizedCategory = Object.values(SupportTicketCategory).includes(
      requestedCategory,
    )
      ? requestedCategory
      : SupportTicketCategory.OTHER;

    const severityLabel = (severity ?? 'NORMAL').toUpperCase();

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await this.prisma.supportTicket.count({
      where: {
        userId,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCount >= 3) {
      throw new HttpException(
        {
          code: 'support.rate_limited',
          message:
            'Você atingiu o limite de chamados por hora. Tente novamente mais tarde.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.logger.log(
      `[SupportService] createTicket: user=${userId} category=${sanitizedCategory} severity=${severityLabel}`,
    );

    const newTicket = await this.prisma.supportTicket.create({
      data: {
        userId,
        role: userRole,
        subject,
        category: sanitizedCategory,
        description,
        bookingId,
        status: SupportTicketStatus.OPEN,
        messages: {
          create: {
            userId,
            role: userRole,
            body: description,
            attachments: attachments || [],
          },
        },
      },
      include: {
        messages: true,
      },
    });

    // Notificar admin ou equipe de suporte sobre novo ticket
    // Usando sendPushNotification para notificar o admin
    await this.notifyAdmins(
      `Novo ticket de suporte #${newTicket.id} - ${newTicket.subject}`,
      `Categoria: ${newTicket.category}. Aberto por: ${userId}.`,
      { ticketId: newTicket.id, category: newTicket.category, userId },
    );

    // Agendar job de escalonamento SLA
    const slaDueDate = this.slaPolicy.getSlaDueDate(sanitizedCategory);
    if (slaDueDate) {
      await this.escalationsQueue.add(
        'check-sla',
        { ticketId: newTicket.id, category: newTicket.category },
        { delay: slaDueDate.getTime() - Date.now() }, // Atraso até o vencimento do SLA
      );
    }

    return newTicket;
  }

  async findTickets(userId?: string, status?: string, category?: string) {
    const where: Prisma.SupportTicketWhereInput = {};
    if (userId) {
      where.userId = userId;
    }
    if (status) {
      const statusEnum = status as SupportTicketStatus;
      if (!Object.values(SupportTicketStatus).includes(statusEnum)) {
        throw new BadRequestException(`Status inválido: ${status}`);
      }
      where.status = statusEnum;
    }
    if (category) {
      const categoryEnum = category as SupportTicketCategory;
      if (!Object.values(SupportTicketCategory).includes(categoryEnum)) {
        throw new BadRequestException(`Categoria inválida: ${category}`);
      }
      where.category = categoryEnum;
    }

    return this.prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async findTicketById(ticketId: string) {
    return this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async addMessageToTicket(
    ticketId: string,
    userId: string,
    userRole: UserRole,
    body: string,
  ) {
    const ticket = await this.findTicketById(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado.');
    }

    // Apenas o usuário do ticket ou um admin/agente pode adicionar mensagem
    if (
      ticket.userId !== userId &&
      userRole !== UserRole.ADMIN &&
      ticket.assignedToId !== userId
    ) {
      throw new BadRequestException(
        'Você não pode adicionar mensagens a este ticket.',
      );
    }

    const newMessage = await this.prisma.supportMessage.create({
      data: {
        ticketId,
        userId,
        role: userRole,
        body,
      },
    });

    // Se o ticket estava esperando resposta do usuário e agora tem uma nova mensagem,
    // transicionar para IN_PROGRESS (se for um agente) ou manter OPEN (se for o usuário)
    if (
      ticket.status === SupportTicketStatus.WAITING_USER &&
      userRole !== UserRole.CLIENT
    ) {
      await this.updateTicketStatus(ticketId, SupportTicketStatus.IN_PROGRESS);
    } else if (
      ticket.status === SupportTicketStatus.RESOLVED &&
      userRole === UserRole.CLIENT
    ) {
      // Se o cliente responde a um ticket resolvido, reabre
      await this.updateTicketStatus(ticketId, SupportTicketStatus.IN_PROGRESS);
    }

    // Notificar a outra parte (cliente se agente respondeu, ou agente se cliente respondeu)
    if (userRole === UserRole.CLIENT) {
      // Notificar agente/admin
      // Usando sendPushNotification para notificar o admin
      await this.notifyAdmins(
        `Nova mensagem no ticket #${ticket.id} - ${ticket.subject}`,
        `Cliente ${userId} adicionou: "${body}"`,
        { ticketId: ticket.id, userId, messageBody: body },
      );
    } else {
      // Notificar cliente
      // Usando sendPushNotification para notificar o cliente
      await this.notificationService.sendToUser(
        ticket.userId,
        `Seu ticket #${ticket.id} tem uma nova mensagem!`,
        `"${body}"`,
        { ticketId: ticket.id, messageBody: body },
      );
    }

    return newMessage;
  }

  async updateTicketStatus(ticketId: string, newStatus: string) {
    const ticket = await this.findTicketById(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado.');
    }

    if (
      !Object.values(SupportTicketStatus).includes(
        newStatus as SupportTicketStatus,
      )
    ) {
      throw new BadRequestException(`Status inválido: ${newStatus}`);
    }

    const currentStatus = ticket.status;
    if (
      !this.stateMachine.canTransition(
        currentStatus,
        newStatus as SupportTicketStatus,
      )
    ) {
      throw new BadRequestException(
        `Transição de status inválida de ${currentStatus} para ${newStatus}.`,
      );
    }

    const updatedTicket = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: newStatus as SupportTicketStatus,
        closedAt:
          newStatus === SupportTicketStatus.RESOLVED ||
          newStatus === SupportTicketStatus.CLOSED
            ? new Date()
            : null,
      },
    });

    await this.prisma.supportSlaLog.create({
      data: {
        ticketId,
        fromStatus: currentStatus,
        toStatus: updatedTicket.status,
      },
    });

    // Notificar o cliente sobre a mudança de status
    // Usando sendPushNotification para notificar o cliente
    await this.notificationService.sendToUser(
      ticket.userId,
      `Status do seu ticket #${ticket.id} atualizado para: ${newStatus}`,
      `Seu ticket "${ticket.subject}" agora está com o status ${newStatus}.`,
      { ticketId: ticket.id, newStatus },
    );

    return updatedTicket;
  }

  async assignTicket(ticketId: string, agentId: string) {
    const ticket = await this.findTicketById(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado.');
    }

    // Verificar se agentId é um ID de usuário válido e se o usuário é um admin/agente
    const agent = await this.prisma.user.findUnique({ where: { id: agentId } });
    if (
      !agent ||
      (agent.role !== UserRole.ADMIN && agent.role !== UserRole.SUPPORT_AGENT)
    ) {
      // Assumindo role SUPPORT_AGENT
      throw new BadRequestException(
        'Agente inválido ou sem permissão para ser agente.',
      );
    }

    const updatedTicket = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId: agentId,
        status: SupportTicketStatus.IN_PROGRESS, // Transiciona para em progresso ao ser atribuído
      },
    });

    // Usando sendPushNotification para notificar o agente
    await this.notificationService.sendToUser(
      agentId,
      `Você foi atribuído ao ticket #${ticket.id}`,
      `O ticket "${ticket.subject}" foi atribuído a você.`,
      { ticketId: ticket.id, assignedAgentId: agentId },
    );

    return updatedTicket;
  }

  // Método para ser chamado pelo job de escalonamento
  async handleSlaEscalation(ticketId: string, category: SupportTicketCategory) {
    const ticket = await this.findTicketById(ticketId);
    if (ticket && ticket.status === SupportTicketStatus.OPEN) {
      // O ticket ainda está aberto e o SLA expirou
      console.warn(
        `SLA Expirado para o Ticket #${ticketId} (Categoria: ${category})`,
      );
      // Aqui você pode:
      // 1. Notificar um grupo de admins/gerentes
      // Usando sendPushNotification para notificar o admin
      await this.notifyAdmins(
        `ALERTA SLA EXPIRADO: Ticket #${ticketId} - ${ticket.subject}`,
        `O ticket de categoria ${category} excedeu o SLA e ainda está ${ticket.status}. Por favor, verifique!`,
        { ticketId: ticket.id, category, status: ticket.status },
      );
      // 2. Mudar o status do ticket para um estado de "escalado"
      // await this.updateTicketStatus(ticketId, SupportTicketStatus.ESCALATED); // Se você tiver este status
    }
  }
}
