import * as functions from "firebase-functions";
import { region } from "firebase-functions/v1";
import { db } from "../config/firebaseAdmin"; // Import db
// Certifique-se de que RescheduleRequest é exportado de ../types/index.ts ou do arquivo booking.types.ts
import { Booking, NotificationPayload, NotificationType, RescheduleRequest, UserRole } from "../types";
import { sendPushNotification, getUserFcmTokens } from "../services/notification.service";

const REGION = "southamerica-east1";

export const onBookingCreatedSendNotifications = region(REGION)
    .firestore.document("bookings/{bookingId}")
    .onCreate(async (snapshot, context) => {
        const booking = snapshot.data() as Booking;
        const { bookingId } = context.params;

        functions.logger.info(`[BookingsTrigger] Novo agendamento criado: ${bookingId}`, { bookingData: booking });

        try {
            if (booking.providerId && booking.status === "pending_provider_confirmation") {
                const providerTokens = await getUserFcmTokens(booking.providerId);

                if (providerTokens.length > 0) {
                    const payload: NotificationPayload = {
                        title: "Nova Solicitação de Agendamento!",
                        body: `${booking.clientName || "Um cliente"} solicitou um serviço de ${booking.serviceSnapshot.name}. Verifique os detalhes.`,
                        data: {
                            bookingId,
                            screen: "ProviderBookingDetails", // Nome da rota do front-end
                            notificationType: "NEW_BOOKING_REQUEST" as NotificationType,
                        },
                    };

                    await sendPushNotification(providerTokens, payload, {
                        saveToFirestore: true,
                        userIdToSave: booking.providerId,
                        typeToSave: "NEW_BOOKING_REQUEST",
                        navigateTo: `/(provider)/bookings/${bookingId}`, // Exemplo de caminho de link profundo
                    });
                } else {
                    functions.logger.info(`[BookingsTrigger] Nenhum token FCM para provedor ${booking.providerId} em novo agendamento ${bookingId}`);
                }
            }
        } catch (erro: any) { // Catch error as 'any' or 'unknown' and then cast
            functions.logger.error(`[BookingsTrigger] Erro em onBookingCreatedSendNotifications para booking ${bookingId}:`, erro);
        }
        return null; // Cloud Functions should always return a Promise or null/void
    });


