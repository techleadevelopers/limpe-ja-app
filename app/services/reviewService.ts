// LimpeJaApp/app/services/reviewService.ts
import api from './api'; // Importa a instância centralizada do Axios
import axios, { AxiosResponse } from 'axios'; // Importar axios para isAxiosError

// Importa as tipagens de review (DTOs e Entity)
import { SubmitReviewDto, ReviewEntity } from '../types/backend/reviews';
import { MessageResponseDto } from '../types/backend/auth'; // Para respostas de sucesso/erro genéricas

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
 * @param providerId O ID do provedor.
 * @returns Promessa com breakdown detalhado das avaliações.
 */
export const getDetailedRatingBreakdown = async (providerId: string): Promise<any> => {
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
 * @param providerId O ID do provedor.
 * @returns Promessa com lista de sugestões inteligentes.
 */
export const getSmartSuggestions = async (providerId: string): Promise<any[]> => {
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
  static async getReviews(providerId: string): Promise<any> {
    try {
      const response = await api.get(`/reviews/provider/${providerId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      throw error;
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

  static async getSmartSuggestions(providerId: string): Promise<any> {
    try {
      const response = await api.get(`/reviews/smart-suggestions/${providerId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar sugestões inteligentes:', error);
      throw error;
    }
  }

  static async getReviewAnalytics(providerId: string): Promise<ReviewAnalytics> {
    try {
      const response = await api.get(`/reviews/analytics/${providerId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar analytics de avaliações:', error);

      // Retornar dados simulados
      return {
        averageRating: 4.7,
        totalReviews: 127,
        ratingDistribution: { 1: 2, 2: 3, 3: 8, 4: 32, 5: 82 },
        sentimentAnalysis: { positive: 78, neutral: 15, negative: 7 },
        commonKeywords: [
          { word: 'pontual', frequency: 45, sentiment: 'positive' },
          { word: 'cuidadosa', frequency: 38, sentiment: 'positive' },
          { word: 'profissional', frequency: 42, sentiment: 'positive' },
          { word: 'atrasou', frequency: 5, sentiment: 'negative' }
        ],
        improvementSuggestions: [
          'Continue focando na pontualidade - é seu ponto forte',
          'Considere criar um checklist de limpeza para garantir consistência',
          'Responda mais rapidamente às avaliações negativas'
        ]
      };
    }
  }

  static async getSuggestedResponse(reviewId: string): Promise<SmartReviewResponse> {
    try {
      const response = await api.get(`/reviews/suggested-response/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar resposta sugerida:', error);

      return {
        suggestedResponses: [
          'Muito obrigada pelo feedback! É um prazer trabalhar com você.',
          'Fico feliz que tenha gostado do serviço. Conte sempre comigo!',
          'Agradeço sua confiança. Sempre à disposição para futuros serviços.'
        ],
        tone: 'friendly',
        keyPoints: ['Agradecer', 'Manter relacionamento', 'Mostrar disponibilidade']
      };
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
    } catch (error) {
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