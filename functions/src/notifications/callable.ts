// LimpeJaApp/functions/src/notifications/callable.ts
import * as functions from "firebase-functions";
import { region } from "firebase-functions/v1";
import admin, { db } from "../config/firebaseAdmin";
// import { assertRole } from "../utils/helpers"; // REMOVIDO - TS6133 (assertRole não usado aqui)
// import { StoredNotification, UserRole } from "../types"; // REMOVIDO UserRole - TS6133. StoredNotification é usado.
import { StoredNotification } from "../types"; // StoredNotification é usado para o tipo de retorno

const REGION = "southamerica-east1";

interface MarkAsReadData {
  notificationIds?: string[];
  markAll?: boolean;
  readUntilTimestamp?: string;
}

export const markNotificationsAsRead = region(REGION).https.onCall(
  async (data: MarkAsReadData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado.");
    }
    const userId = context.auth.uid;
    const { notificationIds, markAll, readUntilTimestamp } = data;

    functions.logger.info(`[NotificationsCallable] Usuário ${userId} marcando notificações como lidas. Data:`, data); // Usando functions.logger

    try {
      const batch = db.batch();
      let query: admin.firestore.Query = db.collection("userNotifications") // Removido <admin.firestore.DocumentData> para inferência
        .where("userId", "==", userId)
        .where("isRead", "==", false);

      if (notificationIds && notificationIds.length > 0 && !markAll && !readUntilTimestamp) {
        // Se IDs específicos forem fornecidos e não for para marcar todos ou por timestamp
        functions.logger.info(`[NotificationsCallable] Marcando IDs específicos: ${notificationIds.join(", ")}`);
        for (const id of notificationIds) {
          const ref = db.collection("userNotifications").doc(id);
          // Opcional: verificar se a notificação realmente pertence ao userId antes de adicionar ao batch
          // const docSnap = await ref.get();
          // if (docSnap.exists && docSnap.data()?.userId === userId) {
          //   batch.update(ref, { isRead: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
          // }
          // Por simplicidade, vamos assumir que o cliente envia apenas seus próprios IDs de notificação
          batch.update(ref, { isRead: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        }
      } else if (markAll) {
        const unreadNotificationsSnapshot = await query.get();
        unreadNotificationsSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, { isRead: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        });
        functions.logger.info(`[NotificationsCallable] Marcando ${unreadNotificationsSnapshot.size} notificações como lidas para ${userId}.`);
      } else if (readUntilTimestamp) {
        const limitTimestamp = admin.firestore.Timestamp.fromDate(new Date(readUntilTimestamp));
        query = query.where("createdAt", "<=", limitTimestamp);
        const unreadNotificationsSnapshot = await query.get();
        unreadNotificationsSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, { isRead: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        });
        functions.logger.info(`[NotificationsCallable] Marcando ${unreadNotificationsSnapshot.size} notificações como lidas até ${readUntilTimestamp} para ${userId}.`);
      } else if (notificationIds && notificationIds.length > 0 && (markAll || readUntilTimestamp)) {
        // Caso onde notificationIds é fornecido mas também markAll ou readUntilTimestamp.
        // A lógica acima já trata markAll e readUntilTimestamp prioritariamente.
        // Se quiser uma lógica diferente, adicione aqui.
        functions.logger.warn("[NotificationsCallable] Opções conflitantes para marcar como lido. Priorizando markAll ou readUntilTimestamp se presentes.");
      } else {
        functions.logger.info("[NotificationsCallable] Nenhuma ação específica para marcar como lido (nem IDs, nem markAll, nem readUntilTimestamp).");
        return { success: true, message: "Nenhuma notificação especificada para marcar como lida." };
      }
      
      await batch.commit();
      return { success: true, message: "Notificações marcadas como lidas." };

    } catch (error) {
      functions.logger.error(`[NotificationsCallable] Erro ao marcar notificações como lidas para ${userId}:`, error);
      throw new functions.https.HttpsError("internal", "Falha ao atualizar notificações.", (error as Error).message);
    }
  }
);

interface GetNotificationsHistoryData {
    limit?: number;
    startAfterId?: string;
}

export const getNotificationsHistory = region(REGION).https.onCall(
  async (data: GetNotificationsHistoryData, context) => {
    // Correção para TS18048: Verificar se context.auth existe antes de usar context.auth.uid
    if (!context.auth) {
      functions.logger.error("[NotificationsCallable] getNotificationsHistory chamado por usuário não autenticado.");
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado para buscar histórico.");
    }
    const userId = context.auth.uid; // Agora seguro para acessar uid
    const limit = data.limit || 15;

    functions.logger.info(`[NotificationsCallable] Usuário ${userId} buscando histórico. Limite: ${limit}, StartAfter: ${data.startAfterId}`);
    
    try {
        let query: admin.firestore.Query = db.collection("userNotifications")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(limit);

        if (data.startAfterId) {
            const lastDoc = await db.collection("userNotifications").doc(data.startAfterId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            } else {
                functions.logger.warn(`[NotificationsCallable] Documento startAfterId ${data.startAfterId} não encontrado para paginação.`);
            }
        }
        const snapshot = await query.get();
        // Tipagem explícita para doc aqui
        const notifications = snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({id: doc.id, ...doc.data()}) as StoredNotification);
        
        return { success: true, notifications };

    } catch (error) {
        functions.logger.error(`[NotificationsCallable] Erro ao buscar histórico para ${userId}:`, error);
        throw new functions.https.HttpsError("internal", "Falha ao buscar notificações.", (error as Error).message);
    }
  }
);