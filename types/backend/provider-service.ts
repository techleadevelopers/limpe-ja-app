// LimpeJaApp/src/types/backend/provider-service.ts

import { Service, PricingType } from './services'; // Import PricingType and Service

/**
 * @interface ProviderServiceDetails
 * Representa os detalhes de um serviço específico oferecido por um provedor.
 * Esta é a versão detalhada para uso em resultados de busca ou exibição.
 */
export interface ProviderServiceDetails {
  id: string;
  providerId: string;
  serviceId: string;
  price: number; // CORREÇÃO: Decimal no Prisma é number aqui
  durationMinutes?: number | null;
  description?: string | null;
  pricingType: PricingType;
  pricePerSquareMeter?: number | null; // CORREÇÃO: Decimal no Prisma é number aqui
  pricePerRoom?: number | null; // CORREÇÃO: Decimal no Prisma é number aqui
  service: Service; // Details about the service category
}

/**
 * @interface ProviderServiceOffering
 * Representa um serviço específico oferecido por um provedor, incluindo detalhes do tipo de serviço.
 * Mantido para compatibilidade, mas ProviderServiceDetails é mais completo.
 * Pode ser um alias para ProviderServiceDetails se forem idênticos.
 */
export type ProviderServiceOffering = ProviderServiceDetails;