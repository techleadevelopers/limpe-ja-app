// LimpeJaApp/functions/src/payments/http.ts
import * as functions from "firebase-functions";
import { region } from "firebase-functions/v1";
import express from "express";
import cors from "cors";
import * as admin from "firebase-admin";
import { db, auth as adminAuth } from "../config/firebaseAdmin";
import { createPixCharge, handlePixWebhook, validatePixWebhookSignature, PixChargeResponse } from "../services/paymentGateway.service";
import { Booking, PaymentStatus } from "../types/booking.types";
import { environment } from "../config/environment";

const REGION = "southamerica-east1";
const app = express();

// Middleware para autenticação (mantido como está)
const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
    functions.logger.warn("[Auth Middleware] Requisição sem token de autorização.");
    return res.status(403).send({ error: "Não autorizado. Token de autorização é necessário." });
  }

  const idToken = req.headers.authorization.split("Bearer ")[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    (req as any).user = decodedToken;
    return next();
  } catch (error: any) {
    functions.logger.error("[Auth Middleware] Erro ao verificar token:", { message: error.message, token: idToken });
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).send({ error: "Token de autenticação expirado. Faça login novamente." });
    }
    return res.status(403).send({ error: "Não autorizado. Token inválido ou expirado." });
  }
};

app.use(cors({ origin: true }));

