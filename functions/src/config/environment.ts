// LimpeJaApp/functions/src/config/environment.ts
import * as functions from "firebase-functions";

export const environment = {
  // Stripe foi um exemplo, pode remover se não for usar para nada
  // stripe: {
  //   secretKey: functions.config().stripe?.secretkey,
  // },
  pix_provider: { // Configuração para seu Provedor de Serviço de Pagamento PIX
    apikey: functions.config().pix_provider?.apikey,      // Ex: firebase functions:config:set pix_provider.apikey="SUA_CHAVE_API"
    secret: functions.config().pix_provider?.secret,    // Ex: firebase functions:config:set pix_provider.secret="SEU_SEGREDO"
    base_url: functions.config().pix_provider?.base_url, // Ex: firebase functions:config:set pix_provider.base_url="https://api.seu-psp.com/v1"
    webhook_secret: functions.config().pix_provider?.webhook_secret // ADICIONADO: Propriedade webhook_secret
  },
  isEmulated: process.env.FUNCTIONS_EMULATOR === "true",
};

// Verificação opcional para a chave do provedor PIX
if (!environment.pix_provider.apikey && !environment.isEmulated) {
  console.warn(
    "API Key do Provedor PIX não configurada no ambiente do Firebase Functions (pix_provider.apikey)."
  );
}

// ADICIONADO: Verificação opcional para o segredo do webhook PIX
if (!environment.pix_provider.webhook_secret && !environment.isEmulated) {
  console.warn(
    "Webhook Secret do Provedor PIX não configurado no ambiente do Firebase Functions (pix_provider.webhook_secret)."
  );
}