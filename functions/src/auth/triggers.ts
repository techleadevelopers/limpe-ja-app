// LimpeJaApp/functions/src/auth/triggers.ts
import { region } from "firebase-functions/v1";
import admin, { db, auth as adminAuth } from "../config/firebaseAdmin";
import { UserProfile, ProviderProfile, UserRole, Booking } from "../types";
import { sendPushNotification } from "../services/notification.service"; // Mantido o import original
import { processRefund } from "../services/paymentGateway.service"; // <--- ADICIONADO: Importar a função de reembolso

const REGION = "southamerica-east1";

export const processNewUser = region(REGION)
  .auth.user()
  .onCreate(async (userRecord) => {
    console.log(`[AuthTrigger] Novo usuário: ${userRecord.uid}, Email: ${userRecord.email}`);

    const userRole: UserRole = "client";

    const userProfileData: Omit<UserProfile, "id" | "createdAt" | "updatedAt"> = {
      email: userRecord.email || `user_${userRecord.uid}@limpeja.com`,
      role: userRole,
      name: userRecord.displayName || userRecord.email?.split("@")[0] || "Usuário LimpeJá",
      avatarUrl: userRecord.photoURL || undefined,
      phone: userRecord.phoneNumber || undefined,
      addresses: [],
      isProviderVerified: false,
      isDisabledByAdmin: false,
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
    
    const batch = db.batch();

    try {
      // 1. Deletar Perfil de Usuário
      const userProfileRef = db.collection("users").doc(userRecord.uid);
      batch.delete(userProfileRef);
      console.log(`[AuthTrigger] Perfil do usuário ${userRecord.uid} adicionado ao batch para exclusão.`);

      // 2. Deletar Perfil de Prestador (se existir)
      const providerProfileRef = db.collection("providerProfiles").doc(userRecord.uid);
      const providerProfileDoc = await providerProfileRef.get();
      if (providerProfileDoc.exists) {
        batch.delete(providerProfileRef);
        console.log(`[AuthTrigger] Perfil de provedor ${userRecord.uid} adicionado ao batch para exclusão.`);
      }

      // 3. Limpar Tokens FCM
      const fcmTokenRef = db.collection("fcmTokens").doc(userRecord.uid);
      const fcmTokenDoc = await fcmTokenRef.get();
      if (fcmTokenDoc.exists) {
        batch.delete(fcmTokenRef);
        console.log(`[AuthTrigger] Token FCM para ${userRecord.uid} adicionado ao batch para exclusão.`);
      }

      // 4. Lógica para Agendamentos Relacionados
      // a) Agendamentos onde o usuário é o cliente
      const clientBookingsSnapshot = await db.collection("bookings")
        .where("clientId", "==", userRecord.uid)
        // Inclui todos os status "ativos" que poderiam precisar de um reembolso ou cancelamento
        .where("status", "in", ["pending_provider_confirmation", "confirmed_by_provider", "scheduled_paid", "in_progress", "reschedule_requested"])
        .get();

      if (!clientBookingsSnapshot.empty) {
        console.log(`[AuthTrigger] Encontrados ${clientBookingsSnapshot.size} agendamentos futuros como cliente para ${userRecord.uid}.`);
        // Usar for...of para permitir 'await' dentro do loop
        for (const doc of clientBookingsSnapshot.docs) {
          const booking = doc.data() as Booking;
          const bookingRef = db.collection("bookings").doc(doc.id);

          // Lógica de Reembolso: Se o agendamento foi pago, tente reembolsar.
          if (booking.paymentStatus === "paid" || booking.paymentStatus === "payout_pending" || booking.paymentStatus === "payout_processing") {
            console.log(`[AuthTrigger] Tentando reembolsar agendamento ${booking.bookingId} (cliente deletou conta).`);
            try {
              // Chama a função de reembolso do seu PSP.
              // É CRÍTICO que booking.paymentGatewayRefId contenha o ID da transação original no PSP.
              const refundResult = await processRefund(
                booking.paymentGatewayRefId!, // ID da transação original no PSP
                booking.totalPrice,
                booking.bookingId, // ID de referência para o reembolso
                "Cliente deletou a conta"
              );

              if (refundResult.success) {
                console.log(`[AuthTrigger] Reembolso para booking ${booking.bookingId} processado com sucesso.`);
                batch.update(bookingRef, { 
                  status: "cancelled_by_client", 
                  cancellationReason: "Cliente deletou a conta",
                  paymentStatus: "refunded", // Novo status de pagamento
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
              } else {
                console.error(`[AuthTrigger] Falha ao reembolsar booking ${booking.bookingId}: ${refundResult.message}`);
                batch.update(bookingRef, { 
                  status: "cancelled_by_client", 
                  cancellationReason: "Cliente deletou a conta (falha no reembolso)",
                  paymentStatus: "refund_failed", // Novo status de pagamento
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
              }
            } catch (refundError) {
              console.error(`[AuthTrigger] Erro inesperado ao tentar reembolso para booking ${booking.bookingId}:`, refundError);
              batch.update(bookingRef, { 
                status: "cancelled_by_client", 
                cancellationReason: "Cliente deletou a conta (erro no reembolso)",
                paymentStatus: "refund_failed",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          } else {
            // Se não foi pago, apenas cancela o agendamento
            batch.update(bookingRef, { 
              status: "cancelled_by_client", 
              cancellationReason: "Cliente deletou a conta",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          // Notificar o prestador sobre o cancelamento
          sendPushNotification(booking.providerId, {
            title: "Agendamento Cancelado",
            body: `Um agendamento (${booking.bookingId}) foi cancelado porque o cliente deletou a conta.`,
            data: { type: 'booking_cancelled_client_deleted', bookingId: booking.bookingId } // Usando booking.bookingId
          }).catch(e => console.error(`Erro ao notificar prestador ${booking.providerId}:`, e));
        }
      }

      // b) Agendamentos onde o usuário é o prestador
      const providerBookingsSnapshot = await db.collection("bookings")
        .where("providerId", "==", userRecord.uid)
        // Inclui todos os status "ativos" que poderiam precisar de um reembolso ou cancelamento
        .where("status", "in", ["pending_provider_confirmation", "confirmed_by_provider", "scheduled_paid", "in_progress", "reschedule_requested"])
        .get();

      if (!providerBookingsSnapshot.empty) {
        console.log(`[AuthTrigger] Encontrados ${providerBookingsSnapshot.size} agendamentos futuros como prestador para ${userRecord.uid}.`);
        // Usar for...of para permitir 'await' dentro do loop
        for (const doc of providerBookingsSnapshot.docs) {
          const booking = doc.data() as Booking;
          const bookingRef = db.collection("bookings").doc(doc.id);

          // Lógica de Reembolso: Se o agendamento foi pago, o cliente deve ser reembolsado.
          if (booking.paymentStatus === "paid" || booking.paymentStatus === "payout_pending" || booking.paymentStatus === "payout_processing") {
            console.log(`[AuthTrigger] Tentando reembolsar agendamento ${booking.bookingId} (provedor deletou conta).`);
            try {
              // Chama a função de reembolso do seu PSP.
              // É CRÍTICO que booking.paymentGatewayRefId contenha o ID da transação original no PSP.
              const refundResult = await processRefund(
                booking.paymentGatewayRefId!,
                booking.totalPrice,
                booking.bookingId,
                "Prestador deletou a conta"
              );

              if (refundResult.success) {
                console.log(`[AuthTrigger] Reembolso para booking ${booking.bookingId} processado com sucesso.`);
                batch.update(bookingRef, { 
                  status: "cancelled_by_provider", 
                  cancellationReason: "Prestador deletou a conta",
                  paymentStatus: "refunded",
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
              } else {
                console.error(`[AuthTrigger] Falha ao reembolsar booking ${booking.bookingId}: ${refundResult.message}`);
                batch.update(bookingRef, { 
                  status: "cancelled_by_provider", 
                  cancellationReason: "Prestador deletou a conta (falha no reembolso)",
                  paymentStatus: "refund_failed",
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
              }
            } catch (refundError) {
              console.error(`[AuthTrigger] Erro inesperado ao tentar reembolso para booking ${booking.bookingId}:`, refundError);
              batch.update(bookingRef, { 
                status: "cancelled_by_provider", 
                cancellationReason: "Prestador deletou a conta (erro no reembolso)",
                paymentStatus: "refund_failed",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          } else {
            // Se não foi pago, apenas cancela o agendamento
            batch.update(bookingRef, { 
              status: "cancelled_by_provider", 
              cancellationReason: "Prestador deletou a conta",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          // Notificar o cliente sobre o cancelamento
          sendPushNotification(booking.clientId, {
            title: "Agendamento Cancelado",
            body: `Seu agendamento (${booking.bookingId}) foi cancelado porque o prestador deletou a conta. Por favor, procure outro profissional.`,
            data: { type: 'booking_cancelled_provider_deleted', bookingId: booking.bookingId } // Usando booking.bookingId
          }).catch(e => console.error(`Erro ao notificar cliente ${booking.clientId}:`, e));
        }
        // Manter este aviso para lembrar sobre a lógica de saldo pendente de repasse
        console.warn(`[AuthTrigger] Verifique se há saldo pendente de repasse para o provedor ${userRecord.uid} de agendamentos JÁ FINALIZADOS. Essa lógica de repasse/retenção precisa ser tratada separadamente.`);
      }

      await batch.commit();
      console.log(`[AuthTrigger] Limpeza de dados para o usuário ${userRecord.uid} concluída.`);
    } catch (error) {
      console.error(`[AuthTrigger] Erro grave durante a limpeza de dados do usuário ${userRecord.uid}:`, error);
    }
  });