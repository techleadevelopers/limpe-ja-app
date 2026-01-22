import axios, { AxiosError, AxiosRequestConfig, Method, isAxiosError } from "axios";

import {
    Activity, AuthResponse, AuthUser, UserProfile,
    Availability, Booking, LiveStatusPayload,
    BookingPage,
    BookingStatus,
    ClaimStatus,
    Client,
    Coupon,
    CouponStatus,
    DashboardMetrics,
    ObservabilityHealthPayload,
    DataRequest, DetailedRatingBreakdown,
    Dispute, DisputeMessage,
    DisputeStatus,
    FAQItem,
    GuaranteeClaim,
    Incident,
    IncidentStatus,
    Mission, MissionStatus,
    Offer,
    PanicAlert,
    PricingRule,
    Provider,
    AdminProviderPage,
    ProviderVisibilityStatus,
    ProviderService,
    QueueInfo, QueueJob,
    Referral,
    ReferralStatus,
    RevenueTrendPoint,
    Review,
    Service,
    SmartSuggestion,
    Subscription,
    SubscriptionStatus,
    Transaction,
    TransactionType,
    UserConsent,
    VerificationStatus,
    WithdrawalRequest
} from "./types";

// --- Admin Settings (SLAs) ---
export type DisputeSlaConfig = { urgentHours: number; highHours: number; mediumHours: number; lowHours: number };
export type SupportSlaConfig = { PAYMENT: number; QUALITY: number; APP: number; OTHER: number };
export type SlaSettings = { disputes: DisputeSlaConfig; support: SupportSlaConfig };
export type SlaAuditEvent = { id: string; at: string; actorUserId: string; before: SlaSettings; after: SlaSettings };
export type GeneralSettings = { commissionRatePercent: number };
export type GeneralAuditEvent = { id: string; at: string; actorUserId: string; before: GeneralSettings; after: GeneralSettings };
export type PricingAuditEvent = { id: string; at: string; actorUserId: string; action: 'create'|'update'|'delete'; ruleBefore?: any; ruleAfter?: any };
type ExtendedBookingStatus = BookingStatus | "STARTED" | "FINISHED";

type UnauthorizedHandler = (context: { originalRequest: AdminAxiosRequestConfig }) => Promise<void> | void;

interface AdminAxiosRequestConfig extends AxiosRequestConfig {
    _retry?: boolean;
    __tries?: number;
}

const RAILWAY_API_BASE_URL = "https://limpeja-backend-production-edfa.up.railway.app";

const resolveBaseUrl = (): string => {
    const maybeWindow = (globalThis as any)?.window as any;
    const injectedUrl = maybeWindow?.__APP_CONFIG__?.backendApiUrl
        || maybeWindow?.__CONFIG__?.backendApiUrl
        || maybeWindow?.__RUNTIME_CONFIG__?.backendApiUrl;

    const envUrl = (
        import.meta.env.VITE_APP_API_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_ADMIN_API_BASE_URL ||
        injectedUrl
    )?.trim()?.replace(/\/$/, "");
    if (envUrl && envUrl !== RAILWAY_API_BASE_URL) {
        console.warn(`[API] Ignoring overridden base URL "${envUrl}" and enforcing ${RAILWAY_API_BASE_URL}.`);
    }
    if (envUrl?.includes("localhost")) {
        console.warn(`[API] Detected localhost override ("${envUrl}") but routing will stay on Railway (${RAILWAY_API_BASE_URL}).`);
    }
    return RAILWAY_API_BASE_URL;
};

