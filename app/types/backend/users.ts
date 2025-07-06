// LimpeJaApp/src/types/backend/users.ts

import { UserRole } from './auth';
import { ProviderDisplayInfo } from './providers'; // Importar ProviderDisplayInfo (conforme o uso em other files)
import { Client } from './clients';
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

  // REMOVIDO: address?: BookingAddress; // Removido: A propriedade 'address' não existe diretamente na raiz do UserProfile (conforme logs)

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
  // As interfaces `Client` e `ProviderDisplayInfo` já incluem a propriedade `address`
  // em suas próprias definições, então não é necessário adicioná-la novamente aqui.
  clientDetails?: Client;
  providerDetails?: ProviderDisplayInfo;
}