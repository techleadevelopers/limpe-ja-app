import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Star, Reply, Search } from 'lucide-react';
import { fetchAllReviews, fetchDetailedRatingBreakdown, fetchSmartSuggestions, respondToReview } from '@/lib/api';

export default function ReviewManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [providerFilter, setProviderFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [respondDialog, setRespondDialog] = useState<{ id: string; open: boolean }>({ id: '', open: false });
  const [responseText, setResponseText] = useState('');

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', providerFilter, clientFilter],
    queryFn: () => fetchAllReviews(providerFilter || undefined, clientFilter || undefined),
  });

  const focusedProviderId = useMemo(() => (reviews.length > 0 ? reviews[0].providerId : providerFilter || ''), [reviews, providerFilter]);
  const { data: breakdown } = useQuery({
    queryKey: ['reviews:breakdown', focusedProviderId],
    enabled: !!focusedProviderId,
    queryFn: () => fetchDetailedRatingBreakdown(focusedProviderId!),
  });
  const { data: suggestions } = useQuery({
    queryKey: ['reviews:suggestions', focusedProviderId],
    enabled: !!focusedProviderId,
    queryFn: () => fetchSmartSuggestions(focusedProviderId!),
  });

  const respondMutation = useMutation({
    mutationFn: (vars: { id: string; message: string }) => respondToReview(vars.id, vars.message),
    onSuccess: () => {
      toast({ title: 'Resposta enviada', description: 'O cliente verá sua resposta em breve.' });
      setRespondDialog({ id: '', open: false });
      setResponseText('');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err?.message ?? 'Falha ao responder avaliação', variant: 'destructive' }),
  });

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return reviews.filter(r =>
      !term || r.comment?.toLowerCase().includes(term) || String(r.rating) === term || r.id.includes(term)
    );
  }, [reviews, search]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Avaliações" subtitle="Gerencie avaliações, responda clientes e acompanhe qualidade." />
        <main className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Lista de Avaliações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative flex-1">
                    <Input placeholder="Buscar por texto, nota ou ID" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <Input placeholder="Filtrar por Provider ID" value={providerFilter} onChange={e => setProviderFilter(e.target.value)} className="w-56" />
                  <Input placeholder="Filtrar por Client ID" value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="w-56" />
                </div>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((r) => (
                      <div key={r.id} className="p-4 rounded border hover:shadow-sm bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="text-yellow-500" size={16} />
                            <span className="font-semibold">{r.rating.toFixed(1)}</span>
                            <span className="text-gray-500 text-sm">• {new Date(r.createdAt).toLocaleString('pt-BR')}</span>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setRespondDialog({ id: r.id, open: true })}>
                            <Reply size={14} className="mr-2" /> Responder
                          </Button>
                        </div>
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{r.comment || '—'}</p>
                      </div>
                    ))}
                    {filtered.length === 0 && (
                      <div className="text-center text-gray-500 py-10">Nenhuma avaliação encontrada.</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="breakdown">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="breakdown">Notas</TabsTrigger>
                    <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
                  </TabsList>
                  <TabsContent value="breakdown" className="mt-4">
                    {!breakdown ? (
                      <div className="text-sm text-gray-500">Selecione um provider para ver o detalhamento.</div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        {Object.entries(breakdown.byStars).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between">
                            <span>{k} estrelas</span>
                            <span className="font-medium">{v}</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t text-gray-700">Média: <span className="font-semibold">{breakdown.average.toFixed(2)}</span></div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="suggestions" className="mt-4">
                    {!suggestions || suggestions.length === 0 ? (
                      <div className="text-sm text-gray-500">Sem sugestões para este provider.</div>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                        {suggestions.map((s, i) => (
                          <li key={i}>{s.text}</li>
                        ))}
                      </ul>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <Dialog open={respondDialog.open} onOpenChange={(open) => setRespondDialog({ id: respondDialog.id, open })}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Responder avaliação</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Textarea placeholder="Escreva sua resposta ao cliente..." value={responseText} onChange={(e) => setResponseText(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setRespondDialog({ id: '', open: false })}>Cancelar</Button>
                  <Button onClick={() => respondMutation.mutate({ id: respondDialog.id, message: responseText })} disabled={!responseText.trim()}>
                    Enviar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

