import axios, { AxiosError, AxiosRequestConfig, Method } from "axios";

import {
    Activity, AuthResponse, DashboardMetrics, Provider, VerificationStatus,
    RevenueTrendPoint,
    Client, Address, Service, ProviderService, Availability, Booking,
    Transaction, WithdrawalRequest, Dispute, DisputeMessage, Subscription,
    Coupon, GuaranteeClaim, PricingRule, PanicAlert, Incident, UserConsent,
    DataRequest, DetailedRatingBreakdown, SmartSuggestion, QueueInfo, QueueJob,
    BookingStatus, TransactionType, DisputeStatus, ClaimStatus, CouponType, CouponTarget, CouponStatus,
    SubscriptionStatus, SubscriptionFrequency, IncidentType, IncidentStatus, PricingType,
    Review, Offer, Referral, FAQItem, Mission, MissionStatus, MissionTargetAudience,
    ReferralStatus
} from "./types";

type UnauthorizedHandler = (context: { originalRequest: AdminAxiosRequestConfig }) => Promise<void> | void;

interface AdminAxiosRequestConfig extends AxiosRequestConfig {
    _retry?: boolean;
    __tries?: number;
}

const resolveBaseUrl = (): string => {
    const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_ADMIN_API_BASE_URL;
    return (envUrl?.trim()?.replace(/\/$/, "")) || "https://limpeja-backend-production.up.railway.app";
};

const API_BASE_URL = resolveBaseUrl();
const DEFAULT_TIMEOUT_MS = import.meta.env.DEV ? 30000 : 12000;

let onUnauthorizedCallback: UnauthorizedHandler | null = null;
export const setUnauthorizedHandler = (callback?: UnauthorizedHandler) => {
    onUnauthorizedCallback = callback ?? null;
};

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: DEFAULT_TIMEOUT_MS,
    headers: {
        "Content-Type": "application/json",
    },
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const shouldRetry = (error: AxiosError) => !error.response || error.response.status >= 500;
const IDEMP_PATHS = [
    "/auth/login",
    "/bookings",
    "/disputes",
    "/missions",
    "/notifications",
    "/payments",
    "/providers",
    "/queues",
    "/support",
];

