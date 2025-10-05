import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchChatLogs } from '@/lib/api';
import { Search } from 'lucide-react';

export default function ChatMonitoringPage() {
  const [chatId, setChatId] = useState('');
  const [term, setTerm] = useState('');
  const [limit, setLimit] = useState(100);

  const { data: logs = [], refetch, isFetching } = useQuery({
    queryKey: ['chat-logs', chatId, term, limit],
    queryFn: () => fetchChatLogs(chatId || undefined, term || undefined, limit),
  });

  const ordered = useMemo(() => logs.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [logs]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Monitor de Chats" subtitle="Investigue conversas para auditoria e suporte." />
        <main className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input placeholder="Chat ID (opcional)" value={chatId} onChange={(e) => setChatId(e.target.value)} className="max-w-xs" />
                <div className="relative w-full max-w-md">
                  <Input placeholder="Buscar por texto" value={term} onChange={(e) => setTerm(e.target.value)} className="pl-9" />
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <Input type="number" min={10} max={1000} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="w-32" />
                <Button onClick={() => refetch()} disabled={isFetching}>Atualizar</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logs ({ordered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ordered.map((m) => (
                  <div key={m.id} className="p-3 bg-white rounded border">
                    <div className="text-xs text-gray-500 mb-1 flex justify-between">
                      <span>{new Date(m.createdAt).toLocaleString('pt-BR')}</span>
                      <span>de: {m.sender?.email || m.senderUserId}</span>
                    </div>
                    <div className="text-sm text-gray-800 whitespace-pre-line">{m.content}</div>
                  </div>
                ))}
                {ordered.length === 0 && <div className="text-gray-500 text-sm">Nenhum log encontrado.</div>}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

