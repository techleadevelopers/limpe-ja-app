import * as functions from "firebase-functions";
import { region } from "firebase-functions/v1";
import admin, { db, auth as adminAuth } from "../config/firebaseAdmin";
import {
  ProviderProfile,
  OfferedService,
  DailyAvailability,
  UserProfile,
  UserRole,
  BlockedDate,
} from "../types";
import { assertRole } from "../utils/helpers";
import { FieldValue } from "firebase-admin/firestore";

const REGION = "southamerica-east1";

// Interface para os dados esperados pela função submitProviderRegistration
interface SubmitProviderRegistrationData {
  personalDetails: Partial<Omit<UserProfile, "id" | "email" | "role" | "createdAt" | "updatedAt">>;
  serviceDetails: Partial<Omit<ProviderProfile, keyof UserProfile | "id" | "email" | "role" | "createdAt" | "updatedAt" | "averageRating" | "totalReviews" | "isVerified">>;
  avatarUri?: string;
}

export const submitProviderRegistration = region(REGION).https.onCall(
  async (data: SubmitProviderRegistrationData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado.");
    }
    const uid = context.auth.uid;
    const userAuthRecord = await adminAuth.getUser(uid);

    console.log(`[ProvidersCallable] Usuário ${uid} submetendo cadastro de provedor com dados:`, data);

    // Validação robusta dos dados
    if (!data.personalDetails || !data.personalDetails.name || !data.personalDetails.phone) {
      throw new functions.https.HttpsError("invalid-argument", "Detalhes pessoais (nome, telefone) são obrigatórios.");
    }
    if (!data.serviceDetails || !data.serviceDetails.bio || !data.serviceDetails.yearsOfExperience || !data.serviceDetails.servicesOffered || data.serviceDetails.servicesOffered.length === 0 || !data.serviceDetails.serviceAreas || data.serviceDetails.serviceAreas.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "Detalhes do serviço (bio, anos de experiência, serviços e áreas de atuação) são obrigatórios.");
    }

    // Validação dos serviços oferecidos
    if (!Array.isArray(data.serviceDetails.servicesOffered) || data.serviceDetails.servicesOffered.some(s => !s.name || typeof s.price !== 'number' || s.price <= 0)) {
        throw new functions.https.HttpsError("invalid-argument", "Os serviços oferecidos devem ser um array válido com nome e preço positivo.");
    }

    const userProfileRef = db.collection("users").doc(uid);
    const providerProfileRef = db.collection("providerProfiles").doc(uid);
    const batch = db.batch();

    const userProfileUpdateData: Partial<UserProfile> = {
      ...data.personalDetails,
      name: data.personalDetails.name || userAuthRecord.displayName || userAuthRecord.email?.split('@')[0],
      phone: data.personalDetails.phone || userAuthRecord.phoneNumber,
      role: "provider" as UserRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(data.avatarUri && { avatarUrl: data.avatarUri }), // Atualiza avatar se fornecido
    };
    batch.update(userProfileRef, userProfileUpdateData);

    const providerProfileDataForFirestore: Partial<ProviderProfile> = {
      bio: data.serviceDetails.bio,
      yearsOfExperience: data.serviceDetails.yearsOfExperience,
      servicesOffered: data.serviceDetails.servicesOffered,
      serviceAreas: data.serviceDetails.serviceAreas,
      weeklyAvailability: data.serviceDetails.weeklyAvailability || [],
      blockedDates: data.serviceDetails.blockedDates || [],
      name: userProfileUpdateData.name, // Denormalizando para providerProfile
      avatarUrl: userProfileUpdateData.avatarUrl, // Denormalizando para providerProfile
      isVerified: false, // O provedor inicia como não verificado
      averageRating: 0,
      totalReviews: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Define createdAt apenas se o documento não existir, ou atualiza se já existir
    // Usamos o FieldValue.serverTimestamp() para createdAt também
    const providerDoc = await providerProfileRef.get();
    if (!providerDoc.exists) {
        (providerProfileDataForFirestore as any).createdAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    batch.set(providerProfileRef, providerProfileDataForFirestore, { merge: true });

    try {
      await batch.commit();
      // Define a custom claim para a role "provider" e força a atualização do token
      await adminAuth.setCustomUserClaims(uid, { role: "provider", lastRefresh: Date.now() });
      console.log(`[ProvidersCallable] Cadastro de provedor para ${uid} submetido e role atualizado.`);
      return { success: true, message: "Cadastro de profissional enviado com sucesso! Aguarde a verificação." };
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

    // Validação de data.services
    if (!data.services || !Array.isArray(data.services) || data.services.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "A lista de serviços não pode ser vazia.");
    }
    for (const service of data.services) {
        if (!service.name || typeof service.price !== 'number' || service.price <= 0) {
            throw new functions.https.HttpsError("invalid-argument", "Cada serviço deve ter um nome, e um preço numérico positivo.");
        }
        // Adicione validações para outros campos de OfferedService se existirem (ex: description, duration)
    }

    try {
      await db.collection("providerProfiles").doc(uid).update({
        servicesOffered: data.services,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { success: true, message: "Serviços atualizados com sucesso." };
    } catch (error) { 
        console.error(`[ProvidersCallable] Erro ao atualizar serviços para ${uid}:`, error);
        throw new functions.https.HttpsError("internal", "Falha ao atualizar serviços.", (error as Error).message);
    }
  }
);

export const updateWeeklyAvailability = region(REGION).https.onCall(
  async (data: { availability: DailyAvailability[] }, context) => {
    if (!context.auth) { throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado."); }
    const uid = context.auth.uid;
    assertRole(context.auth, "provider");

    // Validação de data.availability
    if (!data.availability || !Array.isArray(data.availability)) {
        throw new functions.https.HttpsError("invalid-argument", "A disponibilidade deve ser um array válido.");
    }
    for (const dailyAvail of data.availability) {
        if (typeof dailyAvail.dayOfWeek !== 'number' || dailyAvail.dayOfWeek < 0 || dailyAvail.dayOfWeek > 6) {
            throw new functions.https.HttpsError("invalid-argument", "dayOfWeek deve ser um número entre 0 (domingo) e 6 (sábado).");
        }
        if (!Array.isArray(dailyAvail.intervals)) {
            throw new functions.https.HttpsError("invalid-argument", "Os intervalos de disponibilidade devem ser um array.");
        }
        for (const interval of dailyAvail.intervals) {
            if (typeof interval.startTime !== 'string' || typeof interval.endTime !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(interval.startTime) || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(interval.endTime)) {
                throw new functions.https.HttpsError("invalid-argument", "startTime e endTime devem ser strings no formato HH:MM.");
            }
            // Adicione lógica de validação de horário (ex: endTime > startTime) se necessário
        }
    }

    try {
      await db.collection("providerProfiles").doc(uid).update({
        weeklyAvailability: data.availability,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { success: true, message: "Disponibilidade atualizada com sucesso." };
    } catch (error) { 
        console.error(`[ProvidersCallable] Erro ao atualizar disponibilidade para ${uid}:`, error);
        throw new functions.https.HttpsError("internal", "Falha ao atualizar disponibilidade.", (error as Error).message);
    }
  }
);

export const updateBlockedDates = region(REGION).https.onCall(
  async (data: { dates: BlockedDate[] }, context) => {
    if (!context.auth) { throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado."); }
    const uid = context.auth.uid;
    assertRole(context.auth, "provider");

    // Validação de data.dates
    if (!data.dates || !Array.isArray(data.dates)) {
        throw new functions.https.HttpsError("invalid-argument", "A lista de datas bloqueadas deve ser um array.");
    }
    for (const blockedDate of data.dates) {
        if (typeof blockedDate.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(blockedDate.date)) {
            throw new functions.https.HttpsError("invalid-argument", "Cada data bloqueada deve ser uma string no formato YYYY-MM-DD.");
        }
        // Opcional: Adicione validação para 'reason' se for relevante
    }

    console.log(`[ProvidersCallable] ${uid} atualizando datas bloqueadas:`, data.dates);
    
    try {
      await db.collection("providerProfiles").doc(uid).update({ 
        blockedDates: data.dates, 
        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
      });
      return { success: true, message: "Datas bloqueadas atualizadas com sucesso." };
    } catch (error) {
      console.error(`[ProvidersCallable] Erro ao atualizar datas bloqueadas para ${uid}:`, error);
      throw new functions.https.HttpsError("internal", "Falha ao atualizar datas bloqueadas.", (error as Error).message);
    }
  }
);