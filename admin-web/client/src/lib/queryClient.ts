// admin-web/client/src/lib/queryClient.ts

import { QueryClient } from '@tanstack/react-query';
import { fetchApi } from './api'; // Importa a função fetchApi como um named import

/**
 * Configura e exporta uma instância de QueryClient para o TanStack Query.
 * Define opções padrão para queries e mutations, incluindo a função de query padrão.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Não refetch automaticamente quando a janela do navegador ganha foco.
      refetchOnWindowFocus: false,
      // Define o tempo que os dados permanecem "frescos" no cache antes de serem considerados "stale".
      // Dados "stale" serão refetched em segundo plano na próxima vez que forem acessados.
      staleTime: 1000 * 60 * 5, // 5 minutos
      // Desabilita a tentativa automática de repetir requisições falhas.
      // O tratamento de erros será mais explícito.
      retry: false,

      /**
       * Função de query padrão para todas as queries que não especificam uma `queryFn`.
       * Utiliza a função `fetchApi` para realizar a chamada HTTP.
       * @param queryKey A chave da query. Espera-se que `queryKey[0]` seja o endpoint da API.
       * @returns Uma Promise que resolve com os dados da resposta da API.
       * @throws Erro se a chave da query não for uma string ou se a requisição falhar.
       */
      queryFn: async ({ queryKey }) => {
        // queryKey[0] é o endpoint da API.
        // queryKey[1] (opcional) pode ser usado para passar dados adicionais para requisições POST/PUT,
        // mas para `queryFn` padrão, geralmente esperamos apenas GETs simples.
        const [endpoint] = queryKey;

        // Garante que o primeiro elemento da queryKey é uma string, que representa o endpoint.
        if (typeof endpoint !== 'string') {
          throw new Error('A chave da query deve começar com uma string que representa o endpoint da API.');
        }

        // Chama a função fetchApi com o endpoint.
        // Se você tiver queries que precisam de métodos HTTP diferentes (POST, PUT),
        // você precisaria ajustar a lógica aqui (ex: queryKey[1] como método e queryKey[2] como body)
        // ou, mais comumente, definir `mutationFn` para mutations e `queryFn` específicas para queries complexas.
        return fetchApi(endpoint);
      },
    },
    mutations: {
      // Desabilita a tentativa automática de repetir mutations falhas.
      retry: false,
      // Você pode adicionar um `mutationFn` padrão aqui se a maioria das suas mutations
      // seguir um padrão similar, mas geralmente mutations são mais específicas
      // e definidas diretamente no `useMutation`.
    },
  },
});

export default queryClient;