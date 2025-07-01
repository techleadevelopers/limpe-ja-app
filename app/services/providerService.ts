// app/services/providerService.ts
import api from './api'; // Importa a instância centralizada do Axios
import axios, { AxiosResponse, AxiosError } from 'axios'; // Importa axios para isAxiosError

// =========================================================================
// IMPORTAÇÕES DE INTERFACES DE TIPAGEM CENTRALIZADAS
// =========================================================================
import {
  ProviderDisplayInfo, // Usado para tipar provedores em listas
  ProviderSearchQuery, // Importado para tipar a query de busca
  UpdateProviderProfileData,
  ProviderServiceOffering,
  CreateProviderServiceData,
  UpdateProviderServiceData,
  ProviderAvailability,
  UpdateAvailabilityData,
  ProviderDashboard,
  ProviderTransaction,
  // ProviderEarningsSummary, // <-- REMOVIDO: Esta interface não está sendo usada e não é exportada
  ProviderReview,
  ServiceDetailsDto,
} from '../types/backend/providers';

// <<<< ATUALIZADO: Interface para o novo tipo de retorno de getProviderAvailability >>>>
// Esta interface deve corresponder exatamente ao que o backend retorna para este endpoint.
interface GetProviderAvailabilityResponse {
  available: ProviderAvailability[]; // Slots de tempo configurados pelo provedor
  occupiedTimes: string[];         // Horários já agendados/ocupados
}

// =========================================================================
// FUNÇÕES DE SERVIÇO DO PROVEDOR - AJUSTADAS E COMPLETAS
// =========================================================================

/**
 * @function getProviderDetails
 * Obtém os detalhes completos de um provedor específico por seu ID.
 * Corresponde a GET /providers/:id
 * @param providerId O ID do provedor.
 * @returns Uma Promise que resolve para o objeto ProviderDisplayInfo.
 */