const randomId = () => {
    try {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }
    } catch (_) {
        // ignore
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

apiClient.interceptors.request.use(config => {
    const cfg = config;
    cfg.headers = cfg.headers ?? {};

    const token = localStorage.getItem("authToken");
    if (token) {
        cfg.headers["Authorization"] = `Bearer ${token}`;
    }

    const method = cfg.method?.toLowerCase();
    if (method && ["post", "put", "patch"].includes(method)) {
        const path = String(cfg.url ?? "");
        if (IDEMP_PATHS.some(p => path.includes(p))) {
            cfg.headers["Idempotency-Key"] = cfg.headers["Idempotency-Key"] ?? randomId();
        }
    }

    cfg.headers["X-Client-Request-Id"] = randomId();
    return cfg;
});

const errorBucket = new Map<string, number>();
const shouldDedupe = (key: string) => {
    const now = Date.now();
    const last = errorBucket.get(key) ?? 0;
    errorBucket.set(key, now);
    return now - last < 30000;
};

const buildUnifiedError = (error: AxiosError) => {
    const payload: any = error.response?.data ?? {};
    return {
        status: error.response?.status,
        messageKey: payload.messageKey ?? "errors.network.retry_saved",
        message: payload.message ?? "We couldn�t complete this now. Your progress is safe; try again.",
        requestId: payload.requestId ?? error.response?.headers?.["x-request-id"],
        fieldErrors: payload.fieldErrors ?? null,
    };
};

apiClient.interceptors.response.use(
    response => response,
    async error => {
        const axiosError = error as AxiosError & { config: AdminAxiosRequestConfig };
        const config = axiosError.config || {};
        config.__tries = (config.__tries ?? 0) + 1;

        if (shouldRetry(axiosError) && config.__tries < 3) {
            await sleep(1000 * Math.pow(2, config.__tries - 1));
            return apiClient(config);
        }

        const headers = (config.headers ?? {}) as Record<string, unknown>;
        const silentHeader = headers["x-silent"] ?? headers["X-Silent"];
        const isSilent = silentHeader === "1" || silentHeader === 1 || silentHeader === true;

        const unified = buildUnifiedError(axiosError);
        if (!isSilent && !shouldDedupe(`${unified.messageKey}:${unified.status}`)) {
            console.error("[API] Request failed:", unified.messageKey, unified.message, unified.requestId ?? "");
        }

        if (axiosError.response?.status === 401 && !config._retry) {
            config._retry = true;
            localStorage.removeItem("authToken");
            localStorage.removeItem("userData");
            if (onUnauthorizedCallback) {
                await onUnauthorizedCallback({ originalRequest: config });
            }
        }

        return Promise.reject(unified);
    }
);

export const fetchApi = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    const { method, headers, body, signal } = options;
    const axiosConfig: AdminAxiosRequestConfig = {
        url: path,
        method: (method ? method.toUpperCase() : "GET") as Method,
        headers: { ...(headers as Record<string, string>) } ?? {},
        data: undefined,
        signal: signal || undefined,
    };

    if (body !== undefined) {
        if (typeof body === "string") {
            try {
                axiosConfig.data = JSON.parse(body);
            } catch (_) {
                axiosConfig.data = body;
            }
        } else {
            axiosConfig.data = body;
        }
    }

    try {
        const response = await apiClient.request<T>(axiosConfig);
        return response.data;
    } catch (err) {
        if (axios.isAxiosError(err)) {
            throw buildUnifiedError(err);
        }
        throw err;
    }
};
// --- Funções de Autenticação ---
export const login = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await fetchApi<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
    return response;
};

export const logout = async (): Promise<void> => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
};

// --- Funções de Dados Existentes ---
export const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
    return fetchApi('/admin/dashboard/metrics');
};

export const fetchRevenueTrend = async (months?: number): Promise<RevenueTrendPoint[]> => {
    const query = months ? `?months=${months}` : '';
    return fetchApi(`/admin/dashboard/revenue-trend${query}`);
};

// --- Funções de Provedores ---
export const fetchProviders = async (): Promise<Provider[]> => {
    return fetchApi('/providers');
};

export const fetchProviderById = async (id: string): Promise<Provider> => {
    return fetchApi(`/providers/${id}`);
};

/**
 * **CORREÇÃO AQUI:** Função para atualizar o status de verificação do provedor
 * Utiliza o endpoint PATCH /verification/:id/status
 */
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
export const fetchClients = async (): Promise<Client[]> => { return fetchApi("/users"); };

export const fetchClientById = async (id: string): Promise<Client> => { return fetchApi(`/users/${id}`); };

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

// --- Funções de Missões ---
export const fetchMissions = async (status?: MissionStatus): Promise<Mission[]> => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/missions${query}`);
};

export const createMission = async (data: Omit<Mission, 'id' | 'timesCompleted' | 'createdAt' | 'updatedAt'>): Promise<Mission> => {
    return fetchApi('/missions', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateMission = async (id: string, data: Partial<Mission>): Promise<Mission> => {
    return fetchApi(`/missions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const deleteMission = async (id: string): Promise<void> => {
    return fetchApi(`/missions/${id}`, {
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
    return fetchApi(`/payments/transactions${query}`);
};

export const initiateRefund = async (transactionId: string, amount?: number): Promise<Transaction> => {
    return fetchApi(`/payments/${transactionId}/refund`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
    });
};

// --- Funções de Saques de Provedores ---
export const fetchWithdrawalRequests = async (status?: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<WithdrawalRequest[]> => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/payments/withdrawals${query}`);
};

export const approveWithdrawal = async (id: string): Promise<WithdrawalRequest> => {
    return fetchApi(`/payments/withdrawals/${id}/approve`, {
        method: 'PATCH',
    });
};

export const rejectWithdrawal = async (id: string, reason?: string): Promise<WithdrawalRequest> => {
    return fetchApi(`/payments/withdrawals/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
    });
};