// Endpoint para criar uma cobrança PIX
app.post("/create-pix-charge", authenticate, async (req: express.Request, res: express.Response) => {
  const userId = (req as any).user.uid;
  const {
    amountInCents,
    bookingId,
    description,
  } = req.body;

  if (typeof amountInCents !== "number" || amountInCents <= 0) {
    functions.logger.error("[PaymentsHTTP] Erro em /create-pix-charge: Valor inválido.", { body: req.body });
    return res.status(400).send({ error: "O valor (amountInCents) deve ser um número positivo." });
  }
  if (!bookingId || typeof bookingId !== "string") {
    functions.logger.error("[PaymentsHTTP] Erro em /create-pix-charge: bookingId ausente ou inválido.", { body: req.body });
    return res.status(400).send({ error: "O ID do Agendamento (bookingId) é obrigatório e deve ser uma string." });
  }

  try {
    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      functions.logger.error(`[PaymentsHTTP] Agendamento não encontrado: ${bookingId}`);
      return res.status(404).send({ error: "Agendamento não encontrado." });
    }

    const booking = bookingSnap.data() as Booking;

    if (booking.clientId !== userId) {
      functions.logger.warn(`[PaymentsHTTP] Cliente ${userId} tentou criar cobrança para agendamento não seu: ${bookingId}`);
      return res.status(403).send({ error: "Você não tem permissão para gerar cobrança para este agendamento." });
    }

    if (booking.status !== "confirmed_by_provider" || booking.paymentStatus !== "pending_payment") {
      functions.logger.warn(`[PaymentsHTTP] Agendamento ${bookingId} não está em status de pagamento pendente. Status: ${booking.status}, PaymentStatus: ${booking.paymentStatus}`);
      return res.status(400).send({ error: "Este agendamento não está pronto para ser pago ou já foi processado." });
    }

    if (amountInCents !== booking.totalPrice) {
      functions.logger.warn(`[PaymentsHTTP] Valor da cobrança (${amountInCents}) difere do total do booking (${booking.totalPrice}) para agendamento ${bookingId}.`);
      return res.status(400).send({ error: "O valor da cobrança não corresponde ao valor total do agendamento." });
    }

    functions.logger.info(`[PaymentsHTTP] Recebida solicitação para criar cobrança PIX para booking: ${bookingId}, valor: ${amountInCents}`);
    
    // Chama a função real de criação de cobrança no serviço
    const pixChargeInfo: PixChargeResponse = await createPixCharge(
      amountInCents,
      bookingId,
      description || `Serviço de limpeza - Agendamento ${bookingId}`,
    );

    // Atualiza o booking com os dados da cobrança PIX
    await bookingRef.update({
      paymentGatewayRefId: pixChargeInfo.pixTransactionId,
      paymentStatus: "awaiting_payment_confirmation" as PaymentStatus,
      pixQrCode: pixChargeInfo.qrCode,
      pixCode: pixChargeInfo.copiaECola,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info(`[PaymentsHTTP] Cobrança PIX criada e booking ${bookingId} atualizado.`);
    return res.status(200).send(pixChargeInfo);

  } catch (error: any) {
    functions.logger.error("[PaymentsHTTP] Erro interno ao criar cobrança PIX:", {
        message: error.message,
        details: error,
        bookingId: bookingId,
        userId: userId,
    });
    return res.status(500).send({ error: error.message || "Falha ao criar cobrança PIX." });
  }
});

// Endpoint para webhooks do seu Provedor de PIX
// É crucial que este endpoint use express.raw({type: 'application/json'}) para que o rawBody esteja disponível para validação da assinatura.
app.post("/pix-webhook", express.raw({ type: 'application/json' }), async (req: express.Request, res: express.Response) => {
    // Para `express.raw`, req.body JÁ É um Buffer.
    const rawBody = req.body;
    // O nome do header da assinatura varia entre PSPs (ex: 'x-webhook-signature', 'x-hub-signature', 'x-pagseguro-signature')
    const signature = req.headers["x-webhook-signature"] as string | undefined; // <--- **AJUSTE O NOME DO HEADER CONFORME SEU PSP**

    functions.logger.info("[PaymentsHTTP] Webhook PIX recebido.");
    functions.logger.debug("[PaymentsHTTP] Headers do Webhook PIX:", req.headers);
    functions.logger.debug("[PaymentsHTTP] Corpo bruto do Webhook PIX (se aplicável):", rawBody.toString());

    // Lê o segredo do webhook do environment.ts
    const WEBHOOK_SECRET = environment.pix_provider?.webhook_secret;

    if (!WEBHOOK_SECRET) {
      functions.logger.error("[PaymentsHTTP] WEBHOOK_SECRET não configurado. Impossível validar assinatura.");
      return res.status(500).send("Erro de configuração do servidor.");
    }

    if (!signature) {
      functions.logger.error("[PaymentsHTTP] Assinatura do webhook ausente.");
      return res.status(400).send("Assinatura ausente.");
    }

    try {
      // Chama a função de validação de assinatura do serviço.
      // Lembre-se que validatePixWebhookSignature em paymentGateway.service.ts ainda é MOCK.
      const isValidSignature = validatePixWebhookSignature(rawBody, signature, WEBHOOK_SECRET);
      if (!isValidSignature) {
        functions.logger.error("[PaymentsHTTP] Assinatura do webhook PIX inválida.");
        return res.status(400).send("Assinatura inválida.");
      }
      functions.logger.info("[PaymentsHTTP] Assinatura do webhook PIX validada com sucesso.");
    } catch (validationError: any) {
      functions.logger.error("[PaymentsHTTP] Erro durante a validação da assinatura do webhook PIX:", { message: validationError.message });
      return res.status(400).send("Erro na validação da assinatura.");
    }

    let parsedPayload;
    try {
        // Tenta parsear o corpo bruto como JSON
        parsedPayload = JSON.parse(rawBody.toString());
    } catch (parseError: any) {
        functions.logger.error("[PaymentsHTTP] Erro ao parsear o corpo do webhook PIX para JSON:", { message: parseError.message, rawBody: rawBody.toString() });
        return res.status(400).send("Corpo da requisição inválido.");
    }
    
    try {
        // Chama a função de tratamento do webhook no serviço
        await handlePixWebhook(parsedPayload);
        functions.logger.info("[PaymentsHTTP] Webhook PIX processado (lógica em handlePixWebhook).");
    } catch (processingError: any) {
        functions.logger.error("[PaymentsHTTP] Erro ao processar o conteúdo do webhook PIX na lógica de negócio:", {
            message: processingError.message,
            payload: parsedPayload,
            stack: processingError.stack
        });
        // É importante retornar 200 OK para o PSP mesmo em caso de erro de processamento interno,
        // para evitar que ele reenvie o webhook repetidamente.
        return res.status(200).send({ error: "Erro ao processar webhook." }); 
    }
    
    // Retorna 200 OK para o PSP indicando que o webhook foi recebido e processado.
    return res.status(200).send({ received: true });
});

export const paymentsApi = region(REGION).https.onRequest(app);