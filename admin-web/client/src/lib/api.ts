// admin-web/src/lib/api.ts

import {
    Activity, AuthResponse, DashboardMetrics, Provider, VerificationStatus,
    Client, Address, Service, ProviderService, Availability, Booking,
    Transaction, WithdrawalRequest, Dispute, DisputeMessage, Subscription,
    Coupon, GuaranteeClaim, PricingRule, PanicAlert, Incident, UserConsent,
    DataRequest, DetailedRatingBreakdown, SmartSuggestion, QueueInfo, QueueJob,
    BookingStatus, TransactionType, DisputeStatus, ClaimStatus, CouponType, CouponTarget,
    SubscriptionStatus, SubscriptionFrequency, IncidentType, IncidentStatus, PricingType
} from './types';

// A URL foi alterada para apontar para o servidor de desenvolvimento local
const API_BASE_URL = 'https://limpeja-app-backend-35489557635.southamerica-east1.run.app'; // Alterado para localhost:3000

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

// --- Funções de Provedores ---
export const fetchProviders = async (): Promise<Provider[]> => {
    return fetchApi('/providers');
};

export const fetchProviderById = async (id: string): Promise<Provider> => {
    return fetchApi(`/providers/${id}`);
};

export const updateProviderStatus = async (
    id: string,
    status: VerificationStatus,
    rejectionReason?: string
): Promise<Provider> => {
    return fetchApi(`/verification/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: status, rejectionReason }),
    });
};

// NOVO: Atualizar perfil completo do provedor
export const updateProviderProfile = async (id: string, data: Partial<Provider>): Promise<Provider> => {
    return fetchApi(`/providers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

// --- Funções de Fila de Verificação ---
export const fetchVerificationQueue = async (): Promise<Provider[]> => {
    return fetchApi('/verification/pending-queue');
};

// --- Funções de Atividades Recentes ---
export const fetchRecentActivities = async (limit: number = 10): Promise<Activity[]> => {
    return fetchApi(`/activities?limit=${limit}`);
};

// --- Funções de Clientes ---
export const fetchClients = async (): Promise<Client[]> => {
    return fetchApi('/clients');
};

export const fetchClientById = async (id: string): Promise<Client> => {
    return fetchApi(`/clients/${id}`);
};

export const updateClientProfile = async (id: string, data: Partial<Client>): Promise<Client> => {
    return fetchApi(`/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

// --- Funções de Serviços Globais ---
export const fetchServices = async (): Promise<Service[]> => {
    return fetchApi('/services');
};

export const createService = async (data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service> => {
    return fetchApi('/services', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateService = async (id: string, data: Partial<Service>): Promise<Service> => {
    return fetchApi(`/services/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const deleteService = async (id: string): Promise<void> => {
    return fetchApi(`/services/${id}`, {
        method: 'DELETE',
    });
};

// --- Funções de Serviços Oferecidos por Provedor ---
export const fetchProviderServices = async (providerId: string): Promise<ProviderService[]> => {
    return fetchApi(`/providers/${providerId}/services`);
};

export const addProviderService = async (providerId: string, data: Omit<ProviderService, 'id' | 'providerId' | 'createdAt' | 'updatedAt' | 'service'>): Promise<ProviderService> => {
    return fetchApi(`/providers/${providerId}/services`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateProviderService = async (providerId: string, serviceOfferingId: string, data: Partial<ProviderService>): Promise<ProviderService> => {
    return fetchApi(`/providers/${providerId}/services/${serviceOfferingId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const deleteProviderService = async (providerId: string, serviceOfferingId: string): Promise<void> => {
    return fetchApi(`/providers/${providerId}/services/${serviceOfferingId}`, {
        method: 'DELETE',
    });
};

// --- Funções de Disponibilidade do Provedor ---
export const fetchProviderAvailability = async (providerId: string): Promise<Availability[]> => {
    return fetchApi(`/providers/${providerId}/availability`);
};

export const updateProviderAvailability = async (providerId: string, data: Partial<Availability>[]): Promise<Availability[]> => {
    return fetchApi(`/providers/${providerId}/availability`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

// --- Funções de Agendamentos ---
export const fetchAllBookings = async (status?: BookingStatus): Promise<Booking[]> => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/bookings${query}`);
};

export const fetchBookingDetails = async (id: string): Promise<Booking> => {
    return fetchApi(`/bookings/${id}`);
};

export const updateBookingStatus = async (id: string, status: BookingStatus, notes?: string): Promise<Booking> => {
    return fetchApi(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
    });
};

// --- Funções de Disputas ---
export const fetchAllDisputes = async (status?: DisputeStatus): Promise<Dispute[]> => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/disputes${query}`);
};

export const fetchDisputeDetails = async (id: string): Promise<Dispute> => {
    return fetchApi(`/disputes/${id}`);
};

export const updateDisputeStatus = async (id: string, status: DisputeStatus, resolutionNotes?: string): Promise<Dispute> => {
    return fetchApi(`/disputes/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, resolutionNotes }),
    });
};

