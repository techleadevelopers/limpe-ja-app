import api from './api';

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
      // Em um ambiente de produção "premium", não devemos retornar dados mockados em caso de erro.
      // O erro deve ser propagado para que a UI possa lidar com ele (ex: exibir uma mensagem de erro).
      throw error;
    }
  }

  static async getBusinessInsights(providerId: string, period: 'week' | 'month' | 'quarter'): Promise<BusinessInsights> {
    try {
      const response = await api.get(`/analytics/business/${providerId}?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar insights de negócio:', error);
      // Em um ambiente de produção "premium", não devemos retornar dados mockados em caso de erro.
      // O erro deve ser propagado para que a UI possa lidar com ele (ex: exibir uma mensagem de erro).
      throw error;
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
      throw error; // Propagar o erro para tratamento superior
    }
  }

  static async getCompetitorAnalysis(location: string): Promise<any> {
    try {
      const response = await api.get(`/analytics/competitors?location=${location}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar análise de concorrência:', error);
      // Em um ambiente de produção "premium", não devemos retornar dados mockados em caso de erro.
      // O erro deve ser propagado para que a UI possa lidar com ele (ex: exibir uma mensagem de erro).
      throw error;
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
