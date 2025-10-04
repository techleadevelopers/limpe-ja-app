import { api } from './api';

interface SmartSuggestion {
  id: string;
  type: 'pricing' | 'scheduling' | 'service_improvement' | 'customer_retention';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: string;
  actionRequired: boolean;
}

interface CustomerInsight {
  totalCustomers: number;
  repeatCustomers: number;
  averageRating: number;
  popularServices: string[];
  peakHours: string[];
  suggestions: string[];
}

export class AISuggestionsService {
  static async getSmartSuggestions(providerId: string): Promise<SmartSuggestion[]> {
    try {
      const response = await api.get(`/suggestions/provider/${providerId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar sugestões inteligentes:', error);
      // Em um ambiente de produção "premium", não devemos retornar dados mockados em caso de erro.
      // O erro deve ser propagado para que a UI possa lidar com ele (ex: exibir uma mensagem de erro).
      throw error;
    }
  }

  static async getCustomerInsights(providerId: string): Promise<CustomerInsight> {
    try {
      const response = await api.get(`/insights/customer/${providerId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar insights de clientes:', error);
      // Em um ambiente de produção "premium", não devemos retornar dados mockados em caso de erro.
      // O erro deve ser propagado para que a UI possa lidar com ele (ex: exibir uma mensagem de erro).
      throw error;
    }
  }

  static async getMarketTrends(): Promise<any> {
    try {
      const response = await api.get('/insights/market-trends');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar tendências de mercado:', error);
      // Em um ambiente de produção "premium", não devemos retornar dados mockados em caso de erro.
      // O erro deve ser propagado para que a UI possa lidar com ele (ex: exibir uma mensagem de erro).
      throw error;
    }
  }
}
