// LimpeJaApp/src/types/user.ts
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'client' | 'provider' | null;
  phone?: string; // <<--- ADICIONE ESTA LINHA
  // Outros campos específicos do usuário podem ser adicionados aqui
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}