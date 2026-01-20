import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchProviders, fetchProviderAvailability, updateProviderAvailability } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

export default function ProviderAvailabilityPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [providerId, setProviderId] = useState('');
  const debouncedProviderId = useDebounce(providerId, 300);

  const { data: providers = [] } = useQuery({ queryKey: ['providers:list'], queryFn: fetchProviders });
  const selected = useMemo(() => providers.find((p: any) => p.id === providerId), [providers, providerId]);
  const { data: availability = [], isFetching } = useQuery({
    queryKey: ['providers:availability', debouncedProviderId],
    enabled: !!debouncedProviderId,
    queryFn: () => fetchProviderAvailability(debouncedProviderId!),
  });

  const mutation = useMutation({
    mutationFn: (data: any[]) => updateProviderAvailability(providerId!, data),
    onSuccess: () => {
      toast({ title: 'Disponibilidade atualizada' });
      queryClient.invalidateQueries({ queryKey: ['providers:availability'] });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e?.message ?? 'Falha ao atualizar', variant: 'destructive' }),
  });

  const toggleDay = (dayOfWeek: number) => {
    const current = availability.slice();
    const idx = current.findIndex((d: any) => d.dayOfWeek === dayOfWeek);
    if (idx >= 0) {
      current[idx] = { ...current[idx], isAvailable: !current[idx].isAvailable };
      mutation.mutate(current);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Disponibilidade do Provedor" subtitle="Edite horários semanais dos provedores." />
        <main className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Provedor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input placeholder="Provider ID" value={providerId} onChange={(e) => setProviderId(e.target.value)} className="max-w-md" />
                <span className="text-sm text-gray-500">ou copie do catálogo de provedores</span>
              </div>
              {!!selected && (
                <div className="text-sm text-gray-600 mt-2">Selecionado: {selected.fullName} ({selected.email})</div>
              )}
            </CardContent>
          </Card>

          {providerId && (
            <Card>
              <CardHeader>
                <CardTitle>Semana {isFetching ? '(carregando...)' : ''}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availability.map((d: any) => (
                    <div key={d.id || d.dayOfWeek} className={`p-3 rounded border ${d.isAvailable ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Dia {d.dayOfWeek}</div>
                          <div className="text-xs text-gray-500">{d.startTime} - {d.endTime}</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => toggleDay(d.dayOfWeek)}>
                          {d.isAvailable ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {availability.length === 0 && <div className="text-gray-500 text-sm">Sem dados de disponibilidade.</div>}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
