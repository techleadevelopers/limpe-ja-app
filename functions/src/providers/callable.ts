// LimpeJaApp/functions/src/providers/callable.ts
import * as functions from "firebase-functions";
import { region } from "firebase-functions/v1";
// Importa 'admin' (default export do firebase-admin), e também 'db' e 'adminAuth' (alias para auth)
import admin, { db, auth as adminAuth } from "../config/firebaseAdmin";
// Tipos Corrigidos: DailyAvailability, UserRole, e BlockedDate (que será usado)
import {
  ProviderProfile,
  OfferedService,
  DailyAvailability, // Corrigido de WeeklyAvailability
  UserProfile,
  UserRole,
  BlockedDate      // Importado para usar na nova função placeholder
} from "../types";
import { assertRole } from "../utils/helpers";

const REGION = "southamerica-east1";

// Interface para os dados esperados pela função submitProviderRegistration
interface SubmitProviderRegistrationData {
    personalDetails: Partial<Omit<UserProfile, "id" | "email" | "role" | "createdAt" | "updatedAt">>;
    serviceDetails: Partial<Omit<ProviderProfile, keyof UserProfile | "id" | "email" | "role" | "createdAt" | "updatedAt" | "averageRating" | "totalReviews" | "isVerified" >>;
    avatarUri?: string; // Exemplo se a URI local da imagem for passada para o backend processar o upload
}

export const submitProviderRegistration = region(REGION).https.onCall(
  async (data: SubmitProviderRegistrationData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado.");
    }
    const uid = context.auth.uid;
    const userAuthRecord = await adminAuth.getUser(uid);

    console.log(`[ProvidersCallable] Usuário ${uid} submetendo cadastro de provedor com dados:`, data);
    // TODO: Validação robusta dos dados 'data.personalDetails' e 'data.serviceDetails' usando Zod/Joi.

    const userProfileRef = db.collection("users").doc(uid);
    const providerProfileRef = db.collection("providerProfiles").doc(uid);
    const batch = db.batch();

    const userProfileUpdateData: Partial<UserProfile> = {
        ...data.personalDetails,
        name: data.personalDetails.name || userAuthRecord.displayName || userAuthRecord.email?.split('@')[0],
        phone: data.personalDetails.phone || userAuthRecord.phoneNumber,
        role: "provider" as UserRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(), // CORRETO
    };
    batch.update(userProfileRef, userProfileUpdateData);

    const providerProfileDataForFirestore: Partial<ProviderProfile> = {
        bio: data.serviceDetails.bio,
        yearsOfExperience: data.serviceDetails.yearsOfExperience,
        servicesOffered: data.serviceDetails.servicesOffered || [],
        serviceAreas: data.serviceDetails.serviceAreas || [],
        weeklyAvailability: data.serviceDetails.weeklyAvailability || [],
        blockedDates: data.serviceDetails.blockedDates || [],
        name: userProfileUpdateData.name, // Denormalizando para providerProfile
        avatarUrl: userProfileUpdateData.avatarUrl, // Denormalizando para providerProfile
        isVerified: false,
        averageRating: 0,
        totalReviews: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(), // CORRETO
    };

    batch.set(providerProfileRef, providerProfileDataForFirestore, { merge: true });
    // Para createdAt, é melhor usar um trigger onCreate no providerProfiles ou uma verificação se o doc existe
    // Exemplo simplificado: se você quiser adicionar no batch apenas se for novo:
    // const providerDoc = await providerProfileRef.get();
    // if (!providerDoc.exists) {
    //   batch.update(providerProfileRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
    // }

    try {
      await batch.commit();
      await adminAuth.setCustomUserClaims(uid, { role: "provider", lastRefresh: Date.now() });
      console.log(`[ProvidersCallable] Cadastro de provedor para ${uid} submetido e role atualizado.`);
      return { success: true, message: "Cadastro de profissional enviado com sucesso!" };
    } catch (error) {
      console.error(`[ProvidersCallable] Erro ao submeter cadastro de provedor ${uid}:`, error);
      throw new functions.https.HttpsError("internal", "Falha ao enviar cadastro.", (error as Error).message);
    }
  }
);

export const updateOfferedServices = region(REGION).https.onCall(
  async (data: { services: OfferedService[] }, context) => {
    if (!context.auth) { throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado."); }
    const uid = context.auth.uid;
    assertRole(context.auth, "provider");
    // TODO: Validação de data.services
    try {
      await db.collection("providerProfiles").doc(uid).update({
        servicesOffered: data.services,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(), // CORRETO
      });
      return { success: true, message: "Serviços atualizados com sucesso." };
    } catch (error) { 
        console.error(`[ProvidersCallable] Erro ao atualizar serviços para ${uid}:`, error);
        throw new functions.https.HttpsError("internal", "Falha ao atualizar serviços.", (error as Error).message);
    }
  }
);

export const updateWeeklyAvailability = region(REGION).https.onCall(
  async (data: { availability: DailyAvailability[] }, context) => { // Corrigido para DailyAvailability[]
    if (!context.auth) { throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado."); }
    const uid = context.auth.uid;
    assertRole(context.auth, "provider");
    // TODO: Validação de data.availability
    try {
      await db.collection("providerProfiles").doc(uid).update({
        weeklyAvailability: data.availability,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(), // CORRETO
      });
      return { success: true, message: "Disponibilidade atualizada com sucesso." };
    } catch (error) { 
        console.error(`[ProvidersCallable] Erro ao atualizar disponibilidade para ${uid}:`, error);
        throw new functions.https.HttpsError("internal", "Falha ao atualizar disponibilidade.", (error as Error).message);
    }
  }
);

// Placeholder para usar o tipo BlockedDate e remover o aviso de import não utilizado
export const updateBlockedDates = region(REGION).https.onCall(
  async (data: { dates: BlockedDate[] }, context) => {
    if (!context.auth) { throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado."); }
    const uid = context.auth.uid;
    assertRole(context.auth, "provider");
    console.log(`[ProvidersCallable] ${uid} atualizando datas bloqueadas:`, data.dates);
    // TODO: Implementar a lógica real para salvar as datas bloqueadas no Firestore.
    // Ex: await db.collection("providerProfiles").doc(uid).update({ blockedDates: data.dates, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return { success: true, message: "Datas bloqueadas atualizadas (simulado)." };
  }
);