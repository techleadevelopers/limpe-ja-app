// LimpeJaApp/src/types/backend/bookings.ts

// Importar interfaces de tipagem relevantes de outros arquivos
import { ProviderDisplayInfo } from './providers';
import { Service } from './services';
import { CreateAddressDto } from './auth';
import { PaymentIntentStatus } from './payments';

/**
 * @enum BookingStatus
 * Enumeração para os possíveis status de um agendamento.
 * Deve ser consistente com o enum BookingStatus no backend (@prisma/client).
 */
export enum BookingStatus {
  PENDING = 'PENDING',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PENDING_PROVIDER_CONFIRMATION = 'PENDING_PROVIDER_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
  ON_THE_WAY = 'ON_THE_WAY',
  ARRIVED = 'ARRIVED',
  STARTED = 'STARTED',
  FINISHED = 'FINISHED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  CANCELED = 'CANCELLED',
  PENDING_DISPUTE = 'PENDING_DISPUTE',
  RESCHEDULED = 'RESCHEDULED',
  REJECTED = 'REJECTED',
  NO_SHOW = 'NO_SHOW',
}

export type BookingAction =
  | 'CONTACT_SUPPORT'
  | 'CANCEL'
  | 'OPEN_DISPUTE'
  | 'START_SERVICE'
  | 'COMPLETE_SERVICE'
  | 'CONFIRM'
  | 'REJECT';

/**
 * @interface BookingAddress
 * Representa o endereço de um agendamento.
 * Alinhado com o Address do backend.
 */
export interface BookingAddress {
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
}

/**
 * @interface CreateBookingDto
 * DTO para criar um novo agendamento (POST /bookings).
 * Alinhado com o que o bookings.service.ts espera.
 */
export interface CreateBookingDto {
  providerId: string;
  providerServiceId: string;
  scheduledDate: string;
  scheduledTime: string;
  totalPrice: number;
  notes?: string | null;
  address: CreateAddressDto;
  requestedDurationMinutes?: number;
  requestedSquareMeters?: number;
  requestedRoomCount?: number;
  couponCode?: string; // NOVO: Adicionado para permitir o envio do cA3digo do cupom
  subscriptionId?: string;
  addons?: BookingAddon[];
  insurancePlanId: InsurancePlanId | null;
  quoteId?: string;
  quoteHash?: string;
  quoteExpiresAt?: string;
}



/**
 * @interface BookingDetails
 * Representa um agendamento completo retornado pelo backend para exibição no frontend.
 * Esta é a versão "achatada" do BookingWithDetailsRelations do backend.
 */
export interface BookingDetails {
  id: string;
  status: BookingStatus;

  scheduledDate: string;
  scheduledTime: string;
  scheduledEndTime?: string;
  scheduledStart?: string;
  startedAt?: string | null;
  actualStartTime?: string | null;
  acceptedAt?: string | Date | null;
  completedAt?: string | null;
  durationMinutes?: number | null;

  totalPrice: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  paymentStatus?: string | PaymentIntentStatus | null;

  allowedActions?: BookingAction[];

  // Dados do Cliente
  clientId: string;
  clientFullName: string;
  clientEmail: string;
  clientAvatarUrl?: string | null;

  // Dados do Provedor
  providerId: string;
  providerFullName: string;
  providerEmail: string;
  providerAvatarUrl?: string | null;

  // Dados do Serviço do Provedor
  providerServiceId: string;
  serviceId: string;
  serviceName: string;
  serviceDescription?: string | null;
  servicePrice: number;
  serviceDurationMinutes?: number | null;

  // Dados do Endereço do Agendamento
  address: BookingAddress;

  // Dados da Avaliação (review), se existir
  reviewId?: string | null;
  reviewRating?: number | null;
  reviewComment?: string | null;
  isReviewed?: boolean;

  // Novas relações incluídas no BookingWithDetailsRelations
  subscriptionId?: string | null;
  incidents?: any[];
  guaranteeClaims?: any[];
  couponId?: string | null; // NOVO: ID do cupom aplicado
  discountAmount?: number | null; // NOVO: Valor do desconto aplicado pelo cupom
  insurance?: BookingInsuranceSnapshot | null;
  proofs?: BookingProof[];
}

export interface BookingInsuranceSnapshot {
  planId: InsurancePlanId;
  priceCents: number;
  coverageCents: number;
  deductibleCents: number;
  riskMultiplierBps: number;
  proofRequired: boolean;
  createdAt: string;
}

export type BookingProofType = 'CHECKIN' | 'CHECKOUT';

export interface BookingProof {
  id: string;
  type: BookingProofType;
  photos: string[];
  videoUrl?: string | null;
  hashes?: Record<string, unknown> | null;
  timestamps?: Record<string, unknown> | null;
  userId: string;
  createdAt: string;
}

export interface BookingProofPayload {
  photos: string[];
  videoUrl?: string;
  hashes?: Record<string, unknown>;
  timestamps?: Record<string, unknown>;
}

/**
 * @interface UpdateBookingStatusDto
 * DTO para atualizar o status de um agendamento (PATCH /bookings/:id/status).
 * Alinhado com o que o bookings.service.ts espera.
 */
export interface UpdateBookingStatusDto {
  status: BookingStatus;
  reason?: string;
}

/**
 * NOVO: Tipagem para o cupom aplicado.
 */
export type AppliedCoupon = {
  code: string;
  kind: 'PERCENT' | 'FIXED';
  value: number;
};

/**
 * NOVO: Tipagem para detalhes de precificação de um agendamento.
 */
export type BookingPricing = {
  subtotal: number;
  discountValue?: number;
  total: number;
  appliedCoupon?: AppliedCoupon;
};

export type BookingAddon = {
  id: string;
  quantity?: number;
};

export type InsurancePlanId = 'ESSENCIAL' | 'PREMIUM' | 'TOTAL';

export interface InsurancePlanDefinition {
  id: InsurancePlanId;
  name: string;
  basePriceCents: number;
  coverageCents: number;
  deductibleCents: number;
  proofRequired: boolean;
}

export interface InsurancePlanProposal extends InsurancePlanDefinition {
  finalPriceCents: number;
  eligible: boolean;
  reasons: string[];
  riskMultiplierBps: number;
}

export interface BookingQuoteRequest {
  providerId: string;
  providerServiceId: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes?: number;
  squareMeters?: number;
  roomCount?: number;
  couponCode?: string;
  subscriptionId?: string;
  addons?: BookingAddon[];
  address: BookingAddress;
  insurancePlanId: InsurancePlanId | null;
}

export interface BookingQuoteBreakdownItem {
  label: string;
  amount: number;
  type?: string;
}

export interface BookingQuoteResponse {
  finalPrice: number;
  subtotal: number;
  discountAmount: number;
  platformFee: number;
  providerNet: number;
  couponApplied: boolean;
  couponCode?: string;
  minMinutesApplied?: number;
  quoteId: string;
  quoteHash: string;
  expiresAt: string;
  totalCents: number;
  insuranceFeeCents: number;
  insuranceOptions: InsurancePlanProposal[];
  selectedInsurance?: InsurancePlanProposal | null;
  breakdown: BookingQuoteBreakdownItem[];
}
