// LimpeJaApp/src/types/backend/offers.ts

/**
 * @enum OfferTarget
 * Enumeração para os tipos de alvo de uma oferta.
 */
export enum OfferTarget {
  ALL = 'ALL',
  NEW_CLIENTS = 'NEW_CLIENTS', // NOVO
  FIRST_BOOKING = 'FIRST_BOOKING', // Exemplo de outro alvo
  SPECIFIC_SERVICE = 'SPECIFIC_SERVICE',
  SPECIFIC_PROVIDER = 'SPECIFIC_PROVIDER',
}

/**
 * @interface Offer
 * Representa uma oferta promocional vinda do backend.
 * Alinhado com o que a tela de detalhes da oferta espera exibir.
 */
export interface Offer {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  terms?: string | null;
  discountPercentage?: number | null;
  originalPrice?: number | null;
  discountedPrice?: number | null;
  validUntil?: string | null;
  couponCode?: string | null;
  serviceId?: string | null;
  providerId?: string | null;
  bankName?: string | null;
  bankPaymentText?: string | null;
  buttonText?: string | null;
  disclaimer?: string | null;
  badgeTitle?: string | null;
  badgeDates?: string | null;
  backgroundColorStart?: string | null;
  backgroundColorEnd?: string | null;
  target?: OfferTarget; // NOVO: Adicionado para indicar o alvo da oferta
  firstBookingOnly?: boolean; // NOVO: Indica se a oferta é apenas para a primeira reserva
}