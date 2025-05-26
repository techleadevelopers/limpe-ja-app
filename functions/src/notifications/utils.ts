// LimpeJaApp/functions/src/notifications/utils.ts
// Removido UserProfile da importação, pois não está sendo usado neste arquivo.
// Se futuras funções aqui precisarem dele, você pode adicioná-lo de volta.
import { NotificationPayload, NotificationType, Booking } from "../types"; 

/**
 * Constrói um payload de notificação padrão para um novo agendamento.
 * Esta é uma função de exemplo; você pode criar helpers mais específicos.
 */
export function buildNewBookingNotificationPayload(
  booking: Booking,
  recipientType: "client" | "provider"
): NotificationPayload {
  if (recipientType === "provider") {
    return {
      title: "Nova Solicitação de Agendamento!",
      body: `${booking.clientName || "Um cliente"} solicitou ${booking.serviceSnapshot.name}.`,
      data: {
        bookingId: booking.bookingId,
        screen: "ProviderBookingDetails", // Rota no app do provedor
        notificationType: "NEW_BOOKING_REQUEST" as NotificationType, // Cast para o tipo
      },
    };
  } else { // recipientType === "client"
    return {
      title: "Solicitação de Agendamento Enviada!",
      body: `Sua solicitação para ${booking.serviceSnapshot.name} com ${booking.providerName} foi enviada.`,
      data: {
        bookingId: booking.bookingId,
        screen: "ClientBookingDetails", // Rota no app do cliente
        notificationType: "NEW_BOOKING_REQUEST" as NotificationType, // Cast para o tipo
      },
    };
  }
}

/**
 * Constrói um payload para notificação de status de agendamento alterado.
 */
export function buildBookingStatusUpdatePayload(
  booking: Booking,
  newStatus: Booking["status"], // Usa o tipo de status de Booking
  triggeredByRole: "client" | "provider" | "admin" // Role de quem disparou
): NotificationPayload | null {
  let title = "";
  let body = "";
  let targetUserRole: "client" | "provider" | null = null;

  switch (newStatus) {
    case "confirmed_by_provider":
      title = "Agendamento Confirmado!";
      body = `Boas notícias! ${booking.providerName || "O profissional"} confirmou seu serviço de "${booking.serviceSnapshot.name}".`;
      targetUserRole = "client";
      break;
    case "cancelled_by_client":
      title = "Agendamento Cancelado";
      body = `${booking.clientName || "O cliente"} cancelou o serviço de "${booking.serviceSnapshot.name}" que estava agendado com você.`;
      targetUserRole = "provider";
      break;
    case "cancelled_by_provider":
      title = "Agendamento Cancelado";
      body = `${booking.providerName || "O profissional"} cancelou seu serviço de "${booking.serviceSnapshot.name}".`;
      targetUserRole = "client";
      break;
    default:
      console.log(`[NotificationUtils] Sem payload definido para o status de booking: ${newStatus}`);
      return null;
  }

  if (!targetUserRole) return null;

  return {
    title,
    body,
    data: {
      bookingId: booking.bookingId,
      screen: targetUserRole === "client" ? "ClientBookingDetails" : "ProviderServiceDetails", // Ajuste as rotas conforme necessário
      notificationType: `${newStatus.toUpperCase()}` as NotificationType, // Ex: BOOKING_CONFIRMED
    },
  };
}

/**
 * Formata o corpo de uma mensagem de chat para ser usado em uma notificação push,
 * talvez truncando ou adicionando um prefixo.
 */
export const formatChatMessageForPush = (messageText: string, senderName: string): string => {
    const maxLength = 100;
    const truncatedText = messageText.length > maxLength ? messageText.substring(0, maxLength - 3) + "..." : messageText;
    return `${senderName}: ${truncatedText}`;
};

// Outras funções utilitárias...