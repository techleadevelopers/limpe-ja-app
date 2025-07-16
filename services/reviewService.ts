// LimpeJaApp/app/services/reviewService.ts
import axios, { AxiosResponse } from 'axios'; // Importar axios para isAxiosError
import api from './api'; // Importa a instância centralizada do Axios

// Importa as tipagens de review (DTOs e Entity)
import { MessageResponseDto } from '../app/types/backend/auth'; // Para respostas de sucesso/erro genéricas
import { ReviewEntity, SubmitReviewDto } from '../app/types/backend/reviews';

/**
 * @function submitFeedback
 * Envia um feedback ou avaliação para o backend.
 * Corresponde a `POST /reviews`.
 * @param data O DTO com os detalhes do feedback.
 * @returns Promessa com a entidade de avaliação criada ou uma mensagem de sucesso.
 */
export const submitFeedback = async (data: SubmitReviewDto): Promise<ReviewEntity | MessageResponseDto> => {
  try {
    const response: AxiosResponse<ReviewEntity | MessageResponseDto> = await api.post('/reviews', data);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao enviar feedback:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Não foi possível enviar seu feedback.');
    }
    throw new Error('Erro de rede ou servidor ao enviar feedback.');
  }
};

// Se houver outras funções para reviews, como obter reviews de um provedor, elas iriam aqui:
// export const getProviderReviews = async (providerId: string): Promise<ReviewEntity[]> => { /* ... */ };
// export const getServiceReviews = async (serviceId: string): Promise<ReviewEntity[]> => { /* ... */ };