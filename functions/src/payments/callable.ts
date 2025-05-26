// LimpeJaApp/functions/src/payments/callable.ts
import * as functions from "firebase-functions"; // Usado para HttpsError e logger
import { region } from "firebase-functions/v1";
import admin, { db } from "../config/firebaseAdmin";
import { UserRole, Booking, ProviderProfile, PaymentHistoryItem } from "../types";
import { assertRole } from "../utils/helpers"; // assertRole espera context.auth
import { createPixCharge } from "../services/paymentGateway.service";

const REGION = "southamerica-east1";
const MINIMUM_PAYOUT_AMOUNT_CENTS = 5000;

interface RequestPayoutData {
  amountToWithdraw?: number;
}

export const requestProviderPayout = region(REGION).https.onCall(
  // 'context' aqui já é do tipo functions.https.CallableContext da v1
  async (data: RequestPayoutData, context) => {
    // A chamada para assertRole usa context.auth, que é compatível com V1CallableAuthContext | undefined
    assertRole(context.auth, "provider");
    const providerId = context.auth!.uid; // '!' é seguro aqui por causa do assertRole

    functions.logger.info(`[PaymentsCallable] Prestador ${providerId} solicitando repasse. Dados:`, data);
    const providerProfileRef = db.collection("providerProfiles").doc(providerId);

    try {
      return await db.runTransaction(async (transaction) => {
        const providerDoc = await transaction.get(providerProfileRef);
        if (!providerDoc.exists) {
          throw new functions.https.HttpsError("not-found", "Perfil de prestador não encontrado.");
        }
        const providerProfile = providerDoc.data() as ProviderProfile;

        const pendingBalance = providerProfile.pendingBalance || 0;
        const amountToWithdraw = data.amountToWithdraw || pendingBalance;

        if (amountToWithdraw <= 0) { throw new functions.https.HttpsError("invalid-argument", "O valor para saque deve ser positivo."); }
        if (amountToWithdraw > pendingBalance) { throw new functions.https.HttpsError("failed-precondition", "Saldo insuficiente."); }
        if (amountToWithdraw < MINIMUM_PAYOUT_AMOUNT_CENTS) { throw new functions.https.HttpsError("failed-precondition", `Saque mínimo: R$${(MINIMUM_PAYOUT_AMOUNT_CENTS / 100).toFixed(2)}.`); }
        if (!providerProfile.bankAccount?.pixKey) { throw new functions.https.HttpsError("failed-precondition", "Chave PIX não configurada."); }

        const payoutRequestRef = db.collection("payoutRequests").doc();
        transaction.set(payoutRequestRef, {
          providerId,
          amountRequested: amountToWithdraw,
          status: "pending_approval",
          requestedAt: admin.firestore.FieldValue.serverTimestamp(),
          providerName: providerProfile.name,
          pixKey: providerProfile.bankAccount.pixKey,
        });

        transaction.update(providerProfileRef, {
          pendingBalance: admin.firestore.FieldValue.increment(-amountToWithdraw),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info(`[PaymentsCallable] Solicitação de repasse de ${amountToWithdraw} para ${providerId} registrada.`);
        return { success: true, message: "Solicitação de repasse enviada." };
      });
    } catch (error: any) {
      functions.logger.error(`[PaymentsCallable] Erro ao solicitar repasse para ${providerId}:`, error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError("internal", "Não foi possível processar sua solicitação.", error.message);
    }
  }
);


interface GetPaymentHistoryData {
    limit?: number;
    startAfterId?: string;
}

export const getMyPaymentHistory = region(REGION).https.onCall(
    // 'context' aqui já é do tipo functions.https.CallableContext da v1
    async(data: GetPaymentHistoryData, context) => {
        assertRole(context.auth, ["client", "provider"]);
        const userId = context.auth!.uid;
        const userRole = context.auth!.token.role as UserRole;
        const { limit = 10, startAfterId } = data;

        functions.logger.info(`[PaymentsCallable] Usuário ${userId} (Role: ${userRole}) buscando histórico.`);
        
        try {
            const paymentHistoryItems: PaymentHistoryItem[] = [];
            let bookingsQuery: admin.firestore.Query = db.collection("bookings")
                .where(userRole === "client" ? "clientId" : "providerId", "==", userId)
                .where("status", "==", "finalized")
                .orderBy("updatedAt", "desc")
                .limit(limit);

            if (startAfterId) {
                const lastDoc = await db.collection("bookings").doc(startAfterId).get();
                if (lastDoc.exists) {
                    bookingsQuery = bookingsQuery.startAfter(lastDoc);
                }
            }
            const bookingsSnapshot = await bookingsQuery.get();
            bookingsSnapshot.forEach(doc => {
                const booking = doc.data() as Booking;
                paymentHistoryItems.push({
                    id: doc.id,
                    type: userRole === "client" ? "payment_made" : "earning_received",
                    description: `Serviço: ${booking.serviceSnapshot.name} com ${userRole === "client" ? booking.providerName : booking.clientName}`,
                    amount: userRole === "client" ? (booking.totalPrice || 0) : (booking.providerEarnings || 0),
                    currency: booking.serviceSnapshot.currency,
                    date: (booking.updatedAt as admin.firestore.Timestamp).toDate().toISOString(),
                    status: "completed",
                    details: { bookingId: booking.bookingId }
                });
            });
            return { success: true, history: paymentHistoryItems.slice(0, limit) };
        } catch (error) {
            functions.logger.error(`[PaymentsCallable] Erro ao buscar histórico para ${userId}:`, error);
            throw new functions.https.HttpsError("internal", "Falha ao buscar histórico.", (error as Error).message);
        }
    }
);

interface RetryPaymentData {
    bookingId: string;
}

export const retryBookingPayment = region(REGION).https.onCall(
    // 'context' aqui já é do tipo functions.https.CallableContext da v1
    async (data: RetryPaymentData, context) => {
        assertRole(context.auth, "client");
        const clientId = context.auth!.uid;
        const { bookingId } = data;

        if (!bookingId) {
            throw new functions.https.HttpsError("invalid-argument", "bookingId é obrigatório.");
        }
        functions.logger.info(`[PaymentsCallable] Cliente ${clientId} refazendo pagamento para booking ${bookingId}.`);
        const bookingRef = db.collection("bookings").doc(bookingId);
        try {
            const bookingDoc = await bookingRef.get();
            if (!bookingDoc.exists) { throw new functions.https.HttpsError("not-found", "Agendamento não encontrado."); }
            const booking = bookingDoc.data() as Booking;

            if (booking.clientId !== clientId) { throw new functions.https.HttpsError("permission-denied", "Agendamento não pertence a você."); }
            if (booking.paymentStatus === "paid" || booking.status === "scheduled_paid" || booking.status === "finalized") { throw new functions.https.HttpsError("failed-precondition", "Pagamento já realizado ou finalizado."); }
            if (booking.status === "cancelled_by_client" || booking.status === "cancelled_by_provider") { throw new functions.https.HttpsError("failed-precondition", "Agendamento cancelado."); }
            if (!booking.totalPrice || booking.totalPrice <= 0) { throw new functions.https.HttpsError("internal", "Valor do serviço inválido."); }

            const pixChargeInfo = await createPixCharge( booking.totalPrice, booking.bookingId, `Pagamento LimpeJá: ${booking.serviceSnapshot.name}`);
            
            await bookingRef.update({ 
                paymentIntentId: pixChargeInfo.pixTransactionId,
                paymentStatus: "pending_payment",
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, message: "Nova solicitação PIX gerada.", pixData: pixChargeInfo };
        } catch (error:any) {
            functions.logger.error(`[PaymentsCallable] Erro ao refazer pagamento para booking ${bookingId}:`, error);
            if (error instanceof functions.https.HttpsError) throw error;
            throw new functions.https.HttpsError("internal", "Falha ao refazer o pagamento.", error.message);
        }
    }
);