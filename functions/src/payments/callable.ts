// LimpeJaApp/functions/src/payments/callable.ts
import * as functions from "firebase-functions";
import { region } from "firebase-functions/v1";
import admin, { db } from "../config/firebaseAdmin";
import { UserRole, Booking, ProviderProfile, PaymentHistoryItem, PaymentStatus } from "../types"; // PaymentStatus já está importado
import { assertRole } from "../utils/helpers";
import { createPixCharge } from "../services/paymentGateway.service"; // createPixCharge é chamado aqui

const REGION = "southamerica-east1";
const MINIMUM_PAYOUT_AMOUNT_CENTS = 5000; // R$ 50,00

interface RequestPayoutData {
  amountToWithdraw?: number;
}

export const requestProviderPayout = region(REGION).https.onCall(
  async (data: RequestPayoutData, context) => {
    assertRole(context.auth, "provider");
    const providerId = context.auth!.uid;

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
        if (!providerProfile.bankAccount?.pixKey) { throw new functions.https.HttpsError("failed-precondition", "Chave PIX não configurada no seu perfil."); }

        // Cria um registro da solicitação de repasse (será aprovado/processado por um admin)
        const payoutRequestRef = db.collection("payoutRequests").doc();
        transaction.set(payoutRequestRef, {
          providerId,
          amountRequested: amountToWithdraw,
          status: "pending_approval", // Status inicial da solicitação
          requestedAt: admin.firestore.FieldValue.serverTimestamp(),
          providerName: providerProfile.name,
          pixKey: providerProfile.bankAccount.pixKey,
          // Adicione outros dados relevantes para o admin processar o repasse
        });

        // Decrementa o saldo pendente do provedor imediatamente
        transaction.update(providerProfileRef, {
          pendingBalance: admin.firestore.FieldValue.increment(-amountToWithdraw),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info(`[PaymentsCallable] Solicitação de repasse de ${amountToWithdraw} para ${providerId} registrada.`);
        return { success: true, message: "Solicitação de repasse enviada com sucesso! Um administrador irá processá-la em breve." };
      });
    } catch (error: any) {
      functions.logger.error(`[PaymentsCallable] Erro ao solicitar repasse para ${providerId}:`, error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError("internal", "Não foi possível processar sua solicitação de repasse.", error.message);
    }
  }
);


interface GetPaymentHistoryData {
    limit?: number;
    startAfterId?: string;
}

