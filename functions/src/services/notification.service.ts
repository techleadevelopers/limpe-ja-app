// LimpeJaApp/functions/src/services/notification.service.ts
import * as admin from "firebase-admin";
import { messaging, db } from "../config/firebaseAdmin";
import { NotificationPayload, StoredNotification, NotificationType } from "../types"; // Seus tipos
import { notificationsCollection } from "./firestore.service"; // Assumindo que exporta a coleção

// A função getUserFcmTokens continua como antes (certifique-se que está exportada)
export const getUserFcmTokens = async (userId: string): Promise<string[]> => {
  if (!userId) return [];
  try {
    const tokensSnapshot = await db.collection('users').doc(userId).collection('fcmTokens').get();
    if (tokensSnapshot.empty) {
      console.log(`[NotificationService] Nenhum token FCM encontrado para o usuário ${userId}.`);
      return [];
    }
    const tokens = tokensSnapshot.docs
      .map((doc: admin.firestore.QueryDocumentSnapshot) => doc.data().token as string | undefined)
      .filter((token?: string): token is string => typeof token === 'string' && token.length > 0);
    
    console.log(`[NotificationService] Tokens FCM encontrados para ${userId}:`, tokens.length);
    return tokens;
  } catch (error) {
    console.error(`[NotificationService] Erro ao buscar tokens FCM para ${userId}:`, error);
    return [];
  }
};

// Função sendPushNotification CORRIGIDA:
export const sendPushNotification = async (
  fcmTokens: string | string[],
  payload: NotificationPayload,
  options?: {
    saveToFirestore?: boolean;
    userIdToSave?: string;
    typeToSave?: NotificationType;
    navigateTo?: string; 
  }
): Promise<boolean> => {
  if (!fcmTokens || (Array.isArray(fcmTokens) && fcmTokens.length === 0)) {
    console.log("[NotificationService] Nenhum token FCM fornecido para enviar notificação.");
    return false;
  }

  const messageConfig: admin.messaging.MulticastMessage = {
    notification: {
      title: payload.title,
      body: payload.body,
      // imageUrl: payload.imageUrl, // O SDK Admin pode não suportar imageUrl diretamente no 'notification'. 
                                     // Envie via 'data' ou use config específica da plataforma.
    },
    data: {
      ...payload.data,
      ...(payload.imageUrl && { FcmImageUrl: payload.imageUrl }), // Envia imageUrl via data
      // Adicione 'navigateTo' aos dados se ele vier das options e não estiver já em payload.data
      ...(options?.navigateTo && !payload.data?.navigateTo && { navigateTo: options.navigateTo }),
    },
    tokens: Array.isArray(fcmTokens) ? fcmTokens : [fcmTokens],
    // Configurações específicas de plataforma (opcional)
    // android: { notification: { sound: 'default', icon: 'ic_notification', color: '#007AFF' } },
    // apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  };

  try {
    console.log("[NotificationService] Enviando notificação push:", JSON.stringify(messageConfig, null, 2));
    const response = await messaging.sendEachForMulticast(messageConfig);
    console.log(`[NotificationService] ${response.successCount} mensagens enviadas com sucesso de ${messageConfig.tokens.length}.`);
    
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(
            `[NotificationService] Falha ao enviar para token ${messageConfig.tokens[idx]}:`,
            resp.error?.code, resp.error?.message
          );
          // TODO: Lógica para lidar com tokens inválidos (ex: remover do Firestore)
        }
      });
    }

    // Salvar a notificação no Firestore para histórico do usuário
    // Condição do IF corrigida e objeto notificationToStore preenchido:
    if (options?.saveToFirestore && options.userIdToSave && options.typeToSave) {
      const notificationToStore: Omit<StoredNotification, "id"> = { // <<< OBJETO PREENCHIDO
        userId: options.userIdToSave,
        type: options.typeToSave,
        title: payload.title,
        body: payload.body,
        data: messageConfig.data, // Usar os dados que foram efetivamente enviados
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp, // Tipo correto
        navigateTo: options.navigateTo || payload.data?.screen || payload.data?.navigateTo,
      };
      await notificationsCollection.add(notificationToStore);
      console.log(`[NotificationService] Notificação salva no Firestore para o usuário ${options.userIdToSave}`);
    }
    return response.successCount > 0;
  } catch (error) {
    console.error("[NotificationService] Erro geral ao enviar notificação push:", error);
    return false;
  }
};