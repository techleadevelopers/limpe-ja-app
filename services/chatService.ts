import axios, { AxiosResponse } from 'axios';
import api from './api';

// Importar DTOs e tipos de chat
import { ChatDetails, GetMessagesQuery, Message, SendMessageDto } from '../types/backend/chat';

// Interface para um item de conversa (para o frontend)
export interface ConversationItem {
  id: string; // Este é o seu chatId
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}

/**
 * @function findOrCreateChat
 * Encontra um chat existente ou cria um novo entre um provedor e um cliente.
 * Corresponde a `GET /chat/find-or-create/provider/:providerId/client/:clientId`.
 * @param providerId ID do provedor.
 * @param clientId ID do cliente.
 * @returns Promessa com os detalhes do chat (ChatDetails).
 */
export const findOrCreateChat = async (providerId: string, clientId: string): Promise<ChatDetails> => {
  try {
    const response: AxiosResponse<ChatDetails> = await api.get(`/chat/find-or-create/provider/${providerId}/client/${clientId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao encontrar ou criar chat entre provedor ${providerId} e cliente ${clientId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao encontrar ou criar chat.`);
    }
    throw new Error('Erro de rede ou servidor ao encontrar ou criar chat.');
  }
};

/**
 * @function getChatMessages
 * Busca o histórico de mensagens para um chat específico.
 * Corresponde a `GET /chat/:chatId/messages`.
 * @param chatId ID do chat.
 * @param query Parâmetros de query para paginação (offset, limit).
 * @returns Promessa com um array de mensagens.
 */
export const getChatMessages = async (chatId: string, query?: GetMessagesQuery): Promise<Message[]> => {
  try {
    const response: AxiosResponse<Message[]> = await api.get<Message[]>(`/chat/${chatId}/messages`, { params: query });
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar mensagens do chat ${chatId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao buscar mensagens do chat ${chatId}.`);
    }
    throw new Error('Erro de rede ou servidor ao buscar mensagens do chat.');
  }
};

/**
 * @function sendMessage
 * Envia uma nova mensagem para um chat.
 * Corresponde a `POST /chat/:chatId/messages`.
 * @param messageData DTO com os dados da mensagem a ser enviada.
 * @returns Promessa com a mensagem enviada.
 */
export const sendMessage = async (messageData: SendMessageDto): Promise<Message> => {
  try {
    const { chatId, ...dataToSend } = messageData;
    const response: AxiosResponse<Message> = await api.post<Message>(`/chat/${chatId}/messages`, dataToSend);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao enviar mensagem para o chat ${messageData.chatId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao enviar mensagem.');
    }
    throw new Error('Erro de rede ou servidor ao enviar mensagem.');
  }
};

/**
 * @function getChatListForUser
 * Busca a lista de conversas para um usuário (cliente ou provedor).
 *
 * NOTA: A documentação do backend atual não especifica um endpoint para listar *todas* as conversas de um usuário.
 * Para que esta função seja real, um endpoint como `GET /chat/me/conversations` ou `GET /chat/list`
 * precisaria ser implementado no backend, retornando um array de `ConversationItem` ou um formato similar.
 *
 * @param userId ID do usuário logado.
 * @returns Promessa com um array de ConversationItem.
 */
export const getChatListForUser = async (userId: string): Promise<ConversationItem[]> => {
  console.log(`[chatService] Tentando buscar lista de chats para o usuário ${userId} do backend.`);
  try {
    // await new Promise(resolve => setTimeout(resolve, 500)); // Simula delay de rede
    const response: AxiosResponse<ConversationItem[]> = await api.get(`/chat/me/conversations`); // <-- AQUI: Endpoint hipotético
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar lista de chats para o usuário ${userId}:`, error.response?.data || error.message);
    // Retorne um array vazio ou lance um erro, dependendo do comportamento desejado
    // Em produção, você não deveria retornar dados mockados em caso de erro real.
    throw new Error(error.response?.data?.message || 'Não foi possível carregar a lista de conversas. Verifique a implementação do endpoint no backend.');
  }
};