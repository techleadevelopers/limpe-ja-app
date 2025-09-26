// LimpeJaApp/app/services/metricsService.ts
import axios from 'axios';
import { MetricsSummary, MetricsTimeseriesDataPoint, MetricsFunnel } from '../types/backend/metrics';
import api from './api'; // Importa a instância centralizada do Axios
import Constants from 'expo-constants'; // Importar Constants para API_BASE_URL consistente

// A API_BASE_URL deve ser carregada de Constants para consistência em produção
const API_BASE_URL = Constants.expoConfig?.extra?.backendApiUrl as string;

// Validação para garantir que API_BASE_URL está definida
if (!API_BASE_URL) {
  console.error('[metricsService] Erro crítico: backendApiUrl não está definido!');
  // Em um ambiente de produção, você pode querer lançar um erro ou ter um fallback mais robusto
}


export const metricsService = {
    /**
     * Fetches a summary of client metrics.
     * @returns {Promise<MetricsSummary>} A promise that resolves to the metrics summary.
     */
    async getMetricsSummary(): Promise<MetricsSummary> {
        try {
            // Usa a instância 'api' centralizada para todas as requisições
            const response = await api.get(`/v1/metrics/me/summary`);
            return response.data;
        } catch (error) {
            console.error('Error fetching metrics summary:', error);
            // Em um ambiente de produção "premium", não devemos retornar dados mockados em caso de erro.
            // O erro deve ser propagado para que a UI possa lidar com ele (ex: exibir uma mensagem de erro).
            throw error;
        }
    },

    /**
     * Fetches timeseries data for client metrics over a specified period.
     * @param {'day' | 'week' | 'month' | 'year'} period - The period for which to fetch timeseries data.
     * @returns {Promise<MetricsTimeseriesDataPoint[]>} A promise that resolves to an array of timeseries data points.
     */
    async getMetricsTimeseries(period: 'day' | 'week' | 'month' | 'year'): Promise<MetricsTimeseriesDataPoint[]> {
        try {
            // Usa a instância 'api' centralizada para todas as requisições
            const response = await api.get(`/v1/metrics/me/timeseries`, {
                params: { period },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching metrics timeseries:', error);
            // Em um ambiente de produção "premium", não devemos retornar dados mockados em caso de erro.
            // O erro deve ser propagado para que a UI possa lidar com ele (ex: exibir uma mensagem de erro).
            throw error;
        }
    },

    /**
     * Fetches conversion funnel data for client metrics.
     * @returns {Promise<MetricsFunnel>} A promise that resolves to the conversion funnel data.
     */
    async getMetricsFunnel(): Promise<MetricsFunnel> {
        try {
            // Usa a instância 'api' centralizada para todas as requisições
            const response = await api.get(`/v1/metrics/me/funnel`);
            return response.data;
        } catch (error) {
            console.error('Error fetching metrics funnel:', error);
            // Em um ambiente de produção "premium", não devemos retornar dados mockados em caso de erro.
            // O erro deve ser propagado para que a UI possa lidar com ele (ex: exibir uma mensagem de erro).
            throw error;
        }
    },
};