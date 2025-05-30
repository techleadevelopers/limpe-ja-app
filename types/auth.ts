// LimpeJaApp/src/types/auth.ts

/**
 * Define os possíveis papéis de um usuário no sistema.
 */
export type UserRole = 'client' | 'provider' | 'admin';

/**
 * Interface para representar a estrutura de um endereço completo.
 * Reutilizada em perfis de usuário e provedor.
 */
export interface UserAddress {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string; // Opcional, como apartamento, bloco, etc.
  bairro: string;
  cidade: string;
  estado: string; // Sigla do estado (UF), ex: "SP"
}

/**
 * Interface base para o perfil de um usuário no Firestore.
 * Contém informações básicas e comuns a todos os tipos de usuários (cliente, provedor, admin).
 * Esta interface alinha-se com a coleção 'users' no backend.
 */
export interface UserProfile {
  uid: string; // ID único do usuário, geralmente do Firebase Authentication
  email: string;
  name: string; // Nome completo do usuário
  role: UserRole; // Papel do usuário no sistema ('client', 'provider', 'admin')
  phone?: string; // Número de telefone do usuário, opcional
  avatarUrl?: string; // URL da imagem de perfil, opcional
  fcmTokens?: string[]; // Tokens para Firebase Cloud Messaging (notificações push), opcional
  createdAt?: string; // Timestamp de criação do perfil (formato ISO 8601 string), opcional
  updatedAt?: string; // Timestamp da última atualização do perfil (formato ISO 8601 string), opcional
  isDisabledByAdmin?: boolean; // Booleano indicando se a conta foi desativada por um administrador, opcional
  // Adicione outros campos comuns que o backend possa retornar ou o frontend possa precisar
}

/**
 * Interface específica para dados de login que o frontend envia ao backend.
 * Alinha-se com 'LoginRequest' em 'authService.ts'.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Interface específica para dados de registro de cliente que o frontend envia ao backend.
 * Alinha-se com 'RegisterClientRequest' em 'authService.ts'.
 */
export interface RegisterClientRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
}

/**
 * Interface para a resposta de autenticação que o backend retorna ao frontend.
 * Contém informações essenciais após login ou registro bem-sucedido.
 * Alinha-se com 'AuthResponse' em 'authService.ts' e a resposta da Cloud Function 'createUser'.
 */
export interface AuthResponse {
  userId: string; // ID do usuário
  email: string;
  name?: string; // Nome do usuário, opcional
  token: string; // Firebase ID Token
  role?: UserRole; // Papel do usuário (cliente, provedor, admin), opcional
  // Outras propriedades do perfil que o backend decida retornar junto à resposta inicial de auth
}

/**
 * Interface para dados de atualização de perfil que o frontend envia ao backend.
 * Permite atualizações parciais do perfil do usuário.
 * Alinha-se com 'UpdateUserProfileRequest' em 'authService.ts'.
 */
export interface UpdateUserProfileRequest {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  // Adicione aqui todos os campos do UserProfile que o frontend pode atualizar
  // Ex: address?: UserAddress; // Se o endereço puder ser atualizado diretamente via esta função
}

/**
 * Interface para os tokens de autenticação gerenciados no frontend.
 * O 'idToken' é o JWT do Firebase. O SDK do Firebase geralmente gerencia
 * o 'refreshToken' internamente.
 */
export interface AuthTokens {
  idToken: string;
  // refreshToken?: string; // Com o SDK do Firebase Auth, geralmente não é exposto aqui
  expiresIn?: number; // Tempo de expiração do ID Token em segundos, opcional
}