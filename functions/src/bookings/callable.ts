// LimpeJaApp/functions/src/bookings/callable.ts
import * as functions from "firebase-functions";
import { region } from "firebase-functions/v1";
// Importa 'admin' (default export do firebase-admin), e também 'db'
import admin, { db } from "../config/firebaseAdmin"; // <<<--- CORREÇÃO NA IMPORTAÇÃO
import { BookingStatus, Booking, UserRole } from "../types"; // Adicionado UserRole e Booking
import { assertRole } from "../utils/helpers"; // Mantido, pois vamos usá-lo

const REGION = "southamerica-east1";

interface UpdateBookingStatusData {
  bookingId: string;
  newStatus: BookingStatus;
  cancellationReason?: string;
}

export const updateBookingStatus = region(REGION).https.onCall(
  async (data: UpdateBookingStatusData, context) => {
    if (!context.auth || !context.auth.token) { // Checagem mais robusta de context.auth.token
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado.");
    }
    const uid = context.auth.uid;
    // Assegura que userRole é um dos UserRole definidos (client, provider, admin)
    const userRole = context.auth.token.role as UserRole; 

    const { bookingId, newStatus, cancellationReason } = data;

    if (!bookingId || !newStatus) {
      throw new functions.https.HttpsError("invalid-argument", "bookingId e newStatus são obrigatórios.");
    }
    
    console.log(`[BookingsCallable] Usuário ${uid} (role: ${userRole}) tentando atualizar status do booking ${bookingId} para ${newStatus}`);

    const bookingRef = db.collection("bookings").doc(bookingId);

    try {
      await db.runTransaction(async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef);
        if (!bookingDoc.exists) {
          throw new functions.https.HttpsError("not-found", "Agendamento não encontrado.");
        }
        const booking = bookingDoc.data() as Booking; // Usa o tipo Booking importado

        // Verifica se o usuário tem permissão para alterar este agendamento específico
        // e se a transição de status é válida.
        let canUpdate = false;
        if (userRole === "provider" && uid === booking.providerId) {
          assertRole(context.auth, "provider"); // <<<--- USO DE assertRole
          // Prestador pode confirmar um agendamento pendente dele
          if (newStatus === "confirmed_by_provider" && booking.status === "pending_provider_confirmation") canUpdate = true;
          // Prestador pode cancelar (com regras de antecedência a serem implementadas)
          if (newStatus === "cancelled_by_provider" && 
             (booking.status === "pending_provider_confirmation" || booking.status === "confirmed_by_provider" || booking.status === "scheduled_paid")) canUpdate = true;
          // Prestador pode marcar como concluído (após estar em andamento ou pago/agendado)
          if (newStatus === "completed" && (booking.status === "in_progress" || booking.status === "scheduled_paid")) canUpdate = true; 
          // TODO: Adicionar outras transições permitidas para o provedor (ex: 'in_progress')
        } else if (userRole === "client" && uid === booking.clientId) {
          assertRole(context.auth, "client"); // <<<--- USO DE assertRole
          // Cliente pode cancelar (com regras de antecedência a serem implementadas)
          if (newStatus === "cancelled_by_client" && 
             (booking.status === "pending_provider_confirmation" || booking.status === "confirmed_by_provider" || booking.status === "scheduled_paid")) canUpdate = true;
          // TODO: Adicionar outras transições permitidas para o cliente (ex: confirmar conclusão)
        }
        // Admin pode ter mais permissões (não coberto aqui, mas poderia ser adicionado)

        if (!canUpdate) {
          console.warn(`[BookingsCallable] Tentativa de atualização de status não permitida: User ${uid} (Role: ${userRole}), Booking ${bookingId}, De ${booking.status} Para ${newStatus}`);
          throw new functions.https.HttpsError("permission-denied", `Você não tem permissão para alterar o status deste agendamento de '${booking.status}' para '${newStatus}'.`);
        }

        const updateData: Partial<Booking> = { // Tipagem para o objeto de atualização
            status: newStatus, 
            updatedAt: admin.firestore.FieldValue.serverTimestamp() // <<<--- 'admin' AGORA É RECONHECIDO
        };

        if (cancellationReason && (newStatus === "cancelled_by_client" || newStatus === "cancelled_by_provider")) {
          updateData.cancellationReason = cancellationReason;
          updateData.cancelledBy = userRole; // userRole já é 'client' | 'provider' (ou 'admin' se adicionado)
        }
        transaction.update(bookingRef, updateData);
      });

      console.log(`[BookingsCallable] Status do agendamento ${bookingId} atualizado para ${newStatus} por ${uid}.`);
      // O trigger onBookingUpdate (em bookings/triggers.ts) cuidará do envio de notificações.
      return { success: true, message: `Agendamento ${newStatus.replace(/_/g, " ").toLowerCase()}.` };

    } catch (error: any) {
      console.error(`[BookingsCallable] Erro ao atualizar status do agendamento ${bookingId} para ${uid}:`, error);
      if (error instanceof functions.https.HttpsError) throw error; // Re-lança erros HttpsError
      throw new functions.https.HttpsError("internal", "Falha ao atualizar o status do agendamento.", error.message);
    }
  }
);

// TODO: Adicionar mais Cloud Functions Callable para bookings, como:
// - requestBookingReschedule(data: { bookingId: string, newProposedDate: string, reason: string }, context)
// - acceptBookingReschedule(data: { bookingId: string, rescheduleRequestId: string }, context)