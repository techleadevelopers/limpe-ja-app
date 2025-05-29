// LimpeJaApp/functions/src/payments/triggers.ts
import * as functions from "firebase-functions";
import { region } from "firebase-functions/v1";
import admin, { db } from "../config/firebaseAdmin";
import { Booking, ProviderProfile, NotificationPayload, NotificationType } from "../types";
import { processPixPayout } from "../services/paymentGateway.service"; // processPixPayout é chamado aqui
import { sendPushNotification } from "../services/notification.service";

const REGION = "southamerica-east1";

export const onBookingFinalizedProcessPayment = region(REGION)
  .firestore.document("bookings/{bookingId}")
  .onUpdate(async (change, context) => {
    const bookingId = context.params.bookingId;
    const newBookingData = change.after.data() as Booking;
    const oldBookingData = change.before.data() as Booking;

    // Este trigger é acionado quando o status do booking muda para 'finalized' E o paymentStatus é 'paid'.
    // Isso geralmente acontece após o webhook do PSP confirmar o pagamento.
    if (
      newBookingData.status === "finalized" &&
      oldBookingData.status !== "finalized" &&
      newBookingData.paymentStatus === "paid"
    ) {
      functions.logger.info(`[PaymentsTrigger] Agendamento ${bookingId} finalizado e pago. Processando para provedor ${newBookingData.providerId}.`);

      if (!newBookingData.totalPrice || newBookingData.totalPrice <= 0) {
        functions.logger.error(`[PaymentsTrigger] Preço total inválido para booking ${bookingId}. Abortando processamento de pagamento.`);
        return null;
      }
      if (!newBookingData.providerId) {
        functions.logger.error(`[PaymentsTrigger] providerId ausente no booking ${bookingId}. Abortando processamento de pagamento.`);
        return null;
      }

      const commissionRate = newBookingData.commissionRate || 0.20;
      const commissionValue = Math.round(newBookingData.totalPrice * commissionRate);
      const providerEarnings = newBookingData.totalPrice - commissionValue;

      if (providerEarnings <= 0) {
        functions.logger.error(`[PaymentsTrigger] Ganhos do provedor calculados como zero ou negativo para booking ${bookingId}. Verifique o preço total e a taxa de comissão.`);
        await db.collection("bookings").doc(bookingId).update({
          paymentStatus: "payout_error", // Marca como erro de repasse
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
      }

      try {
        // Atualiza o booking com os valores de comissão e ganhos, e status de pagamento como 'payout_pending'
        const bookingUpdateData = {
          commissionRate,
          commissionValue,
          providerEarnings,
          paymentStatus: "payout_pending" as const, // Marcando que o repasse está pendente
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection("bookings").doc(bookingId).update(bookingUpdateData);
        functions.logger.info(`[PaymentsTrigger] Comissão calculada para ${bookingId}. Prestador ganha: ${providerEarnings}. Status de pagamento: payout_pending.`);

        // Atualiza o saldo pendente e o total histórico ganho do provedor
        const providerProfileRef = db.collection("providerProfiles").doc(newBookingData.providerId);

        await providerProfileRef.update({
          pendingBalance: admin.firestore.FieldValue.increment(providerEarnings),
          totalEarnedHistorical: admin.firestore.FieldValue.increment(providerEarnings),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info(`[PaymentsTrigger] Saldo pendente do provedor ${newBookingData.providerId} atualizado com +${providerEarnings}.`);

        // Notificação push para o provedor sobre os ganhos processados
        const providerUserSnap = await db.collection("users").doc(newBookingData.providerId).get();
        const providerUserData = providerUserSnap.data();
        if (providerUserData && providerUserData.fcmTokens && providerUserData.fcmTokens.length > 0) {
          const notificationPayload1: NotificationPayload = {
            title: "LimpeJá: Ganhos Processados!",
            body: `Seu agendamento #${bookingId} foi finalizado. ${newBookingData.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} pagos, ${providerEarnings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} creditados no seu saldo!`,
            data: {
              screen: "Earnings",
              notificationType: "BOOKING_PAID" as NotificationType,
              bookingId: bookingId,
              providerEarnings: providerEarnings.toString(),
            },
          };
          await sendPushNotification(providerUserData.fcmTokens, notificationPayload1, {
            saveToFirestore: true,
            userIdToSave: newBookingData.providerId,
            typeToSave: "BOOKING_PAID",
            navigateTo: "Earnings",
          });
          functions.logger.info(`[PaymentsTrigger] Notificação de ganhos enviados para o provedor ${newBookingData.providerId}.`);
        }

        // Tenta iniciar o repasse automático para o provedor se a chave PIX estiver configurada
        const providerProfileSnap = await providerProfileRef.get();
        if (providerProfileSnap.exists) {
          const providerProfile = providerProfileSnap.data() as ProviderProfile;
          // Garante que nome e CPF também existam, pois são necessários para o repasse.
          if (providerProfile.bankAccount?.pixKey && providerProfile.name && providerProfile.cpf) { 
            try {
              const payoutResult = await processPixPayout( // Chama a função real de repasse
                providerProfile.bankAccount.pixKey,
                providerProfile.name,
                providerProfile.cpf, // Passa o CPF/CNPJ do provedor
                providerEarnings,
                `Repasse LimpeJá - Agendamento ${bookingId}`,
                bookingId
              );

              if (payoutResult.success) {
                await db.collection("bookings").doc(bookingId).update({
                  paymentStatus: "payout_processing", // Repasse em processamento
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                // Decrementa o pendingBalance imediatamente para refletir o saque
                await providerProfileRef.update({
                  pendingBalance: admin.firestore.FieldValue.increment(-providerEarnings),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                functions.logger.info(`[PaymentsTrigger] Repasse PIX para ${newBookingData.providerId} referente ao booking ${bookingId} iniciado/processado. Saldo pendente decrementado.`);

                if (providerUserData && providerUserData.fcmTokens && providerUserData.fcmTokens.length > 0) {
                  const notificationPayload2: NotificationPayload = {
                    title: "LimpeJá: Repasse em Andamento!",
                    body: `Seu repasse de ${providerEarnings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} referente ao agendamento #${bookingId} foi iniciado. O valor deve cair em breve na sua conta.`,
                    data: {
                      screen: "Earnings",
                      notificationType: "BOOKING_PAID" as NotificationType, // Ou "PAYOUT_INITIATED"
                      bookingId: bookingId,
                      providerEarnings: providerEarnings.toString(),
                    },
                  };
                  await sendPushNotification(providerUserData.fcmTokens, notificationPayload2, {
                    saveToFirestore: true,
                    userIdToSave: newBookingData.providerId,
                    typeToSave: "BOOKING_PAID",
                    navigateTo: "Earnings",
                  });
                }
              } else {
                functions.logger.error(`[PaymentsTrigger] Falha ao iniciar repasse PIX para ${newBookingData.providerId} (booking ${bookingId}):`, payoutResult.message);
                await db.collection("bookings").doc(bookingId).update({
                  paymentStatus: "payout_error",
                  payoutAttemptError: payoutResult.message,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
              }

            } catch (payoutError: any) {
              functions.logger.error(`[PaymentsTrigger] Erro inesperado ao tentar o repasse PIX automático para ${newBookingData.providerId} (booking ${bookingId}):`, payoutError.message);
              await db.collection("bookings").doc(bookingId).update({
                paymentStatus: "payout_error",
                payoutAttemptError: payoutError.message,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          } else {
            functions.logger.warn(`[PaymentsTrigger] Chave PIX, nome ou CPF/CNPJ não configurado para repasse automático ao provedor ${newBookingData.providerId} (booking ${bookingId}). Repasse permanece pendente para processamento manual.`);
            // Marcar o booking com um status que indique necessidade de repasse manual
            await db.collection("bookings").doc(bookingId).update({
                paymentStatus: "payout_manual_required",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        } else {
          functions.logger.error(`[PaymentsTrigger] Perfil do provedor ${newBookingData.providerId} não encontrado para atualizar saldo/repassar.`);
          await db.collection("bookings").doc(bookingId).update({
            paymentStatus: "payout_error",
            payoutAttemptError: "Perfil do provedor não encontrado para repasse.",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

      } catch (error) {
        functions.logger.error(`[PaymentsTrigger] Erro crítico ao processar pagamento finalizado para booking ${bookingId}:`, error);
        await db.collection("bookings").doc(bookingId).update({
          paymentStatus: "payout_error",
          payoutProcessingError: (error as Error).message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } else {
      functions.logger.info(`[PaymentsTrigger] Agendamento ${bookingId} atualizado, mas não acionou o processamento de pagamento finalizado. Novo status: ${newBookingData.status}, Status Pagamento: ${newBookingData.paymentStatus}`);
    }
    return null;
  });