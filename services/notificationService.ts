// LimpeJaApp/app/services/notificationService.ts
import axios, { AxiosResponse } from 'axios'; // Importar axios para isAxiosError
import api from './api'; // Importa a instância centralizada do Axios

// Importa as tipagens de notificações
import { MessageResponseDto } from '../types/backend/auth'; // Para respostas de sucesso/erro genéricas
import { NotificationEntity } from '../types/backend/notifications'; // Certifique-se de que NotificationEntity está atualizado

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
  imageUrl?: string | null;
  actionButtons?: any;
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
  // Este método parece ser uma versão mais antiga ou para um endpoint diferente
  // Mantido conforme sua solicitação de não alterar o que já temos,
  // mas o 'index.tsx' buscará as funções exportadas no final do arquivo.
  static async getNotifications(): Promise<SmartNotification[]> {
    try {
      const response = await api.get('/notifications'); // Endpoint genérico, não /notifications/me
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
      // A lógica de sugestões será movida para o backend, mas a estrutura de quickActions permanece aqui
      switch (notification.type) {
        case 'NEW_BOOKING':
          // enhanced.suggestions serão buscadas do backend
          enhanced.quickActions = [
            { label: 'Aceitar', action: 'accept_booking', style: 'primary' },
            { label: 'Ver Detalhes', action: 'view_booking', style: 'secondary' }
          ];
          break;

        case 'PAYMENT_RECEIVED':
          // enhanced.suggestions serão buscadas do backend
          break;

        case 'REVIEW_RECEIVED':
          // enhanced.suggestions serão buscadas do backend
          enhanced.quickActions = [
            { label: 'Responder', action: 'respond_review', style: 'primary' },
            { label: 'Ver Avaliação', action: 'view_review', style: 'secondary' }
          ];
          break;

        case 'LOW_RATING_ALERT':
          enhanced.priority = 'high';
          // enhanced.suggestions serão buscadas do backend
          break;
      }

      return enhanced;
    });
  }

  // Este método parece ser uma versão mais antiga ou para um endpoint diferente
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  // Este método parece ser uma versão mais antiga ou para um endpoint diferente
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
      // Esta chamada já aponta para o backend, agora o backend terá a lógica completa
      await api.post(`/notifications/quick-action/${action}`, data);
    } catch (error) {
      console.error('Erro ao executar ação rápida:', error);
      throw error;
    }
  }

  /**
   * @function getSmartSuggestions
   * Busca sugestões inteligentes do backend.
   * Corresponde a `GET /notifications/suggestions?context=<context>`.
   * @param context O contexto para as sugestões.
   * @returns Promessa com um array de strings com sugestões.
   */
  static async getSmartSuggestions(context: string): Promise<string[]> {
    try {
      const response: AxiosResponse<string[]> = await api.get(`/notifications/suggestions`, { params: { context } });
      return response.data;
    } catch (error: any) {
      console.error(`Erro ao buscar sugestões inteligentes para o contexto ${context}:`, error.response?.data || error.message);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || `Erro ao buscar sugestões inteligentes.`);
      }
      throw new Error('Erro de rede ou servidor ao buscar sugestões inteligentes.');
    }
  }

  /**
   * @function getNotificationsMe
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
   * @function markNotificationAsReadMe
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
    }
    catch (error: any) {
      console.error(`Erro ao marcar notificação ${notificationId} como lida:`, error.response?.data || error.message);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || `Erro ao marcar notificação ${notificationId} como lida.`);
      }
      throw new Error(`Erro de rede ou servidor ao marcar notificação ${notificationId} como lida.`);
    }
  };

  /**
   * @function markAllNotificationsAsReadMe
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

  /**
   * @function sendPushNotification
   * Envia uma notificação push para um usuário específico.
   * Corresponde a `POST /notifications/send-push`.
   * @param userId O ID do usuário para quem enviar a notificação.
   * @param title O título da notificação push.
   * @param body O corpo da mensagem da notificação push.
   * @param data Dados adicionais para a notificação (opcional).
   * @returns Promessa que resolve quando a notificação é enviada.
   */
  static async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await api.post('/notifications/send-push', { userId, title, body, data });
      console.log(`Notificação push enviada para o usuário ${userId}`);
    } catch (error: any) {
      console.error(`Erro ao enviar notificação push para o usuário ${userId}:`, error.response?.data || error.message);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || `Erro ao enviar notificação push.`);
      }
      throw new Error('Erro de rede ou servidor ao enviar notificação push.');
    }
  }
}

// Exportações nomeadas para compatibilidade com o arquivo index.tsx
// Estas exportações apontam para os métodos estáticos da classe NotificationService.
export const getNotifications = NotificationService.getNotificationsMe;
export const markNotificationAsRead = NotificationService.markNotificationAsReadMe;
export const markAllNotificationsAsRead = NotificationService.markAllNotificationsAsReadMe;