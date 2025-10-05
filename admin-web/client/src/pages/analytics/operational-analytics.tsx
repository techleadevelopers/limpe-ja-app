import React from 'react';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardMetrics } from '@/lib/api';

export default function OperationalAnalyticsPage() {
  const { data } = useQuery({ queryKey: ['dashboard:metrics'], queryFn: fetchDashboardMetrics });
  const k = data?.kpis || {} as any;
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Analytics Operacionais" subtitle="KPIs operacionais e saúde da plataforma." />
        <main className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-sm">
              <CardHeader><CardTitle>Bookings • Hoje</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-semibold">{k?.bookingsToday ?? '—'}</div></CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader><CardTitle>Cancelamentos • Mês</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-semibold">{k?.cancellationsThisMonth ?? '—'}</div></CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader><CardTitle>Taxa de Aceitação</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-semibold">{k?.acceptanceRate ?? '—'}%</div></CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

