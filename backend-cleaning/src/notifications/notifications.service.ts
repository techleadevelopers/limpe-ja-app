// src/notifications/notifications.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  /**
   * Fornece sugestões inteligentes baseadas em um contexto.
   * @param context O contexto para as sugestões (ex: 'booking_flow', 'service_quality').
   * @returns Um array de strings com sugestões.
   */
  async getSmartSuggestions(context: string): Promise<string[]> {
    // Estas sugestões podem vir de um banco de dados, um serviço de IA, ou um arquivo de configuração.
    // Por simplicidade, mantemos o mock aqui, mas agora no backend.
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
      // Adicione mais contextos e sugestões conforme necessário
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
        // Lógica para aceitar um agendamento
        // Ex: await this.bookingService.acceptBooking(data.bookingId);
        this.prisma.booking.update({ // Exemplo de atualização de booking
          where: { id: data.bookingId },
          data: { status: 'CONFIRMED' }
        }).catch(e => console.error(`Erro ao aceitar agendamento ${data.bookingId}:`, e));
        console.log(`Ação Rápida: Agendamento ${data.bookingId} aceito.`);
        break;
      case 'view_booking':
        // Lógica para visualizar detalhes do agendamento (geralmente redirecionamento no frontend, mas pode ter logging ou validação aqui)
        console.log(`Ação Rápida: Visualizar agendamento ${data.bookingId}.`);
        break;
      case 'respond_review':
        // Lógica para responder a uma avaliação
        // Ex: await this.reviewService.respondToReview(data.reviewId, data.responseContent);
        console.log(`Ação Rápida: Respondendo à avaliação ${data.reviewId} com conteúdo: "${data.responseContent}".`);
        break;
      case 'view_review':
        // Lógica para visualizar avaliação
        console.log(`Ação Rápida: Visualizar avaliação ${data.reviewId}.`);
        break;
      // Adicione outros casos de ações rápidas conforme necessário
      default:
        throw new BadRequestException(`Ação rápida desconhecida: ${action}`);
    }
    // Em um cenário real, você pode querer notificar o usuário da conclusão da ação
    // ou emitir um evento WebSocket.
  }
}