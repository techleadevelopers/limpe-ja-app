// LimpeJaApp/functions/src/services/paymentGateway.service.ts
import * as functions from "firebase-functions";
import { db } from "../config/firebaseAdmin";
import { Booking, PaymentStatus } from "../types/booking.types";
import { ProviderProfile } from "../types/provider.types";
import * as admin from "firebase-admin";
import axios from "axios"; // Importar Axios para chamadas HTTP

// Constantes de configuração
const COMMISSION_RATE = 0.20; // 20% de comissão para o LimpeJá

import { environment } from "../config/environment";
const PIX_PROVIDER_API_KEY = environment.pix_provider?.apikey;
const PIX_PROVIDER_BASE_URL = environment.pix_provider?.base_url;
const PIX_WEBHOOK_SECRET = environment.pix_provider?.webhook_secret;
const LIMPEJA_PIX_KEY = "SUA_CHAVE_PIX_DA_EMPRESA_LIMPEJA"; // <--- **SUBSTITUA PELA CHAVE PIX REAL DA SUA EMPRESA**

if (!PIX_PROVIDER_API_KEY && !environment.isEmulated) {
  functions.logger.error("Chave de API do Provedor PIX não configurada nas variáveis de ambiente.");
}
if (!PIX_PROVIDER_BASE_URL && !environment.isEmulated) {
  functions.logger.error("URL Base do Provedor PIX não configurada nas variáveis de ambiente.");
}
if (!PIX_WEBHOOK_SECRET && !environment.isEmulated) {
  functions.logger.error("Segredo do Webhook PIX não configurado nas variáveis de ambiente.");
}


export interface PixChargeResponse {
  qrCode?: string; // URL ou base64 do QR Code
  copiaECola?: string; // String do PIX Copia e Cola
  pixTransactionId?: string; // ID da transação no PSP
}

/**
 * Cria uma cobrança PIX no PSP (Provedor de Serviços de Pagamento).
 * ESTA É A IMPLEMENTAÇÃO "REAL" GENÉRICA. VOCÊ DEVE AJUSTAR PARA SEU PSP ESPECÍFICO.
 */
