// LimpeJaApp/functions/src/payments/triggers.ts
import * as functions from "firebase-functions"; // Para functions.logger
import { region } from "firebase-functions/v1";
import admin, { db } from "../config/firebaseAdmin"; // Importa admin para FieldValue
import { Booking, ProviderProfile } from "../types"; // ProviderProfile pode ser necessário para pegar dados bancários
// Corrigido para importar processPixPayout
import { processPixPayout } from "../services/paymentGateway.service"; 

const REGION = "southamerica-east1";

// Trigger quando um booking é marcado como 'finalized' (concluído E PAGO)
// para calcular comissão e preparar/tentar o repasse.
export const onBookingFinalizedProcessPayment = region(REGION)
  .firestore.document("bookings/{bookingId}")
  .onUpdate(async (change, context) => {
    const bookingId = context.params.bookingId;
    const newBookingData = change.after.data() as Booking;
    const oldBookingData = change.before.data() as Booking;

    // Só executa se o status mudou para 'finalized' E o pagamento foi confirmado como 'paid'
    if (
        newBookingData.status === "finalized" && 
        oldBookingData.status !== "finalized" &&
        newBookingData.paymentStatus === "paid" // Garante que o pagamento foi feito
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


      // 1. Calcular Comissão do LimpeJá (ex: 20%)
      const commissionRate = newBookingData.commissionRate || 0.20; // Padrão 20%, pode vir de config
      const commissionValue = Math.round(newBookingData.totalPrice * commissionRate);
      const providerEarnings = newBookingData.totalPrice - commissionValue;

      if (providerEarnings <= 0) {
        functions.logger.error(`[PaymentsTrigger] Ganhos do provedor calculados como zero ou negativo para booking ${bookingId}. Verifique o preço total e a taxa de comissão.`);
        // Pode ser necessário um status de erro específico para o agendamento aqui
        await db.collection("bookings").doc(bookingId).update({
            paymentStatus: "payout_error",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
      }

      try {
        // Atualiza o booking com os valores calculados de comissão e ganhos
        const bookingUpdateData = {
          commissionRate,
          commissionValue,
          providerEarnings,
          // O paymentStatus já deve estar 'paid', agora vamos para 'payout_pending'
          // Se o repasse for imediato e bem-sucedido, pode ir para 'payout_completed'
          paymentStatus: "payout_pending" as const, 
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection("bookings").doc(bookingId).update(bookingUpdateData);
        functions.logger.info(`[PaymentsTrigger] Comissão calculada para ${bookingId}. Prestador ganha: ${providerEarnings}. Status de pagamento: payout_pending.`);

        // 2. Adicionar providerEarnings ao "saldo a receber" ou processar o repasse
        const providerProfileRef = db.collection("providerProfiles").doc(newBookingData.providerId);
        
        // Exemplo: Incrementa um saldo pendente no perfil do provedor
        // Garanta que ProviderProfile tenha estes campos se for usar esta abordagem.
        await providerProfileRef.update({
            pendingBalance: admin.firestore.FieldValue.increment(providerEarnings),
            totalEarnedHistorical: admin.firestore.FieldValue.increment(providerEarnings), // Exemplo de campo
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info(`[PaymentsTrigger] Saldo pendente do provedor ${newBookingData.providerId} atualizado com +${providerEarnings}.`);

        // 3. TENTATIVA DE REPASSE (Opcional, pode ser um processo em lote separado)
        // Esta é uma lógica complexa e depende da sua integração com o PSP PIX para repasses.
        const providerProfileSnap = await providerProfileRef.get();
        if (providerProfileSnap.exists) {
            const providerProfile = providerProfileSnap.data() as ProviderProfile;
            // Supondo que você armazenou a chave PIX do provedor de forma segura
            // e que sua função processPixPayout está configurada no paymentGateway.service.ts
            if (providerProfile.bankAccount?.pixKey) { // Adapte para como você armazena a chave PIX
                try {
                    await processPixPayout(
                        providerProfile.bankAccount.pixKey, // Chave PIX do recebedor
                        providerProfile.name || "Nome não disponível", // Nome do recebedor
                        providerProfile.cpf || "CPF/CNPJ não disponível", // CPF/CNPJ do recebedor
                        providerEarnings, // Valor em centavos
                        `Repasse LimpeJá - Agendamento ${bookingId}`, // Descrição para o PIX
                        bookingId
                    );
                    // Se o repasse for bem-sucedido (sem erros lançados por processPixPayout):
                    await db.collection("bookings").doc(bookingId).update({ 
                        paymentStatus: "payout_processing", // Ou "payout_completed" se for síncrono e confirmado
                        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
                    });
                    // Decrementa o saldo pendente se o repasse foi iniciado/concluído
                    await providerProfileRef.update({
                        pendingBalance: admin.firestore.FieldValue.increment(-providerEarnings),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    functions.logger.info(`[PaymentsTrigger] Repasse PIX para ${newBookingData.providerId} referente ao booking ${bookingId} iniciado/processado.`);
                } catch (payoutError: any) {
                    functions.logger.error(`[PaymentsTrigger] Falha ao tentar o repasse PIX automático para ${newBookingData.providerId} (booking ${bookingId}):`, payoutError.message);
                    // Mantém como payout_pending para tentativa manual ou em lote posterior
                }
            } else {
                functions.logger.warn(`[PaymentsTrigger] Chave PIX não configurada para repasse ao provedor ${newBookingData.providerId} (booking ${bookingId}). Repasse permanece pendente.`);
            }
        } else {
            functions.logger.error(`[PaymentsTrigger] Perfil do provedor ${newBookingData.providerId} não encontrado para atualizar saldo/repassar.`);
        }

        // 4. TODO: Notificar prestador sobre o valor creditado/repassado.

      } catch (error) {
        functions.logger.error(`[PaymentsTrigger] Erro crítico ao processar pagamento finalizado para booking ${bookingId}:`, error);
        // TODO: Marcar o booking com um erro de processamento de pagamento para revisão manual.
        // Ex: await db.collection("bookings").doc(bookingId).update({ paymentStatus: "payout_error", errorLog: (error as Error).message });
      }
    } else {
        functions.logger.info(`[PaymentsTrigger] Agendamento ${bookingId} atualizado, mas não acionou o processamento de pagamento finalizado. Novo status: ${newBookingData.status}, Status Pagamento: ${newBookingData.paymentStatus}`);
    }
    return null;
  });

// Você pode adicionar outros triggers de pagamento aqui, por exemplo:
// - Um trigger agendado para processar repasses em lote.
// - Um trigger para lidar com falhas de pagamento ou reembolsos.