export const onBookingUpdateSendNotifications = region(REGION)
    .firestore.document("bookings/{bookingId}")
    .onUpdate(async (change, context) => {
        const { bookingId } = context.params;
        const newData = change.after.data() as Booking;
        const oldData = change.before.data() as Booking;

        functions.logger.info(`[BookingsTrigger] Agendamento ${bookingId} atualizado. Status: ${oldData.status} -> ${newData.status}`);

        try {
            // If only secondary fields are changed, no need to send primary status/payment notifications
            if (newData.status === oldData.status && newData.paymentStatus === oldData.paymentStatus) {
                functions.logger.info(`[BookingsTrigger] Status e paymentStatus não alterados para booking ${bookingId}. Nenhuma notificação de status primário enviada.`);
                // return null; // Uncomment if you ONLY want to notify about status/paymentStatus changes.
            }

            let notificationPayload: NotificationPayload | null = null;
            let targetUserId: string | null = null;
            let notificationType: NotificationType | null = null;
            let navigateToPath: string | undefined = undefined;
            let recipientRole: UserRole | undefined = undefined;

            // Notification for Status Change
            if (newData.status !== oldData.status) {
                switch (newData.status) {
                    case "confirmed_by_provider":
                        targetUserId = newData.clientId;
                        recipientRole = "client";
                        notificationType = "BOOKING_CONFIRMED";
                        navigateToPath = `/(client)/bookings/${bookingId}`;
                        notificationPayload = {
                            title: "Agendamento Confirmado!",
                            body: `Seu serviço de ${newData.serviceSnapshot.name} com ${newData.providerName || 'o profissional'} foi confirmado.`,
                            data: { bookingId, screen: "ClientBookingDetails", notificationType },
                        };
                        break;
                    case "cancelled_by_provider":
                        targetUserId = newData.clientId;
                        recipientRole = "client";
                        notificationType = "BOOKING_CANCELLED";
                        navigateToPath = `/(client)/bookings/${bookingId}`;
                        notificationPayload = {
                            title: "Agendamento Cancelado",
                            body: `O serviço ${newData.serviceSnapshot.name} com ${newData.providerName || 'o profissional'} foi cancelado. Motivo: ${newData.cancellationReason || 'Não especificado.'}`,
                            data: { bookingId, screen: "ClientBookingDetails", notificationType, reason: newData.cancellationReason || '' },
                        };
                        break;
                    case "cancelled_by_client":
                        targetUserId = newData.providerId;
                        recipientRole = "provider";
                        notificationType = "BOOKING_CANCELLED";
                        navigateToPath = `/(provider)/bookings/${bookingId}`;
                        notificationPayload = {
                            title: "Agendamento Cancelado",
                            body: `O serviço ${newData.serviceSnapshot.name} solicitado por ${newData.clientName || 'um cliente'} foi cancelado. Motivo: ${newData.cancellationReason || 'Não especificado.'}`,
                            data: { bookingId, screen: "ProviderBookingDetails", notificationType, reason: newData.cancellationReason || '' },
                        };
                        break;
                    case "in_progress":
                        targetUserId = newData.clientId;
                        recipientRole = "client";
                        notificationType = "SERVICE_IN_PROGRESS";
                        navigateToPath = `/(client)/bookings/${bookingId}`;
                        notificationPayload = {
                            title: "Serviço Iniciado!",
                            body: `Seu serviço de ${newData.serviceSnapshot.name} com ${newData.providerName || 'o profissional'} começou.`,
                            data: { bookingId, screen: "ClientBookingDetails", notificationType },
                        };
                        break;
                    case "completed":
                        targetUserId = newData.clientId;
                        recipientRole = "client";
                        notificationType = "SERVICE_COMPLETED";
                        navigateToPath = `/(client)/feedback/${bookingId}?targetId=${newData.providerId}&targetName=${encodeURIComponent(newData.providerName || '')}&serviceName=${encodeURIComponent(newData.serviceSnapshot.name)}`;
                        notificationPayload = {
                            title: "Serviço Concluído!",
                            body: `O serviço de ${newData.serviceSnapshot.name} foi concluído. Que tal deixar sua avaliação?`,
                            data: { bookingId, screen: "FeedbackScreen", notificationType, targetId: newData.providerId, targetName: newData.providerName, serviceName: newData.serviceSnapshot.name },
                        };
                        break;
                    case "reschedule_requested":
                        if (newData.rescheduleRequestId && typeof newData.rescheduleRequestId === 'string') {
                            const reqSnap = await db.collection("rescheduleRequests").doc(newData.rescheduleRequestId).get();
                            if (reqSnap.exists) {
                                const rescheduleReq = reqSnap.data() as RescheduleRequest;
                                if (rescheduleReq.requestedById === newData.clientId) { // Client requested
                                    targetUserId = newData.providerId;
                                    recipientRole = "provider";
                                    navigateToPath = `/(provider)/bookings/${bookingId}?action=viewRescheduleRequest`;
                                    notificationPayload = {
                                        title: "Solicitação de Reagendamento",
                                        body: `${newData.clientName || 'O cliente'} solicitou reagendar o serviço de ${newData.serviceSnapshot.name}.`,
                                        data: { bookingId, screen: "ProviderBookingDetails", notificationType: "BOOKING_RESCHEDULE_REQUEST", rescheduleRequestId: newData.rescheduleRequestId },
                                    };
                                } else if (rescheduleReq.requestedById === newData.providerId) { // Provider requested
                                    targetUserId = newData.clientId;
                                    recipientRole = "client";
                                    navigateToPath = `/(client)/bookings/${bookingId}?action=viewRescheduleRequest`;
                                    notificationPayload = {
                                        title: "Proposta de Reagendamento",
                                        body: `${newData.providerName || 'O profissional'} propôs reagendar o serviço de ${newData.serviceSnapshot.name}.`,
                                        data: { bookingId, screen: "ClientBookingDetails", notificationType: "BOOKING_RESCHEDULE_REQUEST", rescheduleRequestId: newData.rescheduleRequestId },
                                    };
                                }
                                notificationType = "BOOKING_RESCHEDULE_REQUEST";
                            }
                        }
                        break;
                }
            }

            // Notification for Payment Status Change (if different from main status notification)
            // A CORREÇÃO REAL DO ERRO TS2367 ESTÁ AQUI:
            // Esta notificação de pagamento só será preparada se NENHUMA notificação de status
            // (que teria preenchido `notificationPayload`) foi definida ainda.
            if (newData.paymentStatus !== oldData.paymentStatus && newData.paymentStatus === "paid") {
                if (notificationPayload === null) { // Apenas se nenhuma outra notificação foi configurada
                    targetUserId = newData.providerId;
                    recipientRole = "provider";
                    notificationType = "BOOKING_PAID";
                    navigateToPath = `/(provider)/bookings/${bookingId}`;
                    notificationPayload = {
                        title: "Pagamento Confirmado!",
                        body: `Pagamento recebido para o serviço ${newData.serviceSnapshot.name} com ${newData.clientName || 'o cliente'}.`,
                        data: { bookingId, screen: "ProviderBookingDetails", notificationType },
                    };
                }
            } else if (newData.status === "scheduled_paid" && (oldData.status !== "scheduled_paid" || oldData.paymentStatus !== "paid")) {
                // This ensures the provider is notified when booking becomes 'scheduled_paid'
                // Handles transition from 'confirmed_by_provider' (then client pays) -> 'scheduled_paid'
                // Or from 'reschedule_requested' (then accepted) -> 'scheduled_paid'
                targetUserId = newData.providerId;
                recipientRole = "provider";
                notificationType = "BOOKING_PAID"; // Or a more generic "Booking Scheduled & Paid"
                navigateToPath = `/(provider)/bookings/${bookingId}`;
                notificationPayload = {
                    title: "Agendamento Pago e Confirmado!",
                    body: `O serviço ${newData.serviceSnapshot.name} com ${newData.clientName || 'o cliente'} está pago e agendado.`,
                    data: { bookingId, screen: "ProviderBookingDetails", notificationType },
                };
            }

            if (targetUserId && notificationPayload && notificationType && recipientRole) {
                const userTokens = await getUserFcmTokens(targetUserId);
                if (userTokens.length > 0) {
                    await sendPushNotification(userTokens, notificationPayload, {
                        saveToFirestore: true,
                        userIdToSave: targetUserId,
                        typeToSave: notificationType,
                        navigateTo: navigateToPath
                    });
                } else {
                    functions.logger.info(`[BookingsTrigger] Nenhum token FCM para usuário ${targetUserId} (role: ${recipientRole}) para notificação tipo ${notificationType}`);
                }
            } else if (newData.status !== oldData.status) {
                functions.logger.info(`[BookingsTrigger] Nenhuma notificação definida para a transição de status: ${oldData.status} -> ${newData.status} para booking ${bookingId}`);
            }

        } catch (erro: any) { // Catch error as 'any' or 'unknown' and then cast
            functions.logger.error(`[BookingsTrigger] Erro em onBookingUpdateSendNotifications para booking ${bookingId}:`, erro);
        }
        return null; // Cloud Functions should always return a Promise or null/void
    });