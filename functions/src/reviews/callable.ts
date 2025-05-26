// LimpeJaApp/functions/src/reviews/callable.ts
import * as functions from "firebase-functions";
import { region } from "firebase-functions/v1";
// Importa 'admin' (default export do firebase-admin), e também 'db'
import admin, { db } from "../config/firebaseAdmin"; // <<<--- CORREÇÃO AQUI
import { Review, Booking, UserRole } from "../types"; // Adicionado UserRole
import { assertRole } from "../utils/helpers";

const REGION = "southamerica-east1";

// Interface para os dados esperados pela função submitReview
// Omitindo campos que serão gerados/definidos no backend
interface SubmitReviewData extends Omit<Review, "id" | "createdAt" | "reviewerId" | "reviewerRole" | "revieweeRole" | "revieweeId"> {
  // bookingId é obrigatório e já está em Review
  // rating e comment vêm do data
}

export const submitReview = region(REGION).https.onCall(
  async (data: SubmitReviewData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado.");
    }
    const uid = context.auth.uid;
    const userRole = context.auth.token.role as UserRole; // Pega o role dos custom claims

    // Validação básica dos dados da avaliação
    if (data.rating === undefined || data.rating < 1 || data.rating > 5) {
      throw new functions.https.HttpsError("invalid-argument", "A avaliação (rating) deve ser um número entre 1 e 5 estrelas.");
    }
    if (!data.bookingId) {
        throw new functions.https.HttpsError("invalid-argument", "O ID do agendamento (bookingId) é obrigatório.");
    }
    // Comentário pode ser opcional dependendo das suas regras de negócio

    const bookingRef = db.collection("bookings").doc(data.bookingId);
    const reviewRef = db.collection("reviews").doc(); // Gera um novo ID para a avaliação

    try {
      const bookingDoc = await bookingRef.get();
      if (!bookingDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Agendamento não encontrado para esta avaliação.");
      }
      const booking = bookingDoc.data() as Booking;

      // Determina quem está avaliando quem e se a ação é permitida
      let revieweeId: string;
      let revieweeRole: UserRole;

      if (userRole === "client" && uid === booking.clientId) {
        assertRole(context.auth, "client"); // Confirma o role (já temos userRole, mas para consistência)
        revieweeId = booking.providerId;
        revieweeRole = "provider";
        if (booking.clientReviewId) { // Verifica se o cliente já avaliou
             throw new functions.https.HttpsError("already-exists", "Você já avaliou este serviço.");
        }
      } else if (userRole === "provider" && uid === booking.providerId) {
        assertRole(context.auth, "provider");
        revieweeId = booking.clientId;
        revieweeRole = "client";
        if (booking.providerReviewId) { // Verifica se o provedor já avaliou
            throw new functions.https.HttpsError("already-exists", "Você já avaliou este cliente/serviço.");
        }
      } else {
        throw new functions.https.HttpsError("permission-denied", "Você não tem permissão para avaliar este agendamento.");
      }

      // Verifica se o agendamento está em um status que permite avaliação (ex: 'completed' ou 'finalized')
      if (booking.status !== "completed" && booking.status !== "finalized") {
        throw new functions.https.HttpsError("failed-precondition", "Este serviço ainda não foi concluído e não pode ser avaliado.");
      }

      const newReviewData: Review = {
        ...data, // Contém rating, comment (opcional), bookingId
        id: reviewRef.id,
        reviewerId: uid,
        reviewerRole: userRole,
        revieweeId,
        revieweeRole,
        createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp, // CORRETO com 'admin' importado
      };

      await reviewRef.set(newReviewData);
      console.log(`[ReviewsCallable] Nova avaliação ${reviewRef.id} submetida por ${uid} para ${revieweeId}.`);
      
      // Atualiza o booking com o ID da avaliação
      const bookingUpdateData: { clientReviewId?: string, providerReviewId?: string, updatedAt: admin.firestore.FieldValue } = {
          updatedAt: admin.firestore.FieldValue.serverTimestamp() // CORRETO
      };

      if (userRole === "client") {
        bookingUpdateData.clientReviewId = reviewRef.id;
      } else { // userRole === "provider"
        bookingUpdateData.providerReviewId = reviewRef.id;
      }
      await bookingRef.update(bookingUpdateData);

      // O trigger onReviewCreated (em reviews/triggers.ts) cuidará de atualizar a média do prestador.
      return { success: true, reviewId: reviewRef.id, message: "Avaliação enviada com sucesso!" };

    } catch (error: any) {
      console.error(`[ReviewsCallable] Erro ao submeter avaliação por ${uid} para o booking ${data.bookingId}:`, error);
      if (error instanceof functions.https.HttpsError) throw error; // Re-lança erros HttpsError
      throw new functions.https.HttpsError("internal", "Falha ao processar sua avaliação.", error.message);
    }
  }
);