// LimpeJaApp/src/types/backend/offers.ts

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
  terms?: string | null; // Termos e condições da oferta
  discountPercentage?: number | null; // Ex: 30
  originalPrice?: number | null; // Preço original para mostrar o desconto
  discountedPrice?: number | null; // Preço já com desconto
  validUntil?: string | null; // ISO String, data de validade da oferta
  // Adicione outros campos que seu backend de ofertas possa ter
  couponCode?: string | null; // Código do cupom associado
  serviceId?: string | null; // ID do serviço específico ao qual a oferta se aplica
  providerId?: string | null; // ID do provedor ao qual a oferta se aplica
  // NOVAS PROPRIEDADES ADICIONADAS:
  bankName?: string | null;
  bankPaymentText?: string | null;
  buttonText?: string | null;
  disclaimer?: string | null;
  badgeTitle?: string | null;
  badgeDates?: string | null;
  backgroundColorStart?: string | null;
  backgroundColorEnd?: string | null;
}