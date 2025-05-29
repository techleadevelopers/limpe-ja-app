import * as admin from "firebase-admin";
// IMPORTANTE: Removida a definição duplicada de UserProfile.
// Se este arquivo precisar referenciar um UserProfile, ele deve importá-lo:
// import { UserProfile } from "./user.types"; // Descomente se precisar usar UserProfile aqui, por exemplo, em uma interface de histórico de notificações com dados do usuário

/**
 * Define os tipos específicos de notificações que podem ser enviadas e armazenadas.
 */
export type NotificationType =
  | "NEW_BOOKING_REQUEST"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_REMINDER"
  | "SERVICE_IN_PROGRESS"
  | "SERVICE_COMPLETED"
  | "BOOKING_PAID"
  | "PAYMENT_FAILED"
  | "NEW_REVIEW"
  | "NEW_CHAT_MESSAGE"
  | "PROVIDER_APPLICATION_UPDATE"
  | "GENERAL_PROMO"
  | "ACCOUNT_ISSUE"
  | "BOOKING_RESCHEDULE_REQUEST";

/**
 * Interface para o payload da notificação construída nas Cloud Functions (ex: triggers).
 * Contém dados estruturados para que o aplicativo cliente possa interpretá-los.
 */
export interface NotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data: {
    screen: string;
    notificationType: NotificationType;
    bookingId?: string;
    chatId?: string;
    reason?: string;
    serviceName?: string;
    providerName?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Interface para a estrutura de uma notificação quando salva no Firestore.
 */
export interface StoredNotification {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: { [key: string]: string | undefined };
  isRead: boolean;
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  navigateTo?: string;
}

/**
 * Interface para os dados estritamente esperados pela função sendPushNotification,
 * que por sua vez, segue o formato do Firebase Cloud Messaging para o 'notification' e 'data' payload.
 */
export interface PushNotificationData {
  title: string;
  body: string;
  data?: { [key: string]: string };
}