export const API_BASE_URL = resolveBaseUrl();
const DEFAULT_TIMEOUT_MS = 30000;

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
const shouldRetry = (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401 || status === 429) {
        return false;
    }
    return !status || status >= 500;
};
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
    } catch {
        // ignore
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeString = (value?: string | null): string => {
    return value?.trim() ?? "";
};

const deriveFullName = (...values: (string | undefined | null)[]): string => {
    for (const value of values) {
        const normalized = normalizeString(value);
        if (normalized) {
            return normalized;
        }
    }
    return "";
};

const mapProviderPayload = (payload: any): Provider => {
    const candidateFullName = deriveFullName(
        payload?.fullName,
        payload?.full_name,
        payload?.name
    );
    return {
        ...payload,
        fullName: candidateFullName || payload?.name || "",
    };
};

const mapAuthUserPayload = (payload: any): AuthUser => {
    return {
        id: payload?.id ?? "",
        email: payload?.email ?? "",
        role: payload?.role ?? "ADMIN",
        fullName: deriveFullName(
            payload?.fullName,
            payload?.full_name,
            payload?.name,
            payload?.email
        ),
        name: payload?.name,
    };
};

const mapTransactionPayload = (payload: any): Transaction => {
    return {
        ...payload,
        fullName: deriveFullName(
            payload?.fullName,
            payload?.full_name,
            payload?.providerFullName,
            payload?.userFullName,
            payload?.counterparty?.fullName,
            payload?.counterparty?.full_name
        ),
    };
};

const mapWithdrawalRequestPayload = (payload: any): WithdrawalRequest => {
    return {
        ...payload,
        provider: payload?.provider ? mapProviderPayload(payload.provider) : undefined,
    };
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
    return now - last < 5000;
};

const ERROR_MESSAGE_OVERRIDES: Record<string, string> = {
    "error.prisma.generic": "Não foi possível carregar os dados. Tente novamente em instantes.",
    "errors.network.retry_saved": "Não foi possível concluir a requisição agora. Tente novamente.",
};

const buildUnifiedError = (error: AxiosError) => {
    const payload: any = error.response?.data ?? {};
    const requestId = payload.requestId ?? error.response?.headers?.["x-request-id"];
    const baseMessage = (() => {
        const overrideKey = payload.messageKey ?? payload.message;
        const override =
            overrideKey && ERROR_MESSAGE_OVERRIDES[overrideKey]
                ? ERROR_MESSAGE_OVERRIDES[overrideKey]
                : undefined;
        if (override) return override;
        if (payload.message) return payload.message;
        return (
            ERROR_MESSAGE_OVERRIDES["errors.network.retry_saved"]
            ?? "We couldn�t complete this now. Your progress is safe; try again."
        );
    })();
    return {
        status: error.response?.status,
        messageKey: payload.messageKey ?? "errors.network.retry_saved",
        message: requestId ? `${baseMessage} (ID: ${requestId})` : baseMessage,
        requestId,
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
        const sentryClient = (globalThis as any).Sentry;
        if (sentryClient) {
            const method = (config.method ?? "GET").toUpperCase();
            const route = `${method} ${String(config.url ?? "")}`.trim();
            if (unified.requestId) {
                sentryClient.setTag?.("requestId", unified.requestId);
            }
            sentryClient.addBreadcrumb?.({
                category: "api",
                message: route,
                data: {
                    requestId: unified.requestId,
                    status: unified.status,
                },
            });
        }

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
        // Fix: avoid always-truthy object literal with ?? and safely default headers
        headers: { ...((headers as Record<string, string>) ?? {}) },
        data: undefined,
        signal: signal || undefined,
    };

    if (body !== undefined) {
        if (typeof body === "string") {
            try {
                axiosConfig.data = JSON.parse(body);
            } catch {
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
        if (isAxiosError(err)) {
            throw buildUnifiedError(err);
        }
        throw err;
    }
};
// --- FunÃ§Ãµes de AutenticaÃ§Ã£o ---
export const login = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await fetchApi<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
    return {
        ...response,
        user: mapAuthUserPayload(response?.user ?? {}),
    };
};

export const logout = async (): Promise<void> => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
};

// --- FunÃ§Ãµes de Dados Existentes ---
export const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
    return fetchApi('/admin/dashboard/metrics');
};

export const fetchAdminHealth = async (): Promise<ObservabilityHealthPayload> => {
    return fetchApi('/admin/health');
};

export const fetchLiveStatus = async (): Promise<LiveStatusPayload> => {
    return fetchApi('/live-status');
};

export const fetchRevenueTrend = async (months?: number): Promise<RevenueTrendPoint[]> => {
    const query = months ? `?months=${months}` : '';
    return fetchApi(`/admin/dashboard/revenue-trend${query}`);
};

// --- FunÃ§Ãµes de Provedores ---
export const fetchProviders = async (): Promise<Provider[]> => {
    const response = await fetchApi<any[]>('/providers');
    return (response ?? []).map(mapProviderPayload);
};

