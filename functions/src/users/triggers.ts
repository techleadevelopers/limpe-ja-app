// LimpeJaApp/functions/src/users/triggers.ts
import * as functions from "firebase-functions";
import { region } from "firebase-functions/v1";
import admin, { db } from "../config/firebaseAdmin";
// Removido ChatMessage da importação, pois a lógica de denormalização do chat ainda é um TODO
import { UserProfile, ProviderProfile, Booking, Review } from "../types"; 

const REGION = "southamerica-east1";

export const onUserProfileUpdate = region(REGION)
  .firestore.document("users/{userId}")
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const newData = change.after.data() as UserProfile | undefined;
    const oldData = change.before.data() as UserProfile | undefined;

    if (!newData) {
      functions.logger.warn(`[UsersTrigger] Documento do usuário ${userId} não existe mais após o update.`);
      return null;
    }
    if (!oldData) {
      functions.logger.info(`[UsersTrigger] Documento do usuário ${userId} provavelmente foi criado.`);
      // Denormalização inicial pode ser feita aqui se necessário,
      // mas geralmente é feita no trigger de criação do perfil específico (ex: providerProfile)
      // ou no processNewUser em auth/triggers.ts.
      return null;
    }

    functions.logger.info(`[UsersTrigger] Perfil do usuário ${userId} atualizado.`);

    const nameChanged = newData.name !== oldData.name;
    const avatarChanged = newData.avatarUrl !== oldData.avatarUrl;

    if (!nameChanged && !avatarChanged) {
      functions.logger.info(`[UsersTrigger] Nenhuma mudança em nome ou avatar para ${userId}. Nenhuma denormalização necessária.`);
      return null;
    }

    functions.logger.info(`[UsersTrigger] Nome ou avatar do usuário ${userId} alterado. Iniciando atualização de dados denormalizados...`);
    
    const batch = db.batch();
    let operationsCount = 0;
    const timestampUpdate = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

    // 1. Atualizar em 'providerProfiles'
    if (newData.role === "provider") {
      const providerProfileRef = db.collection("providerProfiles").doc(userId);
      const providerUpdateData: Partial<ProviderProfile> = { ...timestampUpdate };
      if (nameChanged) providerUpdateData.name = newData.name;
      if (avatarChanged) providerUpdateData.avatarUrl = newData.avatarUrl;
      
      if (Object.keys(providerUpdateData).length > 1) {
        batch.update(providerProfileRef, providerUpdateData);
        operationsCount++;
        functions.logger.info(`[UsersTrigger] Agendada atualização para providerProfile de ${userId}.`);
      }
    }

    // 2. Atualizar em 'bookings' (como CLIENTE)
    const clientBookingsQuery = db.collection("bookings").where("clientId", "==", userId);
    const clientBookingsSnap = await clientBookingsQuery.get();
    clientBookingsSnap.forEach(doc => {
      const bookingUpdateData: Partial<Booking> = { ...timestampUpdate };
      if (nameChanged && doc.data().clientName !== newData.name) bookingUpdateData.clientName = newData.name;
      if (avatarChanged && doc.data().clientAvatarUrl !== newData.avatarUrl) bookingUpdateData.clientAvatarUrl = newData.avatarUrl;
      if (Object.keys(bookingUpdateData).length > 1) {
        batch.update(doc.ref, bookingUpdateData);
        operationsCount++;
      }
    });
    if (clientBookingsSnap.size > 0 && operationsCount > (newData.role === "provider" ? 1 : 0) ) functions.logger.info(`[UsersTrigger] Agendadas atualizações em bookings (como cliente) para ${userId}.`);

    // 3. Atualizar em 'bookings' (como PRESTADOR)
    const providerBookingsQuery = db.collection("bookings").where("providerId", "==", userId);
    const providerBookingsSnap = await providerBookingsQuery.get();
    providerBookingsSnap.forEach(doc => {
      const bookingUpdateData: Partial<Booking> = { ...timestampUpdate };
      if (nameChanged && doc.data().providerName !== newData.name) bookingUpdateData.providerName = newData.name;
      if (avatarChanged && doc.data().providerAvatarUrl !== newData.avatarUrl) bookingUpdateData.providerAvatarUrl = newData.avatarUrl;
      if (Object.keys(bookingUpdateData).length > 1) {
        batch.update(doc.ref, bookingUpdateData);
        operationsCount++;
      }
    });
    if (providerBookingsSnap.size > 0 && operationsCount > (clientBookingsSnap.size + (newData.role === "provider" ? 1 : 0)) ) functions.logger.info(`[UsersTrigger] Agendadas atualizações em bookings (como prestador) para ${userId}.`);
    
    // 4. Atualizar em 'reviews' (onde o usuário é o AVALIADOR)
    const reviewsByReviewerQuery = db.collection("reviews").where("reviewerId", "==", userId);
    const reviewsByReviewerSnap = await reviewsByReviewerQuery.get();
    reviewsByReviewerSnap.forEach(doc => {
        const reviewUpdateData: Partial<Review> = { ...timestampUpdate }; // Agora Review tem updatedAt
        if (nameChanged && doc.data().reviewerName !== newData.name) (reviewUpdateData as any).reviewerName = newData.name; // Assumindo que Review tem reviewerName
        if (avatarChanged && doc.data().reviewerAvatarUrl !== newData.avatarUrl) (reviewUpdateData as any).reviewerAvatarUrl = newData.avatarUrl; // Assumindo que Review tem reviewerAvatarUrl
        if (Object.keys(reviewUpdateData).length > 1) {
            batch.update(doc.ref, reviewUpdateData);
            operationsCount++;
        }
    });
    // ... (log para reviews) ...

    // 5. Atualizar em 'chats' (na informação dos participantes)
    // A lógica para 'chats' que tínhamos antes pode ser mantida,
    // apenas garanta que o tipo ChatRoom (se você o usa para o documento do chat)
    // tenha um campo updatedAt.
    const chatsQuery = db.collection("chats").where(`participantInfo.${userId}.name`, "!=", null);
    const chatsSnap = await chatsQuery.get();
    chatsSnap.forEach(doc => {
        const chatData = doc.data();
        const participantData = chatData.participantInfo?.[userId];
        if (participantData) {
            const chatUpdateData: any = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
            let needsChatUpdate = false;
            if (nameChanged && participantData.name !== newData.name) {
                chatUpdateData[`participantInfo.${userId}.name`] = newData.name;
                needsChatUpdate = true;
            }
            if (avatarChanged && participantData.avatarUrl !== newData.avatarUrl) {
                chatUpdateData[`participantInfo.${userId}.avatarUrl`] = newData.avatarUrl;
                needsChatUpdate = true;
            }
            if (needsChatUpdate) {
                batch.update(doc.ref, chatUpdateData);
                operationsCount++;
            }
        }
    });
    // ... (log para chats) ...

    if (operationsCount > 0) {
        try {
          await batch.commit();
          functions.logger.info(`[UsersTrigger] Dados denormalizados para ${userId} atualizados (${operationsCount} docs).`);
        } catch (err) {
          functions.logger.error(`[UsersTrigger] Erro ao commitar batch de denormalização para ${userId}:`, err);
        }
    } else {
        functions.logger.info(`[UsersTrigger] Nenhuma operação de denormalização necessária para ${userId}.`);
    }
    return null;
  });