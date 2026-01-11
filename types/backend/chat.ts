// LimpeJaApp/src/types/backend/chat.ts

/**
 * @interface ChatDetails
 * Representa os detalhes básicos de um chat, geralmente contendo apenas o ID do chat.
 * Corresponde ao ChatDetailsDto do backend.
 */
export interface ChatDetails {
  chatId: string;
  // Se o backend retornar mais informações aqui (ex: participantes, último agendamento), adicione-as.
}

export interface BookingConversationDetails {
  chatId: string;
  bookingId: string;
  providerId: string;
  providerUserId: string;
  providerFullName: string;
  providerAvatarUrl?: string | null;
  clientUserId: string;
}


/**
 * @interface Message
 * Representa uma mensagem individual em um chat.
 * Alinhado com a entidade Message do backend.
 */
export interface Message {
  id: string;
  chatId: string;
  senderId: string; // ID do usuário que enviou a mensagem
  receiverId: string; // ID do usuário que recebeu a mensagem
  content: string;
  createdAt: string; // ISO string
  isRead: boolean; // Propriedade 'isRead' do backend
  // readAt?: string; // Manter se você tiver uma lógica de 'lido em' no frontend/backend
}

/**
 * @interface SendMessageDto
 * DTO para enviar uma nova mensagem para um chat.
 * Corresponde ao que o endpoint de criação de mensagem espera no corpo da requisição.
 */
export interface SendMessageDto {
  chatId: string;
  senderId: string;
  receiverId: string; // ID do destinatário é necessário para o backend
  content: string;
}

/**
 * @interface GetMessagesQuery
 * DTO para filtrar e paginar mensagens (GET /chat/:chatId/messages).
 * Renomeado para GetMessagesQuery para evitar confusão com DTOs de corpo de requisição.
 */
export interface GetMessagesQuery {
  limit?: number;
  offset?: number;
  // userId foi removido, pois o endpoint getMessagesByChatId do backend não o utiliza como filtro.
}

/**
 * @interface ChatSummary
 * Representa um resumo de um chat para a lista de conversas.
 * (Este é um tipo conceitual, pois o endpoint para isso não foi fornecido no backend).
 */
export interface ChatSummary {
  id: string;
  lastMessage: Message; // Pode ser um resumo da última mensagem
  participant1: { id: string; fullName: string; avatarUrl?: string | null }; // Usar fullName
  participant2: { id: string; fullName: string; avatarUrl?: string | null }; // Usar fullName
  unreadCount: number;
}
