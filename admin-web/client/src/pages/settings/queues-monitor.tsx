import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { fetchQueueStatus, fetchQueueJobs, retryQueueJob } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function QueuesMonitorPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [queueName, setQueueName] = useState<string>('');
  const [jobStatus, setJobStatus] = useState<string>('');

  const { data: queues = [] } = useQuery({ queryKey: ['queues:status'], queryFn: fetchQueueStatus });
  const { data: jobs = [], isFetching } = useQuery({
    queryKey: ['queues:jobs', queueName, jobStatus],
    enabled: !!queueName,
    queryFn: () => fetchQueueJobs(queueName!, jobStatus || undefined),
  });

  const retryMutation = useMutation({
    mutationFn: (vars: { queue: string; id: string }) => retryQueueJob(vars.queue, vars.id),
    onSuccess: () => {
      toast({ title: 'Reagendado', description: 'Job reenfileirado com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['queues:jobs'] });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e?.message ?? 'Falha ao reenfileirar job', variant: 'destructive' }),
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Filas e Workers" subtitle="Monitore filas, jobs e reexecute quando necessário." />
        <main className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {queues.map((q: any) => (
                  <div key={q.name} className="p-3 bg-white rounded border">
                    <div className="font-medium text-gray-900">{q.name}</div>
                    <div className="text-xs text-gray-500">waiting: {q.waiting} • active: {q.active} • failed: {q.failed}</div>
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => setQueueName(q.name)}>Ver jobs</Button>
                  </div>
                ))}
                {queues.length === 0 && <div className="text-gray-500 text-sm">Nenhuma fila encontrada.</div>}
              </div>
            </CardContent>
          </Card>

          {queueName && (
            <Card>
              <CardHeader>
                <CardTitle>Jobs de {queueName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <Select value={jobStatus} onValueChange={setJobStatus}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="waiting">waiting</SelectItem>
                      <SelectItem value="active">active</SelectItem>
                      <SelectItem value="failed">failed</SelectItem>
                      <SelectItem value="completed">completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['queues:jobs'] })} disabled={isFetching}>Atualizar</Button>
                </div>
                <div className="space-y-2">
                  {jobs.map((j: any) => (
                    <div key={j.id} className="p-3 bg-white rounded border flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">{j.name} • {j.status}</div>
                        <div className="text-xs text-gray-500">{new Date(j.createdAt).toLocaleString('pt-BR')}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => retryMutation.mutate({ queue: queueName, id: j.id })}>Reexecutar</Button>
                      </div>
                    </div>
                  ))}
                  {jobs.length === 0 && <div className="text-gray-500 text-sm">Nenhum job encontrado.</div>}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