// --- Funções de Chat (Monitoramento) ---
export const fetchChatLogs = async (chatId?: string, searchTerm?: string, limit: number = 100): Promise<DisputeMessage[]> => {
    const queryParams = new URLSearchParams();
    if (chatId) queryParams.append('chatId', chatId);
    if (searchTerm) queryParams.append('searchTerm', searchTerm);
    queryParams.append('limit', limit.toString());
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetchApi(`/chat/logs${query}`);
};

// --- Funções de Notificações Push ---
export const sendNotification = async (data: { userId?: string; providerId?: string; title: string; message: string; imageUrl?: string; actionButtons?: any[] }): Promise<any> => {
    return fetchApi('/notifications/send', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const scheduleNotification = async (data: { userId?: string; providerId?: string; title: string; message: string; scheduleAt: string; imageUrl?: string; actionButtons?: any[] }): Promise<any> => {
    return fetchApi('/notifications/schedule', {
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
export const createFAQ = async (data: Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<FAQItem> => {
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
export const fetchAllReferrals = async (status?: ReferralStatus): Promise<Referral[]> => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/referrals${query}`);
};

export const fetchReferralDetails = async (id: string): Promise<Referral> => {
    return fetchApi(`/referrals/${id}`);
};

export const updateReferralStatus = async (id: string, status: ReferralStatus, notes?: string): Promise<Referral> => {
    return fetchApi(`/referrals/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
    });
};

export const issueReferralReward = async (id: string): Promise<Referral> => {
    return fetchApi(`/referrals/${id}/issue-reward`, {
        method: 'POST',
    });
};


// --- Funções de Alertas de Segurança ---
export const fetchPanicAlerts = async (status?: string): Promise<PanicAlert[]> => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/safety/panic-alerts${query}`);
};

export const fetchIncidents = async (status?: IncidentStatus): Promise<Incident[]> => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/safety/incidents${query}`);
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
    return fetchApi(`/users/consents${query}`);
};

// --- Funções de LGPD: Solicitações de Exportação/Exclusão ---
export const fetchDataRequests = async (type?: 'EXPORT' | 'DELETION', status?: string): Promise<DataRequest[]> => {
    const queryParams = new URLSearchParams();
    if (type) queryParams.append('type', type);
    if (status) queryParams.append('status', status);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetchApi(`/users/data-requests${query}`);
};

export const updateDataRequestStatus = async (id: string, status: string): Promise<DataRequest> => {
    return fetchApi(`/users/data-requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
};

// --- Funções de Monitoramento de Workers/Filas ---
export const fetchQueueStatus = async (): Promise<QueueInfo[]> => {
    return fetchApi('/admin/queues/status');
};

export const fetchQueueJobs = async (queueName: string, status?: string): Promise<QueueJob[]> => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/admin/queues/${queueName}/jobs${query}`);
};

export const retryQueueJob = async (queueName: string, jobId: string): Promise<any> => {
    return fetchApi(`/admin/queues/${queueName}/jobs/${jobId}/retry`, { method: 'POST' });
};

// Tipos adicionais (já estavam no seu arquivo, apenas mantidos)
// Estes tipos devem ser removidos daqui se já estiverem definidos em './types.ts'
// Eles estão aqui no original para compatibilidade, mas a fonte da verdade é o './types.ts'
/*
export type FAQItem = {
    id: string;
    question: string;
    answer: string;
    category?: string | null;
    order?: number;
    createdAt: string;
    updatedAt: string;
};

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
*/