export const createPixCharge = async (
  amountInCents: number,
  bookingId: string,
  description: string,
): Promise<PixChargeResponse> => {
  functions.logger.info(`[PaymentGatewayService] Criando cobrança PIX para booking ${bookingId} de ${amountInCents} centavos.`);

  if (!PIX_PROVIDER_API_KEY || !PIX_PROVIDER_BASE_URL) {
    functions.logger.error("Configuração do Provedor PIX incompleta para criar cobrança.");
    throw new Error("Sistema de pagamento PIX não configurado corretamente.");
  }

  // Payload a ser enviado para a API do PSP para criar a cobrança.
  // **AJUSTE ESTE PAYLOAD CONFORME A DOCUMENTAÇÃO DO SEU PSP.**
  const payload = {
    valor: parseFloat((amountInCents / 100).toFixed(2)), // Valor em BRL
    identificador_transacao: bookingId, // ID de referência externa (seu bookingId)
    mensagem_pagador: description || `Pagamento LimpeJá - Agendamento ${bookingId}`,
    chave_recebedora: LIMPEJA_PIX_KEY, // Chave PIX da sua empresa
    // Muitos PSPs exigem uma URL de webhook para notificar o pagamento.
    // Certifique-se de que esta URL está configurada no seu PSP.
    url_webhook: `${PIX_PROVIDER_BASE_URL}/webhooks/pix`, // Exemplo de URL de webhook
    // Outros campos que seu PSP possa exigir (ex: dados do pagador, tempo de expiração)
    // expiracao_segundos: 3600, // Exemplo: expira em 1 hora
  };

  functions.logger.log(`[PaymentGateway] Enviando requisição para criar cobrança PIX. Payload:`, payload);

  try {
    const response = await axios.post(
      `${PIX_PROVIDER_BASE_URL}/api/v1/pix/charges`, // <--- **SUBSTITUA PELA URL REAL DA API DE CRIAÇÃO DE COBRANÇA DO SEU PSP**
      payload,
      {
        headers: {
          'Authorization': `Bearer ${PIX_PROVIDER_API_KEY}`, // <--- **AJUSTE O HEADER DE AUTORIZAÇÃO CONFORME SEU PSP**
          'Content-Type': 'application/json',
        },
      }
    );

    const apiResponse = response.data;
    functions.logger.log("[PaymentGateway] Resposta da API do PSP:", apiResponse);

    // **AJUSTE AQUI CONFORME A ESTRUTURA DA RESPOSTA DO SEU PSP.**
    // As propriedades 'qrCode', 'copiaECola' e 'transactionId' variam entre PSPs.
    if (apiResponse && apiResponse.qrCode && apiResponse.copiaECola && apiResponse.transactionId) {
      functions.logger.log(`[PaymentGateway] Cobrança PIX criada com ID no PSP: ${apiResponse.transactionId}`);
      return {
        qrCode: apiResponse.qrCode, // Pode ser uma URL para a imagem do QR Code ou a string base64
        copiaECola: apiResponse.copiaECola,
        pixTransactionId: apiResponse.transactionId,
      };
    } else {
      functions.logger.error("[PaymentGateway] Resposta inesperada do PSP ao criar cobrança PIX:", apiResponse);
      throw new Error("Não foi possível gerar o PIX para pagamento (resposta inesperada do PSP).");
    }
  } catch (error: any) {
    functions.logger.error("[PaymentGateway] Erro ao criar cobrança PIX:", error.response?.data || error.message || error);
    throw new Error(error.response?.data?.message || "Falha ao comunicar com o sistema de pagamento PIX.");
  }
};

/**
 * Valida a assinatura de um webhook PIX.
 * ESTA É UMA LÓGICA MOCK. VOCÊ DEVE IMPLEMENTAR A VALIDAÇÃO REAL DO SEU PSP EM PRODUÇÃO.
 * ISSO É CRÍTICO PARA A SEGURANÇA.
 */
export function validatePixWebhookSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  functions.logger.warn("[PaymentGatewayService] ATENÇÃO: A validação de assinatura do webhook PIX está usando uma lógica MOCK. IMPLEMENTE A VALIDAÇÃO REAL DO SEU PSP EM PRODUÇÃO!");
  // **EXEMPLO DE LÓGICA REAL (varia MUITO entre PSPs):**
  // Alguns PSPs usam HMAC-SHA256:
  // const crypto = require('crypto');
  // const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  // return expectedSignature === signature;

  // Outros PSPs podem ter SDKs ou funções específicas para validação.
  // Consulte a documentação do seu PSP para a implementação correta.
  return true; // <--- **MUDAR ISSO PARA A LÓGICA REAL DO SEU PSP EM PRODUÇÃO**
}

/**
 * Processa o payload de um webhook PIX, atualizando o agendamento e o saldo do prestador.
 * AJUSTE AQUI CONFORME A ESTRUTURA REAL DO PAYLOAD DO WEBHOOK DO SEU PSP.
 */
