// import * as functions from "firebase-functions"; // REMOVIDO - TS6133
import { region } from "firebase-functions/v1"; // 'region' é usado
import admin, { db } from "../config/firebaseAdmin"; // 'admin' é necessário para FieldValue
import { UserProfile } from "../types/user.types"; // CORREÇÃO: UserProfile agora vem de user.types
import { NotificationPayload, NotificationType } from "../types/notification.types"; // NotificationPayload e NotificationType vêm de notification.types
import { sendPushNotification, getUserFcmTokens } from "../services/notification.service"; // Mantido

const REGION = "southamerica-east1";

export const onNewChatMessage = region(REGION)
  .firestore.document("chats/{chatId}/messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data();
    const chatId = context.params.chatId;
    const messageId = context.params.messageId;

    if (!messageData) {
      console.error(`[ChatTrigger] Nova mensagem ${messageId} no chat ${chatId} não possui dados.`);
      return null;
    }

    console.log(`[ChatTrigger] Nova mensagem ${messageId} no chat ${chatId}:`, messageData);

    // Tipagem para os dados da mensagem
    const { text, senderId, recipientId, timestamp } = messageData as {
      text: string;
      senderId: string;
      recipientId: string;
      timestamp: admin.firestore.Timestamp; // Usa o Timestamp do admin SDK
    };

    if (!text || !senderId || !recipientId || !timestamp) {
      console.error(`[ChatTrigger] Dados da mensagem ${messageId} incompletos.`);
      return null;
    }

    const chatRef = db.collection("chats").doc(chatId);

    try {
      const chatUpdateData = {
        lastMessageText: text.length > 100 ? text.substring(0, 97) + "..." : text,
        lastMessageTimestamp: timestamp,
        lastMessageSenderId: senderId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(), // 'admin' aqui está correto
        [`unreadCount.${recipientId}`]: admin.firestore.FieldValue.increment(1),
      };

      await chatRef.update(chatUpdateData);
      console.log(`[ChatTrigger] Documento do chat ${chatId} atualizado com a última mensagem.`);

      const senderProfileSnap = await db.collection("users").doc(senderId).get();
      const senderProfile = senderProfileSnap.data() as UserProfile | undefined;
      const senderName = senderProfile?.name || "Alguém";

      const recipientFcmTokens = await getUserFcmTokens(recipientId);

      if (recipientFcmTokens.length > 0) {
        const notificationPayload: NotificationPayload = {
          title: `Nova mensagem de ${senderName}`,
          body: text.length > 100 ? text.substring(0, 97) + "..." : text,
          data: {
            chatId: chatId,
            senderId: senderId,
            screen: "ChatScreen",
            // CORREÇÃO: Adicionada a propriedade 'notificationType' que estava faltando
            notificationType: "NEW_CHAT_MESSAGE", 
            recipientName: senderName,
            recipientId: recipientId, // Certifique-se que este recipientId é o id do destinatário da notificação, não do remetente
          },
        };

        await sendPushNotification(
          recipientFcmTokens,
          notificationPayload,
          {
            saveToFirestore: true,
            userIdToSave: recipientId,
            typeToSave: "NEW_CHAT_MESSAGE", // Não precisa de cast aqui, já é NotificationType
            navigateTo: `/(client)/messages/${chatId}`
          }
        );
        console.log(`[ChatTrigger] Notificação de nova mensagem enviada para ${recipientId} (Chat: ${chatId}).`);
      } else {
        console.log(`[ChatTrigger] Destinatário ${recipientId} não possui tokens FCM para notificação.`);
      }
    } catch (error) {
      console.error(`[ChatTrigger] Erro ao processar nova mensagem ${messageId} no chat ${chatId}:`, error);
    }
    return null;
  });