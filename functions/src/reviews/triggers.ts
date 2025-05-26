// LimpeJaApp/functions/src/reviews/triggers.ts
// import * as functions from "firebase-functions"; // Removido, pois 'functions' não estava sendo usado diretamente
import { region } from "firebase-functions/v1";
import admin, { db } from "../config/firebaseAdmin"; // <<<--- ADICIONADO 'admin' À IMPORTAÇÃO
import { Review, ProviderProfile } from "../types";

const REGION = "southamerica-east1";

// Trigger para quando uma nova avaliação é criada (especialmente para um provedor)
export const onReviewCreatedUpdateProviderRating = region(REGION)
  .firestore.document("reviews/{reviewId}")
  .onCreate(async (snapshot, context) => {
    const review = snapshot.data() as Review;
    const reviewId = context.params.reviewId;
    console.log(`[ReviewsTrigger] Nova avaliação criada: ${reviewId}`, review);

    // Apenas atualiza a média se for uma avaliação de um cliente para um provedor
    if (review.reviewerRole === "client" && review.revieweeRole === "provider") {
      const providerId = review.revieweeId;
      const providerProfileRef = db.collection("providerProfiles").doc(providerId);

      try {
        await db.runTransaction(async (transaction) => {
          const providerDoc = await transaction.get(providerProfileRef);
          if (!providerDoc.exists) {
            console.error(`[ReviewsTrigger] Perfil do provedor ${providerId} não encontrado para atualizar rating.`);
            return;
          }
          const providerData = providerDoc.data() as ProviderProfile;
          
          const currentTotalReviews = providerData.totalReviews || 0;
          const currentAverageRating = providerData.averageRating || 0;

          const newTotalReviews = currentTotalReviews + 1;
          const newAverageRating = ((currentAverageRating * currentTotalReviews) + review.rating) / newTotalReviews;

          transaction.update(providerProfileRef, {
            averageRating: parseFloat(newAverageRating.toFixed(2)), // Arredonda para 2 casas decimais
            totalReviews: newTotalReviews,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(), // <<<--- 'admin' AGORA É RECONHECIDO
          });
          console.log(`[ReviewsTrigger] Média de avaliação do provedor ${providerId} atualizada para ${newAverageRating.toFixed(2)} (${newTotalReviews} avaliações).`);
        });
      } catch (error) {
        console.error(`[ReviewsTrigger] Erro ao atualizar média de avaliação do provedor ${providerId}:`, error);
      }
    }
    return null;
  });