// LimpeJaApp/functions/src/admin/callable.ts
import * as functions from "firebase-functions"; // Importa 'functions' para HttpsError e logger
import { region } from "firebase-functions/v1"; // Importa 'region' e 'https' para funções Callable de Gen 1
import * as admin from 'firebase-admin'; // Importa 'admin' para admin.firestore.FieldValue
import { db } from "../config/firebaseAdmin"; // Importa 'db'
import { assertRole } from "../utils/helpers"; // Assumindo que você tem uma função assertRole
import { UserRole } from "../types/user.types"; // Importação usada para tipagem.
import { ProviderProfile } from "../types/provider.types"; // Importação usada para tipagem.
import { Booking } from "../types/booking.types"; // Importação usada para tipagem.

const REGION = "southamerica-east1"; // Defina a região para suas funções

export const setProviderVerificationStatus = region(REGION).https.onCall( // CONVERTIDO PARA GEN 1
    async (data: { providerId: string; isVerified: boolean }, context) => { // CONVERTIDO PARA GEN 1
        // 1. Autenticação e Autorização: Apenas administradores podem chamar esta função.
        if (!context.auth) { // CONVERTIDO PARA GEN 1
            throw new functions.https.HttpsError( // CONVERTIDO PARA GEN 1
                "unauthenticated",
                "A solicitação deve ser autenticada."
            );
        }
        // [CORREÇÃO] Passar o objeto 'context.auth' diretamente para assertRole
        // A assinatura de assertRole em helpers.ts já aceita 'CallableContext.auth' (que é V1CallableAuthContext | undefined)
        assertRole(context.auth, "admin"); // CONVERTIDO PARA GEN 1

        // 2. Validação dos dados de entrada
        const { providerId, isVerified } = data;

        if (!providerId || typeof isVerified !== "boolean") {
            throw new functions.https.HttpsError( // CONVERTIDO PARA GEN 1
                "invalid-argument",
                "ID do provedor e status de verificação são obrigatórios."
            );
        }

        try {
            // 3. Atualizar o status de verificação do provedor no Firestore
            const providerRef = db.collection("providerProfiles").doc(providerId);
            await providerRef.update({
                isVerified: isVerified,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            functions.logger.info(`[Admin Callable] Status de verificação do provedor ${providerId} alterado para ${isVerified}`);
            return { success: true, message: `Status de verificação do provedor ${providerId} atualizado para ${isVerified}.` };
        } catch (error: any) {
            functions.logger.error(`[Admin Callable] Erro ao definir status de verificação para ${providerId}:`, error);
            throw new functions.https.HttpsError( // CONVERTIDO PARA GEN 1
                "internal",
                "Falha ao atualizar o status de verificação do provedor.",
                error.message || error
            );
        }
    }
);


export const setUserDisabledStatus = region(REGION).https.onCall( // CONVERTIDO PARA GEN 1
    async (data: { userId: string; isDisabled: boolean }, context) => { // CONVERTIDO PARA GEN 1
        // 1. Autenticação e Autorização: Apenas administradores podem chamar esta função.
        if (!context.auth) { // CONVERTIDO PARA GEN 1
            throw new functions.https.HttpsError( // CONVERTIDO PARA GEN 1
                "unauthenticated",
                "A solicitação deve ser autenticada."
            );
        }
        // [CORREÇÃO] Passar o objeto 'context.auth' diretamente para assertRole
        assertRole(context.auth, "admin"); // CONVERTIDO PARA GEN 1

        // 2. Validação dos dados de entrada
        const { userId, isDisabled } = data;

        if (!userId || typeof isDisabled !== "boolean") {
            throw new functions.https.HttpsError( // CONVERTIDO PARA GEN 1
                "invalid-argument",
                "ID do usuário e status de desativação são obrigatórios."
            );
        }

        try {
            // 3. Atualizar o status 'disabled' do usuário no Firebase Authentication
            const userRecord = await admin.auth().updateUser(userId, {
                disabled: isDisabled,
            });

            // Opcional: Atualizar um campo no Firestore 'users' para refletir o status,
            // ou confiar apenas no status do Auth para login
            await db.collection("users").doc(userId).update({
                isDisabled: isDisabled,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            functions.logger.info(`[Admin Callable] Status de desativação do usuário ${userId} alterado para ${isDisabled}`);
            return { success: true, message: `Status de desativação do usuário ${userId} atualizado para ${isDisabled}.` };
        } catch (error: any) {
            functions.logger.error(`[Admin Callable] Erro ao definir status de desativação para ${userId}:`, error);
            throw new functions.https.HttpsError( // CONVERTIDO PARA GEN 1
                "internal",
                "Falha ao atualizar o status de desativação do usuário.",
                error.message || error
            );
        }
    }
);


export const getPlatformAnalytics = region(REGION).https.onCall( // CONVERTIDO PARA GEN 1
    async (data: any, context) => { // CONVERTIDO PARA GEN 1
        // 1. Autenticação e Autorização: Apenas administradores podem chamar esta função.
        if (!context.auth) { // CONVERTIDO PARA GEN 1
            throw new functions.https.HttpsError( // CONVERTIDO PARA GEN 1
                "unauthenticated",
                "A solicitação deve ser autenticada."
            );
        }
        // [CORREÇÃO] Passar o objeto 'context.auth' diretamente para assertRole
        assertRole(context.auth, "admin"); // CONVERTIDO PARA GEN 1

        try {
            // Exemplos de métricas para coletar:
            const totalUsers = (await db.collection("users").count().get()).data().count;
            const totalProviders = (await db.collection("providerProfiles").count().get()).data().count;
            const totalBookings = (await db.collection("bookings").count().get()).data().count;

            functions.logger.info(`[Admin Callable] Coletando analíticos da plataforma.`);
            return {
                success: true,
                analytics: {
                    totalUsers,
                    totalProviders,
                    totalBookings,
                },
            };
        } catch (error: any) {
            functions.logger.error("[Admin Callable] Erro ao obter analíticos da plataforma:", error);
            throw new functions.https.HttpsError( // CONVERTIDO PARA GEN 1
                "internal",
                "Falha ao obter dados de analíticos da plataforma.",
                error.message || error
            );
        }
    }
);

// TODO: Adicionar outras funções callable de administração conforme necessário,
// como gerenciar categorias de serviço, banir usuários, etc.