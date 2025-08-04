// services/referralService.ts

import api from './api'; // Assumindo que você tem um arquivo api.ts para suas requisições HTTP
import {
  CreateReferralDto,
  Referral,
  GetReferralsMadeByUserResponse,
  GetReferredUsersResponse,
} from '../types/backend/referrals'; // Ajuste o caminho conforme a sua estrutura de pastas

const BASE_URL = '/referrals'; // Base URL para os endpoints de indicações

export const referralService = {
  /**
   * Cria uma nova indicação.
   * @param data DTO com os dados da indicação.
   * @returns A indicação criada.
   */
  createReferral: async (data: CreateReferralDto): Promise<Referral> => {
    try {
      const response = await api.post<Referral>(BASE_URL, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar indicação:', error);
      throw error;
    }
  },

  /**
   * Obtém todas as indicações feitas por um usuário específico.
   * @param userId O ID do usuário que fez as indicações.
   * @returns Uma lista de indicações.
   */
  getReferralsMadeByUser: async (
    userId: string,
  ): Promise<GetReferralsMadeByUserResponse> => {
    try {
      const response = await api.get<GetReferralsMadeByUserResponse>(
        `${BASE_URL}/made-by/${userId}`,
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar indicações feitas pelo usuário:', error);
      throw error;
    }
  },

  /**
   * Obtém os usuários que foram indicados por um usuário específico.
   * @param referrerId O ID do usuário que indicou.
   * @returns Uma lista de usuários indicados.
   */
  getReferredUsers: async (
    referrerId: string,
  ): Promise<GetReferredUsersResponse> => {
    try {
      const response = await api.get<GetReferredUsersResponse>(
        `${BASE_URL}/referred-by/${referrerId}`,
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar usuários indicados por este usuário:', error);
      throw error;
    }
  },

  /**
   * Obtém os detalhes de uma indicação específica pelo seu ID.
   * @param referralId O ID da indicação.
   * @returns Os detalhes da indicação.
   */
  getReferralById: async (referralId: string): Promise<Referral> => {
    try {
      const response = await api.get<Referral>(`${BASE_URL}/${referralId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar indicação por ID:', error);
      throw error;
    }
  },

  // Adicione outros métodos conforme a necessidade (ex: atualizar status de indicação)
};