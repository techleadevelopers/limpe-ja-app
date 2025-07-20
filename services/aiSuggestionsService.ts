
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
      
      // Fallback com sugestões mockadas
      return [
        {
          id: '1',
          type: 'pricing',
          title: 'Otimização de Preços',
          description: 'Seus preços estão 15% abaixo da média local. Considere aumentar gradualmente.',
          priority: 'high',
          expectedImpact: '+23% receita mensal',
          actionRequired: true
        },
        {
          id: '2',
          type: 'scheduling',
          title: 'Horários de Pico',
          description: 'Ofereça descontos para horários menos populares (14h-16h).',
          priority: 'medium',
          expectedImpact: '+30% reservas',
          actionRequired: false
        },
        {
          id: '3',
          type: 'service_improvement',
          title: 'Novo Serviço Sugerido',
          description: 'Alta demanda por "Limpeza Pós-Obra" na sua região.',
          priority: 'high',
          expectedImpact: '+40% clientes novos',
          actionRequired: true
        }
      ];
    }
  }

  static async getCustomerInsights(providerId: string): Promise<CustomerInsight> {
    try {
      const response = await api.get(`/insights/customer/${providerId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar insights de clientes:', error);
      
      return {
        totalCustomers: 127,
        repeatCustomers: 89,
        averageRating: 4.7,
        popularServices: ['Limpeza Residencial', 'Limpeza Pesada'],
        peakHours: ['09:00-11:00', '14:00-16:00'],
        suggestions: [
          'Implemente um programa de fidelidade',
          'Ofereça pacotes mensais com desconto',
          'Envie lembretes proativos para clientes inativos'
        ]
      };
    }
  }

  static async getMarketTrends(): Promise<any> {
    try {
      const response = await api.get('/insights/market-trends');
      return response.data;
    } catch (error) {
      return {
        growingServices: ['Limpeza Ecológica', 'Sanitização'],
        seasonalTrends: 'Dezembro: +45% demanda limpeza pré-festas',
        competitorAnalysis: 'Você está 20% mais competitivo que a média'
      };
    }
  }
}
