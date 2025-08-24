// LimpeJaApp/src/types/backend/clients.ts

import { UserRole } from './auth';
import { BookingAddress } from './bookings';
import { UserProfile } from './users';

/**
 * @interface Client
 * Representa o perfil completo de um Cliente.
 * Esta interface é necessária porque UserProfile pode incluir clientDetails do tipo Client.
 * Adicione aqui todas as propriedades que definem um cliente no seu backend.
 */
export interface Client {
  id: string;
  userId: string;
  fullName: string;
  completedBookingsCount?: number;
  noShowCount: number;
  cancellationCount: number;
  phone?: string | null;
  avatarUrl?: string | null;
  walletBalance?: number;
  ordersCount?: number;
  user?: UserProfile;
  address?: BookingAddress | null;
  totalBookings?: number; // NOVO: Adicionado para rastrear o número total de agendamentos
}

/**
 * @interface SearchResult
 * Representa o resultado de uma busca por provedores/serviços no endpoint /search.
 * Ajustado para as propriedades que o /search do backend deve retornar (em Português)
 */
export interface SearchResult {
  id: string;
  nome: string;
  especialidade: string;
  avaliacao: number;
  precoHora: string;
  distance?: string;
  imagemUrl: string;
  numeroAvaliacoes?: number;
  isVerificado?: boolean;
  cidade?: string;
}

/**
 * @interface UpdateClientProfileDto
 * DTO para atualização do perfil do cliente (PATCH /clients/me).
 * Baseado no UpdateClientProfileDto do backend.
 */
export interface UpdateClientProfileDto {
  fullName?: string;
  phone?: string | null;
  address?: Partial<BookingAddress> | null;
}

/**
 * @type ClientDetails
 * Alias para a interface Client, usada para tipagem consistente.
 */
export type ClientDetails = Client;