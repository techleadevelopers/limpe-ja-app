// LimpeJaApp/app/services/offerService.ts
import api from './api'; // Importa a instância centralizada do Axios
import axios, { AxiosResponse } from 'axios'; // Importar axios para isAxiosError

// Importa a tipagem da Offer
import { Offer } from '../types/backend/offers'; //

/**
 * @function getOffers
 * Busca a lista de todas as ofertas disponíveis.
 * Corresponde a `GET /offers`.
 * @returns Promessa que resolve para um array de Offer.
 */
export const getOffers = async (): Promise<Offer[]> => {
  try {
    const response: AxiosResponse<Offer[]> = await api.get('/offers'); //
    return response.data; //
  } catch (error: any) {
    console.error('Erro ao buscar ofertas:', error.response?.data || error.message); //
    if (axios.isAxiosError(error) && error.response) { //
      throw new Error(error.response.data.message || 'Não foi possível carregar as ofertas.'); //
    }
    throw new Error('Erro de rede ou servidor ao buscar ofertas.'); //
  }
};

/**
 * @function getOfferDetails
 * Busca os detalhes de uma oferta específica por ID.
 * Corresponde a `GET /offers/:id`.
 * @param offerId O ID da oferta.
 * @returns Promessa que resolve para o objeto Offer.
 */
export const getOfferDetails = async (offerId: string): Promise<Offer> => {
  try {
    const response: AxiosResponse<Offer> = await api.get(`/offers/${offerId}`); //
    return response.data; //
  } catch (error: any) {
    console.error(`Erro ao buscar detalhes da oferta ${offerId}:`, error.response?.data || error.message); //
    if (axios.isAxiosError(error) && error.response) { //
      throw new Error(error.response.data.message || `Não foi possível carregar os detalhes da oferta ${offerId}.`); //
    }
    throw new Error(`Erro de rede ou servidor ao buscar detalhes da oferta ${offerId}.`); //
  }
};