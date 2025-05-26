// LimpeJaApp/functions/src/admin/callable.ts
import * as functions from "firebase-functions"; // Necessário para functions.https.HttpsError
import { region } from "firebase-functions/v1";
import admin, { db, auth as adminAuth } from "../config/firebaseAdmin";
// Importe apenas os tipos que são REALMENTE usados neste arquivo ou em TODOs próximos.
// Se UserProfile e ProviderProfile são usados apenas para casts e os TODOs não os usarão diretamente
// em novas funções aqui, eles poderiam ser omitidos e o cast feito com 'as any' ou tipos mais específicos.
// No entanto, para clareza e desenvolvimento futuro dos TODOs, é bom mantê-los se forem relevantes.
// 'Booking' não parece ser usado neste arquivo específico.
import { UserProfile, ProviderProfile } from "../types"; 
import { assertRole } from "../utils/helpers"; 

const REGION = "southamerica-east1";

interface VerifyProviderData {
  providerId: string;
  isVerified: boolean;
  verificationNotes?: string;
}

export const setProviderVerificationStatus = region(REGION).https.onCall(
  async (data: VerifyProviderData, context) => {
    assertRole(context.auth, "admin"); 

    const { providerId, isVerified, verificationNotes } = data;

    if (!providerId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "O ID do prestador (providerId) é obrigatório."
      );
    }

    const providerProfileRef = db.collection("providerProfiles").doc(providerId);
    const userProfileRef = db.collection("users").doc(providerId); // Esta variável AGORA SERÁ USADA

    console.log(`[AdminCallable] Admin ${context.auth?.uid} está atualizando status de verificação do prestador ${providerId} para ${isVerified}. Notas: ${verificationNotes || "N/A"}`);

    try {
      const batch = db.batch();
      const updateDataProviderProfile: Partial<ProviderProfile> = { // Tipagem para clareza
        isVerified: isVerified,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (verificationNotes) {
        // Supondo que ProviderProfile tenha um campo notesOnVerification
        // Se não, você precisaria adicionar em types/provider.types.ts
        (updateDataProviderProfile as any).notesOnVerification = verificationNotes; 
      }
      batch.update(providerProfileRef, updateDataProviderProfile);

      // Atualizando um campo no UserProfile para espelhar a verificação do provedor
      // Garanta que UserProfile em types/user.types.ts tenha 'isProviderVerified?: boolean;'
      const updateUserProfileData: Partial<UserProfile> = {
          isProviderVerified: isVerified, // <<-- USO DE userProfileRef
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      batch.update(userProfileRef, updateUserProfileData); // <<-- USO DE userProfileRef

      await batch.commit();

      // TODO: Enviar notificação para o prestador sobre a mudança no status de verificação.
      // Ex: await sendPushNotification(providerId, { title: "Seu perfil foi atualizado!", body: `Status de verificação: ${isVerified}`});

      console.log(`[AdminCallable] Status de verificação do prestador ${providerId} atualizado com sucesso para ${isVerified}.`);
      return { success: true, message: `Status de verificação do prestador atualizado para ${isVerified}.` };
    } catch (error) {
      console.error(`[AdminCallable] Erro ao atualizar status de verificação do prestador ${providerId}:`, error);
      throw new functions.https.HttpsError(
        "internal",
        "Não foi possível atualizar o status de verificação do prestador.",
        (error as Error).message
      );
    }
  }
);


interface BanUserData {
    userIdToManage: string;
    disable: boolean;
    reason?: string;
}

export const setUserDisabledStatus = region(REGION).https.onCall(
  async (data: BanUserData, context) => {
    assertRole(context.auth, "admin");

    const { userIdToManage, disable, reason } = data;

    if (!userIdToManage) {
      throw new functions.https.HttpsError("invalid-argument", "O ID do usuário (userIdToManage) é obrigatório.");
    }

    console.log(`[AdminCallable] Admin ${context.auth?.uid} está ${disable ? 'DESABILITANDO' : 'HABILITANDO'} usuário ${userIdToManage}. Razão: ${reason || 'N/A'}`);

    try {
      await adminAuth.updateUser(userIdToManage, { disabled: disable });

      const userProfileRef = db.collection("users").doc(userIdToManage);
      // Garanta que UserProfile tenha 'isDisabledByAdmin' e 'disabledReason'
      const userProfileUpdate: Partial<UserProfile> = {
        isDisabledByAdmin: disable,
        disabledReason: disable ? (reason || "Conta desabilitada pelo administrador.") : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await userProfileRef.update(userProfileUpdate);

      const providerProfileRef = db.collection("providerProfiles").doc(userIdToManage);
      const providerDoc = await providerProfileRef.get();
      if (providerDoc.exists) {
        // Garanta que ProviderProfile tenha 'isDisabledByAdmin' se quiser espelhar
        await providerProfileRef.update({
            isDisabledByAdmin: disable, 
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // TODO: Enviar notificação para o usuário sobre a mudança de status da conta.

      const action = disable ? "desabilitado" : "reabilitado";
      console.log(`[AdminCallable] Usuário ${userIdToManage} foi ${action} com sucesso.`);
      return { success: true, message: `Usuário ${action} com sucesso.` };

    } catch (error: any) {
      console.error(`[AdminCallable] Erro ao ${disable ? 'desabilitar' : 'habilitar'} usuário ${userIdToManage}:`, error);
      throw new functions.https.HttpsError(
        "internal",
        `Não foi possível ${disable ? 'desabilitar' : 'habilitar'} o usuário.`,
        error.message
      );
    }
  }
);


interface GetPlatformAnalyticsData {
    period?: 'daily' | 'weekly' | 'monthly' | 'custom';
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
}

export const getPlatformAnalytics = region(REGION).https.onCall(
  async (data: GetPlatformAnalyticsData, context) => {
    assertRole(context.auth, "admin");

    console.log(`[AdminCallable] Admin ${context.auth?.uid} solicitando analíticas para o período: ${data.period || 'geral'}`);

    // TODO: Implementar lógica real para buscar e agregar dados do Firestore.
    // Esta é uma função complexa que dependerá de como seus dados são estruturados
    // e quais métricas você precisa.
    // Ex: Contar usuários criados em um período, agendamentos concluídos, etc.

    const analyticsData = {
      period: data.period || 'geral (mock)',
      newClients: Math.floor(Math.random() * 100),
      newProviders: Math.floor(Math.random() * 20),
      completedBookings: Math.floor(Math.random() * 200),
      // Adicione mais métricas mockadas ou reais
    };

    console.log("[AdminCallable] Retornando dados analíticos (simulados):", analyticsData);
    return { success: true, data: analyticsData };
  }
);

// TODO: Adicionar mais funções administrativas que você listou anteriormente, como:
// - manageDispute(data: { bookingId: string, resolutionDetails: string }, context)
//   (Precisaria importar o tipo 'Booking' se for usá-lo aqui)
// - sendMessageToAllUsers(data: { title: string, body: string, targetRole?: UserRole }, context)
// - getProviderApplications(data: { status: 'pending' | 'all' }, context) -> lista de prestadores aguardando verificação