// LimpeJaApp/src/types/backend/provider-service.ts

import { Service } from './services';

/**
 * Representa os detalhes de um serviÍo oferecido por um provedor.
 * Agora o contrato centraliza o preço por hora e marca quando o registro precisa de revisão manual.
 */
export interface ProviderServiceDetails {
  id: string;
  providerId: string;
  serviceId: string;
  price?: number;
  pricePerHour: number;
  durationMinutes?: number | null;
  description?: string | null;
  needsReview: boolean;
  service: Service;
}

export type ProviderServiceOffering = ProviderServiceDetails;
