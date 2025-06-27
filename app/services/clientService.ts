// LimpeJaApp/app/services/clientService.ts
import api from './api'; // Importa a instância centralizada do Axios
import axios, { AxiosResponse } from 'axios'; // Importa axios e AxiosResponse

// =========================================================================
// IMPORTAÇÕES DE INTERFACES DE TIPAGEM CENTRALIZADAS
// =========================================================================
import { Service } from '../types/backend/services';
import {
  ProviderDisplayInfo, // CORREÇÃO: Usar ProviderDisplayInfo para tipar provedores
  ProviderSearchQuery, // Importado para tipar a query de busca
} from '../types/backend/providers';
import { Offer } from '../types/backend/offers';
import { UserProfile } from '../types/backend/users';
import { UpdateClientProfileDto } from '../types/backend/clients';

// =========================================================================
// FUNÇÕES DE SERVIÇO DO CLIENTE - AJUSTADAS PARA USAR A INSTÂNCIA 'api' CENTRALIZADA
// =========================================================================

/**
 * @function getServiceCategories
 * Obtém a lista de categorias de serviço disponíveis.
 * Corresponde a GET /services.
 * @returns Promessa com um array de objetos Service.
 */
export async function getServiceCategories(): Promise<Service[]> {
  try {
    // A requisição é feita usando a instância 'api', que já tem a baseURL configurada
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

/**
 * @function searchProviders
 * Realiza uma busca geral por provedores.
 * Corresponde a GET /providers (com query params).
 * NOTA: Esta função foi movida para providerService.ts, mas se você tiver um endpoint /search
 * que retorna provedores, esta função pode ser usada aqui.
 * @param query Objeto com os parâmetros de busca.
 * @returns Promessa com um array de objetos ProviderDisplayInfo.
 */
export async function searchProviders(query: ProviderSearchQuery): Promise<ProviderDisplayInfo[]> {
  try {
    const params = new URLSearchParams(query as any).toString(); // Converte objeto para query string
    // A requisição é feita usando a instância 'api', que já tem a baseURL configurada
    const response: AxiosResponse<ProviderDisplayInfo[]> = await api.get<ProviderDisplayInfo[]>(`/providers?${params}`); // Assumindo que /providers é o endpoint de busca geral
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar provedores:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao buscar provedores.');
    }
    throw new Error('Erro de rede ou servidor ao buscar provedores.');
  }
}

/**
 * @function getUserProfile
 * Obtém o perfil do usuário logado (cliente ou provedor).
 * Corresponde a GET /users/me.
 * @returns Promessa com o objeto UserProfile.
 */
export async function getUserProfile(): Promise<UserProfile> {
  try {
    // A requisição é feita usando a instância 'api', que já tem a baseURL configurada
    const response: AxiosResponse<UserProfile> = await api.get<UserProfile>('/users/me');
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar perfil do usuário:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao buscar perfil do usuário.');
    }
    throw new Error('Erro de rede ou servidor ao buscar perfil do usuário.');
  }
}

/**
 * @function getOffers
 * Obtém a lista de ofertas disponíveis.
 * Corresponde a GET /offers.
 * @returns Promessa com um array de objetos Offer.
 */
export async function getOffers(): Promise<Offer[]> {
  try {
    // A requisição é feita usando a instância 'api', que já tem a baseURL configurada
    const response: AxiosResponse<Offer[]> = await api.get<Offer[]>('/offers');
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar ofertas:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao buscar ofertas.');
    }
    throw new Error('Erro de rede ou servidor ao buscar ofertas.');
  }
}

/**
 * @function getProviderDetails
 * Obtém os detalhes de um provedor específico por ID.
 * Corresponde a GET /providers/:id.
 * NOTA: Esta função também existe em 'providerService.ts'. Considere importar de lá
 * ou manter uma única fonte de verdade para evitar duplicação.
 * @param providerId O ID do provedor.
 * @returns Promessa com o objeto ProviderDisplayInfo.
 */
export async function getProviderDetails(providerId: string): Promise<ProviderDisplayInfo> {
  try {
    // A requisição é feita usando a instância 'api', que já tem a baseURL configurada
    const response: AxiosResponse<ProviderDisplayInfo> = await api.get<ProviderDisplayInfo>(`/providers/${providerId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar detalhes do provedor ${providerId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao buscar detalhes do provedor ${providerId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao buscar detalhes do provedor ${providerId}.`);
  }
}

/**
 * @function updateClientProfile
 * Atualiza o perfil do cliente logado.
 * Corresponde a PATCH /clients/me.
 * @param data DTO com os dados de atualização do perfil.
 * @returns Promessa com o objeto UserProfile atualizado.
 */
export async function updateClientProfile(data: UpdateClientProfileDto): Promise<UserProfile> {
  try {
    // A requisição é feita usando a instância 'api', que já tem a baseURL configurada
    const response: AxiosResponse<UserProfile> = await api.patch<UserProfile>('/clients/me', data);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao atualizar perfil do cliente:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao atualizar perfil do cliente.');
    }
    throw new Error('Erro de rede ou servidor ao atualizar perfil do cliente.');
  }
}