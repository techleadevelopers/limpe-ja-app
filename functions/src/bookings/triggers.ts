// LimpeJaApp/functions/src/bookings/triggers.ts
import * as functions from "firebase-functions"; // Mantido para functions.logger
import { region } from "firebase-functions/v1";
// import { db } from "../config/firebaseAdmin"; // REMOVIDO - TS6133 (db não usado aqui)
import { Booking, NotificationPayload, NotificationType } from "../types"; // Removido BookingStatus - TS6133. Adicionado NotificationPayload e Type.
import { sendPushNotification, getUserFcmTokens } from "../services/notification.service";

const REGION = "southamerica-east1";

export const onBookingCreatedSendNotifications = region(REGION)
  .firestore.document("bookings/{bookingId}")
  .onCreate(async (snapshot, context) => {
    const booking = snapshot.data() as Booking;
    const bookingId = context.params.bookingId;
    functions.logger.info(`[BookingsTrigger] Novo agendamento criado: ${bookingId}`, booking);

    if (booking.providerId && booking.status === "pending_provider_confirmation") {
      const providerTokens = await getUserFcmTokens(booking.providerId);
      if (providerTokens.length > 0) {
        const payload: NotificationPayload = { // Tipagem explícita
          title: "Nova Solicitação de Agendamento!",
          body: `${booking.clientName || "Um cliente"} solicitou um serviço de ${booking.serviceSnapshot.name}.`,
          data: { bookingId, screen: "ProviderBookingDetails", notificationType: "NEW_BOOKING_REQUEST" },
        };
        await sendPushNotification(
          providerTokens,
          payload,
          { 
            saveToFirestore: true, 
            userIdToSave: booking.providerId, 
            typeToSave: "NEW_BOOKING_REQUEST" as NotificationType, // Cast para o tipo
            navigateTo: `/(provider)/services/${bookingId}` // Exemplo de rota para o provedor
          }
        );
      }
    }
    return null;
  });

export const onBookingUpdateSendNotifications = region(REGION)
  .firestore.document("bookings/{bookingId}")
  .onUpdate(async (change, context) => {
    const bookingId = context.params.bookingId;
    const newData = change.after.data() as Booking;
    const oldData = change.before.data() as Booking;

    functions.logger.info(`[BookingsTrigger] Agendamento ${bookingId} atualizado. Status antigo: ${oldData.status}, Novo status: ${newData.status}`);

    if (newData.status !== oldData.status) {
      let notificationPayload: NotificationPayload | null = null; // Usando o tipo importado
      let targetUserId: string | null = null;
      let notificationType: NotificationType | null = null; // Usando o tipo importado
      let navigateToPath: string | undefined = undefined;

      if (newData.status === "confirmed_by_provider") {
        targetUserId = newData.clientId;
        notificationType = "BOOKING_CONFIRMED";
        navigateToPath = `/(client)/bookings/${bookingId}`;
        notificationPayload = {
          title: "Agendamento Confirmado!",
          body: `Seu serviço de ${newData.serviceSnapshot.name} com ${newData.providerName || 'o profissional'} foi confirmado.`,
          data: { bookingId, screen: "ClientBookingDetails", notificationType: notificationType },
        };
      } else if (newData.status === "cancelled_by_provider") {
        targetUserId = newData.clientId;
        notificationType = "BOOKING_CANCELLED";
        navigateToPath = `/(client)/bookings/${bookingId}`;
        notificationPayload = { // <<<--- CONTEÚDO ADICIONADO
          title: "Agendamento Cancelado",
          body: `O serviço de ${newData.serviceSnapshot.name} com ${newData.providerName || 'o profissional'} foi cancelado pelo profissional.`,
          data: { bookingId, screen: "ClientBookingDetails", notificationType: notificationType, reason: newData.cancellationReason || '' },
        };
      } else if (newData.status === "cancelled_by_client") {
        targetUserId = newData.providerId;
        notificationType = "BOOKING_CANCELLED";
        navigateToPath = `/(provider)/services/${bookingId}`; // Provedor vê detalhes do serviço/agendamento
        notificationPayload = { // <<<--- CONTEÚDO ADICIONADO
          title: "Agendamento Cancelado",
          body: `O serviço de ${newData.serviceSnapshot.name} solicitado por ${newData.clientName || 'um cliente'} foi cancelado pelo cliente.`,
          data: { bookingId, screen: "ProviderServiceDetails", notificationType: notificationType, reason: newData.cancellationReason || '' },
        };
      }
      // TODO: Adicionar mais lógicas de notificação para outros status (completed, reminder, in_progress, etc.)
      // Exemplo para 'completed':
      // else if (newData.status === "completed" && oldData.status !== "completed") {
      //   targetUserId = newData.clientId;
      //   notificationType = "SERVICE_COMPLETED";
      //   navigateToPath = `/(common)/feedback/${bookingId}?type=service&serviceName=${encodeURIComponent(newData.serviceSnapshot.name)}&providerName=${encodeURIComponent(newData.providerName || '')}`;
      //   notificationPayload = {
      //     title: "Serviço Concluído!",
      //     body: `O serviço de ${newData.serviceSnapshot.name} com ${newData.providerName || 'o profissional'} foi concluído. Deixe sua avaliação!`,
      //     data: { bookingId, screen: "FeedbackScreen", notificationType: notificationType },
      //   };
      // }


      if (targetUserId && notificationPayload && notificationType) {
        const userTokens = await getUserFcmTokens(targetUserId);
        if (userTokens.length > 0) {
          await sendPushNotification(
            userTokens, 
            notificationPayload, 
            { 
              saveToFirestore: true, 
              userIdToSave: targetUserId, 
              typeToSave: notificationType,
              navigateTo: navigateToPath // Passa o caminho de navegação
            }
          );
        } else {
            functions.logger.info(`[BookingsTrigger] Nenhum token FCM para usuário ${targetUserId} para notificação tipo ${notificationType}`);
        }
      }
    }
    return null;
  });