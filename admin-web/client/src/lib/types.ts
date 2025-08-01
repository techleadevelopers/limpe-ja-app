export interface DashboardMetrics {
  activeUsers: number;
  approvedProviders: number;
  servicesBooked: number;
  totalRevenue: number;
  pendingVerifications: number;
}

export interface ActivityWithRelative extends Activity {
  relativeTime: string;
}

export interface ProviderWithRelative extends Provider {
  relativeTime: string;
}

import type { Provider, Activity } from "@shared/schema";
