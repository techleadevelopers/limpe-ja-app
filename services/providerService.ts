// app/services/providerService.ts
import axios, { AxiosResponse } from 'axios';
import api from './api';

// Importa o serviço de reviews do frontend
import { ReviewService as FrontendReviewService } from './reviewService'; // Renomeado para evitar conflito

// =========================================================================
// IMPORTAÇÕES DE INTERFACES DE TIPAGEM CENTRALIZADAS
// =========================================================================
import {
  CreateProviderServiceData,
  ProviderAvailability,
  ProviderDashboard,
  ProviderDisplayInfo,
  ProviderSearchQuery,
  ProviderTransaction,
  UpdateAvailabilityData,
  UpdateProviderProfileData,
  UpdateProviderServiceData,
  GetProviderAvailabilityResponse,
  ProviderMetrics, // <<-- CORREÇÃO: Importado de ../types/backend/providers
  Offer // <<-- CORREÇÃO: Importado de ../types/backend/providers
} from '../types/backend/providers';

// <<<< CORREÇÃO: Importar ProviderServiceOffering APENAS do seu arquivo de origem >>>>
import { ProviderServiceOffering } from '../types/backend/provider-service';

// Importar Service do seu arquivo de serviços
import { Service } from '../types/backend/services';

// Importar ReviewEntity para tipar as avaliações
import { ReviewEntity } from '../types/backend/reviews'; // Certifique-se de que este caminho está correto

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
    // Busca os detalhes principais do provedor
    const providerResponse: AxiosResponse<ProviderDisplayInfo> = await api.get(`/providers/${providerId}`);
    let providerDetails: ProviderDisplayInfo = providerResponse.data;

    // Busca as avaliações do provedor usando o ReviewService do frontend
    // Assumindo que ReviewService.getReviews retorna um array de ReviewEntity
    const reviews: ReviewEntity[] = await FrontendReviewService.getReviews(providerId);

    // Adiciona as avaliações ao objeto de detalhes do provedor
    // É crucial que ProviderDisplayInfo em '../types/backend/providers' inclua 'reviews?: ReviewEntity[];'
    providerDetails = {
      ...providerDetails,
      reviews: reviews,
      // Atualiza reviewCount e averageRating com base nas reviews reais
      reviewCount: reviews.length,
      averageRating: reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0,
    };

    return providerDetails;
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
export async function getProviderAvailability(providerId: string, date?: string): Promise<GetProviderAvailabilityResponse> {
  try {
    const params = date ? { date } : {};
    const response: AxiosResponse<GetProviderAvailabilityResponse> = await api.get(`/providers/${providerId}/availability`, { params });
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar disponibilidade do provedor ${providerId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao buscar disponibilidade do provedor ${providerId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao buscar disponibilidade do provedor ${providerId}.`);
  }
}

// =========================================================================
// NOVAS FUNÇÕES DE SERVIÇO PARA A DISPONIBILIDADE DO PROVEDOR AUTENTICADO (/me)
// =========================================================================

/**
 * @function getMyProviderAvailability
 * Obtém a disponibilidade de horários e os horários ocupados do provedor autenticado.
 * Corresponde a GET /providers/me/availability
 * @param date Data opcional no formato string (ex: "YYYY-MM-DD") para filtrar a disponibilidade.
 * @returns Uma Promise que resolve para um objeto contendo 'available' (slots configurados) e 'occupiedTimes' (slots já agendados).
 */
export async function getMyProviderAvailability(date?: string): Promise<GetProviderAvailabilityResponse> {
  try {
    const params = date ? { date } : {};
    const response: AxiosResponse<GetProviderAvailabilityResponse> = await api.get(`/providers/me/availability`, { params });
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar disponibilidade do provedor autenticado:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao buscar disponibilidade do provedor autenticado.`);
    }
    throw new Error('Erro de rede ou servidor ao buscar disponibilidade do provedor autenticado.');
  }
}

