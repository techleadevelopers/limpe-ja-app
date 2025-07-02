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
 * ALINHADO COM O BACKEND: qrCodeImage e expiresAt são requeridos e do tipo string.
 */
export interface PixChargeResponseDto {
  transactionId: string; // ALTERADO: De 'id' para 'transactionId' para espelhar o backend
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED'; // Mantido o status que você definiu
  brCode: string; // ALTERADO: De 'pixCode' e 'qrCodeData' para 'brCode' (código copia e cola)
  qrCodeImage: string; // CORREÇÃO: Agora requerido, pois o backend sempre retorna a URL
  expiresAt: string; // CORREÇÃO: Agora requerido e do tipo string (ISO 8601), como é comum em APIs
  amount: number;
  description: string;
  bookingId?: string; // <<<<< CORREÇÃO: ADICIONADO A PROPRIEDADE AQUI >>>>>
  brCodeError?: string; // CORREÇÃO: Adicionado para resolver erro de tipagem no frontend
  expirationDate?: string; // CORREÇÃO: Adicionado para resolver erro de tipagem no frontend (se usado para formatar)
}

/**
 * @interface RequestWithdrawalDto
 * DTO para solicitar um saque (para provedores).
 * ALINHADO COM O BACKEND: Inclui todos os campos esperados pelo backend.
 */
export interface RequestWithdrawalDto {
    amount: number; // ✅ agora aceita qualquer número
  bankName: string;
  agencyNumber: string;
  accountNumber: string;
  accountType: 'CONTA_CORRENTE' | 'CONTA_POUPANCA';
  notes?: string;
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
