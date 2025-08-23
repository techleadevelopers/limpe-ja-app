// src/notifications/notifications.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Notification } from '@prisma/client';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { I18nService } from '../common/i18n/i18n.service';
import { CreateNotificationDto } from './dto/create-notification.dto'; // NEW

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Cria uma nova notificação.
   * @param dto DTO com os dados da notificação a ser criada.
   * @returns A notificação criada.
   */
  async createNotification(dto: CreateNotificationDto): Promise<Notification> { // Refactored to use DTO
    const { userId, type, message, targetUrl, title, imageUrl, actionButtons } = dto;
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        message,
        targetUrl,
        title, // Storing title in DB
        imageUrl, // Storing imageUrl in DB
        actionButtons, // Storing actionButtons in DB
        isRead: false,
      },
    });
  }

  /**
   * Retorna todas as notificações de um usuário.
   * @param userId ID do usuário.
   * @param includeRead Incluir notificações já lidas (padrão: false).
   * @returns Lista de notificações.
   */
  async getUserNotifications(userId: string, includeRead: boolean = false): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(includeRead ? {} : { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Marca notificações como lidas.
   * @param userId ID do usuário.
   * @param markAsReadDto DTO contendo os IDs das notificações a serem marcadas como lidas.
   * @returns Contagem de notificações atualizadas.
   */
  async markNotificationsAsRead(userId: string, markAsReadDto: MarkAsReadDto): Promise<{ count: number }> {
    if (markAsReadDto.notificationIds && markAsReadDto.notificationIds.length > 0) {
      // Marca notificações específicas como lidas
      const result = await this.prisma.notification.updateMany({
        where: {
          id: { in: markAsReadDto.notificationIds },
          userId: userId, // Garante que o usuário só pode marcar suas próprias notificações
          isRead: false, // Apenas marca as que ainda não foram lidas
        },
        data: {
          isRead: true,
        },
      });
      return { count: result.count };
    } else {
      // Marca todas as notificações não lidas do usuário como lidas
      const result = await this.prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
      return { count: result.count };
    }
  }

  /**
   * Marca uma única notificação como lida.
   * @param notificationId ID da notificação.
   * @param userId ID do usuário (para validação de propriedade).
   * @returns A notificação atualizada.
   */
  async markNotificationByIdAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(await this.i18n.translate('notification.notFound'));
    }

    if (notification.isRead) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Deleta uma notificação.
   * @param notificationId ID da notificação.
   * @param userId ID do usuário (para validação de propriedade).
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(await this.i18n.translate('notification.notFound'));
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Fornece sugestões inteligentes baseadas em um contexto.
   * @param context O contexto para as sugestões (ex: 'booking_flow', 'service_quality').
   * @returns Um array de strings com sugestões.
   */
  async getSmartSuggestions(context: string): Promise<string[]> {
    const suggestions: Record<string, string[]> = {
      'booking_flow': [
        'Responda em até 30 minutos para melhor ranking',
        'Seja cordial e profissional na primeira impressão',
        'Confirme todos os detalhes antes de aceitar'
      ],
      'service_quality': [
        'Chegue sempre 5 minutos antes do horário',
        'Traga materiais extras para imprevistos',
        'Tire fotos antes/depois para mostrar qualidade'
      ],
      'customer_retention': [
        'Ofereça agendamentos recorrentes com desconto',
        'Envie lembretes de manutenção preventiva',
        'Mantenha contato pós-serviço para feedback'
      ],
    };

    return suggestions[context] || [];
  }

  /**
   * Executa uma ação rápida associada a uma notificação.
   * @param action O tipo de ação a ser executada (ex: 'accept_booking', 'respond_review').
   * @param data Dados adicionais necessários para a ação (ex: bookingId, reviewId, message).
   * @returns Promessa que resolve quando a ação é concluída.
   */
  async executeQuickAction(action: string, data: any): Promise<void> {
    switch (action) {
      case 'accept_booking':
        this.prisma.booking.update({
          where: { id: data.bookingId },
          data: { status: 'CONFIRMED' }
        }).catch(e => this.logger.error(`Erro ao aceitar agendamento ${data.bookingId}:`, e));
        this.logger.log(`Ação Rápida: Agendamento ${data.bookingId} aceito.`);
        break;
      case 'view_booking':
        this.logger.log(`Ação Rápida: Visualizar agendamento ${data.bookingId}.`);
        break;
      case 'respond_review':
        this.logger.log(`Ação Rápida: Respondendo à avaliação ${data.reviewId} com conteúdo: "${data.responseContent}".`);
        break;
      case 'view_review':
        this.logger.log(`Ação Rápida: Visualizar avaliação ${data.reviewId}.`);
        break;
      default:
        throw new BadRequestException(await this.i18n.translate('notification.badRequest.unknownAction', 'pt-BR', { action }));
    }
  }

  /**
   * Envia uma notificação push para um usuário específico.
   * Esta função é um placeholder e precisa ser implementada
   * com a lógica do seu provedor de notificações push (e.g., Firebase Cloud Messaging).
   *
   * @param userId O ID do usuário para quem enviar a notificação.
   * @param title O título da notificação push.
   * @param body O corpo da mensagem da notificação push.
   * @param data Dados adicionais (payload) para a notificação (opcional).
   * @returns Promessa que resolve quando a notificação é enviada.
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    this.logger.log(`Iniciando envio de notificação push para userId: ${userId}`);
    this.logger.log(`Título: "${title}", Corpo: "${body}"`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          fcmToken: true,
        },
      });

      if (!user || !user.fcmToken) {
        this.logger.warn(`Nenhum token de dispositivo (fcmToken) encontrado para o usuário ${userId}. Notificação push não enviada.`);
        return;
      }

      const deviceToken = user.fcmToken;

      // EXEMPLO CONCEITUAL COM FIREBASE ADMIN SDK (comentado, pois requer setup)
      /*
      const message = {
        notification: {
          title: title,
          body: body,
        },
        data: {
          ...data,
        },
        token: deviceToken,
      };
      await admin.messaging().send(message);
      this.logger.log(`Notificação push enviada com sucesso para o usuário ${userId} (token: ${deviceToken}).`);
      */

      // Por enquanto, apenas um log para simular o envio:
      this.logger.log(`[SIMULADO] Notificação push para ${userId} enviada: Título="${title}", Corpo="${body}", Dados=${JSON.stringify(data)}`);

    } catch (error: any) {
      this.logger.error(
        `Erro ao enviar notificação push para o usuário ${userId}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Falha ao enviar notificação push: ${error.message}`);
    }
  }
}