import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MetricsCards from "@/components/dashboard/metrics-cards";
import RevenueChart from "@/components/dashboard/revenue-chart";
import ProviderMap from "@/components/dashboard/provider-map";
import RecentActivities from "@/components/dashboard/recent-activities";
import VerificationQueueWidget from "@/components/dashboard/verification-queue-widget";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetrics } from "@/lib/api";
import type { DashboardMetrics } from "@/lib/types";

export default function Dashboard() {
  const { data: metrics, isLoading, isError, error } = useQuery<DashboardMetrics, Error>({
    queryKey: ['/admin/dashboard/metrics'],
    queryFn: fetchDashboardMetrics,
  });

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />

      <div className="flex-1 ml-72 overflow-hidden">
        <Header
          title="Dashboard Overview"
          subtitle="Welcome back! Here's what's happening with LimpeJǭ today."
        />

        <main className="flex-1 overflow-y-auto p-8">
          {/* Metrics Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600">
              <p>Erro ao carregar métricas do dashboard: {error?.message}</p>
            </div>
          ) : metrics ? (
            <MetricsCards metrics={metrics} />
          ) : null}

          {/* Charts and Map Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <RevenueChart />
            <ProviderMap />
          </div>

          {/* Recent Activities and Verification Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <RecentActivities />
            <VerificationQueueWidget />
          </div>
        </main>
      </div>
    </div>
  );
}
