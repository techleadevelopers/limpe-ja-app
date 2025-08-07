// LimpeJaApp/src/types/backend/notifications.ts

/**
 * @interface NotificationEntity
 * Representa uma notificação individual vinda do backend.
 * Alinhado com o que a tela de notificações espera.
 */
export interface NotificationEntity {
  id: string;
  // Mapear para os tipos reais que seu backend usa.
  // Ex: 'BOOKING_CONFIRMED', 'NEW_MESSAGE', 'PAYMENT_RECEIVED', 'SYSTEM_UPDATE'
  type: 'AGENDAMENTO' | 'MENSAGEM' | 'PAGAMENTO' | 'GERAL' | 'BOOKING_CONFIRMED' | 'NEW_MESSAGE' | 'PAYMENT_RECEIVED' | 'SYSTEM_UPDATE' | string;
  title: string; // CORREÇÃO: Adicionado title
  body: string; // Conteúdo principal da notificação (CORREÇÃO: Renomeado de message para body)
  createdAt: string; // ISO String, data de criação da notificação
  readAt?: string | null; // ISO String, data em que a notificação foi lida (será nulo se não lida)
  navigateTo?: string | null; // Rota interna do app para onde navegar ao clicar na notificação
  relatedId?: string | null; // ID de um item relacionado (ex: bookingId, chatId)
  userId: string; // ID do usuário a quem a notificação pertence
  imageUrl?: string | null; // CORREÇÃO: Adicionado imageUrl
  actionButtons?: any | null; // CORREÇÃO: Adicionado actionButtons (Prisma.JsonValue no backend)
}

/**
 * @interface MarkAsReadDto
 * DTO para marcar uma ou mais notificações como lidas.
 * (PATCH /notifications/me/mark-as-read ou PATCH /notifications/:id/mark-as-read)
 */
export interface MarkAsReadDto {
  notificationIds?: string[]; // IDs das notificações a serem marcadas como lidas (para PATCH em massa)
  // Se for PATCH /notifications/:id/mark-as-read, o ID já estará na URL, então este campo seria opcional.
  readAt?: string; // Pode ser enviado pelo frontend para marcar a hora de leitura.
}