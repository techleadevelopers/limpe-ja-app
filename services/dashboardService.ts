// app/services/dashboardService.ts

import axios, { AxiosResponse } from 'axios';
import { api } from './api'; // Importa a instância centralizada do Axios
import { createLocalConsole } from './logging';
const console = createLocalConsole();
import { ProviderDashboard } from '../types/backend/providers'; // Importa a tipagem do DTO de resposta

/**
 * @function getMyProviderDashboard
 * Obtém os dados do painel do provedor atualmente logado.
 * Corresponde a GET /providers/me/dashboard.
 * @returns Uma Promise que resolve para o objeto ProviderDashboard.
 * @throws Error se a requisição falhar ou retornar status de erro.
 */
export async function getMyProviderDashboard(): Promise<ProviderDashboard> {
  try {
    const response: AxiosResponse<ProviderDashboard> = await api.get(`/providers/me/dashboard`);
    console.log('[dashboardService] getMyProviderDashboard: Dados recebidos com sucesso.');
    return response.data;
  } catch (error: any) {
    console.error('[dashboardService] Erro ao buscar dados do painel do provedor:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao buscar dados do painel do provedor.');
    }
    throw new Error('Erro de rede ou servidor ao buscar dados do painel do provedor.');
  }
}
