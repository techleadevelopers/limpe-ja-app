// LimpeJaApp/app/services/metricsService.ts
import axios from 'axios';
import { MetricsSummary, MetricsTimeseriesDataPoint, MetricsFunnel, ClientMetrics } from '../types/backend/metrics';
import { api } from './api';
import { createLocalConsole } from './logging';
const console = createLocalConsole(); // Importa a instância centralizada do Axios
import Constants from 'expo-constants'; // Importar Constants para API_BASE_URL consistente
import { getBookingsForUser } from './bookingService';
import { BookingDetails, BookingStatus } from '../types/backend/bookings';
import { getMyLoyaltyBalance, getMyLoyaltyHistory, LoyaltyBalance, LoyaltyHistoryItem } from './loyaltyService';
import { getMyMissions } from './missionService';
import type { MissionItem } from './missionService';
import { getMyCoupons, MyCouponListItem } from './couponService';

// A API_BASE_URL deve ser carregada de Constants para consistência em produção e desenvolvimento
const API_BASE_URL = Constants.expoConfig?.extra?.backendApiUrl as string;

// Validação para garantir que API_BASE_URL está definida
if (!API_BASE_URL) {
    console.error('[metricsService] Erro crítico: backendApiUrl não está  definido!');
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

    /**
     * Aggregated Client Metrics (points, bookings, missions, coupons).
     */
    async getClientMetrics(): Promise<ClientMetrics> {
        // Simple retry helper (2 attempts)
        const retry = async <T>(fn: () => Promise<T>, attempts = 2): Promise<T> => {
            let lastErr: any;
            for (let i = 0; i < attempts; i++) {
                try { return await fn(); } catch (e) {
                    lastErr = e;
                    if (i < attempts - 1) await new Promise(r => setTimeout(r, 300 * (i + 1)));
                }
            }
            throw lastErr;
        };

        const [bookingsRes, loyaltyBalRes, loyaltyHistRes, missionsRes, couponsRes] = await Promise.all([
            retry(() => getBookingsForUser()).catch(() => [] as BookingDetails[]),
            retry(() => getMyLoyaltyBalance()).catch(() => ({ currentPoints: 0 } as LoyaltyBalance)),
            retry(() => getMyLoyaltyHistory()).catch(() => [] as LoyaltyHistoryItem[]),
            retry(() => getMyMissions()).catch(() => [] as MissionItem[]),
            retry(() => getMyCoupons()).catch(() => [] as MyCouponListItem[]),
        ]);

        // Bookings aggregation
        const allBookings = (bookingsRes || []) as BookingDetails[];
        const isFuture = (b: BookingDetails) => {
            const dateStr = `${b.scheduledDate}${b.scheduledTime ? `T${b.scheduledTime}` : 'T00:00'}`;
            const d = new Date(dateStr);
            return d.getTime() > Date.now();
        };
        const total = allBookings.length;
        const completed = allBookings.filter(b => b.status === BookingStatus.FINISHED).length;
        const canceled = allBookings.filter(b => b.status === BookingStatus.CANCELED).length;
        const upcoming = allBookings.filter(b => isFuture(b) && ![BookingStatus.CANCELED, BookingStatus.FINISHED, BookingStatus.REJECTED].includes(b.status)).length;

        const trendMap: Record<string, number> = {};
        for (const b of allBookings) {
            const month = (b.scheduledDate || '').slice(0, 7);
            if (month) trendMap[month] = (trendMap[month] || 0) + 1;
        }
        const monthlyTrend = Object.keys(trendMap).sort().map(m => ({ month: m, count: trendMap[m] }));

        const latest = allBookings
            .slice()
            .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
            .slice(0, 5)
            .map(b => ({
                id: b.id,
                status: b.status,
                scheduledDate: b.scheduledDate,
                scheduledTime: b.scheduledTime,
                serviceName: b.serviceName,
                totalPrice: b.totalPrice,
            }));

        // Points aggregation
        const balance = (loyaltyBalRes as LoyaltyBalance)?.currentPoints ?? 0;
        const history = (loyaltyHistRes as LoyaltyHistoryItem[]).slice(0, 10);

        // Missions aggregation
        const missionItems = (missionsRes as MissionItem[]) || [];
        const missionsTotal = missionItems.length;
        const missionsCompleted = missionItems.filter((m: any) => (m?.progress?.status === 'COMPLETED' || m?.progress?.status === 'CLAIMED')).length;
        const missionsAvailableToClaim = missionItems.filter((m: any) => m?.canClaim).length;

        // Coupons aggregation
        const allCoupons = (couponsRes as MyCouponListItem[]) || [];
        const active = allCoupons.filter(c => (c.status || '').toUpperCase() === 'ACTIVE');
        const used = allCoupons.filter(c => (c.status || '').toUpperCase() === 'USED');

        const result: ClientMetrics = {
            points: { balance, history },
            bookings: { total, completed, canceled, upcoming, monthlyTrend, latest },
            missions: { total: missionsTotal, completed: missionsCompleted, availableToClaim: missionsAvailableToClaim, items: missionItems },
            coupons: { active, used },
        };

        return result;
    },};


