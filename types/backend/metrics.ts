// LimpeJaApp/app/types/backend/metrics.ts
export interface MetricsSummary {
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    completedMissions: number;
    pendingMissions: number;
}

export interface MetricsTimeseriesDataPoint {
    date: string;
    bookings: number;
    revenue: number;
}

export interface MetricsFunnelStep {
    name: string;
    count: number;
    percentage: number;
}

export interface MetricsFunnel {
    steps: MetricsFunnelStep[];
}