// src/notifications/notifications.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Notification } from '@prisma/client';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { I18nService } from '../common/i18n/i18n.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import * as Sentry from '@sentry/node'; // NEW: Import Sentry (conceptual, requires setup)
import axios from 'axios';

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
    const {
      userId,
      type,
      message,
      targetUrl,
      title,
      imageUrl,
      actionButtons,
      category,
    } = dto; // NEW: Added category
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
        ...actionButtons, // Pass action buttons data to push notification payload
      }).catch((e) =>
        this.logger.error(
          `Failed to send push notification for ${notification.id}: ${e.message}`,
          e.stack,
        ),
      );
      return notification;
    } catch (error) {
      this.logger.error(
        `Erro ao criar notificação para userId ${userId}: ${error.message}`,
        error.stack,
      );
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
  async getUserNotifications(
    userId: string,
    includeRead: boolean = false,
  ): Promise<Notification[]> {
    try {
      return this.prisma.notification.findMany({
        where: {
          userId,
          ...(includeRead ? {} : { isRead: false }),
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao buscar notificações para userId ${userId}: ${error.message}`,
        error.stack,
      );
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
  async markNotificationsAsRead(
    userId: string,
    markAsReadDto: MarkAsReadDto,
  ): Promise<{ count: number }> {
    try {
      if (
        markAsReadDto.notificationIds &&
        markAsReadDto.notificationIds.length > 0
      ) {
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
      this.logger.error(
        `Erro ao marcar notificações como lidas para userId ${userId}: ${error.message}`,
        error.stack,
      );
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
  async markNotificationByIdAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(
        await this.i18n.translate('notification.notFound'),
      );
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
      this.logger.error(
        `Erro ao marcar notificação ${notificationId} como lida: ${error.message}`,
        error.stack,
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Deleta uma notificação.
   * @param notificationId ID da notificação.
   * @param userId ID do usuário (para validação de propriedade).
   */
  /**
   * Envia uma notifica��o push para um usu�rio (FCM legado se dispon�vel; fallback simulado).
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    this.logger.log(
      `Iniciando envio de notifica��o push para userId: ${userId}`,
    );
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });
      if (!user?.fcmToken) {
        this.logger.warn(`Sem fcmToken para ${userId}`);
        return;
      }
      const token = user.fcmToken;
      const serverKey = process.env.FCM_SERVER_KEY;
      if (serverKey) {
        try {
          await axios.post(
            'https://fcm.googleapis.com/fcm/send',
            {
              to: token,
              notification: { title, body },
              data: { ...(data || {}) },
              android: {
                notification: {
                  channel_id: (data as any)?.channelId || 'high-priority',
                  priority: (data as any)?.priority || 'high',
                },
              },
            },
            {
              headers: {
                Authorization: `key=${serverKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 5000,
            },
          );
          this.logger.log(`Push FCM enviado para ${userId}.`);
          return;
        } catch (e: any) {
          this.logger.warn(
            `Falha FCM ${userId}: ${e?.response?.status} ${e?.response?.data || e?.message}`,
          );
        }
      }
      this.logger.log(
        `[SIMULADO] Push para ${userId}: ${title} | ${body} | ${JSON.stringify(data)}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Erro ao enviar push para ${userId}: ${error?.message}`,
        error?.stack,
      );
      throw new Error(`Falha ao enviar notifica��o push: ${error?.message}`);
    }
  }

  /**
   * Deleta uma notifica��o (valida propriedade do usu�rio).
   */
  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(
        await this.i18n.translate('notification.notFound'),
      );
    }
    await this.prisma.notification.delete({ where: { id: notificationId } });
  }
  /**
   * Provides smart suggestions based on context.
   */
  async getSmartSuggestions(context: string): Promise<string[]> {
    const suggestions: Record<string, string[]> = {
      booking_flow: [
        'Responda em ate 30 minutos para melhor ranking',
        'Seja cordial e profissional na primeira impressao',
        'Confirme todos os detalhes antes de aceitar',
      ],
      service_quality: [
        'Chegue sempre 5 minutos antes do horario',
        'Traga materiais extras para imprevistos',
        'Tire fotos antes/depois para mostrar qualidade',
      ],
      customer_retention: [
        'Ofereca agendamentos recorrentes com desconto',
        'Envie lembretes de manutencao preventiva',
        'Mantenha contato pos-servico para feedback',
      ],
      dispute: [
        'Mantenha a comunicacao clara e objetiva.',
        'Anexe todas as evidencias relevantes.',
        'Proponha uma solucao justa para ambas as partes.',
      ],
    };
    return suggestions[context] || [];
  }

  /**
   * Executes a quick action tied to a notification.
   */
  async executeQuickAction(action: string, data: any): Promise<void> {
    try {
      switch (action) {
        case 'accept_booking':
          await this.prisma.booking.update({
            where: { id: data.bookingId },
            data: { status: 'CONFIRMED' },
          });
          this.logger.log(`QuickAction: booking ${data.bookingId} accepted.`);
          break;
        case 'view_booking':
          this.logger.log(`QuickAction: view booking ${data.bookingId}.`);
          break;
        case 'respond_review':
          this.logger.log(
            `QuickAction: respond review ${data.reviewId} with: "${data.responseContent}".`,
          );
          break;
        case 'view_review':
          this.logger.log(`QuickAction: view review ${data.reviewId}.`);
          break;
        case 'view_dispute':
          this.logger.log(`QuickAction: view dispute ${data.disputeId}.`);
          break;
        case 'view_dispute_message':
          this.logger.log(
            `QuickAction: view message in dispute ${data.disputeId}.`,
          );
          break;
        case 'view_dispute_resolution':
          this.logger.log(
            `QuickAction: view dispute resolution ${data.disputeId}.`,
          );
          break;
        default:
          throw new BadRequestException(
            await this.i18n.translate(
              'notification.badRequest.unknownAction',
              'pt-BR',
              { action },
            ),
          );
      }
    } catch (error) {
      this.logger.error(
        `QuickAction error '${action}': ${error.message}`,
        error.stack,
      );
      Sentry.captureException(error);
      throw error;
    }
  }
  async registerDeviceToken(
    userId: string,
    token: string,
  ): Promise<{ ok: true }> {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Token inválido.');
    }
    try {
      // token é unique em User.fcmToken; se já estiver em outro user, move para este
      await this.prisma.user.update({
        where: { id: userId },
        data: { fcmToken: token },
      });
      return { ok: true };
    } catch (error: any) {
      // Se violar unique, limpa do outro usuário e aplica neste
      try {
        await this.prisma.user.updateMany({
          where: { fcmToken: token, id: { not: userId } },
          data: { fcmToken: null },
        });
        await this.prisma.user.update({
          where: { id: userId },
          data: { fcmToken: token },
        });
        return { ok: true };
      } catch (e) {
        this.logger.error(
          `registerDeviceToken: falha ao registrar token para ${userId}: ${e?.message}`,
        );
        throw e;
      }
    }
  }
}
