import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { fetchDataRequests, updateDataRequestStatus } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function DataRequestsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [type, setType] = useState<'EXPORT' | 'DELETION' | 'ALL'>('ALL');
  const [status, setStatus] = useState<string>('');

  const { data: requests = [], isFetching } = useQuery({
    queryKey: ['data-requests', type, status],
    queryFn: () => fetchDataRequests(type === 'ALL' ? undefined : type, status || undefined),
  });

  const mutation = useMutation({
    mutationFn: (vars: { id: string; status: string }) => updateDataRequestStatus(vars.id, vars.status),
    onSuccess: () => {
      toast({ title: 'Atualizado', description: 'Solicitação atualizada.' });
      queryClient.invalidateQueries({ queryKey: ['data-requests'] });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e?.message ?? 'Falha ao atualizar', variant: 'destructive' }),
  });

  const options = useMemo(() => ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'], []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Solicitações de Dados (LGPD)" subtitle="Gerencie exportações e exclusões." />
        <main className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="EXPORT">Exportação</SelectItem>
                    <SelectItem value="DELETION">Exclusão</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Solicitações {isFetching ? '(carregando...)' : `(${requests.length})`}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requests.map((r: any) => (
                  <div key={r.id} className="p-3 bg-white rounded border flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">{r.type} • {r.status}</div>
                      <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString('pt-BR')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(v) => mutation.mutate({ id: r.id, status: v })}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="Alterar status" /></SelectTrigger>
                        <SelectContent>
                          {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={() => mutation.mutate({ id: r.id, status: 'COMPLETED' })}>Concluir</Button>
                    </div>
                  </div>
                ))}
                {requests.length === 0 && <div className="text-gray-500 text-sm">Nenhuma solicitação encontrada.</div>}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

