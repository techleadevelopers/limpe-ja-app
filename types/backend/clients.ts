// LimpeJaApp/src/types/backend/clients.ts

import { UserRole } from './auth';
import { BookingAddress } from './bookings'; // [CORREÇÃO] Importa BookingAddress para tipagem consistente do endereço
import { UserProfile } from './users'; // Importa UserProfile para tipagem do user aninhado

/**
 * @interface Client
 * Representa o perfil completo de um Cliente.
 * Esta interface é necessária porque UserProfile pode incluir clientDetails do tipo Client.
 * Adicione aqui todas as propriedades que definem um cliente no seu backend.
 */
export interface Client {
  id: string;
  userId: string; // Referência ao ID do usuário no sistema de autenticação
  fullName: string; // Propriedade 'fullName' existe no Client
  completedBookingsCount?: number; // NEW: Counter for loyalty program (tornar opcional se o backend não garantir sempre)
  phone?: string | null; // Permitir null
  avatarUrl?: string | null; // Permitir null
  walletBalance?: number;
  ordersCount?: number;
  user?: UserProfile; // Se você quiser aninhar o UserProfile completo
  address?: BookingAddress | null; // [CORREÇÃO] Alinhado com schema.prisma (Address?)
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
  // Adicione outros campos que a sua SearchResult do backend possa ter
}

/**
 * @interface UpdateClientProfileDto
 * DTO para atualização do perfil do cliente (PATCH /clients/me).
 * Baseado no UpdateClientProfileDto do backend.
 */
export interface UpdateClientProfileDto {
  fullName?: string;
  phone?: string | null; // Permitir null
  address?: Partial<BookingAddress> | null; // [CORREÇÃO] Alinhado com schema.prisma (Address?)
}

/**
 * @type ClientDetails
 * Alias para a interface Client, usada para tipagem consistente.
 */
export type ClientDetails = Client;