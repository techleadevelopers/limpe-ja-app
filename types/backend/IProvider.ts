// LimpeJaApp/types/IProvider.ts

// import { VerificationStatus } from './backend/auth'; // ❌ Removido: módulo inexistente e tipo não utilizado

export interface IProviderDetails {
  // Campos relevantes do seu backend
  serviceName: string;
  description: string;
  price: number;
  // ...outros campos relevantes
}

export interface IProvider {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  rating: number;        // Ex.: 4.5
  reviewsCount: number;  // Ex.: 6
  providerDetails: IProviderDetails;
  // ...outros campos do usuário
}
