import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MetricsCards from "@/components/dashboard/metrics-cards";
import RevenueChart from "@/components/dashboard/revenue-chart";
import ProviderMap from "@/components/dashboard/provider-map";
import ProvidersSummary from "@/components/dashboard/providers-summary";
import RecentActivities from "@/components/dashboard/recent-activities";
import VerificationQueueWidget from "@/components/dashboard/verification-queue-widget";
import ConfigUpdates from "@/components/dashboard/config-updates";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetrics } from "@/lib/api";
import type { DashboardMetrics } from "@/lib/types";

export default function Dashboard() {
  const { data: metrics, isLoading, isError, error } = useQuery<DashboardMetrics, Error>({
    queryKey: ["/admin/dashboard/metrics"],
    queryFn: fetchDashboardMetrics,
  });

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />

      <div className="flex-1 ml-72 overflow-hidden">
        <Header
          title="Dashboard Overview"
          subtitle="Bem-vindo de volta! Acompanhe os principais indicadores."
        />

        <main className="flex-1 overflow-y-auto p-8">
          {/* Linha 1 — KPIs principais */}
          {isLoading ? (
            <div className="grid grid-cols-12 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl col-span-12 md:col-span-6 xl:col-span-3" />
              ))}
            </div>
          ) : isError ? (
            <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600">
              <p>Erro ao carregar métricas do dashboard: {error?.message}</p>
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-12 gap-6 mb-8">
              <div className="col-span-12">
                <MetricsCards metrics={metrics} />
              </div>
            </div>
          ) : null}

          {/* Linha 2 — Receita + Resumo de Provedores */}
          <div className="grid grid-cols-12 gap-6 mb-8">
            <div className="col-span-12 xl:col-span-7">
              <RevenueChart />
            </div>
            <div className="col-span-12 xl:col-span-5">
              <ProvidersSummary />
            </div>
          </div>

          {/* Linha 3 — Mapa de Provedores em destaque */}
          <div className="grid grid-cols-12 gap-6 mb-8">
            <div className="col-span-12">
              <ProviderMap height={460} />
            </div>
          </div>

          {/* Linha 4 — Extras/Operações */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 xl:col-span-8">
              <RecentActivities />
            </div>
            <div className="col-span-12 lg:col-span-4 xl:col-span-4 space-y-6">
              <VerificationQueueWidget />
              <ConfigUpdates />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
