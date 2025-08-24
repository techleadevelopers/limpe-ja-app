// LimpeJaApp/app/services/metricsService.ts
import axios from 'axios';
import { MetricsSummary, MetricsTimeseriesDataPoint, MetricsFunnel } from '../types/backend/metrics';

// Replace with your actual API base URL. It's recommended to use environment variables.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'; 

export const metricsService = {
    /**
     * Fetches a summary of client metrics.
     * @returns {Promise<MetricsSummary>} A promise that resolves to the metrics summary.
     */
    async getMetricsSummary(): Promise<MetricsSummary> {
        try {
            const response = await axios.get(`${API_BASE_URL}/v1/metrics/me/summary`);
            return response.data;
        } catch (error) {
            console.error('Error fetching metrics summary:', error);
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
            const response = await axios.get(`${API_BASE_URL}/v1/metrics/me/timeseries`, {
                params: { period },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching metrics timeseries:', error);
            throw error;
        }
    },

    /**
     * Fetches conversion funnel data for client metrics.
     * @returns {Promise<MetricsFunnel>} A promise that resolves to the conversion funnel data.
     */
    async getMetricsFunnel(): Promise<MetricsFunnel> {
        try {
            const response = await axios.get(`${API_BASE_URL}/v1/metrics/me/funnel`);
            return response.data;
        } catch (error) {
            console.error('Error fetching metrics funnel:', error);
            throw error;
        }
    },
};