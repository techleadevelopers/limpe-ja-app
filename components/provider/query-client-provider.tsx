// src/providers/query-client-provider.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Crie uma instância do QueryClient
export const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Dados "stale" após 5 minutos
      gcTime: 1000 * 60 * 10, // <--- CORREÇÃO AQUI: 'cacheTime' foi renomeado para 'gcTime'
      refetchOnWindowFocus: false, // Desabilitar refetch em foco para apps mobile, pode ser ajustado
      retry: 2, // Tentar novamente 2 vezes em caso de falha
    },
  },
});

interface AppQueryClientProviderProps {
  children: React.ReactNode;
}

const AppQueryClientProvider: React.FC<AppQueryClientProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={appQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default AppQueryClientProvider;
