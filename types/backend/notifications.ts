// LimpeJaApp/src/types/backend/notifications.ts

/**
 * @interface NotificationEntity
 * Representa uma notificação individual vinda do backend.
 * Alinhado com o que a tela de notificações espera.
 */
export interface NotificationEntity {
  id: string;
  // Mapear para os tipos reais que seu backend usa.
  // Ex: 'BOOKING_CONFIRMED', 'NEW_MESSAGE', 'PAYMENT_RECEIVED', 'SYSTEM_UPDATE', 'DISPUTE_CREATED', 'DISPUTE_RESOLVED'
  type: 'AGENDAMENTO' | 'MENSAGEM' | 'PAGAMENTO' | 'GERAL' | 'BOOKING_CONFIRMED' | 'NEW_MESSAGE' | 'PAYMENT_RECEIVED' | 'SYSTEM_UPDATE' | 'DISPUTE_CREATED' | 'DISPUTE_RESOLVED' | 'DISPUTE_MESSAGE' | 'DISPUTE_MESSAGE_ADMIN' | string; // NEW: Added dispute types
  title: string;
  message: string; // CORREÇÃO: Renomeado de 'body' para 'message' para consistência com o backend
  createdAt: string; // ISO String, data de criação da notificação
  readAt?: string | null; // ISO String, data em que a notificação foi lida (será nulo se não lida)
  targetUrl?: string | null; // CORREÇÃO: Renomeado de 'navigateTo' para 'targetUrl' para consistência com o backend
  relatedId?: string | null; // ID de um item relacionado (ex: bookingId, chatId)
  userId: string; // ID do usuário a quem a notificação pertence
  imageUrl?: string | null;
  actionButtons?: any | null; // (Prisma.JsonValue no backend)
  category?: 'booking' | 'payment' | 'review' | 'system' | 'suggestion' | 'dispute' | string; // NEW: Added dispute category
  priority?: 'high' | 'medium' | 'low'; // CORREÇÃO: Adicionado 'priority' para uso no frontend
}

/**
 * @interface MarkAsReadDto
 * DTO para marcar uma ou mais notificações como lidas.
 * (PATCH /notifications/me/mark-as-read ou PATCH /notifications/:id/mark-as-read)
 */
export interface MarkAsReadDto {
  notificationIds?: string[]; // IDs das notificações a serem marcadas como lidas (para PATCH em massa)
  readAt?: string; // Pode ser enviado pelo frontend para marcar a hora de leitura.
}