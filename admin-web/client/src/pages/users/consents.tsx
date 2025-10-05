import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { fetchUserConsents } from '@/lib/api';

export default function UserConsentsPage() {
  const [userId, setUserId] = useState('');
  const { data: consents = [], isFetching } = useQuery({
    queryKey: ['user-consents', userId],
    queryFn: () => fetchUserConsents(userId || undefined),
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Consentimentos (LGPD)" subtitle="Acompanhe consentimentos e preferências de privacidade." />
        <main className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input placeholder="User ID (opcional)" value={userId} onChange={(e) => setUserId(e.target.value)} className="max-w-md" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consentimentos {isFetching ? '(carregando...)' : `(${consents.length})`}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {consents.map((c: any) => (
                  <div key={c.id} className="p-3 bg-white rounded border">
                    <div className="text-sm font-medium text-gray-900">{c.type}</div>
                    <div className="text-xs text-gray-500">{new Date(c.updatedAt || c.createdAt).toLocaleString('pt-BR')}</div>
                    <div className="text-sm text-gray-700 mt-1">Status: {String(c.status ?? 'unknown')}</div>
                  </div>
                ))}
                {consents.length === 0 && <div className="text-gray-500 text-sm">Nenhum consentimento encontrado.</div>}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

