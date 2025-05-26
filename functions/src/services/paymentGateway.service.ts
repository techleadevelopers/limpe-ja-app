// LimpeJaApp/functions/src/services/paymentGateway.service.ts
// import axios from 'axios'; // REMOVIDO TEMPORARIAMENTE
import { environment } from "../config/environment";
const PIX_PROVIDER_API_KEY = environment.pix_provider?.apikey;
const PIX_PROVIDER_BASE_URL = environment.pix_provider?.base_url;

if (!PIX_PROVIDER_API_KEY && !environment.isEmulated) {
  console.error("Chave de API do Provedor PIX não configurada nas variáveis de ambiente.");
}
if (!PIX_PROVIDER_BASE_URL && !environment.isEmulated) {
  console.error("URL Base do Provedor PIX não configurada nas variáveis de ambiente.");
}

interface PixChargeResponse {
  qrCode?: string; // Pode ser a string base64 da imagem do QR Code
  copiaECola?: string;
  pixTransactionId?: string; // ID da transação no PSP
  // Outros campos que o PSP retornar
}

/**
 * Cria uma cobrança PIX (QR Code e/ou Copia e Cola) junto ao PSP escolhido.
 */
export const createPixCharge = async (
  amountInCents: number, // Valor em centavos
  bookingId: string,
  clientName?: string, // Opcional, dependendo do PSP
  clientCpf?: string,  // Opcional, dependendo do PSP
  description?: string,
): Promise<PixChargeResponse> => {
  if (!PIX_PROVIDER_API_KEY || !PIX_PROVIDER_BASE_URL) {
    console.error("Configuração do Provedor PIX incompleta para criar cobrança.");
    throw new Error("Sistema de pagamento PIX não configurado corretamente.");
  }

  const payload = {
    valor: parseFloat((amountInCents / 100).toFixed(2)), // PSP pode esperar o valor em reais como número
    identificadorDaCobranca: bookingId,
    chavePixRecebedora: "SUA_CHAVE_PIX_DA_EMPRESA_LIMPEJA", // Configure sua chave PIX real
    descricao: description || `Pagamento LimpeJá - Agendamento ${bookingId}`,
    // Adicione dados do devedor (cliente) se o seu PSP exigir/permitir
    // devedor: clientCpf && clientName ? { nome: clientName, cpf: clientCpf.replace(/\D/g, '') } : undefined,
    // Mais campos específicos do seu PSP...
  };

  console.log(`[PaymentGateway] Criando cobrança PIX para booking ${bookingId}, valor ${payload.valor} BRL. Payload:`, payload);

  try {
    // Substitua pela chamada real à API do seu PSP
    // const response = await axios.post(`${PIX_PROVIDER_BASE_URL}/cobrancas`, payload, {
    //   headers: { 
    //       'Authorization': `Bearer ${PIX_PROVIDER_API_KEY}`,
    //       'Content-Type': 'application/json'
    //   }
    // });

    // ------- INÍCIO DA SIMULAÇÃO (remova ou comente ao integrar com PSP real) --------
    await new Promise(resolve => setTimeout(resolve, 700));
    const mockApiResponse = {
        // Estrutura da resposta simulada do PSP
        txid: `psp_tx_${Date.now()}`,
        calendario: { criacao: new Date().toISOString(), expiracao: 3600 },
        valor: { original: payload.valor.toFixed(2) },
        chave: "SUA_CHAVE_PIX_DA_EMPRESA_LIMPEJA",
        solicitacaoPagador: payload.descricao,
        pixCopiaECola: `00020126580014BR.GOV.BCB.PIX0136${Math.random().toString(36).substring(2, 15)}-xxxx-xxxx-xxxx-xxxxxxxxxxxx520400005303986540${payload.valor.toFixed(2).length.toString().padStart(2,'0')}${payload.valor.toFixed(2)}5802BR5925NOME_DA_SUA_EMPRESA6009SAO_PAULO62290525identificadorDaCobranca${bookingId}6304XXXX`,
        // linkVisualizacao: "https://psp.com/link_qr_code_visualizacao" // Se o PSP fornecer
    };
    console.log("[PaymentGateway] Resposta simulada da API do PSP:", mockApiResponse);
    // ------- FIM DA SIMULAÇÃO --------

    // Processar a resposta real do PSP. Exemplo:
    // if (response.data && response.data.pixCopiaECola) {
    if (mockApiResponse && mockApiResponse.pixCopiaECola) { // Usando a simulação
      // console.log(`[PaymentGateway] Cobrança PIX criada com ID no PSP: ${response.data.txid}`);
      console.log(`[PaymentGateway] Cobrança PIX criada com ID no PSP: ${mockApiResponse.txid}`);
      return {
        copiaECola: mockApiResponse.pixCopiaECola,
        pixTransactionId: mockApiResponse.txid,
        // qrCode: response.data.imagemQrCode, // Se o PSP fornecer a imagem base64
      };
    } else {
      console.error("[PaymentGateway] Resposta inesperada do PSP ao criar cobrança PIX:", mockApiResponse);
      throw new Error("Não foi possível gerar o PIX para pagamento (resposta inesperada).");
    }
  } catch (error: any) {
    console.error("[PaymentGateway] Erro ao criar cobrança PIX:", error.response?.data || error.message || error);
    throw new Error(error.response?.data?.mensagem || "Falha ao comunicar com o sistema de pagamento PIX.");
  }
};

/**
 * Função para ser chamada por um webhook do PSP quando um PIX é pago.
 */
export const handlePixWebhook = async (webhookPayload: any): Promise<void> => {
    console.log("[PaymentGateway] Webhook PIX recebido:", webhookPayload);
    // TODO: Implementar a lógica completa do webhook conforme a documentação do seu PSP
    // 1. Validar a autenticidade do webhook (essencial!).
    // 2. Extrair o identificadorDaCobranca (que seria o bookingId) e o status do pagamento.
    // 3. Se o PIX foi pago, atualizar o status do booking no Firestore e outras lógicas de negócio.
    const bookingId = webhookPayload.identificadorDaCobranca; // Exemplo, ajuste ao payload real
    const statusPagamento = webhookPayload.statusPagamento; // Exemplo

    if (bookingId && (statusPagamento === 'CONCLUIDA' || statusPagamento === 'PAGO')) { // Ajuste os status
        console.log(`[PaymentGateway] PIX para booking ${bookingId} confirmado como PAGO.`);
        // Ex: await processSuccessfulPaymentForBooking(bookingId); (função a ser criada)
    }
};

// Função para repasses PIX para prestadores (MUITO MAIS COMPLEXA)
export const processPixPayout = async (providerPixKey: string, providerName: string, providerCpfCnpj: string, amountInCents: number, description: string, bookingId: string) => {
  if (!PIX_PROVIDER_API_KEY || !PIX_PROVIDER_BASE_URL) { /* ... */ throw new Error("Configuração PIX incompleta.");}
  console.log(`[PaymentGateway] Processando repasse PIX de ${amountInCents / 100} para ${providerName} referente ao booking ${bookingId}`);
  // TODO: Lógica real para iniciar uma transferência PIX para a conta do prestador.
  // Isso requer que o PSP suporte essa funcionalidade via API, que você tenha os dados da chave PIX do prestador,
  // e que cumpra todas as regulações e requisitos de segurança para repasses.
  console.log(`[PaymentGateway] SIMULAÇÃO: Repasse PIX para prestador ${providerName} (Chave: ${providerPixKey}) no valor de ${amountInCents / 100} BRL.`);
  return { success: true, payoutId: `payout_pix_sim_${Date.now()}` };
};