export const fetchAdminProvidersPage = async (params: {
    page?: number;
    limit?: number;
    searchTerm?: string;
    serviceId?: string;
    verificationStatus?: VerificationStatus;
  }): Promise<AdminProviderPage> => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.searchTerm) query.set('searchTerm', params.searchTerm);
    if (params.serviceId) query.set('serviceId', params.serviceId);
    if (params.verificationStatus) query.set('verificationStatus', params.verificationStatus);
    const queryString = query.toString();
    return fetchApi<AdminProviderPage>(`/admin/providers${queryString ? `?${queryString}` : ''}`);
  };

export const fetchProviderById = async (id: string): Promise<Provider> => {
    const response = await fetchApi<any>(`/providers/${id}`);
    return mapProviderPayload(response);
};

/**
 * **CORREÃ‡ÃƒO AQUI:** FunÃ§Ã£o para atualizar o status de verificaÃ§Ã£o do provedor
 * Utiliza o endpoint PATCH /verification/:id/status
 */
export const updateProviderStatus = async (
    id: string,
    status: VerificationStatus,
    rejectionReason?: string
): Promise<Provider> => {
    const response = await fetchApi<any>(`/verification/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: status, rejectionReason }),
    });
    return mapProviderPayload(response);
};

export const updateProviderVisibility = async (
    id: string,
    visibilityStatus: ProviderVisibilityStatus,
    visibilityReason?: string | null
): Promise<Provider> => {
    const response = await fetchApi<any>(`/admin/providers/${id}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({
            visibilityStatus,
            visibilityReason: visibilityReason ?? null,
        }),
    });
    return mapProviderPayload(response);
};

