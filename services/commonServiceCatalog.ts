// LimpeJaApp/app/services/commonServiceCatalog.ts
import api from './api';
import { Service } from '../types/backend/services';
import axios, { AxiosResponse } from 'axios';

/**
 * @function getServiceCategories
 * Obtém a lista de categorias de serviço disponíveis na plataforma.
 * Corresponde a GET /services.
 * @returns Promessa com um array de objetos Service.
 */
export async function getServiceCategories(): Promise<Service[]> {
  try {
    const response: AxiosResponse<Service[]> = await api.get<Service[]>('/services');
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar categorias de serviço:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao buscar categorias de serviço.');
    }
    throw new Error('Erro de rede ou servidor ao buscar categorias de serviço.');
  }
}