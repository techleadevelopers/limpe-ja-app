// LimpeJaApp/src/types/backend/users.ts

import { UserRole, VerificationStatus } from './auth';
import { ProviderDisplayInfo } from './providers';
import { Client } from './clients';
import { BookingAddress } from './bookings';

/**
 * @interface UserProfile
 * Representa o perfil completo de um usuário retornado por endpoints como GET /users/me.
 * REFLETE UserProfileDto do backend.
 */
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;

  // Propriedades básicas que vêm na raiz do perfil do usuário
  fullName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;

  createdAt?: string;
  updatedAt?: string;

  // NOVO: Adicionada a propriedade 'address' diretamente ao UserProfile.
  // Esta propriedade é opcional e serve para manter a compatibilidade
  // com o código que espera encontrar o endereço na raiz do objeto.
  address?: BookingAddress | null;

  // Propriedades específicas ou calculadas
  walletBalance?: number;
  ordersCount?: number;
  totalEarningsLastMonth?: number;
  upcomingBookingsCount?: number;
  averageRating?: number;
  reviewCount?: number;
  isVerified?: boolean;

  // Detalhes específicos do cliente ou provedor, aninhados
  clientDetails?: Client | null;
  providerDetails?: ProviderDisplayInfo | null;
}