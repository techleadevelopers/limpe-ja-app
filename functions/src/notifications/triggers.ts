// LimpeJaApp/functions/src/notifications/triggers.ts
import * as functions from "firebase-functions"; // Usaremos functions.logger
import { region } from "firebase-functions/v1";
import admin, { db } from "../config/firebaseAdmin"; // db é usado para atualizar 'reminderSent'
import { Booking, Review, UserProfile, NotificationPayload } from "../types"; // Removido NotificationType (TS6133)
import { sendPushNotification, getUserFcmTokens } from "../services/notification.service";
import { formatDate } from "../utils/helpers"; // Agora deve ser encontrado

const REGION = "southamerica-east1";

export const sendBookingReminderMaybe = region(REGION)
  .firestore.document("bookings/{bookingId}")
  .onUpdate(async (change, context) => {
    const newBooking = change.after.data() as Booking;
    // const oldBooking = change.before.data() as Booking; // Removido - TS6133
    const bookingId = context.params.bookingId;

    if (newBooking.status === "confirmed_by_provider" || newBooking.status === "scheduled_paid") {
        const now = new Date();
        // Assegura que scheduledDateTime é um Timestamp do Firestore e converte para Date
        const serviceTimeDate = (newBooking.scheduledDateTime as admin.firestore.Timestamp).toDate();
        const hoursBefore = (serviceTimeDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Enviar lembrete 24-25 horas antes (exemplo de janela) e se não foi enviado
        if (hoursBefore > 23 && hoursBefore <= 25 && !newBooking.reminderSent) { // Usa reminderSent
            functions.logger.info(`[NotificationTrigger] Enviando lembrete para booking ${bookingId}`);
            
            const clientTokens = await getUserFcmTokens(newBooking.clientId);
            const providerTokens = await getUserFcmTokens(newBooking.providerId);
            // Usa formatDate que acabamos de definir em helpers.ts
            const serviceDateFormatted = formatDate(serviceTimeDate, { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

            const clientPayload: NotificationPayload = {
                title: "Lembrete de Agendamento!",
                body: `Seu serviço de ${newBooking.serviceSnapshot.name} com ${newBooking.providerName || 'o profissional'} é amanhã, ${serviceDateFormatted}.`,
                data: { bookingId, screen: "ClientBookingDetails", notificationType: "BOOKING_REMINDER" }
            };
            const providerPayload: NotificationPayload = {
                title: "Lembrete de Agendamento!",
                body: `Você tem um serviço de ${newBooking.serviceSnapshot.name} com ${newBooking.clientName || 'o cliente'} amanhã, ${serviceDateFormatted}.`,
                data: { bookingId, screen: "ProviderServiceDetails", notificationType: "BOOKING_REMINDER" }
            };

            if (clientTokens.length > 0) {
                await sendPushNotification(clientTokens, clientPayload, { 
                    saveToFirestore: true, 
                    userIdToSave: newBooking.clientId, 
                    typeToSave: "BOOKING_REMINDER", // NotificationType é inferido como string aqui
                    navigateTo: `/(client)/bookings/${bookingId}` 
                });
            }
            if (providerTokens.length > 0) {
                await sendPushNotification(providerTokens, providerPayload, { 
                    saveToFirestore: true, 
                    userIdToSave: newBooking.providerId, 
                    typeToSave: "BOOKING_REMINDER",
                    navigateTo: `/(provider)/services/${bookingId}` 
                });
            }
            
            // Marcar que o lembrete foi enviado no documento do booking
            try {
                await db.collection("bookings").doc(bookingId).update({ reminderSent: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                functions.logger.info(`[NotificationTrigger] Campo 'reminderSent' atualizado para booking ${bookingId}`);
            } catch (updateError) {
                functions.logger.error(`[NotificationTrigger] Erro ao atualizar 'reminderSent' para booking ${bookingId}:`, updateError);
            }
        }
    }
    return null;
});

export const onNewReviewForProvider = region(REGION)
  .firestore.document("reviews/{reviewId}")
  .onCreate(async (snapshot, context) => {
    const review = snapshot.data() as Review;
    const reviewId = context.params.reviewId;

    if (review.revieweeRole === "provider") {
      const providerId = review.revieweeId;
      const reviewerProfileSnap = await db.collection("users").doc(review.reviewerId).get(); // db é usado aqui
      const reviewerName = (reviewerProfileSnap.data() as UserProfile)?.name || "Um cliente";

      functions.logger.info(`[NotificationTrigger] Nova avaliação ${reviewId} para o prestador ${providerId} por ${reviewerName}`);

      const providerTokens = await getUserFcmTokens(providerId);
      if (providerTokens.length > 0) {
        const payload: NotificationPayload = {
          title: "Você recebeu uma nova avaliação!",
          body: `${reviewerName} deixou uma avaliação de ${review.rating} estrelas.`,
          data: { reviewId, providerId, screen: "ProviderReviews", notificationType: "NEW_REVIEW" },
        };
        await sendPushNotification(
            providerTokens, 
            payload,
            {
                saveToFirestore: true,
                userIdToSave: providerId,
                typeToSave: "NEW_REVIEW",
                navigateTo: `/(provider)/profile` // Ou uma aba específica de avaliações
            }
        );
      }
    }
    return null;
  });