import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPricingHistory, PricingAuditEvent } from "@/lib/api";

export default function ConfigUpdates() {
  const [filter, setFilter] = useState<"all" | "create" | "update" | "delete">("all");
  const [period, setPeriod] = useState<"all" | "24h" | "7d" | "30d">("all");
  const [cursor, setCursor] = useState<number | null>(0);
  const [events, setEvents] = useState<PricingAuditEvent[]>([]);

  const { data } = useQuery<{ items: PricingAuditEvent[]; nextCursor: number | null}>({
    queryKey: ["config-updates", filter, cursor],
    queryFn: () => fetchPricingHistory(20, cursor ?? 0),
    enabled: cursor !== null,
  });

  useEffect(() => {
    if (data?.items) {
      setEvents(prev => [...prev, ...data.items]);
      setCursor(data.nextCursor);
    }
  }, [data]);

  const filtered = useMemo(() => {
    const byAction = filter === "all" ? events : events.filter(ev => ev.action === filter);
    if (period === "all") return byAction;
    const now = Date.now();
    const msWindow = period === "24h" ? 24*3600*1000 : period === "7d" ? 7*24*3600*1000 : 30*24*3600*1000;
    return byAction.filter(ev => {
      const t = new Date(ev.at).getTime();
      return Number.isFinite(t) && (now - t) <= msWindow;
    });
  }, [events, filter, period]);

  const resetAndFilter = (value: "all" | "create" | "update" | "delete") => {
    setEvents([]);
    setCursor(0);
    setFilter(value);
  };

  return (
    <Card className="shadow-floating border-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Atualizações de Configuração</CardTitle>
        <div className="flex gap-3">
          <div className="w-40">
            <Select value={filter} onValueChange={(v: any) => resetAndFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="create">Criadas</SelectItem>
                <SelectItem value="update">Atualizadas</SelectItem>
                <SelectItem value="delete">Excluídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-36">
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {filtered.map(ev => (
            <div key={ev.id} className="rounded-lg border border-gray-100 p-3 bg-white">
              <div className="text-xs text-gray-500">{new Date(ev.at).toLocaleString()} — {ev.actorUserId}</div>
              <div className="text-sm font-medium">{ev.action.toUpperCase()}</div>
              <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <pre className="text-[10px] bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(ev.ruleBefore ?? null, null, 2)}</pre>
                <pre className="text-[10px] bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(ev.ruleAfter ?? null, null, 2)}</pre>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-gray-500">Sem eventos para este filtro.</div>
          )}
          {cursor !== null && (
            <button onClick={() => setCursor(cursor ?? 0)} className="text-xs text-medium-blue hover:underline">Carregar mais</button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
