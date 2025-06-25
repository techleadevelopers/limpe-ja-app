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
  imageUrl?: string;
  terms?: string; // Termos e condições da oferta
  discountPercentage?: number; // Ex: 30
  originalPrice?: number; // Preço original para mostrar o desconto
  discountedPrice?: number; // Preço já com desconto
  validUntil?: string; // ISO String, data de validade da oferta
  // Adicione outros campos que seu backend de ofertas possa ter
  couponCode?: string; // Código do cupom associado
  serviceId?: string; // ID do serviço específico ao qual a oferta se aplica
  providerId?: string; // ID do provedor ao qual a oferta se aplica
}