export const updateProviderProfile = async (id: string, data: Partial<Provider>): Promise<Provider> => {
    const response = await fetchApi<any>(`/providers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return mapProviderPayload(response);
};

// Excluir provedor (conta do prestador)
export const deleteProvider = async (id: string): Promise<void> => {
    await fetchApi(`/providers/${id}`, {
        method: 'DELETE',
    });
};

// --- FunÃ§Ãµes de Fila de VerificaÃ§Ã£o ---
export const fetchVerificationQueue = async (): Promise<Provider[]> => {
    const response = await fetchApi<any[]>('/verification/pending-queue');
    return (response ?? []).map(mapProviderPayload);
};

// --- FunÃ§Ãµes de Atividades Recentes ---
export const fetchRecentActivities = async (limit: number = 10): Promise<Activity[]> => {
    return fetchApi(`/activities?limit=${limit}`);
};

// --- Settings: SLAs ---
export const fetchSlaSettings = async (): Promise<SlaSettings> => {
    return fetchApi('/admin/settings/slas');
};

export const updateSlaSettings = async (payload: Partial<SlaSettings>): Promise<SlaSettings> => {
    return fetchApi('/admin/settings/slas', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
};

export const fetchSlaHistory = async (limit = 50, cursor = 0): Promise<{ items: SlaAuditEvent[]; nextCursor: number | null }> => {
    const query = `?limit=${limit}&cursor=${cursor}`;
    return fetchApi(`/admin/settings/slas/history${query}`);
};

export const fetchGeneralSettings = async (): Promise<GeneralSettings> => {
    return fetchApi('/admin/settings/general');
};

export const updateGeneralSettings = async (payload: Partial<GeneralSettings>): Promise<GeneralSettings> => {
    return fetchApi('/admin/settings/general', { method: 'PUT', body: JSON.stringify(payload) });
};

export const fetchGeneralHistory = async (limit = 50, cursor = 0): Promise<{ items: GeneralAuditEvent[]; nextCursor: number | null }> => {
    const query = `?limit=${limit}&cursor=${cursor}`;
    return fetchApi(`/admin/settings/general/history${query}`);
};

export const fetchPricingHistory = async (limit = 50, cursor = 0): Promise<{ items: PricingAuditEvent[]; nextCursor: number | null }> => {
    const query = `?limit=${limit}&cursor=${cursor}`;
    return fetchApi(`/admin/settings/pricing/history${query}`);
};

// --- Fun??es de Clientes ---
const mapUserProfileToClient = (user: any): Client => {
    const client = user?.clientDetails ?? user?.client ?? {};
    const addr = client?.address ?? null;
    const bookingsCount = client?._count?.bookings ?? client?.bookings?.length ?? user?.completedBookingsCount ?? 0;
    const formattedFullName = (deriveFullName(
        client?.fullName,
        client?.full_name,
        client?.name,
        user?.fullName,
        user?.full_name,
        user?.name,
        user?.email
    ) || user?.email) ?? "";
    return {
        id: client?.id ?? user?.id ?? "",
        userId: client?.userId ?? user?.id ?? "",
        name: formattedFullName,
        fullName: formattedFullName,
        email: user?.email ?? "",
        role: user?.role,
        avatarUrl: client?.avatarUrl ?? user?.avatarUrl ?? null,
        phone: client?.phone ?? user?.phone ?? null,
        cpf: client?.cpf ?? null,
        dateOfBirth: client?.dateOfBirth ?? null,
        address: addr,
        completedBookingsCount: bookingsCount,
        noShowCount: client?.noShowCount ?? 0,
        cancellationCount: client?.cancellationCount ?? 0,
        totalSpent: client?.totalSpent ?? user?.totalSpent ?? null,
        memberSince: user?.createdAt ?? "",
        status: user?.status ?? "active",
        lastActivity: user?.updatedAt ?? user?.createdAt ?? "",
        lastLogin: user?.lastLogin ?? user?.updatedAt ?? user?.createdAt ?? "",
        loyaltyTier: user?.loyalty?.tier ?? "bronze",
        verificationStatus: user?.verificationStatus ?? client?.verificationStatus ?? null,
        createdAt: user?.createdAt ?? "",
        updatedAt: user?.updatedAt ?? "",
    };
};

export const fetchClients = async (): Promise<Client[]> => {
    const users = await fetchApi<any[]>("/users");
    return (users ?? []).map(mapUserProfileToClient);
};

export const fetchClientById = async (id: string): Promise<Client> => {
    const user = await fetchApi<any>(`/users/${id}`);
    return mapUserProfileToClient(user);
};

export const fetchUserProfileById = async (id: string): Promise<UserProfile> => {
    return fetchApi<UserProfile>(`/users/${id}`);
};

export const forceLogoutUser = async (userId: string): Promise<void> => {
    await fetchApi(`/admin/telemetry/force-logout/${userId}`, {
        method: 'POST',
    });
};
export const updateClientProfile = async (id: string, data: Partial<Client>): Promise<Client> => {
    return fetchApi(`/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const deleteUser = async (id: string): Promise<void> => {
    return fetchApi(`/users/${id}`, { method: 'DELETE' });
};

// --- FunÃ§Ãµes de ServiÃ§os Globais ---
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

// --- FunÃ§Ãµes de ServiÃ§os Oferecidos por Provedor ---
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

// --- FunÃ§Ãµes de Disponibilidade do Provedor ---
export const fetchProviderAvailability = async (providerId: string): Promise<Availability[]> => {
    return fetchApi(`/providers/${providerId}/availability`);
};

export const updateProviderAvailability = async (providerId: string, data: Partial<Availability>[]): Promise<Availability[]> => {
    return fetchApi(`/providers/${providerId}/availability`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

// --- FunÃ§Ãµes de Agendamentos ---
export const fetchAllBookings = async (status?: BookingStatus): Promise<Booking[]> => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/bookings${query}`);
};

export const fetchBookingsPage = async (params: {
    cursor?: string;
    limit?: number;
    status?: BookingStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
} = {}): Promise<BookingPage> => {
    const query = new URLSearchParams();
    query.set('paginated', '1');
    if (params.cursor) {
        query.set('cursor', params.cursor);
    }
    if (params.limit) {
        query.set('limit', String(params.limit));
    }
    if (params.status) {
        query.set('status', params.status);
    }
    if (params.search) {
        query.set('search', params.search);
    }
    if (params.startDate) {
        query.set('startDate', params.startDate);
    }
    if (params.endDate) {
        query.set('endDate', params.endDate);
    }
    const queryString = query.toString();
    return fetchApi<BookingPage>(`/bookings${queryString ? `?${queryString}` : ''}`);
};

export const fetchBookingDetails = async (id: string): Promise<Booking> => {
    return fetchApi(`/bookings/${id}`);
};

export const updateBookingStatus = async (id: string, status: ExtendedBookingStatus, notes?: string): Promise<Booking> => {
    return fetchApi(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
    });
};

export const cancelBookingWithRefund = async (id: string, reason?: string): Promise<Booking> => {
    return fetchApi(`/bookings/${id}/cancel-with-refund`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    });
};

// --- FunÃ§Ãµes de Disputas ---
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

// --- FunÃ§Ãµes de Assinaturas ---
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

// --- FunÃ§Ãµes de Cupons ---
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

// --- FunÃ§Ãµes de MissÃµes ---
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


// --- FunÃ§Ãµes de ReclamaÃ§Ãµes de Garantia ---
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

// --- FunÃ§Ãµes de TransaÃ§Ãµes Financeiras ---
export const fetchAllTransactions = async (type?: TransactionType, status?: string): Promise<Transaction[]> => {
    const queryParams = new URLSearchParams();
    if (type) queryParams.append('type', type);
    if (status) queryParams.append('status', status);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetchApi<any[]>(`/payments/transactions${query}`);
    return (response ?? []).map(mapTransactionPayload);
};

export const initiateRefund = async (transactionId: string, amount?: number): Promise<Transaction> => {
    const response = await fetchApi<any>(`/payments/${transactionId}/refund`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
    });
    return mapTransactionPayload(response);
};

// --- FunÃ§Ãµes de Saques de Provedores ---
export const fetchWithdrawalRequests = async (status?: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<WithdrawalRequest[]> => {
    const query = status ? `?status=${status}` : '';
    const response = await fetchApi<any>(`/payments/withdrawals${query}`);
    return (response ?? []).map(mapWithdrawalRequestPayload);
};

export const approveWithdrawal = async (id: string): Promise<WithdrawalRequest> => {
    const response = await fetchApi<any>(`/payments/withdrawals/${id}/approve`, {
        method: 'PATCH',
    });
    return mapWithdrawalRequestPayload(response);
};

export const rejectWithdrawal = async (id: string, reason?: string): Promise<WithdrawalRequest> => {
    const response = await fetchApi<any>(`/payments/withdrawals/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
    });
    return mapWithdrawalRequestPayload(response);
};

// --- FunÃ§Ãµes de Chat (Monitoramento) ---
export const fetchChatLogs = async (chatId?: string, searchTerm?: string, limit: number = 100): Promise<DisputeMessage[]> => {
    const queryParams = new URLSearchParams();
    if (chatId) queryParams.append('chatId', chatId);
    if (searchTerm) queryParams.append('searchTerm', searchTerm);
    queryParams.append('limit', limit.toString());
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetchApi(`/chat/logs${query}`);
};

// --- FunÃ§Ãµes de NotificaÃ§Ãµes Push ---
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

// --- FunÃ§Ãµes de AvaliaÃ§Ãµes ---
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

// --- FunÃ§Ãµes de Regras de PrecificaÃ§Ã£o DinÃ¢mica ---
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

// --- FunÃ§Ãµes de Ofertas/PromoÃ§Ãµes ---
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

// --- FunÃ§Ãµes de FAQs ---
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

// --- FunÃ§Ãµes de IndicaÃ§Ãµes ---
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


// --- FunÃ§Ãµes de Alertas de SeguranÃ§a ---
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

// --- FunÃ§Ãµes de LGPD: GestÃ£o de Consentimentos ---
export const fetchUserConsents = async (userId?: string): Promise<UserConsent[]> => {
    const query = userId ? `?userId=${userId}` : '';
    return fetchApi(`/users/consents${query}`);
};

// --- FunÃ§Ãµes de LGPD: SolicitaÃ§Ãµes de ExportaÃ§Ã£o/ExclusÃ£o ---
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

// --- FunÃ§Ãµes de Monitoramento de Workers/Filas ---
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

// Tipos adicionais (jÃ¡ estavam no seu arquivo, apenas mantidos)
// Estes tipos devem ser removidos daqui se jÃ¡ estiverem definidos em './types.ts'
// Eles estÃ£o aqui no original para compatibilidade, mas a fonte da verdade Ã© o './types.ts'
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