export const getMyPaymentHistory = region(REGION).https.onCall(
    async(data: GetPaymentHistoryData, context) => {
        assertRole(context.auth, ["client", "provider"]);
        const userId = context.auth!.uid;
        const userRole = context.auth!.token.role as UserRole;
        const { limit = 10, startAfterId } = data;

        functions.logger.info(`[PaymentsCallable] Usuário ${userId} (Role: ${userRole}) buscando histórico de pagamentos.`);
        
        try {
            const paymentHistoryItems: PaymentHistoryItem[] = [];
            let bookingsQuery: admin.firestore.Query = db.collection("bookings")
                .where(userRole === "client" ? "clientId" : "providerId", "==", userId)
                .where("status", "==", "finalized") // Apenas bookings finalizados
                .orderBy("updatedAt", "desc")
                .limit(limit);

            if (startAfterId) {
                const lastDoc = await db.collection("bookings").doc(startAfterId).get();
                if (lastDoc.exists) {
                    bookingsQuery = bookingsQuery.startAfter(lastDoc);
                } else {
                    functions.logger.warn(`[PaymentsCallable] Documento startAfterId ${startAfterId} não encontrado para paginação.`);
                }
            }
            const bookingsSnapshot = await bookingsQuery.get();
            bookingsSnapshot.forEach(doc => {
                const booking = doc.data() as Booking;
                // Adiciona item de histórico para o cliente (pagamento feito)
                if (userRole === "client" && booking.clientId === userId && booking.paymentStatus === "paid") {
                    paymentHistoryItems.push({
                        id: doc.id,
                        type: "payment_made",
                        description: `Serviço: ${booking.serviceSnapshot.name} com ${booking.providerName}`,
                        amount: -(booking.totalPrice || 0), // Negativo para pagamento feito
                        currency: booking.serviceSnapshot.currency,
                        date: (booking.paymentConfirmedAt || booking.updatedAt as admin.firestore.Timestamp).toDate().toISOString(),
                        status: "Concluído",
                        details: { bookingId: booking.bookingId, providerId: booking.providerId }
                    });
                }
                // Adiciona item de histórico para o provedor (ganho recebido)
                if (userRole === "provider" && booking.providerId === userId && booking.paymentStatus === "paid") {
                    paymentHistoryItems.push({
                        id: doc.id,
                        type: "earning_received",
                        description: `Serviço: ${booking.serviceSnapshot.name} de ${booking.clientName}`,
                        amount: (booking.providerEarnings || 0),
                        currency: booking.serviceSnapshot.currency,
                        date: (booking.paymentConfirmedAt || booking.updatedAt as admin.firestore.Timestamp).toDate().toISOString(),
                        status: "Concluído",
                        details: { bookingId: booking.bookingId, clientId: booking.clientId }
                    });
                }
            });

            // Opcional: Buscar também registros da coleção "payoutRequests" para provedores
            if (userRole === "provider") {
                let payoutRequestsQuery: admin.firestore.Query = db.collection("payoutRequests")
                    .where("providerId", "==", userId)
                    .orderBy("requestedAt", "desc")
                    .limit(limit); // Pode precisar de paginação separada ou unificada

                const payoutRequestsSnapshot = await payoutRequestsQuery.get();
                payoutRequestsSnapshot.forEach(doc => {
                    const payout = doc.data() as any; // Tipar melhor PayoutRequest
                    paymentHistoryItems.push({
                        id: doc.id,
                        type: "payout_requested",
                        description: `Solicitação de Repasse`,
                        amount: -(payout.amountRequested || 0), // Negativo para saque solicitado
                        currency: "BRL", // Assumindo BRL para repasses
                        date: (payout.requestedAt as admin.firestore.Timestamp).toDate().toISOString(),
                        status: payout.status === "pending_approval" ? "Pendente" : payout.status,
                        details: { payoutRequestId: doc.id }
                    });
                });
            }

            // Ordena todos os itens por data (mais recente primeiro)
            paymentHistoryItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return { success: true, history: paymentHistoryItems.slice(0, limit) };
        } catch (error) {
            functions.logger.error(`[PaymentsCallable] Erro ao buscar histórico para ${userId}:`, error);
            throw new functions.https.HttpsError("internal", "Falha ao buscar histórico de pagamentos.", (error as Error).message);
        }
    }
);

interface RetryPaymentData {
    bookingId: string;
}

export const retryBookingPayment = region(REGION).https.onCall(
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
            if (!booking.totalPrice || booking.totalPrice <= 0) { throw new functions.https.HttpsError("internal", "Valor do serviço inválido para pagamento."); }

            // Chama a função real de criação de cobrança no serviço
            const pixChargeInfo = await createPixCharge( booking.totalPrice, booking.bookingId, `Pagamento LimpeJá: ${booking.serviceSnapshot.name}`);
            
            // Atualiza o booking com os novos dados da cobrança PIX
            await bookingRef.update({ 
                paymentGatewayRefId: pixChargeInfo.pixTransactionId,
                paymentStatus: "awaiting_payment_confirmation" as PaymentStatus,
                pixQrCode: pixChargeInfo.qrCode,
                pixCode: pixChargeInfo.copiaECola,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, message: "Nova solicitação PIX gerada com sucesso.", pixData: pixChargeInfo };
        } catch (error:any) {
            functions.logger.error(`[PaymentsCallable] Erro ao refazer pagamento para booking ${bookingId}:`, error);
            if (error instanceof functions.https.HttpsError) throw error;
            throw new functions.https.HttpsError("internal", "Falha ao refazer o pagamento.", error.message);
        }
    }
);