/**
 * @function updateMyProviderAvailability
 * Atualiza a disponibilidade semanal do provedor autenticado.
 * Corresponde a PATCH /providers/me/availability
 * @param data Array de objetos UpdateAvailabilityData contendo os slots de disponibilidade a serem atualizados.
 * @returns Uma Promise que resolve para um array de ProviderAvailability atualizados.
 */
export async function updateMyProviderAvailability(data: UpdateAvailabilityData[]): Promise<ProviderAvailability[]> {
  try {
    const response: AxiosResponse<ProviderAvailability[]> = await api.patch(`/providers/me/availability`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao atualizar disponibilidade do provedor autenticado:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao atualizar disponibilidade do provedor autenticado.`);
    }
    throw new Error(`Erro de rede ou servidor ao atualizar disponibilidade do provedor autenticado.`);
  }
}

/**
 * @function addMyProviderAvailability
 * Adiciona um novo slot de disponibilidade para o provedor autenticado.
 * Corresponde a POST /providers/me/availability
 * @param data Objeto UpdateAvailabilityData contendo os detalhes do novo slot.
 * @returns Uma Promise que resolve para o objeto ProviderAvailability recém-criado.
 */
export async function addMyProviderAvailability(data: UpdateAvailabilityData): Promise<ProviderAvailability> {
  try {
    const response: AxiosResponse<ProviderAvailability> = await api.post(`/providers/me/availability`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao adicionar disponibilidade para o provedor autenticado:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao adicionar disponibilidade para o provedor autenticado.`);
    }
    throw new Error(`Erro de rede ou servidor ao adicionar disponibilidade para o provedor autenticado.`);
  }
}

/**
 * @function deleteMyProviderAvailability
 * Deleta um slot de disponibilidade específico do provedor autenticado.
 * Corresponde a DELETE /providers/me/availability/:availabilityId
 * @param availabilityId O ID do slot de disponibilidade a ser deletado.
 * @returns Uma Promise que resolve quando a operação é concluída.
 */
export async function deleteMyProviderAvailability(availabilityId: string): Promise<void> {
  try {
    await api.delete(`/providers/me/availability/${availabilityId}`);
  } catch (error: any) {
    console.error(`Erro ao deletar disponibilidade ${availabilityId} do provedor autenticado:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao deletar disponibilidade ${availabilityId} do provedor autenticado.`);
    }
    throw new Error(`Erro de rede ou servidor ao deletar disponibilidade ${availabilityId} do provedor autenticado.`);
  }
}

/**
 * @function updateMyProviderProfile
 * Atualiza o perfil do provedor atualmente logado (PATCH /providers/me).
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
 * Obtém os dados do painel do provedor atualmente logado (GET /providers/me/dashboard).
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
 * Obtém o histórico de transações de ganhos do provedor atualmente logado (GET /providers/me/earnings).
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
 * Atualiza a disponibilidade semanal de um provedor (PATCH /providers/:providerId/availability).
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
 * Adiciona um novo slot de disponibilidade para um provedor (POST /providers/:providerId/availability).
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
 * Deleta um slot de disponibilidade específico de um provedor (DELETE /providers/:providerId/availability/:availabilityId).
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
 * Obtém a lista de serviços que um provedor oferece (GET /providers/:providerId/services).
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
 * Adiciona um novo serviço à lista de serviços oferecidos por um provedor (POST /providers/:providerId/services).
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
 * Atualiza um serviço específico oferecido por um provedor (PATCH /providers/:providerId/services/:id).
 * @param providerId O ID do provedor.
 * @param serviceOfferingId O ID do serviço oferecido a ser atualizado.
 * @param data Os dados de atualização do serviço.
 * @returns Uma Promise que resolve para o objeto ProviderServiceOffering atualizado.
 */
