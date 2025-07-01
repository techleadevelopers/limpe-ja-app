// src/notifications/notifications.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Notification } from '@prisma/client';
import { MarkAsReadDto } from './dto/mark-as-read.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria uma nova notificação.
   * @param userId ID do usuário que receberá a notificação.
   * @param type Tipo da notificação (e.g., BOOKING_CONFIRMED).
   * @param message Conteúdo da mensagem.
   * @param targetUrl URL de destino ao clicar na notificação (opcional).
   * @returns A notificação criada.
   */
  async createNotification(
    userId: string,
    type: string,
    message: string,
    targetUrl?: string,
  ): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        message,
        targetUrl,
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
      throw new NotFoundException('Notificação não encontrada ou você não tem permissão para acessá-la.');
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
      throw new NotFoundException('Notificação não encontrada ou você não tem permissão para excluí-la.');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }
}