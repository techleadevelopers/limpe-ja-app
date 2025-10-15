// src/notifications/notifications.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Notification } from '@prisma/client';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { I18nService } from '../common/i18n/i18n.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import * as Sentry from '@sentry/node'; // NEW: Import Sentry (conceptual, requires setup)

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
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const { userId, type, message, targetUrl, title, imageUrl, actionButtons, category } = dto; // NEW: Added category
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          message,
          targetUrl,
          title,
          imageUrl,
          actionButtons,
          category, // NEW: Storing category in DB
          isRead: false,
        },
      });
      // Optionally, send push notification immediately after creating DB entry
      this.sendPushNotification(userId, title || message, message, {
        type,
        notificationId: notification.id,
        targetUrl,
        category,
        ...actionButtons // Pass action buttons data to push notification payload
      }).catch(e => this.logger.error(`Failed to send push notification for ${notification.id}: ${e.message}`, e.stack));
      return notification;
    } catch (error) {
      this.logger.error(`Erro ao criar notificação para userId ${userId}: ${error.message}`, error.stack);
      Sentry.captureException(error); // NEW: Capture exception with Sentry
      throw error;
    }
  }

  /**
   * Retorna todas as notificações de um usuário.
   * @param userId ID do usuário.
   * @param includeRead Incluir notificações já lidas (padrão: false).
   * @returns Lista de notificações.
   */
  async getUserNotifications(userId: string, includeRead: boolean = false): Promise<Notification[]> {
    try {
      return this.prisma.notification.findMany({
        where: {
          userId,
          ...(includeRead ? {} : { isRead: false }),
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Erro ao buscar notificações para userId ${userId}: ${error.message}`, error.stack);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Marca notificações como lidas.
   * @param userId ID do usuário.
   * @param markAsReadDto DTO contendo os IDs das notificações a serem marcadas como lidas.
   * @returns Contagem de notificações atualizadas.
   */
  async markNotificationsAsRead(userId: string, markAsReadDto: MarkAsReadDto): Promise<{ count: number }> {
    try {
      if (markAsReadDto.notificationIds && markAsReadDto.notificationIds.length > 0) {
        const result = await this.prisma.notification.updateMany({
          where: {
            id: { in: markAsReadDto.notificationIds },
            userId: userId,
            isRead: false,
          },
          data: {
            isRead: true,
          },
        });
        return { count: result.count };
      } else {
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
    } catch (error) {
      this.logger.error(`Erro ao marcar notificações como lidas para userId ${userId}: ${error.message}`, error.stack);
      Sentry.captureException(error);
      throw error;
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

    try {
      return this.prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } catch (error) {
      this.logger.error(`Erro ao marcar notificação ${notificationId} como lida: ${error.message}`, error.stack);
      Sentry.captureException(error);
      throw error;
    }
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

    try {
      await this.prisma.notification.delete({
        where: { id: notificationId },
      });
    } catch (error) {
      this.logger.error(`Erro ao deletar notificação ${notificationId}: ${error.message}`, error.stack);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Fornece sugestões inteligentes baseadas em um contexto.
   * @param context O contexto para as sugestões (ex: 'booking_flow', 'service_quality', 'dispute').
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
      'dispute': [ // NEW: Suggestions for disputes
        'Mantenha a comunicação clara e objetiva.',
        'Anexe todas as evidências relevantes.',
        'Proponha uma solução justa para ambas as partes.'
      ]
    };

    return suggestions[context] || [];
  }

  /**
   * Executa uma ação rápida associada a uma notificação.
   * @param action O tipo de ação a ser executada (ex: 'accept_booking', 'respond_review', 'view_dispute').
   * @param data Dados adicionais necessários para a ação (ex: bookingId, reviewId, message, disputeId).
   * @returns Promessa que resolve quando a ação é concluída.
   */
  async executeQuickAction(action: string, data: any): Promise<void> {
    try {
      switch (action) {
        case 'accept_booking':
          await this.prisma.booking.update({
            where: { id: data.bookingId },
            data: { status: 'CONFIRMED' }
          });
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
        case 'view_dispute': // NEW: Quick action for disputes
          this.logger.log(`Ação Rápida: Visualizar disputa ${data.disputeId}.`);
          break;
        case 'view_dispute_message': // NEW: Quick action for dispute messages
          this.logger.log(`Ação Rápida: Visualizar mensagem na disputa ${data.disputeId}.`);
          break;
        case 'view_dispute_resolution': // NEW: Quick action for dispute resolution
          this.logger.log(`Ação Rápida: Visualizar resolução da disputa ${data.disputeId}.`);
          break;
        default:
          throw new BadRequestException(await this.i18n.translate('notification.badRequest.unknownAction', 'pt-BR', { action }));
      }
    } catch (error) {
      this.logger.error(`Erro ao executar ação rápida '${action}': ${error.message}`, error.stack);
      Sentry.captureException(error);
      throw error;
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
      Sentry.captureException(error); // NEW: Capture exception with Sentry
      throw new Error(`Falha ao enviar notificação push: ${error.message}`);
    }
  }

  /**
   * Registra/atualiza o token de push do dispositivo (FCM/Expo) para o usuário logado.
   * Único por usuário; sobrescreve o anterior.
   */
  async registerDeviceToken(userId: string, token: string): Promise<{ ok: true }>{
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Token inválido.');
    }
    try {
      // token é unique em User.fcmToken; se já estiver em outro user, move para este
      await this.prisma.user.update({ where: { id: userId }, data: { fcmToken: token } });
      return { ok: true };
    } catch (error: any) {
      // Se violar unique, limpa do outro usuário e aplica neste
      try {
        await this.prisma.user.updateMany({ where: { fcmToken: token, id: { not: userId } }, data: { fcmToken: null } });
        await this.prisma.user.update({ where: { id: userId }, data: { fcmToken: token } });
        return { ok: true };
      } catch (e) {
        this.logger.error(`registerDeviceToken: falha ao registrar token para ${userId}: ${e?.message}`);
        throw e;
      }
    }
  }
}
