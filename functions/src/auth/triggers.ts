// LimpeJaApp/functions/src/auth/triggers.ts
// import * as functions from "firebase-functions"; // REMOVIDO - TS6133
import { region } from "firebase-functions/v1"; // 'region' é usado
import admin, { db, auth as adminAuth } from "../config/firebaseAdmin";
import { UserProfile, UserRole } from "../types"; // Assegure que UserRole está em types/index.ts

const REGION = "southamerica-east1";

export const processNewUser = region(REGION)
  .auth.user()
  .onCreate(async (userRecord) => {
    // Use functions.logger.info se precisar logar e tiver importado * as functions
    // console.log ou functions.logger.info são boas opções para Cloud Functions
    console.log(`[AuthTrigger] Novo usuário: ${userRecord.uid}, Email: ${userRecord.email}`);

    const userRole: UserRole = "client"; // Role padrão

    // Omitindo 'id' porque o ID do documento será o userRecord.uid
    // Omitindo 'createdAt' e 'updatedAt' porque estamos usando FieldValue.serverTimestamp()
    const userProfileData: Omit<UserProfile, "id" | "createdAt" | "updatedAt"> = {
      email: userRecord.email || `user_${userRecord.uid}@limpeja.com`, // Email é obrigatório, use um fallback se necessário
      role: userRole,
      name: userRecord.displayName || userRecord.email?.split("@")[0] || "Usuário LimpeJá",
      avatarUrl: userRecord.photoURL || undefined,
      phone: userRecord.phoneNumber || undefined,
      addresses: [], // Começa com uma lista de endereços vazia
      // createdAt e updatedAt serão adicionados com FieldValue.serverTimestamp()
    };

    const profileWithTimestamps = {
        ...userProfileData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      await db.collection("users").doc(userRecord.uid).set(profileWithTimestamps);
      console.log(`[AuthTrigger] Perfil de usuário criado para ${userRecord.uid} com role ${userRole}`);

      await adminAuth.setCustomUserClaims(userRecord.uid, { role: userRole, lastRefresh: Date.now() });
      console.log(`[AuthTrigger] Custom claim 'role: ${userRole}' definido para ${userRecord.uid}`);
    } catch (error) {
      console.error(`[AuthTrigger] Erro ao processar novo usuário ${userRecord.uid}:`, error);
    }
  });

export const cleanupUser = region(REGION)
  .auth.user()
  .onDelete(async (userRecord) => {
    console.log(`[AuthTrigger] Usuário deletado: ${userRecord.uid}, Email: ${userRecord.email}`);
    try {
      await db.collection("users").doc(userRecord.uid).delete();
      console.log(`[AuthTrigger] Perfil do usuário ${userRecord.uid} deletado do Firestore.`);

      const providerProfileRef = db.collection("providerProfiles").doc(userRecord.uid);
      const providerProfileDoc = await providerProfileRef.get();
      if (providerProfileDoc.exists) {
          await providerProfileRef.delete();
          console.log(`[AuthTrigger] Perfil de provedor ${userRecord.uid} deletado do Firestore.`);
      }
      
      // TODO: Adicionar lógica para limpar outros dados relacionados (agendamentos, avaliações ativas, etc.)
    } catch (error) {
      console.error(`[AuthTrigger] Erro ao limpar dados do usuário ${userRecord.uid}:`, error);
    }
  });