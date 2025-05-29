// LimpeJaApp/functions/src/services/notification.service.ts
import * as admin from "firebase-admin";
import { messaging, db } from "../config/firebaseAdmin";
import { NotificationPayload, StoredNotification, NotificationType, UserProfile } from "../types"; // Added UserProfile
// Corrected import for the notifications collection
import { userNotificationsCollection as notificationsCollection } from "./firestore.service";

// Updated function to read FCM tokens from the UserProfile document field
export const getUserFcmTokens = async (userId: string): Promise<string[]> => {
    if (!userId) return [];
    try {
        const userDocRef = db.collection('users').doc(userId);
        const userDocSnap = await userDocRef.get();

        if (!userDocSnap.exists) {
            console.log(`[NotificationService] Usuário não encontrado: ${userId}.`);
            return [];
        }

        const userData = userDocSnap.data() as UserProfile | undefined;
        const tokens = userData?.fcmTokens || [];

        if (!tokens || tokens.length === 0) {
            console.log(`[NotificationService] Nenhum token FCM encontrado para o usuário ${userId}.`);
            return [];
        }
        
        console.log(`[NotificationService] Tokens FCM encontrados para ${userId}:`, tokens.length);
        // Filter out any potentially invalid tokens if necessary, though arrayUnion should keep them unique
        return tokens.filter((token): token is string => typeof token === 'string' && token.length > 0);
    } catch (error) {
        console.error(`[NotificationService] Erro ao buscar tokens FCM para ${userId}:`, error);
        return [];
    }
};

// sendPushNotification function remains the same as you provided
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
        },
        data: {
            ...payload.data,
            ...(payload.imageUrl && { FcmImageUrl: payload.imageUrl }),
            ...(options?.navigateTo && !payload.data?.navigateTo && { navigateTo: options.navigateTo }),
        },
        tokens: Array.isArray(fcmTokens) ? fcmTokens : [fcmTokens],
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
                }
            });
        }

        if (options?.saveToFirestore && options.userIdToSave && options.typeToSave) {
            const notificationToStore: Omit<StoredNotification, "id"> = {
                userId: options.userIdToSave,
                type: options.typeToSave,
                title: payload.title,
                body: payload.body,
                data: messageConfig.data, // Using the actual data sent
                isRead: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
                navigateTo: options.navigateTo || payload.data?.screen || payload.data?.navigateTo,
            };
            await notificationsCollection.add(notificationToStore); // Uses the correctly imported collection
            console.log(`[NotificationService] Notificação salva no Firestore para o usuário ${options.userIdToSave}`);
        }
        return response.successCount > 0;
    } catch (error) {
        console.error("[NotificationService] Erro geral ao enviar notificação push:", error);
        return false;
    }
};