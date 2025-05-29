// LimpeJaApp/functions/src/types/chat.types.ts
import * as admin from "firebase-admin"; // Para FirebaseFirestore.Timestamp

export interface ChatMessage {
  id?: string; // ID do documento da mensagem no Firestore (can remain optional here if ID is only set when retrieved)
  chatId: string; // ID da conversa/sala de chat a que pertence
  senderId: string;
  senderName?: string; // Denormalizado para exibição
  senderAvatarUrl?: string; // Denormalizado
  recipientId: string;
  text?: string; // Conteúdo da mensagem de texto
  imageUrl?: string; // URL se for uma mensagem de imagem
  timestamp: admin.firestore.Timestamp | admin.firestore.FieldValue; // Quando a mensagem foi enviada/criada
  isReadByRecipient?: boolean;
  // Você pode adicionar outros campos como messageType: 'text' | 'image' | 'booking_info', etc.
}

// Opcional: Interface para o documento principal do Chat (sala de chat)
export interface ChatRoom {
    id: string; // <<< CHANGED from id?: string;
    participants: string[]; // Array com UIDs dos participantes
    participantInfo: {
        [userId: string]: {
            name?: string;
            avatarUrl?: string;
        }
    };
    lastMessageText?: string;
    lastMessageTimestamp?: admin.firestore.Timestamp | admin.firestore.FieldValue;
    lastMessageSenderId?: string;
    unreadCount?: {
        [userId: string]: number;
    };
    createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
    updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
}