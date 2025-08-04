// types/backend/referrals.ts

/**
 * @description Enum para o status de uma indicação (exemplo, se necessário)
 * Pode ser estendido conforme a lógica de negócio (ex: PENDING, APPROVED, REJECTED)
 */
export enum ReferralStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * @description Interface para o modelo Referral (como retornado pelo backend/banco de dados)
 */
export interface Referral {
  id: string;
  referredUserId: string;
  referrerUserId: string;
  referralCode?: string; // Código de indicação usado
  status: ReferralStatus; // Exemplo de campo de status
  createdAt: string; // DateTime do Prisma é string em TS
  updatedAt: string; // DateTime do Prisma é string em TS

  // Opcional: Incluir detalhes básicos dos usuários relacionados, se o backend retornar
  referredUser?: {
    id: string;
    email: string;
    fullName?: string; // Ou outro campo identificador
  };
  referrerUser?: {
    id: string;
    email: string;
    fullName?: string;
  };
}

/**
 * @description DTO para criar uma nova indicação (enviado ao backend)
 */
export interface CreateReferralDto {
  referredUserId: string; // ID do usuário que foi indicado
  referralCode?: string; // Código de indicação opcional
}

/**
 * @description DTO para obter indicações feitas por um usuário (resposta do backend)
 */
export interface GetReferralsMadeByUserResponse {
  referrals: Referral[];
  total: number;
}

/**
 * @description DTO para obter usuários indicados por um usuário (resposta do backend)
 */
export interface GetReferredUsersResponse {
  referredUsers: Referral[]; // Ou uma lista mais simples, dependendo do que o backend retorna
  total: number;
}