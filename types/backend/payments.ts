// LimpeJaApp/src/types/backend/payments.ts

/**
 * @interface CreatePixChargeDto
 * DTO para criar uma cobrança PIX.
 * REMOVIDO: clientEmail, pois o backend o obtém do token/DB.
 */
export interface CreatePixChargeDto {
  amount: number;
  description: string;
  bookingId?: string | null; // Se a cobrança PIX está ligada a um agendamento
  providerId?: string | null; // ID do provedor para quem o pagamento será direcionado (necessário pelo backend)
  // clientEmail: string; // REMOVIDO: Esta propriedade não deve ser enviada do frontend para o backend neste DTO.
                        // O backend já obtém o email do cliente a partir do token de autenticação.
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
  bookingId?: string | null; // <<<<< CORREÇÃO: ADICIONADO A PROPRIEDADE AQUI >>>>>
  brCodeError?: string | null; // CORREÇÃO: Adicionado para resolver erro de tipagem no frontend
  expirationDate?: string | null; // CORREÇÃO: Adicionado para resolver erro de tipagem no frontend (se usado para formatar)
  providerId: string; // Adicionado aqui, pois é uma informação importante na resposta.
}

/**
 * @interface RequestWithdrawalDto
 * DTO para solicitar um saque (para provedores).
 * ALINHADO COM O BACKEND: Inclui todos os campos esperados pelo backend.
 */
export interface RequestWithdrawalDto {
  amount: number;
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  pixKey: string;
  notes?: string | null;
}

export enum PixKeyType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  RANDOM = 'RANDOM',
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
  bookingId?: string | null;
  relatedUserId?: string | null; // ID do outro usuário envolvido na transação (cliente ou provedor)
}