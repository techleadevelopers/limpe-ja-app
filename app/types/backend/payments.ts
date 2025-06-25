// LimpeJaApp/src/types/backend/payments.ts

/**
 * @interface CreatePixChargeDto
 * DTO para criar uma cobrança PIX.
 */
export interface CreatePixChargeDto {
  amount: number;
  description: string;
  bookingId?: string; // Se a cobrança PIX está ligada a um agendamento
  providerId?: string; // ADICIONADO: ID do provedor para quem o pagamento será direcionado (necessário pelo backend)
}

/**
 * @interface PixChargeResponseDto
 * Resposta do backend após a criação de uma cobrança PIX.
 */
export interface PixChargeResponseDto {
  transactionId: string; // ALTERADO: De 'id' para 'transactionId' para espelhar o backend
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED'; // Mantido o status que você definiu
  brCode: string; // ALTERADO: De 'pixCode' e 'qrCodeData' para 'brCode' (código copia e cola)
  qrCodeImage: string; // ALTERADO: De 'qrCodeImageUrl' para 'qrCodeImage' (URL ou base64 da imagem do QR Code)
  expiresAt?: string; // Alterado de Date para string (ISO) para ser consistente com o que geralmente vem da API
  amount: number;
  description: string;
  bookingId?: string; // <<<<< CORREÇÃO: ADICIONADO A PROPRIEDADE AQUI >>>>>
  brCodeError?: string; // CORREÇÃO: Adicionado para resolver erro de tipagem no frontend
  expirationDate?: string; // CORREÇÃO: Adicionado para resolver erro de tipagem no frontend (se usado para formatar)
}

/**
 * @interface RequestWithdrawalDto
 * DTO para solicitar um saque (para provedores).
 */
export interface RequestWithdrawalDto {
  amount: number;
  bankAccountId?: string; // Opcional, se o provedor tiver várias contas
  // Adicione outros campos como senha de transação, etc.
}

/**
 * @interface TransactionEntity
 * Representa uma transação financeira genérica no sistema.
 * (Pode ser usada se a `ProviderTransaction` em providers.ts for uma versão simplificada)
 */
export interface TransactionEntity {
  id: string;
  userId: string; // ID do usuário associado
  type: 'SERVICE_PAYMENT' | 'WITHDRAWAL' | 'ADJUSTMENT' | 'CHARGE_CLIENT';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'PROCESSING';
  description: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  bookingId?: string;
  relatedUserId?: string; // ID do outro usuário envolvido na transação (cliente ou provedor)
}