import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MetricsCards from "@/components/dashboard/metrics-cards";
import RevenueChart from "@/components/dashboard/revenue-chart";
import ProviderMap from "@/components/dashboard/provider-map";
import RecentActivities from "@/components/dashboard/recent-activities";
import VerificationQueueWidget from "@/components/dashboard/verification-queue-widget";
import { Skeleton } from "@/components/ui/skeleton";
import { mockDashboardMetrics } from "@/data/mockData";

export default function Dashboard() {
  const [metrics, setMetrics] = useState(mockDashboardMetrics);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      
      <div className="flex-1 ml-72 overflow-hidden">
        <Header 
          title="Dashboard Overview"
          subtitle="Welcome back! Here's what's happening with LimpeJá today."
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Metrics Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : metrics ? (
            <MetricsCards metrics={metrics} />
          ) : null}

          {/* Charts and Map Section */}
          {/* CORREÇÃO AQUI: Garante um layout de grade consistente */}
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