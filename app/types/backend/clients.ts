// LimpeJaApp/src/types/backend/clients.ts

import { UserRole } from './auth'; 
import { BookingAddress } from './bookings'; // Importar BookingAddress para tipagem consistente do endereço

/**
 * @interface Client
 * Representa o perfil completo de um Cliente.
 * Esta interface é necessária porque UserProfile pode incluir clientDetails do tipo Client.
 * Adicione aqui todas as propriedades que definem um cliente no seu backend.
 */
export interface Client {
  id: string;
  userId: string; // Referência ao ID do usuário no sistema de autenticação
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  walletBalance?: number;
  ordersCount?: number;
  // Adicione outras propriedades específicas do cliente aqui, como:
  // addressId?: string; // Se o endereço for um ID separado
  // user?: UserProfile; // Se você quiser aninhar o UserProfile completo
  // ... outras propriedades

  // CORREÇÃO: Adicionar a propriedade 'address' do tipo BookingAddress para resolver o erro de tipagem.
  // A propriedade address pode ser opcional se o cliente nem sempre tiver um endereço.
  // Se o seu backend sempre retornar um endereço, remova o '?'.
  address?: BookingAddress; 
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
  phone?: string; //
  // Adicione outros campos que o cliente pode atualizar aqui (ex: address)
  
  // CORREÇÃO: A sintaxe para definir um objeto aninhado dentro de uma interface
  // estava incorreta. Deve ser definida como uma propriedade que é um objeto.
  // Usamos 'Partial<BookingAddress>' aqui para indicar que todos os campos do endereço
  // são opcionais no contexto da atualização. Se o backend espera 'zipCode' e não 'cep'
  // para este DTO específico, você precisará ajustar ou criar um tipo separado.
  address?: Partial<BookingAddress>; //
}