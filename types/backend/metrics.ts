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

// Unified client metrics DTO for the app hub (points, bookings, missions, coupons)
export interface ClientMetrics {
  points: {
    balance: number;
    history: Array<{
      id: string;
      type: string;
      points: number;
      referenceId?: string | null;
      createdAt: string;
    }>;
  };
  bookings: {
    total: number;
    completed: number;
    canceled: number;
    upcoming: number;
    monthlyTrend: Array<{
      month: string; // YYYY-MM
      count: number;
    }>;
    latest: Array<{
      id: string;
      status: string;
      scheduledDate: string;
      scheduledTime: string;
      serviceName: string;
      totalPrice: number;
    }>;
  };
  missions: {
    total: number;
    completed: number;
    availableToClaim: number;
    items: any[]; // MissionItem[] (kept as any to avoid cyclic dep in types)
  };
  coupons: {
    active: Array<{ id: string; code: string; description?: string; validUntil: string; value: number; valueType: string }>;
    used: Array<{ id: string; code: string; description?: string; validUntil: string; value: number; valueType: string }>;
  };
}
