// LimpeJaApp/src/types/backend/auth.ts

import { UserProfile } from './users'; // Importar UserProfile

/**
 * DTOs de Requisição (dados que o frontend envia para o backend)
 */

/**
 * @interface LoginDto
 * Representa os dados necessários para realizar o login de um usuário.
 */
export interface LoginDto {
  email: string;
  password: string; // O frontend envia a senha em texto plano. O backend é responsável por hashear e armazenar.
}

/**
 * @interface CreateAddressDto
 * Representa a estrutura de dados para a criação de um endereço.
 * Esta interface é usada para aninhar o objeto de endereço dentro dos DTOs de registro.
 */
export interface CreateAddressDto {
  cep: string;
  street: string;
  number: string;
  complement?: string | null; // Opcional, permitindo null explicitamente
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * @interface RegisterClientDto
 * Representa os dados necessários para registrar um novo cliente.
 * Agora inclui um objeto 'address' aninhado.
 */
export interface RegisterClientDto {
  email: string;
  password: string; // Senha em texto plano que será hasheada pelo backend.
  fullName: string;
  phone?: string | null; // Telefone: Opcional no frontend, mas você pode torná-lo obrigatório se necessário.
  cpf: string; // <-- ADICIONADO: Propriedade CPF para o cliente

  // Endereço agora é um objeto aninhado
  address: CreateAddressDto;
}

/**
 * @interface RegisterProviderDto
 * Representa os dados necessários para registrar um novo provedor de serviços.
 * Agora inclui um objeto 'address' aninhado e os novos campos de detalhes de serviço.
 */
export interface RegisterProviderDto {
  email: string;
  password: string; // Senha em texto plano que será hasheada pelo backend.
  fullName: string;
  cpf: string;
  dateOfBirth: string; // Formato de data recomendado: string ISO (ex: "YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm:ss.sssZ").
  phone?: string | null; // Telefone: Opcional no frontend.

  // Endereço agora é um objeto aninhado
  address: CreateAddressDto;

  yearsOfExperience?: number | null; // Opcional, corresponde a 'anosExperiencia'
  avatarUrl?: string | null; // CORREÇÃO: Permitir 'null' explicitamente

  // NOVOS CAMPOS ADICIONADOS PARA DETALHES DO SERVIÇO:
  bio?: string | null; // Corresponde a 'experiencia'
  offeredServices?: string | null; // Corresponde a 'servicosOferecidos'
  pricingStructure?: string | null; // Corresponde a 'estruturaPreco'
  serviceAreas?: string | null; // Corresponde a 'areasAtendimento'
  pixKey?: string | null; // Corresponde a 'pixKey'
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
 * Renomeado de AuthResponseDto para AuthResponse para consistência.
 */
export interface AuthResponse {
  accessToken: string;
  user: UserProfile; // <-- CORREÇÃO: Agora usa a interface UserProfile completa
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
 * Corresponde ao `enum UserRole` definido no `prisma/schema.prisma` do backend.
 */
export enum UserRole {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM', // Adicionado SYSTEM para consistência com o backend
}

/**
 * @enum VerificationStatus
 * Enum para o status de verificação do provedor.
 * Corresponde ao `enum VerificationStatus` definido no `prisma/schema.prisma` do backend.
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