// providerService.ts
// app/services/providerService.ts
import axios, { AxiosResponse } from 'axios';
import api from './api';

// =========================================================================
// IMPORTAÇÕES DE INTERFACES DE TIPAGEM CENTRALIZADAS
// =========================================================================
import {
    CreateProviderServiceData,
    ProviderAvailability,
    ProviderDashboard,
    ProviderDisplayInfo, // Usado para tipar provedores em listas - DEVE INCLUIR 'badges', 'user.isVerified', 'address.latitude/longitude'
    ProviderSearchQuery, // Importado para tipar a query de busca - DEVE INCLUIR 'latitude', 'longitude', 'radius'
    ProviderTransaction,
    UpdateAvailabilityData, // Importado para tipar a query de busca
    UpdateProviderProfileData,
    UpdateProviderServiceData,
    GetProviderAvailabilityResponse // <--- IMPORTADO DE providers.ts
} from '../types/backend/providers';

// <<<< CORREÇÃO: Importar ProviderServiceOffering APENAS do seu arquivo de origem >>>>
import { ProviderServiceOffering } from '../types/backend/provider-service';

// Mock ou placeholder para tipos que não foram fornecidos nos snippets
// Em um projeto real, estes deveriam vir de `../types/backend/providers` e `../types/backend/offers`
export interface ProviderMetrics {
  acceptanceRate: number;
  avgResponseTime: number; // em minutos
  totalBookings: number;
  // Adicione outras métricas conforme necessário
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  couponCode: string | null;
  discountType: 'PERCENT' | 'FIXED'; // Adicionado para corresponder ao uso
  discountValue: number; // Adicionado para corresponder ao uso
  startDate: string;
  endDate: string;
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

/**
 * @function getProvidersByServiceCategory
 * Obtém uma lista de provedores que oferecem serviços dentro de uma categoria específica.
 * Assume que o endpoint /providers pode aceitar um `serviceId` como query parameter.
 * @param categoryId O ID da categoria de serviço.
 * @returns Uma Promise que resolve para um array de provedores (ProviderDisplayInfo).
 */
export async function getProvidersByServiceCategory(categoryId: string): Promise<ProviderDisplayInfo[]> {
  try {
    // CORREÇÃO: Passa categoryId como serviceId para corresponder ao DTO do backend
    const query: ProviderSearchQuery = { serviceId: categoryId };
    const response: AxiosResponse<ProviderDisplayInfo[]> = await api.get(`/providers`, { params: query });
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar provedores pela categoria ${categoryId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao buscar provedores pela categoria ${categoryId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao buscar provedores pela categoria ${categoryId}.`);
  }
}

// =========================================================================
// FUNÇÃO PARA BUSCA GERAL DE PROVEDORES (GET /providers)
// =========================================================================

/**
 * @function searchProviders
 * Realiza uma busca por provedores com base em filtros.
 * Corresponde a GET /providers
 * @param query Objeto com os parâmetros de busca. Deve incluir latitude, longitude e radius.
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

/**
 * @function getProviderMetrics
 * Obtém métricas específicas para um provedor.
 * Este é um placeholder, ajuste o endpoint e a lógica conforme sua API.
 * @param providerId O ID do provedor.
 * @returns Uma Promise que resolve para o objeto ProviderMetrics.
 */
export async function getProviderMetrics(providerId: string): Promise<ProviderMetrics> {
  try {
    // Exemplo de endpoint: /providers/:providerId/metrics
    // Se não houver um endpoint real, você pode mockar os dados ou lançar um erro.
    const response: AxiosResponse<ProviderMetrics> = await api.get(`/providers/${providerId}/metrics`);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar métricas do provedor ${providerId}:`, error.response?.data || error.message);
    // Retornar dados mockados em caso de erro ou se o endpoint não existe para evitar quebrar a UI
    return {
      acceptanceRate: 95, // Exemplo
      avgResponseTime: 15, // Exemplo em minutos
      totalBookings: 120, // Exemplo
    };
    // Ou lançar um erro:
    // if (axios.isAxiosError(error) && error.response) {
    //   throw new Error(error.response.data.message || `Erro ao buscar métricas do provedor ${providerId}.`);
    // }
    // throw new Error(`Erro de rede ou servidor ao buscar métricas do provedor ${providerId}.`);
  }
}

/**
 * @function getProviderOffers
 * Obtém as ofertas disponíveis para um provedor.
 * Este é um placeholder, ajuste o endpoint e a lógica conforme sua API.
 * @param providerId O ID do provedor.
 * @returns Uma Promise que resolve para um array de objetos Offer.
 */
export async function getProviderOffers(providerId: string): Promise<Offer[]> {
  try {
    // Exemplo de endpoint: /providers/:providerId/offers
    const response: AxiosResponse<Offer[]> = await api.get(`/providers/${providerId}/offers`);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar ofertas do provedor ${providerId}:`, error.response?.data || error.message);
    // Retornar um array vazio ou dados mockados em caso de erro
    return [
      // Exemplo de oferta mockada
      // {
      //   id: 'offer-123',
      //   title: '10% de Desconto no Primeiro Serviço',
      //   description: 'Válido para novos clientes.',
      //   couponCode: 'BEMVINDO10',
      //   discountType: 'PERCENT',
      //   discountValue: 10,
      //   startDate: '2025-01-01',
      //   endDate: '2025-12-31',
      // }
    ];
    // Ou lançar um erro:
    // if (axios.isAxiosError(error) && error.response) {
    //   throw new Error(error.response.data.message || `Erro ao buscar ofertas do provedor ${providerId}.`);
    // }
    // throw new Error(`Erro de rede ou servidor ao buscar ofertas do provedor ${providerId}.`);
  }
}