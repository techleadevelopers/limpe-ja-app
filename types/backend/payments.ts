// LimpeJaApp/src/types/backend/payments.ts

/**
 * @interface CreatePixChargeDto
 * DTO para criar uma cobrança PIX.
 * REMOVIDO: clientEmail, pois o backend o obtém do token/DB.
 */
export interface CreatePixChargeDto {
  amount: number;
  description: string;
  bookingId: string;
  providerId: string;
}

/**
 * @interface PixChargeResponseDto
 * Resposta do backend após a criação de uma cobrança PIX.
 * ALINHADO COM O BACKEND: qrCodeImage e expiresAt são requeridos e do tipo string.
 */
export interface PixChargeResponseDto {
  transactionId: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'REFUNDED' | 'CHARGEBACK';
  brCode: string;
  qrCodeImage: string;
  expiresAt: string;
  amount: number;
  description: string;
  bookingId?: string | null;
  brCodeError?: string | null;
  expirationDate?: string | null;
  providerId: string;
  paymentIntent?: PaymentIntent;
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




export enum PaymentIntentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
  CHARGEBACK = 'CHARGEBACK',
}

export interface PaymentIntent {
  id: string;
  bookingId: string;
  amountCents: number;
  amount: number;
  status: PaymentIntentStatus;
  gateway: string;
  externalRef?: string | null;
  qrCodeUrl?: string | null;
  qrCodeText?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// FE-normalized Intent helper (drop-in)
export type FEIntent = 'PENDING' | 'PAID' | 'EXPIRED' | 'REFUNDED' | 'CHARGEBACK';
export const normalizeIntent = (raw: string): FEIntent => {
  if (raw === 'CANCELLED') return 'EXPIRED';
  if (raw === 'CANCELED') return 'EXPIRED';
  const allowed: FEIntent[] = ['PENDING', 'PAID', 'EXPIRED', 'REFUNDED', 'CHARGEBACK'];
  return (allowed.includes(raw as FEIntent) ? (raw as FEIntent) : 'EXPIRED');
};
