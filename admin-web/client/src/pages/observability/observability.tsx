import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Activity, Server, Users, ShieldCheck } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAdminHealth } from "@/lib/api";
import type {
  ObservabilityHealthPayload,
  ObservabilitySentryData,
  ObservabilitySentryError,
  ObservabilityLatencyPoint,
  ObservabilitySentryIssue,
} from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

const timeLabel = (value: string) =>
  new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatLatency = (value?: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value.toFixed(0)} ms`;
  }

  return "0 ms";
};

const isSentryData = (
  value?: ObservabilitySentryData | ObservabilitySentryError,
): value is ObservabilitySentryData => {
  return Boolean(value && "totalUnresolved" in value);
};

export default function ObservabilityPage() {
  const { data, isLoading, isError, error } = useQuery<
    ObservabilityHealthPayload,
    Error
  >({
    queryKey: ["/admin/health"],
    queryFn: fetchAdminHealth,
    refetchInterval: 10_000,
    refetchOnWindowFocus: false,
  });

 const chartData = useMemo(() => {
  // Garanta que latencySeries existe antes de mapear
  return data?.latencySeries?.map((point) => ({
    label: timeLabel(point.timestamp),
    latency: point.latencyMs ?? 0,
  })) ?? [];
}, [data]);

  const systemStatusUp = data?.db?.status === "up";
  const sentryInfo = data?.sentry;
  const sentryData = sentryInfo && isSentryData(sentryInfo) ? sentryInfo : undefined;
  const sentryError =
    sentryInfo && !isSentryData(sentryInfo) ? sentryInfo.error : undefined;
  const hasSentryData = Boolean(sentryData);

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />

      <div className="flex-1 ml-72 overflow-hidden">
        <Header
          title="Observabilidade"
          subtitle="Monitoramento em tempo real da saúde da API, do Sentry e da experiência dos usuários."
        />

        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          {isError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
              Erro ao carregar o painel de observabilidade: {error?.message}
            </div>
          )}

          <section className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-6 xl:col-span-3">
              <div
                className={cn(
                  systemStatusUp
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-red-200 bg-red-50 text-red-900",
                  "flex flex-col gap-2 rounded-2xl border p-5 shadow-sm",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold uppercase tracking-wide">
                    Status do Sistema
                  </div>
                  <Server className="h-5 w-5" />
                </div>
                <p className="text-3xl font-semibold">
                  {systemStatusUp ? "Online" : "Degradado"}
                </p>
                <p className="text-sm text-gray-600">
                  Latência API: {formatLatency(data?.apiLatencyMs)}
                </p>
                <p className="text-sm text-gray-600">
                  Latência DB: {formatLatency(data?.db?.latencyMs)}
                </p>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    Heap (Uso / Total)
                  </p>
                  <p className="text-sm font-mono font-semibold">
                    {(data?.memory?.heapUsedMb ?? 0).toFixed(2)} /{" "}
                    {(data?.memory?.heapTotalMb ?? 0).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    RSS (Total Processo)
                  </p>
                  <p className="text-sm font-mono font-semibold">
                    {(data?.memory?.rssMb ?? 0).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>

            <div className="col-span-12 md:col-span-6 xl:col-span-3">
              <div className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold uppercase tracking-wide">
                    Crashes (Sentry)
                  </div>
                  <Activity className="h-5 w-5 text-pink-500" />
                </div>
                <p className="text-3xl font-semibold">
                  {hasSentryData
                    ? sentryData?.totalUnresolved
                    : sentryError
                    ? "Erro"
                    : "—"}
                </p>
                <div className="text-sm text-gray-600">
                  <div>
                    Android: {hasSentryData ? sentryData?.byPlatform.android : "—"}
                  </div>
                  <div>
                    iOS: {hasSentryData ? sentryData?.byPlatform.ios : "—"}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Tempo de sincronização: {formatLatency(data?.sentryLatencyMs)}
                </p>
                {sentryError ? (
                  <p className="text-xs text-red-500">
                    {sentryError.statusCode
                      ? `Sentry respondeu ${sentryError.statusCode}`
                      : "Falha ao autenticar no Sentry."}
                  </p>
                ) : !hasSentryData ? (
                  <p className="text-xs text-gray-400">
                    Configure o token da API do Sentry para enxergar dados reais.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Dados sincronizados nas últimas 24h.
                  </p>
                )}
              </div>
            </div>

            {/* BLOCO USUÁRIOS ONLINE */}
            <div className="col-span-12 md:col-span-6 xl:col-span-3">
              <div className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold uppercase tracking-wide">
                    Usuários Online
                  </div>
                  <Users className="h-5 w-5 text-sky-500" />
                </div>
                <p className="text-3xl font-semibold">
                  {/* Garante que se 'data' for nulo, exibe "—" em vez de quebrar */}
                  {data?.activeSessions ?? "—"}
                </p>
                <p className="text-xs text-gray-500">
                  Estimativa via Redis / Websockets
                </p>
              </div>
            </div>

            {/* BLOCO CONVERSÃO DE SEGURO */}
            <div className="col-span-12 md:col-span-6 xl:col-span-3">
              <div className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold uppercase tracking-wide">
                    Conversão de Seguro
                  </div>
                  <ShieldCheck className="h-5 w-5 text-indigo-500" />
                </div>
                <p className="text-3xl font-semibold">
                  {/* O uso de ?. evita erro se insuranceConversion não existir */}
                  {data?.insuranceConversion?.insuredRate !== undefined
                    ? `${percentFormatter.format(
                        data.insuranceConversion.insuredRate,
                      )}%`
                    : "—"}
                </p>
                <p className="text-sm text-gray-600">
                  Serviços encerrados com seguro de R$ 59, 99 ou 199
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-12 gap-6">
            <div className="col-span-12 xl:col-span-8">
              <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide">
                      Gráfico de Latência
                    </p>
                    <p className="text-xs text-gray-500">
                      Tempo de resposta da rota /search nas últimas horas
                    </p>
                  </div>
                </div>
                <div className="mt-6 h-64">
                  {isLoading ? (
                    <Skeleton className="h-full rounded-2xl" />
                  ) : chartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      Sem amostras de latência registradas.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          domain={["dataMin", "dataMax"]}
                          tickFormatter={(value) => `${value} ms`}
                        />
                        <Tooltip
  formatter={(value: number) => [`${(Number(value) || 0).toFixed(1)} ms`, "Latência"]}
  labelFormatter={(label) => `Hora: ${label}`}
/>
                        <Line
                          type="monotone"
                          dataKey="latency"
                          stroke="#14b8a6"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-12 xl:col-span-4">
              <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-wide">
                    Logs de Erro
                  </p>
                </div>
                <div className="mt-4 space-y-4 overflow-y-auto">
                  {hasSentryData && sentryData?.recentIssues?.length ? (
                    sentryData?.recentIssues?.map((issue: ObservabilitySentryIssue) => (
                      <div
                        key={issue.id}
                        className="space-y-1 rounded-xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <p className="text-sm font-semibold text-gray-800">
                          {issue.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          Plataforma: {issue.platform} · Última ocorrência:{" "}
                          {timeLabel(issue.lastSeen)}
                        </p>
                        {issue.stackTrace && (
                          <details className="mt-2 text-xs text-gray-500">
                            <summary className="cursor-pointer hover:text-gray-700">
                              Ver stack trace
                            </summary>
                            <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-2 text-[11px] text-gray-600">
                              {issue.stackTrace}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))
                  ) : sentryError ? (
                    <p className="text-sm text-red-500">
                      {sentryError.statusCode
                        ? `Erro ${sentryError.statusCode}: ${sentryError.message}`
                        : `Erro: ${sentryError.message}`}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Nenhum erro não resolvido disponível no momento.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
