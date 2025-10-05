// LimpeJaApp/app/types/backend/support.ts

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
export type TicketSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type TicketCategory = 'PAYMENT' | 'QUALITY' | 'APP' | 'OTHER';

export interface SupportTicket {
  id: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
  messages?: SupportMessage[];
  category: TicketCategory;
  // severity é apenas visual na UI; não persistido no backend
  severity?: TicketSeverity;
  bookingId?: string | null;
  description: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  userId: string;
  role?: string;
  body: string;
  attachments?: string[];
  createdAt: string;
}

export interface CreateTicketPayload {
  subject: string;
  description: string;
  category: TicketCategory;
  // Não enviar severity ao backend enquanto o DTO não suportar
  bookingId?: string;
  attachments?: string[];
}

export interface AddMessagePayload {
  content: string;
}
