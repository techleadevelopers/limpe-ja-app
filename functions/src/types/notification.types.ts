import * as admin from "firebase-admin"; // Para FirebaseFirestore.Timestamp e FieldValue

export type NotificationType =
  | "NEW_BOOKING_REQUEST"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_REMINDER"
  | "SERVICE_STARTED"
  | "SERVICE_COMPLETED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "NEW_REVIEW"
  | "NEW_CHAT_MESSAGE"
  | "PROVIDER_APPLICATION_UPDATE"
  | "GENERAL_PROMO"
  | "ACCOUNT_ISSUE";

export interface NotificationPayload {
  title: string;
  body: string;
  data?: { [key: string]: string }; 
  imageUrl?: string;
}

export interface StoredNotification {
  id?: string; // ID do documento no Firestore
  userId: string; 
  type: NotificationType;
  title: string;
  body: string;
  data?: { [key: string]: string }; 
  isRead: boolean;
  // Permite que createdAt seja um Timestamp (ao ler) ou um FieldValue (ao escrever com serverTimestamp)
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue; // <<< ALTERAÇÃO AQUI
  navigateTo?: string; 
}