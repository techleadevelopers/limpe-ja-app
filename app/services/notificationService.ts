// LimpeJaApp/app/services/notificationService.ts
import api from './api'; // Importa a instância centralizada do Axios
import axios, { AxiosResponse, AxiosError } from 'axios'; // Importar axios para isAxiosError

// Importa as tipagens de notificações
import { NotificationEntity, MarkAsReadDto } from '../types/backend/notifications';
import { MessageResponseDto } from '../types/backend/auth'; // Para respostas de sucesso/erro genéricas

/**
 * @function getNotifications
 * Busca a lista de notificações para o usuário logado.
 * Corresponde a `GET /notifications/me`.
 * @returns Promessa com um array de NotificationEntity.
 */
export const getNotifications = async (): Promise<NotificationEntity[]> => {
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
export const markNotificationAsRead = async (notificationId: string): Promise<NotificationEntity> => {
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
export const markAllNotificationsAsRead = async (): Promise<MessageResponseDto | { count: number }> => {
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
export const deleteNotification = async (notificationId: string): Promise<void> => {
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