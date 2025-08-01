// admin-web/src/lib/api.ts

import { Provider, Activity, DashboardMetrics, VerificationStatus, AuthResponse, AuthUser } from './types';

const API_BASE_URL = 'https://limpeja-app-backend-665493568088.southamerica-east1.run.app/api'; // URL do seu backend NestJS

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

export const fetchVerificationQueue = async (): Promise<Provider[]> => {
    return fetchApi('/providers?status=PENDING_MANUAL_REVIEW,PENDING_DOCUMENTS_UPLOAD');
};

export const fetchProviderById = async (id: string): Promise<Provider> => {
    return fetchApi(`/providers/${id}`);
};

export const updateProviderStatus = async (
    id: string,
    status: VerificationStatus,
    rejectionReason?: string
): Promise<Provider> => {
    return fetchApi(`/providers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ verificationStatus: status, rejectionReason }),
    });
};

export const fetchRecentActivities = async (limit: number = 10): Promise<Activity[]> => {
    return fetchApi(`/activities?limit=${limit}`);
};

// --- Novas Funções de API (Exemplos, baseadas na documentação do backend) ---
// Você precisará adicionar mais funções aqui conforme as funcionalidades do admin forem integradas
// Exemplo: fetchUsers, createService, updateService, fetchOffers, etc.