export async function getProviderDetails(providerId: string): Promise<ProviderDisplayInfo> {
  try {
    const response: AxiosResponse<ProviderDisplayInfo> = await api.get(`/providers/${providerId}`);
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
 * @function getProviderAvailability
 * Obtém a disponibilidade de horários e os horários ocupados de um provedor para uma data específica.
 * Corresponde a GET /providers/:providerId/availability
 * @param providerId O ID do provedor.
 * @param date Data opcional no formato string (ex: "YYYY-MM-DD") para filtrar a disponibilidade.
 * @returns Uma Promise que resolve para um objeto contendo 'available' (slots configurados) e 'occupiedTimes' (slots já agendados).
 */
export async function getProviderAvailability(providerId: string, date?: string): Promise<GetProviderAvailabilityResponse> { // <<<< TIPO DE RETORNO ATUALIZADO AQUI
  try {
    const params = date ? { date } : {};
    const response: AxiosResponse<GetProviderAvailabilityResponse> = await api.get(`/providers/${providerId}/availability`, { params }); // <<<< TIPO DE RESPOSTA AXIOS ATUALIZADO
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar disponibilidade do provedor ${providerId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao buscar disponibilidade do provedor ${providerId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao buscar disponibilidade do provedor ${providerId}.`);
  }
}

/**
 * @function updateMyProviderProfile
 * Atualiza o perfil do provedor atualmente logado (`PATCH /providers/me`).
 * @param data Os dados de atualização do perfil.
 * @returns Uma Promise que resolve para o objeto ProviderDisplayInfo atualizado.
 */
export async function updateMyProviderProfile(data: UpdateProviderProfileData): Promise<ProviderDisplayInfo> {
  try {
    const response: AxiosResponse<ProviderDisplayInfo> = await api.patch(`/providers/me`, data);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao atualizar perfil do provedor:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao atualizar perfil do provedor.');
    }
    throw new Error('Erro de rede ou servidor ao atualizar perfil do provedor.');
  }
}

/**
 * @function getMyProviderDashboard
 * Obtém os dados do painel do provedor atualmente logado (`GET /providers/me/dashboard`).
 * @returns Uma Promise que resolve para o objeto ProviderDashboard.
 */
export async function getMyProviderDashboard(): Promise<ProviderDashboard> {
  try {
    const response: AxiosResponse<ProviderDashboard> = await api.get(`/providers/me/dashboard`);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar dados do painel do provedor:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao buscar dados do painel do provedor.');
    }
    throw new Error('Erro de rede ou servidor ao buscar dados do painel do provedor.');
  }
}

/**
 * @function getMyProviderEarnings
 * Obtém o histórico de transações de ganhos do provedor atualmente logado (`GET /providers/me/earnings`).
 * @returns Uma Promise que resolve para um array de ProviderTransaction.
 */
export async function getMyProviderEarnings(): Promise<ProviderTransaction[]> {
  try {
    const response: AxiosResponse<ProviderTransaction[]> = await api.get(`/providers/me/earnings`);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar ganhos do provedor:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao buscar ganhos do provedor.');
    }
    throw new Error('Erro de rede ou servidor ao buscar ganhos do provedor.');
  }
}

/**
 * @function updateProviderAvailability
 * Atualiza a disponibilidade semanal de um provedor (`PATCH /providers/:providerId/availability`).
 * @param providerId O ID do provedor.
 * @param data Array de objetos UpdateAvailabilityData contendo os slots de disponibilidade a serem atualizados.
 * @returns Uma Promise que resolve para um array de ProviderAvailability atualizados.
 */
export async function updateProviderAvailability(providerId: string, data: UpdateAvailabilityData[]): Promise<ProviderAvailability[]> {
  try {
    const response: AxiosResponse<ProviderAvailability[]> = await api.patch(`/providers/${providerId}/availability`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao atualizar disponibilidade do provedor ${providerId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao atualizar disponibilidade do provedor ${providerId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao atualizar disponibilidade do provedor ${providerId}.`);
  }
}

/**
 * @function addProviderAvailability
 * Adiciona um novo slot de disponibilidade para um provedor (`POST /providers/:providerId/availability`).
 * @param providerId O ID do provedor.
 * @param data Objeto UpdateAvailabilityData contendo os detalhes do novo slot.
 * @returns Uma Promise que resolve para o objeto ProviderAvailability recém-criado.
 */
export async function addProviderAvailability(providerId: string, data: UpdateAvailabilityData): Promise<ProviderAvailability> {
  try {
    const response: AxiosResponse<ProviderAvailability> = await api.post(`/providers/${providerId}/availability`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao adicionar disponibilidade para o provedor ${providerId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao adicionar disponibilidade para o provedor ${providerId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao adicionar disponibilidade para o provedor ${providerId}.`);
  }
}

/**
 * @function deleteProviderAvailability
 * Deleta um slot de disponibilidade específico de um provedor (`DELETE /providers/:providerId/availability/:availabilityId`).
 * @param providerId O ID do provedor.
 * @param availabilityId O ID do slot de disponibilidade a ser deletado.
 * @returns Uma Promise que resolve quando a operação é concluída.
 */
export async function deleteProviderAvailability(providerId: string, availabilityId: string): Promise<void> {
  try {
    await api.delete(`/providers/${providerId}/availability/${availabilityId}`);
  } catch (error: any) {
    console.error(`Erro ao deletar disponibilidade ${availabilityId} do provedor ${providerId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao deletar disponibilidade ${availabilityId} do provedor ${providerId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao deletar disponibilidade ${availabilityId} do provedor ${providerId}.`);
  }
}

/**
 * @function getProviderServicesOffered
 * Obtém a lista de serviços que um provedor oferece (`GET /providers/:providerId/services`).
 * @param providerId O ID do provedor.
 * @returns Uma Promise que resolve para um array de ProviderServiceOffering.
 */
export async function getProviderServicesOffered(providerId: string): Promise<ProviderServiceOffering[]> {
  try {
    const response: AxiosResponse<ProviderServiceOffering[]> = await api.get(`/providers/${providerId}/services`);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar serviços oferecidos pelo provedor ${providerId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao buscar serviços oferecidos pelo provedor ${providerId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao buscar serviços oferecidos pelo provedor ${providerId}.`);
  }
}

/**
 * @function addProviderServiceOffering
 * Adiciona um novo serviço à lista de serviços oferecidos por um provedor (`POST /providers/:providerId/services`).
 * @param providerId O ID do provedor.
 * @param data Os dados do novo serviço a ser oferecido.
 * @returns Uma Promise que resolve para o objeto ProviderServiceOffering recém-criado.
 */
export async function addProviderServiceOffering(providerId: string, data: CreateProviderServiceData): Promise<ProviderServiceOffering> {
  try {
    const response: AxiosResponse<ProviderServiceOffering> = await api.post(`/providers/${providerId}/services`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao adicionar serviço para o provedor ${providerId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao adicionar serviço para o provedor ${providerId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao adicionar serviço para o provedor ${providerId}.`);
  }
}

/**
 * @function updateProviderServiceOffering
 * Atualiza um serviço específico oferecido por um provedor (`PATCH /providers/:providerId/services/:id`).
 * @param providerId O ID do provedor.
 * @param serviceOfferingId O ID do serviço oferecido a ser atualizado.
 * @param data Os dados de atualização do serviço.
 * @returns Uma Promise que resolve para o objeto ProviderServiceOffering atualizado.
 */
export async function updateProviderServiceOffering(providerId: string, serviceOfferingId: string, data: UpdateProviderServiceData): Promise<ProviderServiceOffering> {
  try {
    const response: AxiosResponse<ProviderServiceOffering> = await api.patch(`/providers/${providerId}/services/${serviceOfferingId}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao atualizar serviço ${serviceOfferingId} do provedor ${providerId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao atualizar serviço ${serviceOfferingId} do provedor ${providerId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao atualizar serviço ${serviceOfferingId} do provedor ${providerId}.`);
  }
}

/**
 * @function deleteProviderServiceOffering
 * Deleta um serviço específico oferecido por um provedor (`DELETE /providers/:providerId/services/:id`).
 * @param providerId O ID do provedor.
 * @param serviceOfferingId O ID do serviço oferecido a ser deletado.
 * @returns Uma Promise que resolve quando a operação é concluída.
 */
export async function deleteProviderServiceOffering(providerId: string, serviceOfferingId: string): Promise<void> {
  try {
    await api.delete(`/providers/${providerId}/services/${serviceOfferingId}`);
  } catch (error: any) {
    console.error(`Erro ao deletar serviço ${serviceOfferingId} do provedor ${providerId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao deletar serviço ${serviceOfferingId} do provedor ${providerId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao deletar serviço ${serviceOfferingId} do provedor ${providerId}.`);
  }
}

// =========================================================================
// NOVAS FUNÇÕES PARA BUSCAR LISTAS DE PROVEDORES PARA A TELA INICIAL
// =========================================================================

/**
 * @function getRecommendedProviders
 * Obtém uma lista de provedores recomendados para a tela inicial.
 * Chama o endpoint GET /providers/recommended.
 * @returns Uma Promise que resolve para um array de provedores (ProviderDisplayInfo para frontend).
 */
export async function getRecommendedProviders(): Promise<ProviderDisplayInfo[]> {
  try {
    const response: AxiosResponse<ProviderDisplayInfo[]> = await api.get('/providers/recommended');
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar provedores recomendados:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao buscar provedores recomendados.');
    }
    throw new Error('Erro de rede ou servidor ao buscar provedores recomendados.');
  }
}

/**
 * @function getNearbyProviders
 * Obtém uma lista de provedores próximos para a tela inicial.
 * Chama o endpoint GET /providers/nearby.
 * @returns Uma Promise que resolve para um array de provedores (ProviderDisplayInfo para frontend).
 */
export async function getNearbyProviders(): Promise<ProviderDisplayInfo[]> {
  try {
    // Você pode adicionar parâmetros de localização aqui no futuro, se necessário
    const response: AxiosResponse<ProviderDisplayInfo[]> = await api.get('/providers/nearby');
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar provedores próximos:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao buscar provedores próximos.');
    }
    throw new Error(`Erro de rede ou servidor ao buscar provedores próximos.`);
  }
}

// =========================================================================
// FUNÇÃO PARA BUSCA GERAL DE PROVEDORES (GET /providers)
// =========================================================================

/**
 * @function searchProviders
 * Realiza uma busca por provedores com base em filtros.
 * Corresponde a GET /providers
 * @param query Objeto com os parâmetros de busca.
 * @returns Uma Promise que resolve para um array de provedores (ProviderDisplayInfo).
 */
export async function searchProviders(query: ProviderSearchQuery): Promise<ProviderDisplayInfo[]> {
  try {
    const params = new URLSearchParams(query as any).toString(); // Converte objeto para query string
    const response: AxiosResponse<ProviderDisplayInfo[]> = await api.get(`/providers?${params}`);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar provedores:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao buscar provedores.');
    }
    throw new Error('Erro de rede ou servidor ao buscar provedores.');
  }
}