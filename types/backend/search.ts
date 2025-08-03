// LimpeJaApp/types/backend/search.ts

import { ProviderDetails } from './providers'; // Agora exporta ProviderDetails
import { ServiceDetails } from './services';   // Agora exporta ServiceDetails
import { ProviderServiceDetails } from './provider-service'; // Do novo arquivo

/**
 * Enumeração para os tipos de busca disponíveis.
 */
export enum SearchType {
  PROVIDERS = 'providers',
  SERVICES = 'services',
  OFFERS = 'offers',
  ALL = 'all',
  PROVIDER_SERVICES = 'providerServices', // NOVO: Para buscar serviços específicos de provedores
}

/**
 * Enumeração para as opções de ordenação dos resultados da busca.
 */
export enum SortByOption {
  Rating = 'rating',
  Distance = 'distance',
  Experience = 'experience',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  FullName = 'fullName',
  // Adicione outras opções conforme necessário
}

/**
 * Interface para os parâmetros de consulta da busca que o frontend envia.
 */
export interface SearchQuery {
  query?: string;
  type?: SearchType;
  location?: string;
  date?: string;
  limit?: number;
  offset?: number;
  latitude?: number;
  longitude?: number;
  radius?: number; // Raio em quilômetros
  sortBy?: SortByOption;
}

/**
 * Interface para o resultado de um serviço específico oferecido por um provedor,
 * combinando detalhes do provedor e do serviço oferecido.
 * Este seria o principal tipo de resultado para a busca de serviços.
 */
export interface ProviderServiceSearchResult {
  provider: ProviderDetails;
  providerService: ProviderServiceDetails;
  distance?: number; // Distância se a busca for geoespacial
}

/**
 * Interface para a resposta completa da API de busca.
 */
export interface SearchResult {
  providerServices: ProviderServiceSearchResult[]; // NOVO: Lista principal de resultados
  providers: ProviderDetails[]; // Lista de provedores (busca complementar)
  services: ServiceDetails[];   // Lista de tipos de serviço (busca complementar)
  // offers?: OfferDetails[]; // Lista de ofertas (busca complementar)
}