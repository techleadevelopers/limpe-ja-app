// LimpeJaApp/app/services/chatService.ts
import { api } from './api'; // Importa a instância centralizada do Axios
import { createLocalConsole } from './logging';
const console = createLocalConsole();

// Importa as tipagens necessárias do seu diretório de tipos de backend
import {
  ChatDetails,
  GetMessagesQuery,
  Message,
  SendMessageDto,
  // ChatSummary, // Se ChatSummary for usado para a lista de conversas, importe aqui
} from '../types/backend/chat'; // Ajuste o caminho conforme a sua estrutura de pastas

/**
 * Interface para o item de conversa no frontend.
 * Conforme a documentação, esta interface é para uso interno do frontend.
 * Ela representa um resumo de uma conversa na lista de chats do usuário.
 */
export interface ConversationItem {
  id: string; // ID do chat
  otherUserId: string; // ID do outro participante
  otherUserName: string; // Nome do outro participante
  otherUserAvatarUrl?: string; // URL do avatar do outro participante
  lastMessage: string; // Conteúdo da última mensagem (simplificado para string)
  lastMessageTimestamp: string; // Data/hora da última mensagem
  unreadCount: number; // Número de mensagens não lidas nesta conversa
  isPinned?: boolean; // Se a conversa está fixada
  isTyping?: boolean; // Se o outro participante está digitando
  messageType?: 'text' | 'voice' | 'sticker' | 'file'; // Tipo da última mensagem
  // Adicione outros campos relevantes que o backend possa retornar para uma conversa,
  // como o ID do booking associado, se houver.
  bookingId?: string;
}

/**
 * Encontra um chat existente entre um provedor e um cliente ou cria um novo.
 * Corresponde a GET /chat/find-or-create/provider/:providerId/client/:clientId.
 *
 * @param providerId O ID do provedor.
 * @param clientId O ID do cliente.
 * @returns Uma promessa que resolve para os detalhes do chat.
 */
export async function findOrCreateChat(providerId: string, clientId: string): Promise<ChatDetails> {
  try {
    const response = await api.get<ChatDetails>(`/chat/find-or-create/provider/${providerId}/client/${clientId}`);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao encontrar ou criar chat:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Não foi possível encontrar ou criar o chat.');
  }
}

/**
 * Obtém o histórico de mensagens para um chat específico.
 * Corresponde a GET /chat/:chatId/messages.
 *
 * @param chatId O ID do chat.
 * @param query Opções de paginação (limite e offset).
 * @returns Uma promessa que resolve para um array de mensagens.
 */
export async function getChatMessages(chatId: string, query?: GetMessagesQuery): Promise<Message[]> {
  try {
    const response = await api.get<Message[]>(`/chat/${chatId}/messages`, { params: query });
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar mensagens do chat:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Não foi possível carregar as mensagens do chat.');
  }
}

/**
 * Envia uma nova mensagem para um chat.
 * Corresponde a POST /chat/:chatId/messages.
 *
 * @param messageData Os dados da mensagem a ser enviada, incluindo o chatId.
 * @returns Uma promessa que resolve para a mensagem enviada.
 */
export async function sendMessage(messageData: SendMessageDto): Promise<Message> {
  try {
    // O backend espera o chatId na URL, então usamos messageData.chatId
    const response = await api.post<Message>(`/chat/${messageData.chatId}/messages`, messageData);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Não foi possível enviar a mensagem.');
  }
}

/**
 * Busca a lista de conversas do usuário logado.
 * Corresponde a GET /chat/me/conversations.
 *
 * @returns Uma promessa que resolve para um array de ConversationItem.
 */
export async function getChatListForUser(): Promise<ConversationItem[]> {
  try {
    // A documentação indica que este endpoint é para o usuário logado,
    // então não é necessário passar o userId explicitamente na requisição.
    const response = await api.get<ConversationItem[]>('/chat/me/conversations');
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar lista de conversas:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Não foi possível carregar a lista de conversas.');
  }
}
