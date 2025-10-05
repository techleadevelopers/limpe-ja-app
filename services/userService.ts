// LimpeJaApp/services/userService.ts

import { api } from './api'; // Assumindo que sua instância do Axios (com o token JWT) está aqui
import axios from 'axios';
import { UserProfile } from '../types/backend/users'; // Ajuste o caminho conforme necessário - DEVE INCLUIR 'isVerified', 'noShowCount', 'cancellationCount', 'badges'

class UserService {
  private readonly BASE_URL = '/users'; // Assumindo que /users é o caminho base para endpoints relacionados ao usuário

  async getMe(): Promise<UserProfile> {
    try {
      // Este endpoint deve retornar o perfil completo do usuário autenticado
      // O backend (NestJS) normalmente obtém o ID do usuário a partir do token JWT
      const response = await api.get<UserProfile>(`${this.BASE_URL}/me`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar perfil do usuário:', error.response?.data || error.message);
      // Preserve axios error details (status, config) for upstream handling
      if (axios.isAxiosError(error)) {
        throw error;
      }
      throw new Error(error?.message || 'Erro ao buscar perfil do usuário.');
    }
  }

  // Adicione outros métodos relacionados ao usuário aqui, se necessário (ex: update profile)
}

export default new UserService();
