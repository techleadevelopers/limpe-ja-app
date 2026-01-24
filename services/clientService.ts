// LimpeJaApp/app/services/clientService.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { api } from './api';

// Dev-only logger to avoid RN redbox/yellowbox overlays from console.error/console.warn
// Keeps signal in the console without surfacing overlay in the UI
const devLog = (...args: any[]) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

// Shadow console locally in this module to avoid redbox from console.error
// Map error -> devLog (no UI overlay), keep other methods intact
const console = { ...globalThis.console, error: (...args: any[]) => devLog(...args) } as Console;

// Adiciona interceptor de resposta global para logging de erros em dev
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (__DEV__) {
      console.warn('[API ERROR]', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// =========================================================================
// IMPORTAÇÕES DE INTERFACES DE TIPAGEM CENTRALIZADAS
// =========================================================================
import { UpdateClientProfileDto } from '../types/backend/clients';
import { Offer } from '../types/backend/offers';
import {
    ProviderDisplayInfo,
    ProviderSearchQuery,
    ProviderMetrics,
} from '../types/backend/providers';
import { Service } from '../types/backend/services';
import { UserProfile } from '../types/backend/users';
import { ProviderSearchItem, SearchQuery } from '../types/backend/search';
import { AppliedCoupon, BookingPricing, BookingDetails } from '../types/backend/bookings';
import { ClientMission, ClientReward } from '../types/backend/mission';

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
    const response: AxiosResponse<Service[]> = await api.get<Service[]>('/services', { headers: { 'X-Silent': '1' } });
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
 * @param query Objeto com os parâmetros de busca.
 * @returns Promessa com um array de objetos ProviderDisplayInfo.
 */
export async function searchProviders(query: ProviderSearchQuery): Promise<ProviderDisplayInfo[]> {
  try {
    const filtered: any = { ...query };
    // Mapear categoryId -> serviceId para o backend
    if ((filtered as any).categoryId && !(filtered as any).serviceId) {
      (filtered as any).serviceId = (filtered as any).categoryId;
      delete (filtered as any).categoryId;
    }
    const hasLat = typeof (query as any).latitude === 'number' && isFinite((query as any).latitude) && (query as any).latitude !== 0;
    const hasLon = typeof (query as any).longitude === 'number' && isFinite((query as any).longitude) && (query as any).longitude !== 0;
    if (!(hasLat && hasLon)) {
      delete filtered.latitude;
      delete filtered.longitude;
      // evite sortBy distance sem coords
      if (filtered.sortBy === 'distance') delete filtered.sortBy;
    }
    const params = new URLSearchParams(filtered).toString();
    const response: AxiosResponse<ProviderDisplayInfo[]> = await api.get<ProviderDisplayInfo[]>(`/providers?${params}`);
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
 * NOVO: Realiza uma busca de provedores com base na localização.
 * @param params Objeto com latitude, longitude e raio.
 * @returns Promessa com um array de objetos ProviderDisplayInfo.
 */
export async function searchProvidersWithLocation(
  params: {
    latitude: number;
    longitude: number;
    radius?: number;
    query?: string;
  },
  config?: AxiosRequestConfig,
): Promise<ProviderDisplayInfo[]> {
  try {
    const validLat = typeof params.latitude === 'number' && isFinite(params.latitude) && params.latitude !== 0;
    const validLon = typeof params.longitude === 'number' && isFinite(params.longitude) && params.longitude !== 0;
    const mappedParams: Record<string, any> = {
      ...(validLat && validLon ? { latitude: params.latitude, longitude: params.longitude } : {}),
      ...(params.radius != null ? { radius: params.radius } : {}),
      ...(params.query ? { searchTerm: params.query } : {}),
    };

    const requestConfig: AxiosRequestConfig = {
      ...config,
      params: mappedParams,
      headers: {
        'X-Silent': '1',
        ...(config?.headers ?? {}),
      },
    };
    const response: AxiosResponse<ProviderDisplayInfo[]> = await api.get<ProviderDisplayInfo[]>(
      '/providers',
      requestConfig,
    );
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar provedores por localização:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao buscar provedores por localização.');
    }
    throw new Error('Erro de rede ou servidor ao buscar provedores por localização.');
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
    const response: AxiosResponse<UserProfile> = await api.get<UserProfile>('/users/me', { headers: { 'X-Allow-Guest': '1', 'X-Silent': '1' } });
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
    const response: AxiosResponse<Offer[]> = await api.get<Offer[]>('/offers', { headers: { 'X-Silent': '1' } });
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
 * NOVO: Obtém as ofertas disponíveis para um provedor específico.
 * Corresponde a GET /providers/:providerId/offers.
 * @param providerId O ID do provedor.
 * @returns Promessa com um array de objetos Offer.
 */
export async function getProviderOffers(providerId: string): Promise<Offer[]> {
  try {
    const response: AxiosResponse<Offer[]> = await api.get<Offer[]>(`/providers/${providerId}/offers`);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar ofertas do provedor ${providerId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao buscar ofertas do provedor ${providerId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao buscar ofertas do provedor ${providerId}.`);
  }
}

/**
 * NOVO: Aplica um cupom a um agendamento.
 * Corresponde a POST /bookings/:bookingId/apply-coupon.
 * @param bookingId O ID do agendamento.
 * @param code O código do cupom.
 * @returns Promessa com o objeto BookingPricing atualizado.
 */
export async function applyCoupon(bookingId: string, code: string): Promise<BookingPricing> {
  try {
    const response: AxiosResponse<BookingPricing> = await api.post<BookingPricing>(`/bookings/${bookingId}/apply-coupon`, { code });
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao aplicar cupom ao agendamento ${bookingId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao aplicar cupom ao agendamento ${bookingId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao aplicar cupom ao agendamento ${bookingId}.`);
  }
}

/**
 * @function getProviderDetails
 * Obtém os detalhes de um provedor específico por ID.
 * Corresponde a GET /providers/:id.
 * @param providerId O ID do provedor.
 * @returns Promessa com o objeto ProviderDisplayInfo.
 */
export async function getProviderDetails(providerId: string): Promise<ProviderDisplayInfo> {
  try {
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
 * NOVO: Obtém as métricas de performance de um provedor.
 * Corresponde a GET /providers/:providerId/metrics.
 * @param providerId O ID do provedor.
 * @returns Promessa com o objeto ProviderMetrics.
 */
export async function getProviderMetrics(providerId: string): Promise<ProviderMetrics> {
  try {
    const response: AxiosResponse<ProviderMetrics> = await api.get<ProviderMetrics>(`/providers/${providerId}/metrics`);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar métricas do provedor ${providerId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao buscar métricas do provedor ${providerId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao buscar métricas do provedor ${providerId}.`);
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

/**
 * NOVO: Obtém a lista de missões disponíveis para o cliente.
 * Corresponde a GET /missions/my.
 * @returns Promessa com um array de objetos ClientMission.
 */
export async function getClientMissions(): Promise<ClientMission[]> {
  try {
    const response: AxiosResponse<ClientMission[]> = await api.get<ClientMission[]>('/missions/my');
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar missões do cliente:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao buscar missões do cliente.');
    }
    throw new Error('Erro de rede ou servidor ao buscar missões do cliente.');
  }
}

/**
 * NOVO: Resgata a recompensa de uma missão concluída pelo cliente.
 * Corresponde a POST /missions/claim.
 * @param missionId O ID da missão a ser resgatada.
 * @returns Promessa com o objeto ClientReward.
 */
export async function claimClientReward(missionId: string): Promise<ClientReward> {
  try {
    const response: AxiosResponse<ClientReward> = await api.post<ClientReward>(`/missions/claim`, { missionId });
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao resgatar recompensa da missão ${missionId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao resgatar recompensa da missão ${missionId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao resgatar recompensa da missão ${missionId}.`);
  }
}



