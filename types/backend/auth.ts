// LimpeJaApp/src/types/backend/auth.ts

import { UserProfile } from './users';

/**
 * DTOs de Requisição (dados que o frontend envia para o backend)
 */

/**
 * @interface LoginDto
 * Representa os dados necessários para realizar o login de um usuário.
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * @interface CreateAddressDto
 * Representa a estrutura de dados para a criação de um endereço.
 */
export interface CreateAddressDto {
  cep: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

/**
 * @interface RegisterClientDto
 * Representa os dados necessários para registrar um novo cliente.
 */
export interface RegisterClientDto {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
  cpf: string;
  address: CreateAddressDto;
  referralCode?: string; // NOVO: Campo opcional para código de indicação
  dateOfBirth?: string;  // <- Adicione esta linha
}

/**
 * @interface RegisterProviderDto
 * Representa os dados necessários para registrar um novo provedor de serviços.
 */
export interface RegisterProviderDto {
  email: string;
  password: string;
  fullName: string;
  cpf: string;
  dateOfBirth: string;
  phone?: string | null;
  address: CreateAddressDto;
  yearsOfExperience?: number | null;
  avatarUrl?: string | null;
  bio?: string | null;
  offeredServices?: string | null;
  pricingStructure?: string | null;
  serviceAreas?: string | null;
  pixKey?: string | null;
  referralCode?: string; // NOVO: Campo opcional para código de indicação
}

/**
 * @interface UpdateProviderProfileDto
 * Representa os dados para atualização do perfil de um provedor existente.
 * Usado no PATCH /providers/me.
 */
export interface UpdateProviderProfileDto {
  fullName?: string;
  phone?: string | null;
  address?: Partial<CreateAddressDto> | null;
  yearsOfExperience?: number | null;
  avatarUrl?: string | null;
  bio?: string | null;
  offeredServices?: string | null;
  pricingStructure?: string | null;
  serviceAreas?: string | null;
  pixKey?: string | null;
}

/**
 * @interface ForgotPasswordDto
 * Representa os dados necessários para solicitar a redefinição de senha.
 */
export interface ForgotPasswordDto {
  email: string;
}

/**
 * DTOs de Resposta (dados que o backend envia para o frontend)
 */

/**
 * @interface AuthResponse
 * Representa a resposta do backend após um login ou registro bem-sucedido.
 */
export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}

/**
 * @interface MessageResponseDto
 * Representa uma resposta genérica do backend contendo apenas uma mensagem.
 */
export interface MessageResponseDto {
  message: string;
}

/**
 * Tipos Auxiliares
 */

/**
 * @enum UserRole
 * Define os papéis possíveis para um usuário no sistema.
 */
export enum UserRole {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
}

/**
 * @enum VerificationStatus
 * Enum para o status de verificação do provedor.
 */
export enum VerificationStatus {
  PENDING_INITIAL_REVIEW = 'PENDING_INITIAL_REVIEW',
  PENDING_DOCUMENTS_UPLOAD = 'PENDING_DOCUMENTS_UPLOAD',
  PENDING_BACKGROUND_CHECK = 'PENDING_BACKGROUND_CHECK',
  PENDING_MANUAL_REVIEW = 'PENDING_MANUAL_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED',
}