export const sendDisputeMessage = async (disputeId: string, content: string): Promise<DisputeMessage> => {
    return fetchApi(`/disputes/${disputeId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
    });
};

// --- Funções de Assinaturas ---
export const fetchAllSubscriptions = async (status?: SubscriptionStatus): Promise<Subscription[]> => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/subscriptions${query}`);
};

export const fetchSubscriptionDetails = async (id: string): Promise<Subscription> => {
    return fetchApi(`/subscriptions/${id}`);
};

export const updateSubscription = async (id: string, data: Partial<Subscription>): Promise<Subscription> => {
    return fetchApi(`/subscriptions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

// --- Funções de Cupons ---
export const createCoupon = async (data: Omit<Coupon, 'id' | 'usesCount' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Coupon> => {
    return fetchApi('/coupons', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const fetchCoupons = async (status?: CouponStatus): Promise<Coupon[]> => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/coupons${query}`);
};

export const updateCoupon = async (id: string, data: Partial<Coupon>): Promise<Coupon> => {
    return fetchApi(`/coupons/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const deleteCoupon = async (id: string): Promise<void> => {
    return fetchApi(`/coupons/${id}`, {
        method: 'DELETE',
    });
};

// --- Funções de Reclamações de Garantia ---
export const fetchAllGuaranteeClaims = async (status?: ClaimStatus): Promise<GuaranteeClaim[]> => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/guarantee/claims${query}`);
};

export const fetchGuaranteeClaimDetails = async (id: string): Promise<GuaranteeClaim> => {
    return fetchApi(`/guarantee/claims/${id}`);
};

export const updateGuaranteeClaimStatus = async (id: string, status: ClaimStatus, resolutionNotes?: string): Promise<GuaranteeClaim> => {
    return fetchApi(`/guarantee/claims/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, resolutionNotes }),
    });
};

// --- Funções de Transações Financeiras ---
export const fetchAllTransactions = async (type?: TransactionType, status?: string): Promise<Transaction[]> => {
    const queryParams = new URLSearchParams();
    if (type) queryParams.append('type', type);
    if (status) queryParams.append('status', status);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetchApi(`/payments/transactions${query}`); // Supondo endpoint /payments/transactions
};

export const initiateRefund = async (transactionId: string, amount?: number): Promise<Transaction> => {
    return fetchApi(`/payments/${transactionId}/refund`, { // Supondo endpoint /payments/:id/refund
        method: 'POST',
        body: JSON.stringify({ amount }),
    });
};

// --- Funções de Saques de Provedores ---
export const fetchWithdrawalRequests = async (status?: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<WithdrawalRequest[]> => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/payments/withdrawals${query}`); // Supondo endpoint /payments/withdrawals
};

export const approveWithdrawal = async (id: string): Promise<WithdrawalRequest> => {
    return fetchApi(`/payments/withdrawals/${id}/approve`, { // Supondo endpoint /payments/withdrawals/:id/approve
        method: 'PATCH',
    });
};

