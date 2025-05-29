// LimpeJaApp/functions/src/utils/notifications.ts
import admin from "../config/firebaseAdmin"; // Importe o admin SDK

export interface PushNotificationData {
  title: string; // <-- DEVE SER OBRIGATÓRIO
  body: string;  // <-- DEVE SER OBRIGATÓRIO
  data?: { [key: string]: string }; // Opcional
}

export const sendPushNotification = async (
  userId: string,
  notification: PushNotificationData
) => {
  const tokenDoc = await admin.firestore().collection("fcmTokens").doc(userId).get();
  if (!tokenDoc.exists) {
    console.warn(`[Notifications] Nenhum token de push para user ${userId}`);
    return;
  }

  const token = tokenDoc.data()?.token;
  if (!token) {
    console.warn(`[Notifications] Token de push vazio para user ${userId}`);
    return;
  }

  const message = {
    token: token,
    notification: {
      title: notification.title, // Agora TypeScript sabe que é string
      body: notification.body,   // Agora TypeScript sabe que é string
    },
    data: notification.data || {},
  };

  try {
    await admin.messaging().send(message);
    console.log(`[Notifications] Notificação enviada para ${userId}`);
  } catch (error) {
    console.error(`[Notifications] Erro ao enviar notificação para ${userId}:`, error);
    throw error;
  }
};