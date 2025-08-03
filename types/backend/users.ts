// LimpeJaApp/src/types/backend/users.ts

import { UserRole, VerificationStatus } from './auth'; // Importar UserRole e VerificationStatus
import { ProviderDisplayInfo } from './providers'; // Importar ProviderDisplayInfo
import { Client } from './clients'; // Importar Client
import { BookingAddress } from './bookings'; // Importar BookingAddress

/**
 * @interface UserProfile
 * Representa o perfil completo de um usuário retornado por endpoints como GET /users/me.
 * REFLETE UserProfileDto do backend
 */
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;

  // ADICIONADO: Token de autenticação para uso no frontend
  // Pode ser 'string' se for sempre esperado após o login, ou 'string | null' / 'string?' se puder ser opcional/nulo.
  // Pelo uso em service-details.tsx, parece ser uma string não-nula quando o usuário está logado.
  token: string; 

  fullName?: string | null; // Presente na raiz do fetchedUserProfile nos logs, permitir null
  phone?: string | null;     // Presente na raiz do fetchedUserProfile nos logs, permitir null
  avatarUrl?: string | null; // Permitir null

  createdAt?: string; // Presente na raiz do fetchedUserProfile nos logs
  updatedAt?: string; // Presente na raiz do fetchedUserProfile nos logs

  // CORREÇÃO: Adicionada a propriedade 'address' diretamente ao UserProfile.
  // Isso é necessário porque `schedule-service.tsx` acessa `user.address` diretamente.
  // Se o seu backend *não* retornar o endereço diretamente na raiz do UserProfileDto,
  // mas sim aninhado dentro de `clientDetails` ou `providerDetails`,
  // você precisará ajustar a lógica em `schedule-service.tsx` para `user.clientDetails?.address`
  // (ou `user.providerDetails?.address` dependendo do papel do usuário).
  // Para manter a compatibilidade com o código atual do `schedule-service.tsx`, esta é a solução.
  address?: BookingAddress | null;

  // Propriedades específicas ou calculadas que podem estar na raiz do UserProfileDto
  walletBalance?: number;
  ordersCount?: number;
  totalEarningsLastMonth?: number;
  upcomingBookingsCount?: number;
  averageRating?: number;
  reviewCount?: number;

  // Detalhes específicos do cliente ou provedor
  clientDetails?: Client | null; // Assumindo que 'Client' é a interface para ClientDetailsDto, permitir null
  providerDetails?: ProviderDisplayInfo | null; // Assumindo que 'ProviderDisplayInfo' é a interface para ProviderDetailsDto, permitir null
}