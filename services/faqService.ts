// LimpeJaApp/app/services/faqService.ts
import axios, { AxiosResponse } from 'axios'; // Importar axios para isAxiosError
import api from './api'; // Importa a instância centralizada do Axios

// Importa a tipagem da FAQItem
import { FAQItem } from '../app/types/backend/faqs'; //

/**
 * @function getFaqs
 * Busca a lista de perguntas frequentes (FAQs) do backend.
 * Corresponde a `GET /faqs` (endpoint assumido, ajuste se for diferente no seu backend).
 * @returns Promessa que resolve para um array de FAQItem.
 */
export const getFaqs = async (): Promise<FAQItem[]> => {
  try {
    const response: AxiosResponse<FAQItem[]> = await api.get('/faqs'); // Endpoint para buscar FAQs
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar FAQs:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Não foi possível carregar as FAQs.');
    }
    throw new Error('Erro de rede ou servidor ao buscar FAQs.');
  }
};