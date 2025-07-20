// LimpeJaApp/app/services/chatService.ts
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
 * Simula a busca da lista de conversas para um usuário (cliente ou provedor).
 * Em um cenário real, este endpoint seria implementado no backend.
 * @param userId ID do usuário logado.
 * @returns Promessa com um array de ConversationItem.
 */
export const getChatListForUser = async (userId: string): Promise<ConversationItem[]> => {
  console.log(`[chatService] Simulação: Buscando lista de chats para o usuário ${userId}`);
  // TODO: Substituir por uma chamada real ao backend: await api.get(`/chat/list/${userId}`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simula delay de rede

  // Dados mockados para demonstração
  const mockConversations: ConversationItem[] = [
    {
      id: 'chat_mock_1',
      otherUserId: 'prov_abc_1', // Se o userId for cliente, este é o provedor. Se for provedor, este é o cliente.
      otherUserName: 'Dr. Limpeza (Provedor)',
      otherUserAvatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
      lastMessage: 'Sua limpeza foi agendada para amanhã!',
      lastMessageTimestamp: new Date(Date.now() - 300000).toISOString(),
      unreadCount: 1,
    },
    {
      id: 'chat_mock_2',
      otherUserId: 'client_xyz_2',
      otherUserName: 'Dona Maria (Cliente)',
      otherUserAvatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
      lastMessage: 'Obrigado pelo ótimo serviço!',
      lastMessageTimestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      unreadCount: 0,
    },
    {
      id: 'chat_mock_3',
      otherUserId: 'prov_def_3',
      otherUserName: 'Clean Express (Provedor)',
      otherUserAvatarUrl: 'https://randomuser.me/api/portraits/men/50.jpg',
      lastMessage: 'Por favor, confirme o endereço.',
      lastMessageTimestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
      unreadCount: 2,
    },
    {
      id: 'chat_mock_4',
      otherUserId: 'client_pqr_4',
      otherUserName: 'Sr. João (Cliente)',
      otherUserAvatarUrl: 'https://randomuser.me/api/portraits/men/60.jpg',
      lastMessage: 'Até a próxima!',
      lastMessageTimestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
      unreadCount: 0,
    },
  ];

  // Ordena por timestamp, mais recente primeiro
  const sortedConversations = mockConversations.sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());

  return sortedConversations;
};