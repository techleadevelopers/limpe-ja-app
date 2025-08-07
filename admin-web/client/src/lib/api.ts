// admin-web/src/lib.ts

import { Activity, AuthResponse, DashboardMetrics, Provider, VerificationStatus } from './types';

// A URL foi alterada para apontar para o servidor de desenvolvimento local
const API_BASE_URL = 'http://192.168.32.262.262.262.26:3000'; // Alterado para localhost:3000

/**
 * Função genérica para tratar requisições HTTP para a API.
 * Adiciona o token de autenticação e trata erros, incluindo 401 Unauthorized.
 * @param path O caminho do endpoint da API (ex: '/dashboard/metrics').
 * @param options Opções padrão para a requisição fetch (method, body, etc.).
 * @returns Uma Promise que resolve com os dados da resposta em JSON.
 * @throws Error se a requisição falhar ou retornar status de erro (incluindo 401).
 */
export const fetchApi = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    const token = localStorage.getItem('authToken'); // Pega o token do localStorage (usando 'authToken' como em AuthContext)

    // Inicializa headers como Record<string, string> para permitir adição de chaves dinâmicas
    // e para combinar corretamente com options.headers.
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        // Espalha os headers de options primeiro para que Content-Type possa sobrescrever se necessário
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Adiciona o token ao cabeçalho
    }

    // CORREÇÃO: Concatena o path com a API_BASE_URL
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: headers, // Usa o objeto headers construído
        credentials: 'include', // Mantém para cookies, se usado
    });

    if (!response.ok) {
        // Se a resposta não for OK, tenta extrair a mensagem de erro ou usa o statusText
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        // Lança um erro com a mensagem para ser tratado pelo chamador
        throw new Error(errorData.message || `Erro na requisição: ${response.status} ${response.statusText}`);
    }
    return response.json();
};

// --- Funções de Autenticação ---
/**
 * Realiza o login do usuário.
 * @param credentials Objeto contendo email e password.
 * @returns Uma Promise que resolve com AuthResponse (accessToken e user).
 */
export const login = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await fetchApi<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
    return response;
};

/**
 * Realiza o logout do usuário.
 * Remove o token e informações do usuário do localStorage.
 */
export const logout = async (): Promise<void> => {
    // Em um cenário real, você pode ter um endpoint de logout no backend
    // await fetchApi('/auth/logout', { method: 'POST' }); // Exemplo de chamada ao backend
    localStorage.removeItem('authToken'); // Remove o token do cliente
    localStorage.removeItem('userData'); // Remove informações do usuário do cliente
    // O backend pode invalidar o token no lado do servidor se necessário
};


// --- Funções de Dados Existentes (agora usando fetchApi com autenticação) ---
export const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
    return fetchApi('/dashboard/metrics');
};

export const fetchProviders = async (): Promise<Provider[]> => {
    return fetchApi('/providers');
};

// CORREÇÃO: A função agora chama o novo endpoint do backend.
// A rota antiga foi removida do backend, então o frontend deve usar a nova rota.
export const fetchVerificationQueue = async (): Promise<Provider[]> => {
    return fetchApi('/verification/pending-queue');
};

export const fetchProviderById = async (id: string): Promise<Provider> => {
    return fetchApi(`/providers/${id}`);
};

export const updateProviderStatus = async (
    id: string,
    status: VerificationStatus,
    rejectionReason?: string
): Promise<Provider> => {
    // CORREÇÃO: A rota para atualização de status também foi ajustada.
    // A propriedade no corpo da requisição foi alterada de `verificationStatus` para `status`.
    return fetchApi(`/verification/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: status, rejectionReason }), // <-- CORREÇÃO AQUI
    });
};

export const fetchRecentActivities = async (limit: number = 10): Promise<Activity[]> => {
    return fetchApi(`/activities?limit=${limit}`);
};