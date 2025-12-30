// src/notifications/notifications.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Notification } from '@prisma/client';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { I18nService } from '../common/i18n/i18n.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import * as Sentry from '@sentry/node'; // NEW: Import Sentry (conceptual, requires setup)
import type { SeverityLevel } from '@sentry/core';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly dedupeWindowSeconds: number;
  private readonly defaultAppEventTtl: number;

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
    private prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
  ) {
    this.dedupeWindowSeconds =
      this.configService.get<number>(
        'notifications.dedupeWindowSeconds',
        180,
      );
    this.defaultAppEventTtl =
      this.configService.get<number>('notifications.defaultTtlSeconds', 300);
  }

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
      idempotencyKey,
      scheduledAt,
    } = dto;
    if (idempotencyKey) {
      const existing = await this.prisma.notification.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return existing;
      }
    }

    const dedupeKey = dto.dedupeKey ?? this.buildDedupeKey(dto);
    const ttlSeconds = dto.ttlSeconds ?? this.defaultAppEventTtl;

    if (dedupeKey) {
      const since = new Date(Date.now() - this.dedupeWindowSeconds * 1000);
      const duplicate = await this.prisma.notification.findFirst({
        where: {
          userId,
          dedupeKey,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (duplicate) {
        return duplicate;
      }
    }
    const scheduledAtDate = scheduledAt ? new Date(scheduledAt) : undefined;
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
          category,
          idempotencyKey,
          scheduledAt: scheduledAtDate,
          isRead: false,
          dedupeKey,
          payload: (dto.payload as any) ?? null,
          ttlSeconds,
          },
        });
      const appEvent = this.toAppEvent(notification);
      // Optionally, send push notification immediately after creating DB entry
      this.sendPushNotification(userId, title || message, message, {
        type,
        notificationId: notification.id,
        targetUrl,
        category,
        idempotencyKey,
        dedupeKey,
        ttlSeconds,
        payload: (dto.payload as any) ?? null,
        appEvent,
        ...actionButtons, // Pass action buttons data to push notification payload
      }).catch((e) =>
        this.logger.error(
          `Failed to send push notification for ${notification.id}: ${this.formatError(
            e,
          )}`,
          e instanceof Error ? e.stack : undefined,
        ),
      );
      return notification;
    } catch (error) {
      this.logger.error(
        `Erro ao criar notificação para userId ${userId}: ${this.formatError(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      Sentry.captureException(error); // NEW: Capture exception with Sentry
      throw error;
    }
  }

  private toAppEvent(notification: Notification) {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      targetUrl: notification.targetUrl,
      category: notification.category,
      actionButtons: notification.actionButtons,
      imageUrl: notification.imageUrl,
      dedupeKey: notification.dedupeKey ?? undefined,
      payload: notification.payload ?? undefined,
      ttlSeconds: notification.ttlSeconds ?? undefined,
      createdAt: notification.createdAt,
      readAt: notification.readAt ?? undefined,
      acknowledgedAt: notification.acknowledgedAt ?? undefined,
    };
  }

  private buildDedupeKey(dto: CreateNotificationDto): string | null {
    if (!dto.type || !dto.userId) {
      return null;
    }
    const reference =
      dto.relatedId ?? this.extractReferenceFromPayload(dto.payload);
    if (!reference) {
      return null;
    }
    return `${dto.type}:${reference}:${dto.userId}`;
  }

  private extractReferenceFromPayload(
    payload?: Record<string, unknown>,
  ): string | undefined {
    if (!payload) {
      return undefined;
    }
    const candidates = [
      'bookingId',
      'booking_id',
      'referenceId',
      'id',
      'targetId',
      'userId',
    ];
    for (const key of candidates) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return undefined;
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
        `Erro ao buscar notificações para userId ${userId}: ${this.formatError(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  async getUserNotificationStream(
    userId: string,
    since?: Date,
    limit = 200,
  ): Promise<Notification[]> {
    const where: any = { userId };
    if (since) {
      where.createdAt = { gt: since };
    }
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async ackNotification(
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

    if (notification.acknowledgedAt) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: notification.readAt ?? new Date(),
        acknowledgedAt: new Date(),
      },
    });
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
          readAt: new Date(),
          acknowledgedAt: new Date(),
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
          readAt: new Date(),
          acknowledgedAt: new Date(),
        },
        });
        return { count: result.count };
      }
    } catch (error) {
      this.logger.error(
        `Erro ao marcar notificações como lidas para userId ${userId}: ${this.formatError(error)}`,
        error instanceof Error ? error.stack : undefined,
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
        data: {
          isRead: true,
          readAt: new Date(),
          acknowledgedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao marcar notificação ${notificationId} como lida: ${this.formatError(error)}`,
        error instanceof Error ? error.stack : undefined,
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
    data?: Record<string, unknown>,
  ): Promise<void> {
    this.logger.log(
      `Iniciando envio de notificação push para userId: ${userId}`,
    );
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });
    if (!user?.fcmToken) {
      this.logger.warn(`Sem fcmToken para ${userId}; push será simulado com notif DB.`);
      Sentry.addBreadcrumb({
        message: 'Token ausente ao enviar push',
        data: { userId, hasToken: false },
        level: 'warning' as SeverityLevel,
      });
      return;
    }
      const token = user.fcmToken;
      const serverKey = process.env.FCM_SERVER_KEY;
      const getStringField = (key: string, fallback: string) => {
        const value = data?.[key];
        return typeof value === 'string' ? value : fallback;
      };
      const isAxiosError = (
        val: unknown,
      ): val is { response?: { status?: number; data?: unknown } } =>
        typeof val === 'object' && val !== null && 'response' in val;
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
                  channel_id: getStringField('channelId', 'high-priority'),
                  priority: getStringField('priority', 'high'),
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
        } catch (e: unknown) {
          const status =
            isAxiosError(e) && typeof e.response?.status === 'number'
              ? e.response.status
              : 'unknown';
          const payload =
            isAxiosError(e) && e.response?.data !== undefined
              ? e.response.data
              : this.formatError(e);
          const payloadStr =
            typeof payload === 'string' ? payload : JSON.stringify(payload);
          this.logger.warn(`Falha FCM ${userId}: ${status} ${payloadStr}`);
        }
      }
      this.logger.log(
        `[SIMULADO] Push para ${userId}: ${title} | ${body} | ${JSON.stringify(data)}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao enviar push para ${userId}: ${this.formatError(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(
        `Falha ao enviar notificação push: ${this.formatError(error)}`,
      );
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
  getSmartSuggestions(context: string): string[] {
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
  async executeQuickAction(
    action: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const getString = (key: string): string | undefined => {
      const value = data?.[key];
      return typeof value === 'string' ? value : undefined;
    };
    try {
      switch (action) {
        case 'accept_booking': {
          const bookingId = getString('bookingId');
          if (!bookingId) {
            throw new BadRequestException('bookingId ? obrigat?rio.');
          }
          await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CONFIRMED' },
          });
          this.logger.log(`QuickAction: booking ${bookingId} accepted.`);
          break;
        }
        case 'view_booking': {
          const bookingId = getString('bookingId');
          this.logger.log(`QuickAction: view booking ${bookingId}.`);
          break;
        }
        case 'respond_review': {
          this.logger.log(
            `QuickAction: respond review ${getString('reviewId')} with: "${getString('responseContent')}".`,
          );
          break;
        }
        case 'view_review': {
          this.logger.log(`QuickAction: view review ${getString('reviewId')}.`);
          break;
        }
        case 'view_dispute': {
          const disputeId = getString('disputeId');
          this.logger.log(`QuickAction: view dispute ${disputeId}.`);
          break;
        }
        case 'view_dispute_message': {
          const disputeId = getString('disputeId');
          this.logger.log(`QuickAction: view message in dispute ${disputeId}.`);
          break;
        }
        case 'view_dispute_resolution': {
          const disputeId = getString('disputeId');
          this.logger.log(`QuickAction: view dispute resolution ${disputeId}.`);
          break;
        }
        default: {
          throw new BadRequestException(
            await this.i18n.translate(
              'notification.badRequest.unknownAction',
              'pt-BR',
              { action },
            ),
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `QuickAction error '${action}': ${this.formatError(error)}`,
        error instanceof Error ? error.stack : undefined,
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
    } catch (error: unknown) {
      this.logger.warn(
        `registerDeviceToken: tentativa inicial falhou para ${userId}: ${this.formatError(
          error,
        )}`,
      );
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
          `registerDeviceToken: falha ao registrar token para ${userId}: ${this.formatError(
            e,
          )}`,
        );
        throw e;
      }
    }
  }

  async unregisterDeviceToken(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { fcmToken: null },
      });
    } catch (error: unknown) {
      this.logger.warn(
        `unregisterDeviceToken(${userId}) falhou: ${this.formatError(error)}`,
      );
    }
  }
}
