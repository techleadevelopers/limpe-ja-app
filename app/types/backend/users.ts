// LimpeJaApp/src/types/backend/users.ts

import { UserRole, VerificationStatus } from './auth'; // Importar UserRole e VerificationStatus
import { ProviderDisplayInfo } from './providers'; // Importar ProviderDisplayInfo (conforme o uso em other files)
import { Client } from './clients'; // Assumindo que Client está definido em clients.ts
import { BookingAddress } from './bookings'; // Mantido, pois BookingAddress pode ser usado internamente por Client/ProviderDisplayInfo

/**
 * @interface UserProfile
 * Representa o perfil completo de um usuário retornado por endpoints como GET /users/me.
 * REFLETE UserProfileDto do backend
 */
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;

  fullName?: string; // Presente na raiz do fetchedUserProfile nos logs
  phone?: string;     // Presente na raiz do fetchedUserProfile nos logs
  avatarUrl?: string | null;

  createdAt?: string; // Presente na raiz do fetchedUserProfile nos logs
  updatedAt?: string; // Presente na raiz do fetchedUserProfile nos logs

  // Propriedades específicas ou calculadas que podem estar na raiz do UserProfileDto
  walletBalance?: number;
  ordersCount?: number;
  totalEarningsLastMonth?: number;
  upcomingBookingsCount?: number;
  averageRating?: number;
  reviewCount?: number;

  // Detalhes específicos do cliente ou provedor
  clientDetails?: Client; // Assumindo que 'Client' é a interface para ClientDetailsDto
  providerDetails?: ProviderDisplayInfo; // Assumindo que 'ProviderDisplayInfo' é a interface para ProviderDetailsDto
}

// Nota: Se ProviderDisplayInfo e Client não existirem, você precisará criá-los.
// Exemplo mínimo se não existirem:
/*
export interface Client {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  cpf: string | null;
  address?: BookingAddress; // Ou uma interface Address mais genérica
  createdAt: string;
  updatedAt: string;
  // ... outras propriedades do cliente
}

export interface ProviderDisplayInfo {
  id: string;
  userId: string;
  fullName: string;
  cpf: string | null;
  dateOfBirth: string;
  phone: string | null;
  yearsOfExperience: number | null;
  avatarUrl: string | null;
  bio: string | null;
  verificationStatus: VerificationStatus; // Usando o enum importado
  pixKey: string | null;
  address?: BookingAddress; // Ou uma interface Address mais genérica
  createdAt: string;
  updatedAt: string;
  // ... outras propriedades do provedor
}
*/