export const handlePixWebhook = async (webhookPayload: any): Promise<void> => {
  functions.logger.info("[PaymentGatewayService] Webhook PIX recebido:", webhookPayload);

  // **AJUSTE AQUI CONFORME A ESTRUTURA REAL DO PAYLOAD DO WEBHOOK DO SEU PSP.**
  // Cada PSP tem uma estrutura diferente para o webhook.
  // Você precisará mapear os campos do webhook para as variáveis abaixo.
  const paymentReferenceId = webhookPayload.transactionId || webhookPayload.data?.id || webhookPayload.pix?.[0]?.txid || webhookPayload.identificador_transacao; // Exemplo de mapeamento
  const paymentStatus = webhookPayload.status || webhookPayload.data?.status || webhookPayload.status_pagamento; // Exemplo de mapeamento
  // const amountPaidInCents = webhookPayload.amount || webhookPayload.data?.transaction_amount_in_cents || (webhookPayload.pix?.[0]?.valor ? parseFloat(webhookPayload.pix[0].valor) * 100 : 0); // Removido pois não é usado (TS6133)
  const bookingId = webhookPayload.external_reference || webhookPayload.data?.external_reference || webhookPayload.metadata?.bookingId || webhookPayload.identificador_transacao_externa; // Exemplo de mapeamento

  if (!paymentReferenceId || !paymentStatus || !bookingId) {
    functions.logger.error("[PaymentGatewayService] Payload do webhook PIX inválido/incompleto.", { webhookPayload });
    throw new Error("Payload do webhook PIX inválido ou incompleto.");
  }

  functions.logger.info(`[PaymentGatewayService] Webhook para booking ${bookingId} com status ${paymentStatus} e refId ${paymentReferenceId}`);

  // **AJUSTE AQUI OS NOMES DOS STATUS QUE SEU PSP USA PARA PAGAMENTO APROVADO.**
  const isPaymentApproved = ["approved", "completed", "paid", "confirmed", "concluida", "pago"].includes(paymentStatus.toLowerCase());

  if (!isPaymentApproved) {
    functions.logger.info(`[PaymentGatewayService] Pagamento para booking ${bookingId} não foi aprovado. Status: ${paymentStatus}`);
    // Você pode adicionar lógica para lidar com pagamentos falhos aqui, se necessário (ex: registrar o erro no booking).
    return;
  }

  const bookingRef = db.collection("bookings").doc(bookingId);
  const bookingSnap = await bookingRef.get();

  if (!bookingSnap.exists) {
    functions.logger.error(`[PaymentGatewayService] Agendamento ${bookingId} não encontrado para o webhook PIX.`);
    throw new Error(`Agendamento ${bookingId} não encontrado.`);
  }

  const booking = bookingSnap.data() as Booking;

  if (booking.paymentStatus === "paid") {
    functions.logger.warn(`[PaymentGatewayService] Agendamento ${bookingId} já está marcado como pago. Ignorando webhook duplicado.`);
    return;
  }
  
  const commissionValue = Math.round(booking.totalPrice * COMMISSION_RATE);
  const providerEarnings = booking.totalPrice - commissionValue;

  await db.runTransaction(async (transaction) => {
    const latestBookingSnap = await transaction.get(bookingRef);
    if (!latestBookingSnap.exists) {
        throw new Error(`Agendamento ${bookingId} não encontrado durante a transação.`);
    }
    const latestBooking = latestBookingSnap.data() as Booking;

    if (latestBooking.paymentStatus === "paid") {
        functions.logger.warn(`[PaymentGatewayService] Agendamento ${bookingId} já está pago na transação. Retrying webhook. Abortando transação.`);
        return;
    }

    transaction.update(bookingRef, {
      paymentStatus: "paid" as PaymentStatus,
      status: "scheduled_paid", // Altera o status do agendamento para agendado e pago
      commissionValue: commissionValue,
      providerEarnings: providerEarnings,
      paymentConfirmedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentGatewayRefId: paymentReferenceId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const providerProfileRef = db.collection("providerProfiles").doc(booking.providerId);
    const providerProfileSnap = await transaction.get(providerProfileRef);

    if (!providerProfileSnap.exists) {
      functions.logger.error(`[PaymentGatewayService] Perfil do prestador ${booking.providerId} não encontrado para o agendamento ${bookingId}.`);
      throw new Error(`Perfil do prestador não encontrado.`);
    }

    const providerProfile = providerProfileSnap.data() as ProviderProfile;

    transaction.update(providerProfileRef, {
      pendingBalance: (providerProfile.pendingBalance || 0) + providerEarnings,
      totalEarnedHistorical: (providerProfile.totalEarnedHistorical || 0) + providerEarnings,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info(`[PaymentGatewayService] Agendamento ${bookingId} marcado como PAGO. Saldo do prestador ${booking.providerId} atualizado com ${providerEarnings} centavos.`);
  });
};

/**
 * Processa o repasse PIX para um prestador.
 * ESTA É A IMPLEMENTAÇÃO "REAL" GENÉRICA. VOCÊ DEVE AJUSTAR PARA SEU PSP ESPECÍFICO.
 */
export const processPixPayout = async (
  providerPixKey: string, 
  providerName: string, 
  providerCpfCnpj: string, // Pode ser necessário para o PSP
  amountInCents: number, 
  description: string, 
  bookingId: string // ID de referência para o repasse
): Promise<{ success: boolean; payoutId?: string; message?: string }> => {
  if (!PIX_PROVIDER_API_KEY || !PIX_PROVIDER_BASE_URL) { 
    functions.logger.error("Configuração PIX incompleta para payout."); 
    throw new Error("Configuração PIX incompleta."); 
  }

  functions.logger.log(`[PaymentGateway] Processando repasse PIX de ${amountInCents / 100} para ${providerName} (chave: ${providerPixKey}) referente ao booking ${bookingId}`);

  // Payload a ser enviado para a API do PSP para iniciar o repasse.
  // **AJUSTE ESTE PAYLOAD CONFORME A DOCUMENTAÇÃO DO SEU PSP.**
  const payload = {
    valor: parseFloat((amountInCents / 100).toFixed(2)), // Valor em BRL
    chave_pix_destino: providerPixKey,
    tipo_chave_pix_destino: "random", // <--- **AJUSTE CONFORME O TIPO DE CHAVE PIX DO PRESTADOR OU DO SEU PSP**
    descricao_repasse: description,
    id_externo_repasse: `payout_${bookingId}_${Date.now()}`, // ID único para o repasse
    // Muitos PSPs exigem dados do recebedor (nome, CPF/CNPJ) para repasses.
    nome_recebedor: providerName,
    documento_recebedor: providerCpfCnpj,
    // Outros campos que seu PSP possa exigir (ex: dados bancários completos, tempo de expiração)
  };

  try {
    const response = await axios.post(
      `${PIX_PROVIDER_BASE_URL}/api/v1/pix/payouts`, // <--- **SUBSTITUA PELA URL REAL DA API DE REPASSE DO SEU PSP**
      payload,
      {
        headers: {
          'Authorization': `Bearer ${PIX_PROVIDER_API_KEY}`, // <--- **AJUSTE O HEADER DE AUTORIZAÇÃO CONFORME SEU PSP**
          'Content-Type': 'application/json',
        },
      }
    );

    const apiResponse = response.data;
    functions.logger.log("[PaymentGateway] Resposta da API de Payout do PSP:", apiResponse);

    // **AJUSTE AQUI CONFORME A ESTRUTURA DA RESPOSTA DO SEU PSP.**
    // As propriedades 'payoutId' e 'status' variam entre PSPs.
    if (apiResponse && apiResponse.payoutId && apiResponse.status === "processing") { // Ou "accepted", "success"
      functions.logger.info(`[PaymentGateway] Repasse PIX iniciado com sucesso. ID do Payout: ${apiResponse.payoutId}`);
      return { success: true, payoutId: apiResponse.payoutId, message: "Repasse iniciado com sucesso." };
    } else {
      functions.logger.error("[PaymentGateway] Resposta inesperada do PSP ao processar repasse:", apiResponse);
      throw new Error("Não foi possível iniciar o repasse PIX (resposta inesperada do PSP).");
    }
  } catch (error: any) {
    functions.logger.error("[PaymentGateway] Erro ao processar repasse PIX:", error.response?.data || error.message || error);
    throw new Error(error.response?.data?.message || "Falha ao comunicar com o sistema de repasse PIX.");
  }
};