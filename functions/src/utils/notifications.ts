import * as admin from "firebase-admin";

export const sendPushNotification = async (
  userId: string,
  notification: { title: string; body: string }
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
      title: notification.title,
      body: notification.body,
    },
  };

  await admin.messaging().send(message);
  console.log(`[Notifications] Notificação enviada para ${userId}`);
};
