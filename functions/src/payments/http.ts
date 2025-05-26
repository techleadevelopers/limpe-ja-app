// LimpeJaApp/functions/src/payments/http.ts
import * as functions from "firebase-functions"; // Para functions.logger
import { region } from "firebase-functions/v1";
import express from "express";
import cors from "cors";
// import { db, auth as adminAuth } from "../config/firebaseAdmin"; // Descomente se precisar de db ou auth
import { createPixCharge, handlePixWebhook } from "../services/paymentGateway.service"; // Importa as funções PIX

const REGION = "southamerica-east1";
const app = express();

// Middleware para parsear JSON no corpo da requisição para a maioria das rotas
app.use(express.json());
app.use(cors({ origin: true })); // Habilita CORS

// TODO: Adicionar middleware de autenticação ('authenticate') se os endpoints precisarem ser protegidos
// Exemplo:
// const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => { /* ... sua lógica de autenticação ... */ };
// app.post("/create-pix-charge", authenticate, async (req: express.Request, res: express.Response) => { ... });


// Endpoint para criar uma cobrança PIX
app.post("/create-pix-charge", async (req: express.Request, res: express.Response) => {
  // Se o endpoint for protegido, você pegaria o userId de (req as any).user.uid
  
  const {
    amountInCents,
    bookingId,
    description,
    // clientName, // Opcional, dependendo do seu PSP
    // clientCpf,  // Opcional
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
    functions.logger.info(`[PaymentsHTTP] Recebida solicitação para criar cobrança PIX para booking: ${bookingId}, valor: ${amountInCents}`);
    const pixChargeInfo = await createPixCharge(
      amountInCents,
      bookingId,
      description,
      // clientName,
      // clientCpf
    );
    return res.status(200).send(pixChargeInfo);
  } catch (error: any) {
    functions.logger.error("[PaymentsHTTP] Erro interno ao criar cobrança PIX:", {
        message: error.message,
        details: error,
        bookingId: bookingId
    });
    return res.status(500).send({ error: error.message || "Falha ao criar cobrança PIX." });
  }
});

// Endpoint para webhooks do seu Provedor de PIX
// É crucial que este endpoint use express.raw({type: 'application/json'})
// SE o seu provedor de PIX exigir o corpo bruto (raw body) para verificação de assinatura.
// Se não, o express.json() global já terá feito o parse.
app.post("/pix-webhook", express.raw({ type: 'application/json' }), async (req: express.Request, res: express.Response) => {
    const webhookPayload = req.body; // Se express.raw, é um Buffer. Se express.json, é um objeto.
    // const signature = req.headers['x-psp-signature-header']; // Comentado temporariamente (TS6133)
                                                              // Descomente quando for implementar a validação.

    functions.logger.info("[PaymentsHTTP] Webhook PIX recebido.");
    functions.logger.debug("[PaymentsHTTP] Headers do Webhook PIX:", req.headers);
    functions.logger.debug("[PaymentsHTTP] Corpo bruto do Webhook PIX (se aplicável):", webhookPayload.toString());


    // TODO: Implementar a validação da assinatura do Webhook (MUITO IMPORTANTE PARA SEGURANÇA)
    // 1. Obtenha o segredo do webhook das configurações do Firebase:
    //    const WEBHOOK_SECRET = functions.config().pix_provider?.webhook_secret;
    // 2. Implemente uma função para validar a assinatura usando o corpo bruto (req.body como Buffer),
    //    a assinatura do header, e o segredo. Consulte a documentação do seu PSP.
    //    Exemplo:
    //    const isValid = suaFuncaoDeValidarAssinatura(req.body, signature, WEBHOOK_SECRET);
    //    if (!isValid) {
    //      functions.logger.error("[PaymentsHTTP] Assinatura do webhook PIX inválida.");
    //      return res.status(400).send("Assinatura inválida.");
    //    }

    // TODO: Chamar a função para processar o payload do webhook após validação.
    try {
        // Se req.body for um Buffer (devido a express.raw), você precisará parseá-lo para JSON.
        // Se o express.json() global já fez o parse (e você removeu express.raw para esta rota),
        // webhookPayload já será um objeto.
        let parsedPayload;
        if (Buffer.isBuffer(webhookPayload)) {
            parsedPayload = JSON.parse(webhookPayload.toString());
        } else {
            parsedPayload = webhookPayload; // Já é um objeto JSON
        }
        
        await handlePixWebhook(parsedPayload); // Função do seu paymentGateway.service.ts
        functions.logger.info("[PaymentsHTTP] Webhook PIX processado (lógica em handlePixWebhook).");
    } catch (processingError: any) {
        functions.logger.error("[PaymentsHTTP] Erro ao processar o conteúdo do webhook PIX:", {
            message: processingError.message,
            payload: webhookPayload.toString(), // Loga o payload que causou erro
        });
        // Retorne 200 OK mesmo em caso de erro de processamento para evitar retentativas excessivas do PSP,
        // mas garanta que você logou o erro para investigação. Alguns PSPs esperam 5xx para retentar. Verifique.
        return res.status(500).send({ error: "Erro ao processar webhook." }); 
    }
    
    // Responda 200 OK para o PSP para confirmar o recebimento.
    // O processamento real pode ser feito de forma assíncrona.
    return res.status(200).send({ received: true });
});

export const paymentsApi = region(REGION).https.onRequest(app);