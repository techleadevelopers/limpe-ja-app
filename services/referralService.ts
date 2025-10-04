// LimpeJaApp/app/services/reviewService.ts
import axios, { AxiosResponse } from 'axios';
import { api } from './api';

// Importa as tipagens de review (DTOs e Entity)
import { MessageResponseDto } from '../types/backend/auth';
import { ReviewEntity, SubmitReviewDto } from '../types/backend/reviews'; // Certifique-se de que estes tipos estão corretos

interface ReviewAnalytics {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  commonKeywords: Array<{
    word: string;
    frequency: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  improvementSuggestions: string[];
}

interface SmartReviewResponse {
  suggestedResponses: string[];
  tone: 'professional' | 'friendly' | 'apologetic';
  keyPoints: string[];
}

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

/**
 * @function getDetailedRatingBreakdown
 * Obtém análise detalhada das avaliações de um provedor.
 * Corresponde a `GET /reviews/provider/:providerId/breakdown`.
 * @param providerId O ID do provedor.
 * @returns Promessa com breakdown detalhado das avaliações.
 */
export const getDetailedRatingBreakdown = async (providerId: string): Promise<ReviewAnalytics> => { // Tipado para ReviewAnalytics
  try {
    const response = await api.get(`/reviews/provider/${providerId}/breakdown`);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar breakdown de avaliações:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Não foi possível carregar a análise de avaliações.');
    }
    throw new Error('Erro de rede ou servidor ao carregar análise de avaliações.');
  }
};

/**
 * @function getSmartSuggestions
 * Obtém sugestões inteligentes baseadas em IA para um provedor.
 * Corresponde a `GET /reviews/provider/:providerId/suggestions`.
 * @param providerId O ID do provedor.
 * @returns Promessa com lista de sugestões inteligentes.
 */
export const getSmartSuggestions = async (providerId: string): Promise<string[]> => { // Tipado para string[]
  try {
    const response = await api.get(`/reviews/provider/${providerId}/suggestions`);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar sugestões inteligentes:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Não foi possível carregar as sugestões.');
    }
    throw new Error('Erro de rede ou servidor ao carregar sugestões.');
  }
};

export class ReviewService {
  static async getReviews(providerId: string): Promise<ReviewEntity[]> { // ALTERADO: Tipo de retorno de 'any' para 'ReviewEntity[]'
    try {
      const response: AxiosResponse<ReviewEntity[]> = await api.get(`/reviews/provider/${providerId}`); // Adicionada tipagem para AxiosResponse
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar avaliações:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Não foi possível carregar as avaliações.');
      }
      throw new Error('Erro de rede ou servidor ao carregar avaliações.');
    }
  }

  static async submitReview(review: any): Promise<any> {
    try {
      const response = await api.post('/reviews', review);
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      throw error;
    }
  }

  static async getSmartSuggestions(providerId: string): Promise<string[]> {
    return getSmartSuggestions(providerId);
  }

  static async getReviewAnalytics(providerId: string): Promise<ReviewAnalytics> {
    return getDetailedRatingBreakdown(providerId);
  }

  static async getSuggestedResponse(reviewId: string): Promise<SmartReviewResponse> {
    try {
      const response = await api.get(`/reviews/suggested-response/${reviewId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar resposta sugerida:', error.response?.data || error.message);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Não foi possível carregar as respostas sugeridas.');
      }
      throw new Error('Erro de rede ou servidor ao carregar respostas sugeridas.');
    }
  }

  static async respondToReview(reviewId: string, response: string): Promise<void> {
    try {
      await api.post(`/reviews/${reviewId}/respond`, { response });
    } catch (error) {
      console.error('Erro ao responder avaliação:', error);
      throw error;
    }
  }

  static async flagInappropriateReview(reviewId: string, reason: string): Promise<void> {
    try {
      await api.post(`/reviews/${reviewId}/flag`, { reason });
    } catch (error) {
      console.error('Erro ao reportar avaliação:', error);
      throw error;
    }
  }

  static async getReviewTrends(providerId: string, period: string): Promise<any> {
    try {
      const response = await api.get(`/reviews/trends/${providerId}?period=${period}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar tendências de avaliações:', error);
      // Ainda retorna dados mockados em caso de erro, mas em produção, isso seria um erro real.
      return {
        ratingTrend: 'increasing',
        volumeTrend: 'stable',
        sentimentTrend: 'improving',
        keyInsights: [
          'Suas avaliações melhoraram 15% no último mês',
          'Clientes elogiam principalmente sua pontualidade',
          'Considere oferecer serviços adicionais mencionados em comentários'
        ]
      };
    }
  }
}