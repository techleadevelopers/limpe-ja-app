
import { api } from './api';

interface PerformanceMetrics {
  responseTime: number;
  completionRate: number;
  customerSatisfaction: number;
  repeatCustomerRate: number;
  revenueGrowth: number;
  ranking: number;
}

interface BusinessInsights {
  totalRevenue: number;
  totalBookings: number;
  averageJobValue: number;
  peakDays: string[];
  topServices: Array<{
    name: string;
    bookings: number;
    revenue: number;
  }>;
  customerRetention: number;
  recommendations: string[];
}

export class AnalyticsService {
  static async getPerformanceMetrics(providerId: string): Promise<PerformanceMetrics> {
    try {
      const response = await api.get(`/analytics/performance/${providerId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar métricas de performance:', error);
      
      // Retornar métricas simuladas para desenvolvimento
      return {
        responseTime: 12, // minutos
        completionRate: 94.5,
        customerSatisfaction: 4.7,
        repeatCustomerRate: 68,
        revenueGrowth: 23.5,
        ranking: 8
      };
    }
  }

  static async getBusinessInsights(providerId: string, period: 'week' | 'month' | 'quarter'): Promise<BusinessInsights> {
    try {
      const response = await api.get(`/analytics/business/${providerId}?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar insights de negócio:', error);
      
      return {
        totalRevenue: 3450.00,
        totalBookings: 28,
        averageJobValue: 123.21,
        peakDays: ['Sábado', 'Domingo', 'Segunda'],
        topServices: [
          { name: 'Limpeza Residencial', bookings: 18, revenue: 2160.00 },
          { name: 'Limpeza Pesada', bookings: 7, revenue: 980.00 },
          { name: 'Limpeza Comercial', bookings: 3, revenue: 310.00 }
        ],
        customerRetention: 72,
        recommendations: [
          'Foque em limpezas pesadas para aumentar ticket médio',
          'Ofereça pacotes semanais para melhorar retenção',
          'Considere expandir para limpeza comercial'
        ]
      };
    }
  }

  static async trackEvent(event: string, properties?: Record<string, any>): Promise<void> {
    try {
      await api.post('/analytics/events', {
        event,
        properties,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao rastrear evento:', error);
    }
  }

  static async getCompetitorAnalysis(location: string): Promise<any> {
    try {
      const response = await api.get(`/analytics/competitors?location=${location}`);
      return response.data;
    } catch (error) {
      return {
        averagePrice: 89.50,
        marketShare: 12.3,
        competitorCount: 47,
        yourPosition: 8,
        suggestions: [
          'Seus preços estão competitivos',
          'Considere expandir para bairros vizinhos',
          'Foque em diferenciação por qualidade'
        ]
      };
    }
  }

  static async generateReport(type: 'monthly' | 'quarterly', providerId: string): Promise<any> {
    try {
      const response = await api.get(`/analytics/reports/${type}/${providerId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }
}
