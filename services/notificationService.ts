// LimpeJaApp/app/services/notificationService.ts
import axios, { AxiosResponse } from 'axios';
import api from './api'; // Importa a instância centralizada do Axios

// Importa as tipagens de notificações
import { MessageResponseDto } from '../types/backend/auth';
import { NotificationEntity } from '../types/backend/notifications'; // Certifique-se de que NotificationEntity está atualizado
import * as Sentry from '@sentry/react-native'; // NEW: Import Sentry (conceptual, requires setup)

// NEW: Define a interface para SmartNotification baseada em NotificationEntity
// SmartNotification agora estende NotificationEntity, que já inclui 'priority'
interface SmartNotification extends NotificationEntity {
  suggestions?: string[];
  quickActions?: Array<{
    label: string;
    action: string;
    style: 'primary' | 'secondary' | 'danger';
    data?: Record<string, any>; // NEW: Added data to quick actions
  }>;
}

export class NotificationService {
  // NEW: Método para exibir mensagens de erro centralizadas
  static notifyError(message: string, error?: any): void {
    console.error('Notification Error:', message, error);
    // Em um ambiente de produção, você usaria uma biblioteca de UI para mostrar um toast/snackbar
    // Ex: Toast.show({ type: 'error', text1: 'Erro', text2: message });
    // Para fins de demonstração, apenas logamos.
  }

  // Este método parece ser uma versão mais antiga ou para um endpoint diferente
  // Mantido conforme sua solicitação de não alterar o que já temos,
  // mas o 'index.tsx' buscará as funções exportadas no final do arquivo.
  static async getNotifications(): Promise<SmartNotification[]> {
    try {
      const response = await api.get('/notifications'); // Endpoint genérico, não /notifications/me
      return this.enhanceNotifications(response.data);
    } catch (error: any) {
      Sentry.captureException(error); // NEW: Capture exception
      NotificationService.notifyError('Erro ao buscar notificações genéricas.', error); // NEW: Centralized error handling
      throw error;
    }
  }

  static enhanceNotifications(notifications: NotificationEntity[]): SmartNotification[] {
    return notifications.map(notification => {
      const enhanced: SmartNotification = { ...notification }; // 'message' e 'targetUrl' já estão em 'notification'

      // Adicionar sugestões contextuais baseadas no tipo
      switch (notification.type) {
        case 'NEW_BOOKING':
          enhanced.quickActions = [
            { label: 'Aceitar', action: 'accept_booking', style: 'primary', data: { bookingId: notification.relatedId } },
            { label: 'Ver Detalhes', action: 'view_booking', style: 'secondary', data: { bookingId: notification.relatedId } }
          ];
          break;

        case 'PAYMENT_RECEIVED':
          // enhanced.suggestions serão buscadas do backend
          break;

        case 'REVIEW_RECEIVED':
          enhanced.quickActions = [
            { label: 'Responder', action: 'respond_review', style: 'primary', data: { reviewId: notification.relatedId } },
            { label: 'Ver Avaliação', action: 'view_review', style: 'secondary', data: { reviewId: notification.relatedId } }
          ];
          break;

        case 'LOW_RATING_ALERT':
          enhanced.priority = 'high'; // CORREÇÃO: 'priority' agora é uma propriedade válida
          // enhanced.suggestions serão buscadas do backend
          break;

        // NEW: QuickActions específicas para disputas
        case 'DISPUTE_CREATED':
        case 'DISPUTE_MESSAGE':
        case 'DISPUTE_MESSAGE_ADMIN':
          enhanced.quickActions = [
            { label: 'Ver Disputa', action: 'view_dispute', style: 'primary', data: { disputeId: notification.relatedId || notification.targetUrl?.split('/').pop() } }, // CORREÇÃO: 'targetUrl' agora é uma propriedade válida
            // { label: 'Responder', action: 'respond_dispute', style: 'secondary', data: { disputeId: notification.relatedId } } // Se houver endpoint para responder direto
          ];
          break;

        case 'DISPUTE_RESOLVED':
          enhanced.priority = 'medium'; // CORREÇÃO: 'priority' agora é uma propriedade válida
          enhanced.quickActions = [
            { label: 'Ver Resolução', action: 'view_dispute_resolution', style: 'primary', data: { disputeId: notification.relatedId || notification.targetUrl?.split('/').pop() } } // CORREÇÃO: 'targetUrl' agora é uma propriedade válida
          ];
          break;
      }

      // Se a notificação já tiver actionButtons do backend, eles podem sobrescrever ou complementar
      if (notification.actionButtons) {
        // Lógica para mesclar ou priorizar actionButtons do backend
        // Por simplicidade, vamos assumir que os do backend têm precedência ou são adicionados
        // Depende de como você quer que os `actionButtons` do backend interajam com os `quickActions` gerados no frontend.
        // Por exemplo, você pode converter `actionButtons` do backend para o formato `quickActions`
        // enhanced.quickActions = [...(enhanced.quickActions || []), ...this.convertBackendActionButtons(notification.actionButtons)];
      }

      return enhanced;
    });
  }

  // Este método parece ser uma versão mais antiga ou para um endpoint diferente
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
    } catch (error: any) {
      Sentry.captureException(error);
      NotificationService.notifyError('Erro ao marcar notificação como lida.', error);
      throw error;
    }
  }

  // Este método parece ser uma versão mais antiga ou para um endpoint diferente
  static async markAllAsRead(): Promise<void> {
    try {
      await api.patch('/notifications/mark-all-read');
    } catch (error: any) {
      Sentry.captureException(error);
      NotificationService.notifyError('Erro ao marcar todas notificações como lidas.', error);
      throw error;
    }
  }

  static async executeQuickAction(action: string, data?: any): Promise<void> {
    try {
      await api.post(`/notifications/quick-action/${action}`, data);
    } catch (error: any) {
      Sentry.captureException(error);
      NotificationService.notifyError(`Erro ao executar ação rápida "${action}".`, error);
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
      Sentry.captureException(error);
      NotificationService.notifyError(`Erro ao buscar sugestões inteligentes para o contexto "${context}".`, error);
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
      Sentry.captureException(error);
      NotificationService.notifyError('Erro ao buscar notificações.', error);
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
      const response: AxiosResponse<NotificationEntity> = await api.patch(`/notifications/${notificationId}/mark-as-read`, { readAt: new Date().toISOString() });
      return response.data;
    }
    catch (error: any) {
      Sentry.captureException(error);
      NotificationService.notifyError(`Erro ao marcar notificação ${notificationId} como lida.`, error);
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
      const response: AxiosResponse<MessageResponseDto | { count: number }> = await api.patch('/notifications/me/mark-as-read');
      return response.data;
    } catch (error: any) {
      Sentry.captureException(error);
      NotificationService.notifyError('Erro ao marcar todas as notificações como lidas.', error);
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
      Sentry.captureException(error);
      NotificationService.notifyError(`Erro ao deletar notificação ${notificationId}.`, error);
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
      Sentry.captureException(error);
      NotificationService.notifyError(`Erro ao enviar notificação push para o usuário ${userId}.`, error);
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