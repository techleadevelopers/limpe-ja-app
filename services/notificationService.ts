// LimpeJaApp/app/services/notificationService.ts
import axios, { AxiosResponse } from 'axios'; // Importar axios para isAxiosError
import api from './api'; // Importa a instância centralizada do Axios

// Importa as tipagens de notificações
import { MessageResponseDto } from '../types/backend/auth'; // Para respostas de sucesso/erro genéricas
import { NotificationEntity } from '../types/backend/notifications';

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  targetUrl?: string;
  createdAt: string;
  priority?: 'high' | 'medium' | 'low';
  actionable?: boolean;
  category?: 'booking' | 'payment' | 'review' | 'system' | 'suggestion';
}

interface SmartNotification extends Notification {
  suggestions?: string[];
  quickActions?: Array<{
    label: string;
    action: string;
    style: 'primary' | 'secondary' | 'danger';
  }>;
}

export class NotificationService {
  static async getNotifications(): Promise<SmartNotification[]> {
    try {
      const response = await api.get('/notifications');
      return this.enhanceNotifications(response.data);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      throw error;
    }
  }

  static enhanceNotifications(notifications: Notification[]): SmartNotification[] {
    return notifications.map(notification => {
      const enhanced: SmartNotification = { ...notification };

      // Adicionar sugestões contextuais baseadas no tipo
      switch (notification.type) {
        case 'NEW_BOOKING':
          enhanced.suggestions = [
            'Confirme rapidamente para melhorar sua classificação',
            'Verifique se tem todos os materiais necessários',
            'Envie uma mensagem de boas-vindas ao cliente'
          ];
          enhanced.quickActions = [
            { label: 'Aceitar', action: 'accept_booking', style: 'primary' },
            { label: 'Ver Detalhes', action: 'view_booking', style: 'secondary' }
          ];
          break;

        case 'PAYMENT_RECEIVED':
          enhanced.suggestions = [
            'Pagamento confirmado! Prepare-se para o serviço',
            'Revise os detalhes do agendamento uma última vez'
          ];
          break;

        case 'REVIEW_RECEIVED':
          enhanced.suggestions = [
            'Responda ao feedback para mostrar profissionalismo',
            'Use este feedback para melhorar seus serviços'
          ];
          enhanced.quickActions = [
            { label: 'Responder', action: 'respond_review', style: 'primary' },
            { label: 'Ver Avaliação', action: 'view_review', style: 'secondary' }
          ];
          break;

        case 'LOW_RATING_ALERT':
          enhanced.priority = 'high';
          enhanced.suggestions = [
            'Entre em contato com o cliente para resolver problemas',
            'Ofereça um desconto na próxima limpeza',
            'Revise seus processos de qualidade'
          ];
          break;
      }

      return enhanced;
    });
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  static async markAllAsRead(): Promise<void> {
    try {
      await api.patch('/notifications/mark-all-read');
    } catch (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
      throw error;
    }
  }

  static async executeQuickAction(action: string, data?: any): Promise<void> {
    try {
      await api.post(`/notifications/quick-action/${action}`, data);
    } catch (error) {
      console.error('Erro ao executar ação rápida:', error);
      throw error;
    }
  }

  static async getSmartSuggestions(context: string): Promise<string[]> {
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
      ]
    };

    return suggestions[context] || [];
  }

  /**
 * @function getNotifications
 * Busca a lista de notificações para o usuário logado.
 * Corresponde a `GET /notifications/me`.
 * @returns Promessa com um array de NotificationEntity.
 */
  static getNotificationsMe = async (): Promise<NotificationEntity[]> => {
    try {
      const response: AxiosResponse<NotificationEntity[]> = await api.get('/notifications/me');
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar notificações:', error.response?.data || error.message);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Erro ao buscar notificações.');
      }
      throw new Error('Erro de rede ou servidor ao buscar notificações.');
    }
  };

  /**
   * @function markNotificationAsRead
   * Marca uma notificação específica como lida.
   * Corresponde a `PATCH /notifications/:id/mark-as-read`.
   * @param notificationId O ID da notificação a ser marcada como lida.
   * @returns Promessa com a NotificationEntity atualizada.
   */
  static markNotificationAsReadMe = async (notificationId: string): Promise<NotificationEntity> => {
    try {
      // Assumimos que o backend espera um PATCH vazio ou um { readAt: new Date().toISOString() }
      // A estrutura exata do corpo da requisição depende da implementação do seu backend.
      const response: AxiosResponse<NotificationEntity> = await api.patch(`/notifications/${notificationId}/mark-as-read`, { readAt: new Date().toISOString() });
      return response.data;
    } catch (error: any) {
      console.error(`Erro ao marcar notificação ${notificationId} como lida:`, error.response?.data || error.message);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || `Erro ao marcar notificação ${notificationId} como lida.`);
      }
      throw new Error(`Erro de rede ou servidor ao marcar notificação ${notificationId} como lida.`);
    }
  };

  /**
   * @function markAllNotificationsAsRead
   * Marca todas as notificações do usuário logado como lidas.
   * Corresponde a `PATCH /notifications/me/mark-as-read`.
   * @returns Promessa com uma mensagem de resposta ou um objeto de contagem.
   */
  static markAllNotificationsAsReadMe = async (): Promise<MessageResponseDto | { count: number }> => {
    try {
      // O backend pode retornar uma mensagem de sucesso ou um objeto com a contagem de notificações atualizadas.
      const response: AxiosResponse<MessageResponseDto | { count: number }> = await api.patch('/notifications/me/mark-as-read');
      return response.data;
    } catch (error: any) {
      console.error('Erro ao marcar todas as notificações como lidas:', error.response?.data || error.message);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Erro ao marcar todas as notificações como lidas.');
      }
      throw new Error('Erro de rede ou servidor ao marcar todas as notificações como lidas.');
    }
  };

  /**
   * @function deleteNotification
   * Deleta uma notificação específica.
   * Corresponde a `DELETE /notifications/:id`.
   * @param notificationId O ID da notificação a ser deletada.
   * @returns Promessa que resolve quando a operação é concluída (void).
   */
  static deleteNotificationMe = async (notificationId: string): Promise<void> => {
    try {
      await api.delete(`/notifications/${notificationId}`);
    } catch (error: any) {
      console.error(`Erro ao deletar notificação ${notificationId}:`, error.response?.data || error.message);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || `Erro ao deletar notificação ${notificationId}.`);
      }
      throw new Error(`Erro de rede ou servidor ao deletar notificação ${notificationId}.`);
    }
  };
}