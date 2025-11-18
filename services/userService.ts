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
      const response = await api.get<UserProfile>(`${this.BASE_URL}/me`, { headers: { 'X-Silent': '1' } });
      return response.data;
    } catch (error: any) {
      // Sem console.* aqui. O interceptor global já loga em __DEV__.
      if (axios.isAxiosError(error)) {
        // mantém axios error (status, config) para quem consome
        throw error;
      }
      throw new Error(error?.message || 'Erro ao buscar perfil do usuário.');
    }
  }

  async deleteMe(): Promise<void> {
    try {
      // Alinha com o contrato DELETE /users/me
      await api.delete(`${this.BASE_URL}/me`);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw error;
      }
      throw new Error(error?.message || 'Erro ao excluir conta do usuário.');
    }
  }

  // Adicione outros métodos relacionados ao usuário aqui, se necessário (ex: update profile)
}

export default new UserService();