export async function updateProviderServiceOffering(
  providerId: string,
  serviceOfferingId: string,
  data: UpdateProviderServiceData
): Promise<ProviderServiceOffering> {
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
 * Deleta um serviço específico oferecido por um provedor (DELETE /providers/:providerId/services/:id).
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
 * @param latitude Latitude da localização atual para busca.
 * @param longitude Longitude da localização atual para busca.
 * @returns Uma Promise que resolve para um array de provedores (ProviderDisplayInfo para frontend).
 */
export async function getNearbyProviders(latitude?: number, longitude?: number): Promise<ProviderDisplayInfo[]> {
  try {
    const params = (latitude !== undefined && longitude !== undefined) ? { latitude, longitude } : {};
    const response: AxiosResponse<ProviderDisplayInfo[]> = await api.get('/providers/nearby', { params });
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
 * Assume que o endpoint /providers pode aceitar um serviceId como query parameter.
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

/**
 * @function getServicesByCategoryId
 * Obtém uma lista de serviços (não provedores) que pertencem a uma categoria específica.
 * NOTA: Este endpoint não está explicitamente detalhado no README.md do backend.
 * VOCÊ PRECISA IMPLEMENTAR ESTE ENDPOINT NO BACKEND (ex: GET /services?categoryId=...)
 * ou adaptar o frontend para usar getProvidersByServiceCategory se a intenção for listar provedores.
 * @param categoryId O ID da categoria de serviço.
 * @returns Uma Promise que resolve para um array de objetos Service.
 */
export async function getServicesByCategoryId(categoryId: string): Promise<Service[]> {
  try {
    // Exemplo de como o endpoint poderia ser. Ajuste conforme sua implementação real.
    const response: AxiosResponse<Service[]> = await api.get(`/services`, { params: { categoryId } });
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar serviços pela categoria ${categoryId}:`, error.response?.data || error.message);
    // Para um app premium, não devemos retornar um array vazio em caso de erro.
    // O erro deve ser propagado para que a UI possa lidar com ele.
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao buscar serviços pela categoria ${categoryId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao buscar serviços pela categoria ${categoryId}.`);
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
    const response: AxiosResponse<ProviderMetrics> = await api.get(`/providers/${providerId}/metrics`);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar métricas do provedor ${providerId}:`, error.response?.data || error.message);
    // Em um ambiente de produção "premium", não devemos retornar dados mockados em caso de erro.
    // O erro deve ser propagado para que a UI possa lidar com ele.
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao buscar métricas do provedor ${providerId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao buscar métricas do provedor ${providerId}.`);
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
    // Em um ambiente de produção "premium", não devemos retornar um array vazio em caso de erro.
    // O erro deve ser propagado para que a UI possa lidar com ele.
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao buscar ofertas do provedor ${providerId}.`);
    }
    throw new Error(`Erro de rede ou servidor ao buscar ofertas do provedor ${providerId}.`);
  }
}

// =========================================================================
// FUNÇÃO ADICIONAL: getProviderAvatar (NOVA - Para otimizar fetches em listas)
// =========================================================================

/**
 * @function getProviderAvatar
 * Obtém apenas a URL do avatar de um provedor específico por seu ID.
 * Wrapper otimizado em torno de getProviderDetails para evitar fetch completo em listas (ex.: telas de booking).
 * Retorna apenas { url: string }, com fallback silencioso para não quebrar a UI.
 * @param providerId O ID do provedor.
 * @returns Uma Promise que resolve para { url: string } (vazio em erro).
 */
export async function getProviderAvatar(providerId: string): Promise<{ url: string }> {
  try {
    const details = await getProviderDetails(providerId);
    // Assumindo que ProviderDisplayInfo tem 'avatarUrl' (ajuste o campo se for 'avatar' ou 'profileImage')
    return { url: details.avatarUrl || '' };
  } catch (error: any) {
    console.error(`Erro ao buscar avatar do provedor ${providerId}:`, error.response?.data || error.message);
    // Fallback silencioso: retorna URL vazia para expo-image lidar com placeholder
    return { url: '' };
  }
}