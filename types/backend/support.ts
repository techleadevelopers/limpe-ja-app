// LimpeJaApp/app/types/backend/support.ts
export interface SupportTicket {
    id: string;
    subject: string;
    status: 'open' | 'pending' | 'closed';
    createdAt: string;
    updatedAt: string;
    lastMessagePreview?: string; // Optional: A short preview of the last message
    messages?: SupportMessage[]; // Optional: Full list of messages for ticket details
}

export interface SupportMessage {
    id: string;
    ticketId: string;
    senderId: string; // User ID or Admin ID
    senderType: 'client' | 'admin' | 'provider'; // Type of sender
    content: string;
    createdAt: string;
}

export interface CreateTicketPayload {
    subject: string;
    initialMessage: string;
}

export interface AddMessagePayload {
    content: string;
}