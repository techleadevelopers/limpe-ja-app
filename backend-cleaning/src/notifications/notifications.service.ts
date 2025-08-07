// src/notifications/notifications.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'; // Importe Logger
import { PrismaService } from '../prisma/prisma.service';
import { Notification } from '@prisma/client';
import { MarkAsReadDto } from './dto/mark-as-read.dto';

// Se você estiver usando Firebase Admin SDK, você precisaria importá-lo:
// import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name); // Instancia o logger

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
    title?: string, // Adicionado título para consistência com o push
  ): Promise<Notification> {
    // Você pode decidir se quer armazenar o título na notificação do banco de dados
    // ou se o título é apenas para a notificação push.
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        message,
        targetUrl,
        // title: title, // Descomente se quiser armazenar o título no banco de dados
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
        throw new BadRequestException(`Ação rápida desconhecida: ${action}`);
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
      // 1. RECUPERAR O TOKEN DO DISPOSITIVO DO USUÁRIO
      // Você precisa ter um campo no seu modelo de usuário (ou em um modelo relacionado)
      // que armazene o token de notificação push do dispositivo (ex: FCM token).
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          // Substitua 'fcmToken' pelo nome real do campo em seu modelo User
          // ou inclua a relação para o modelo de dispositivo se for o caso.
          fcmToken: true,
        },
      });

      if (!user || !user.fcmToken) {
        this.logger.warn(`Nenhum token de dispositivo (fcmToken) encontrado para o usuário ${userId}. Notificação push não enviada.`);
        return; // Não há token, então não há como enviar a notificação push.
      }

      const deviceToken = user.fcmToken;

      // 2. LÓGICA REAL DE ENVIO DA NOTIFICAÇÃO PUSH
      // Esta parte dependerá do provedor de notificações push que você está usando.
      // EXEMPLO CONCEITUAL COM FIREBASE ADMIN SDK:
      /*
      const message = {
        notification: {
          title: title,
          body: body,
        },
        data: {
          ...data, // Inclui quaisquer dados adicionais passados
          // Você pode adicionar dados específicos para o seu app aqui,
          // como 'bookingId', 'notificationType', etc.
        },
        token: deviceToken,
      };

      // Certifique-se de que o Firebase Admin SDK foi inicializado em seu aplicativo.
      await admin.messaging().send(message);
      this.logger.log(`Notificação push enviada com sucesso para o usuário ${userId} (token: ${deviceToken}).`);
      */

      // EXEMPLO PARA EXPO PUSH NOTIFICATIONS (se estiver usando Expo no frontend)
      /*
      // Você precisaria instalar o 'expo-server-sdk'
      // import { Expo } from 'expo-server-sdk';
      // const expo = new Expo();
      // const messages = [];
      // messages.push({
      //   to: deviceToken,
      //   sound: 'default',
      //   title: title,
      //   body: body,
      //   data: data,
      // });
      // const chunks = expo.chunkPushNotifications(messages);
      // for (let chunk of chunks) {
      //   await expo.sendPushNotificationsAsync(chunk);
      // }
      // this.logger.log(`Notificação push Expo enviada com sucesso para o usuário ${userId}.`);
      */

      // Por enquanto, apenas um log para simular o envio:
      this.logger.log(`[SIMULADO] Notificação push para ${userId} enviada: Título="${title}", Corpo="${body}", Dados=${JSON.stringify(data)}`);

    } catch (error) {
      this.logger.error(
        `Erro ao enviar notificação push para o usuário ${userId}: ${error.message}`,
        error.stack,
      );
      // Dependendo da sua necessidade, você pode relançar o erro ou tratá-lo silenciosamente.
      throw new Error(`Falha ao enviar notificação push: ${error.message}`);
    }
  }
}