export const rejectWithdrawal = async (id: string, reason?: string): Promise<WithdrawalRequest> => {
    return fetchApi(`/payments/withdrawals/${id}/reject`, { // Supondo endpoint /payments/withdrawals/:id/reject
        method: 'PATCH',
        body: JSON.stringify({ reason }),
    });
};

// --- Funções de Chat (Monitoramento) ---
export const fetchChatLogs = async (chatId?: string, searchTerm?: string, limit: number = 100): Promise<DisputeMessage[]> => { // Reutilizando DisputeMessage para logs de chat simples
    const queryParams = new URLSearchParams();
    if (chatId) queryParams.append('chatId', chatId);
    if (searchTerm) queryParams.append('searchTerm', searchTerm);
    queryParams.append('limit', limit.toString());
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetchApi(`/chat/logs${query}`); // Supondo endpoint /chat/logs
};

// --- Funções de Notificações Push ---
export const sendNotification = async (data: { userId?: string; providerId?: string; title: string; message: string; imageUrl?: string; actionButtons?: any[] }): Promise<any> => {
    return fetchApi('/notifications/send', { // Supondo endpoint /notifications/send
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const scheduleNotification = async (data: { userId?: string; providerId?: string; title: string; message: string; scheduleAt: string; imageUrl?: string; actionButtons?: any[] }): Promise<any> => {
    return fetchApi('/notifications/schedule', { // Supondo endpoint /notifications/schedule
        method: 'POST',
        body: JSON.stringify(data),
    });
};

// --- Funções de Avaliações ---
export const fetchAllReviews = async (providerId?: string, clientId?: string): Promise<Review[]> => {
    const queryParams = new URLSearchParams();
    if (providerId) queryParams.append('providerId', providerId);
    if (clientId) queryParams.append('clientId', clientId);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetchApi(`/reviews${query}`);
};

export const fetchDetailedRatingBreakdown = async (providerId: string): Promise<DetailedRatingBreakdown> => {
    return fetchApi(`/reviews/provider/${providerId}/breakdown`);
};

export const fetchSmartSuggestions = async (providerId: string): Promise<SmartSuggestion[]> => {
    return fetchApi(`/reviews/provider/${providerId}/suggestions`);
};

export const respondToReview = async (reviewId: string, response: string): Promise<any> => {
    return fetchApi(`/reviews/${reviewId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ response }),
    });
};

// --- Funções de Regras de Precificação Dinâmica ---
export const createPricingRule = async (data: Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<PricingRule> => {
    return fetchApi('/pricing/rules', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const fetchPricingRules = async (): Promise<PricingRule[]> => {
    return fetchApi('/pricing/rules');
};

export const updatePricingRule = async (id: string, data: Partial<PricingRule>): Promise<PricingRule> => {
    return fetchApi(`/pricing/rules/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const deletePricingRule = async (id: string): Promise<void> => {
    return fetchApi(`/pricing/rules/${id}`, {
        method: 'DELETE',
    });
};

// --- Funções de Ofertas/Promoções ---
export const createOffer = async (data: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Offer> => {
    return fetchApi('/offers', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const fetchOffers = async (): Promise<Offer[]> => {
    return fetchApi('/offers');
};

export const updateOffer = async (id: string, data: Partial<Offer>): Promise<Offer> => {
    return fetchApi(`/offers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const deleteOffer = async (id: string): Promise<void> => {
    return fetchApi(`/offers/${id}`, {
        method: 'DELETE',
    });
};

// --- Funções de FAQs ---
export const createFAQ = async (data: { question: string; answer: string; category?: string; order?: number }): Promise<FAQItem> => {
    return fetchApi('/faqs', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const fetchFAQs = async (): Promise<FAQItem[]> => {
    return fetchApi('/faqs');
};

export const updateFAQ = async (id: string, data: Partial<FAQItem>): Promise<FAQItem> => {
    return fetchApi(`/faqs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const deleteFAQ = async (id: string): Promise<void> => {
    return fetchApi(`/faqs/${id}`, {
        method: 'DELETE',
    });
};

// --- Funções de Indicações ---
export const fetchReferrals = async (): Promise<Referral[]> => {
    return fetchApi('/referrals');
};

// --- Funções de Programa de Fidelidade (Exemplo - Backend precisa implementar) ---
// export const fetchLoyaltyProgramConfig = async (): Promise<any> => { return fetchApi('/loyalty/config'); };
// export const updateLoyaltyProgramConfig = async (data: any): Promise<any> => { return fetchApi('/loyalty/config', { method: 'PATCH', body: JSON.stringify(data) }); };
// export const adjustUserLoyalty = async (userId: string, points: number): Promise<any> => { return fetchApi(`/loyalty/user/${userId}/adjust`, { method: 'POST', body: JSON.stringify({ points }) }); };

// --- Funções de Alertas de Segurança ---
export const fetchPanicAlerts = async (status?: string): Promise<PanicAlert[]> => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/safety/panic-alerts${query}`); // Supondo endpoint /safety/panic-alerts
};

export const fetchIncidents = async (status?: IncidentStatus): Promise<Incident[]> => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/safety/incidents${query}`); // Supondo endpoint /safety/incidents
};

export const updatePanicAlertStatus = async (id: string, status: string): Promise<PanicAlert> => {
    return fetchApi(`/safety/panic-alerts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
};

export const updateIncidentStatus = async (id: string, status: IncidentStatus, resolution?: string): Promise<Incident> => {
    return fetchApi(`/safety/incidents/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, resolution }),
    });
};

// --- Funções de LGPD: Gestão de Consentimentos ---
export const fetchUserConsents = async (userId?: string): Promise<UserConsent[]> => {
    const query = userId ? `?userId=${userId}` : '';
    return fetchApi(`/users/consents${query}`); // Supondo endpoint /users/consents
};

// --- Funções de LGPD: Solicitações de Exportação/Exclusão ---
export const fetchDataRequests = async (type?: 'EXPORT' | 'DELETION', status?: string): Promise<DataRequest[]> => {
    const queryParams = new URLSearchParams();
    if (type) queryParams.append('type', type);
    if (status) queryParams.append('status', status);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetchApi(`/users/data-requests${query}`); // Supondo endpoint /users/data-requests
};

export const updateDataRequestStatus = async (id: string, status: string): Promise<DataRequest> => {
    return fetchApi(`/users/data-requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
};

// --- Funções de Monitoramento de Workers/Filas (Exemplo - Backend precisa implementar) ---
export const fetchQueueStatus = async (): Promise<QueueInfo[]> => {
    return fetchApi('/admin/queues/status'); // Supondo endpoint /admin/queues/status
};

export const fetchQueueJobs = async (queueName: string, status?: string): Promise<QueueJob[]> => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/admin/queues/${queueName}/jobs${query}`); // Supondo endpoint /admin/queues/:queueName/jobs
};

export const retryQueueJob = async (queueName: string, jobId: string): Promise<any> => {
    return fetchApi(`/admin/queues/${queueName}/jobs/${jobId}/retry`, { method: 'POST' });
};

// NOVO: Tipo para Item de FAQ (já definido no backend, mas para consistência)
export type FAQItem = {
    id: string;
    question: string;
    answer: string;
    category?: string | null;
    order?: number;
    createdAt: string;
    updatedAt: string;
};

// NOVO: Tipo para Oferta (já definido no backend, mas para consistência)
export type Offer = {
    id: string;
    title: string;
    description?: string | null;
    discountPercentage?: number | null;
    fixedDiscountAmount?: number | null;
    validUntil: string;
    imageUrl?: string | null;
    createdAt: string;
    updatedAt: string;
};

// NOVO: Tipo para Review (já definido no backend, mas para consistência)
export type Review = {
    id: string;
    bookingId: string;
    clientId: string;
    providerId: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    updatedAt: string;
    client?: Client;
    provider?: Provider;
    booking?: Booking;
};

// NOVO: Tipo para Referral (já definido no backend, mas para consistência)
export type Referral = {
    id: string;
    referredUserId: string;
    referrerUserId: string;
    referralCode?: string | null;
    createdAt: string;
    updatedAt: string;
    referredUser?: AuthUser;
    referrerUser?: AuthUser;
};