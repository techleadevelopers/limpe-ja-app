// admin-web/src/lib/types.ts

// Enums compartilhadas com o backend
export enum VerificationStatus {
    PENDING_DOCUMENTS_UPLOAD = "PENDING_DOCUMENTS_UPLOAD",
    PENDING_MANUAL_REVIEW = "PENDING_MANUAL_REVIEW",
    PENDING_INITIAL_REVIEW = "PENDING_INITIAL_REVIEW", // NOVO: Status inicial após registro
    PENDING_BACKGROUND_CHECK = "PENDING_BACKGROUND_CHECK", // NOVO: Após documentos, aguardando verificação de antecedentes
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    BLOCKED = "BLOCKED",
}

export enum ActivityType {
    PROVIDER_STATUS_CHANGE = "PROVIDER_STATUS_CHANGE",
    PROVIDER_REGISTRATION = "PROVIDER_REGISTRATION",
    BOOKING_COMPLETED = "BOOKING_COMPLETED",
    PAYMENT_PROCESSED = "PAYMENT_PROCESSED",
    // Adicione outros tipos de atividade conforme necessário
    NEW_DISPUTE = "NEW_DISPUTE", // NOVO
    COUPON_CREATED = "COUPON_CREATED", // NOVO
    SUBSCRIPTION_STARTED = "SUBSCRIPTION_STARTED", // NOVO
    SAFETY_ALERT = "SAFETY_ALERT", // NOVO
}

// NOVO: Enum para o tipo de precificação do serviço
export enum PricingType {
    FIXED_PRICE = "FIXED_PRICE",
    HOURLY = "HOURLY",
    BY_SIZE = "BY_SIZE",
    CUSTOM_QUOTE = "CUSTOM_QUOTE",
}

// NOVO: Enum para o status do agendamento
export enum BookingStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    COMPLETED = "COMPLETED",
    CANCELED = "CANCELED",
    PENDING_DISPUTE = "PENDING_DISPUTE",
    RESCHEDULED = "RESCHEDULED",
    IN_PROGRESS = "IN_PROGRESS",
    PENDING_PROVIDER_CONFIRMATION = "PENDING_PROVIDER_CONFIRMATION",
    REJECTED = "REJECTED",
    NO_SHOW = "NO_SHOW", // Adicionado para métricas de cliente
}

// NOVO: Enum para o tipo de transação financeira
export enum TransactionType {
    PAYMENT = "PAYMENT",
    WITHDRAWAL = "WITHDRAWAL",
    COMMISSION = "COMMISSION",
    REFUND = "REFUND",
}

// NOVO: Enum para o motivo da disputa
export enum DisputeReason {
    SERVICE_NOT_PERFORMED = "SERVICE_NOT_PERFORMED",
    SERVICE_INCOMPLETE = "SERVICE_INCOMPLETE",
    QUALITY_ISSUES = "QUALITY_ISSUES",
    PROVIDER_DID_NOT_SHOW = "PROVIDER_DID_NOT_SHOW",
    CLIENT_DID_NOT_SHOW = "CLIENT_DID_NOT_SHOW",
    OTHER = "OTHER",
}

// NOVO: Enum para o status da disputa
export enum DisputeStatus {
    PENDING = "PENDING",
    IN_REVIEW = "IN_REVIEW",
    RESOLVED = "RESOLVED",
    REJECTED = "REJECTED",
}

// NOVO: Enum para o status da assinatura
export enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    CANCELED = "CANCELED",
    COMPLETED = "COMPLETED",
}

// NOVO: Enum para a frequência da assinatura
export enum SubscriptionFrequency {
    WEEKLY = "WEEKLY",
    BI_WEEKLY = "BI_WEEKLY",
    MONTHLY = "MONTHLY",
}

// NOVO: Enum para o tipo de incidente
export enum IncidentType {
    DAMAGE = "DAMAGE",
    MISCONDUCT = "MISCONDUCT",
    THEFT = "THEFT",
    NO_SHOW = "NO_SHOW",
    OTHER = "OTHER",
}

// NOVO: Enum para o status do incidente
export enum IncidentStatus {
    PENDING_REVIEW = "PENDING_REVIEW",
    INVESTIGATING = "INVESTIGATING",
    RESOLVED = "RESOLVED",
    REJECTED = "REJECTED",
}

// NOVO: Enum para o tipo de cupom
export enum CouponType {
    PERCENTAGE = "PERCENTAGE",
    FIXED_AMOUNT = "FIXED_AMOUNT",
}

// NOVO: Enum para o alvo do cupom
export enum CouponTarget {
    ALL = "ALL",
    NEW_CLIENTS = "NEW_CLIENTS",
    SPECIFIC_SERVICE = "SPECIFIC_SERVICE",
    SPECIFIC_PROVIDER = "SPECIFIC_PROVIDER",
}

// NOVO: Enum para o status do cupom
export enum CouponStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    EXPIRED = "EXPIRED",
    USED_UP = "USED_UP",
}

// NOVO: Enum para o status da solicitação de garantia
export enum ClaimStatus {
    PENDING = "PENDING",
    UNDER_REVIEW = "UNDER_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    SETTLED = "SETTLED",
}

export type Provider = {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    verificationStatus: VerificationStatus;
    documentPhotoFrontUrl?: string | null;
    documentPhotoBackUrl?: string | null;
    selfieWithDocumentUrl?: string | null;
    ocrResult?: any | null; // Tipo genérico para o resultado JSON do OCR
    livenessResult?: any | null; // Tipo genérico para o resultado JSON do liveness check
    rejectionReason?: string | null;
    fiveStarReviewCount: number;
    monthlyBookingsCount: number;
    totalEarnings: string; // Mantido como string para consistência com o mock original
    latitude?: string | null;
    longitude?: string | null;
    createdAt: string;
    updatedAt: string;
    city?: string;
    specialties?: string[];
    jobsCompleted?: number;
    yearsOfExperience?: number; // NOVO: Campo para provedor
    bio?: string; // NOVO: Campo para provedor
    pixKey?: string; // NOVO: Campo para provedor
    avatarUrl?: string; // NOVO: Campo para provedor
    badges?: string[]; // NOVO: Campo para provedor
};

// NOVO: Tipo para Cliente
export type Client = {
    id: string;
    userId: string;
    name: string; // Nome completo do cliente
    email: string; // Email do usuário associado
    phone?: string | null;
    cpf?: string | null;
    dateOfBirth?: string | null; // Usar string para datas vindas da API
    address?: Address | null; // NOVO: Endereço do cliente
    completedBookingsCount: number;
    noShowCount: number; // NOVO: Métricas de comportamento
    cancellationCount: number; // NOVO: Métricas de comportamento
    memberSince: string; // Data de criação do perfil
    status: 'active' | 'inactive' | 'blocked'; // Status do cliente
    lastActivity: string; // Última atividade do cliente
    loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum'; // Nível de fidelidade
    createdAt: string;
    updatedAt: string;
};

// NOVO: Tipo para Endereço
export type Address = {
    id: string;
    cep: string;
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    latitude?: string | null;
    longitude?: string | null;
};

export type Activity = {
    id: string;
    type: ActivityType;
    description: string;
    entityId?: string | null;
    entityType?: string | null;
    status?: string | null;
    createdAt: string;
};

export type DashboardMetrics = {
    activeUsers: number;
    approvedProviders: number;
    servicesBooked: number;
    totalRevenue: number;
    pendingVerifications: number;
};

// --- Tipos para Autenticação ---
export type AuthUser = {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'CLIENT' | 'PROVIDER'; // Exemplo de roles
    // Adicione outras propriedades do usuário autenticado se necessário
};

export type AuthResponse = {
    accessToken: string;
    user: AuthUser;
};

// NOVO: Tipo para Serviço Global
export type Service = {
    id: string;
    name: string;
    description?: string | null;
    price: number; // Usar number para valores monetários no frontend
    icon?: string | null;
    createdAt: string;
    updatedAt: string;
};

// NOVO: Tipo para Serviço Oferecido por Provedor
export type ProviderService = {
    id: string;
    providerId: string;
    serviceId: string;
    price: number;
    durationMinutes?: number | null;
    description?: string | null;
    pricingType: PricingType;
    pricePerSquareMeter?: number | null;
    pricePerRoom?: number | null;
    service?: Service; // Pode incluir os detalhes do serviço global
    createdAt: string;
    updatedAt: string;
};

// NOVO: Tipo para Disponibilidade do Provedor
export type Availability = {
    id: string;
    providerId: string;
    dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    isAvailable: boolean;
    createdAt: string;
    updatedAt: string;
};

// NOVO: Tipo para Agendamento
export type Booking = {
    id: string;
    clientId: string;
    providerId: string;
    providerServiceId: string;
    scheduledDate: string; // Data do agendamento
    scheduledTime: string; // Hora do agendamento
    status: BookingStatus;
    totalPrice: number;
    notes?: string | null;
    address?: Address | null; // Endereço específico do agendamento
    client?: Client; // Detalhes do cliente
    provider?: Provider; // Detalhes do provedor
    service?: Service; // Detalhes do serviço global
    providerService?: ProviderService; // Detalhes do serviço oferecido pelo provedor
    createdAt: string;
    updatedAt: string;
};

// NOVO: Tipo para Transação Financeira
export type Transaction = {
    id: string;
    providerId?: string | null; // Pode ser nulo para transações da plataforma
    userId?: string | null; // Pode ser nulo para transações da plataforma
    amount: number;
    type: TransactionType;
    status: string; // Ex: 'completed', 'pending', 'failed'
    description?: string | null;
    createdAt: string;
    bookingId?: string | null;
    gatewayTransactionId?: string | null;
    qrCodeUrl?: string | null;
    transactionRef?: string | null;
    couponId?: string | null;
};

// NOVO: Tipo para Solicitação de Saque
export type WithdrawalRequest = {
    id: string;
    providerId: string;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestedAt: string;
    processedAt?: string | null;
    provider?: Provider; // Detalhes do provedor
};

// NOVO: Tipo para Disputa
export type Dispute = {
    id: string;
    bookingId: string;
    reporterUserId: string;
    reason: DisputeReason;
    description: string;
    refundAmountProposed?: number | null;
    attachments?: string[];
    status: DisputeStatus;
    resolutionNotes?: string | null;
    resolvedByUserId?: string | null;
    resolvedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    messages?: DisputeMessage[]; // Mensagens da disputa
    booking?: Booking; // Detalhes do agendamento
    reporterUser?: AuthUser; // Detalhes do usuário que reportou
};

// NOVO: Tipo para Mensagem de Disputa
export type DisputeMessage = {
    id: string;
    disputeId: string;
    senderUserId: string;
    content: string;
    createdAt: string;
    sender?: AuthUser; // Detalhes do remetente
};

// NOVO: Tipo para Assinatura
export type Subscription = {
    id: string;
    clientId: string;
    providerId: string;
    providerServiceId: string;
    frequency: SubscriptionFrequency;
    startDate: string;
    endDate?: string | null;
    status: SubscriptionStatus;
    totalPrice: number;
    nextGenerationDate: string;
    createdAt: string;
    updatedAt: string;
    client?: Client;
    provider?: Provider;
    providerService?: ProviderService;
    generatedBookings?: Booking[];
};

// NOVO: Tipo para Cupom
export type Coupon = {
    id: string;
    code: string;
    type: CouponType;
    value: number;
    validFrom: string;
    validUntil: string;
    maxUses?: number | null;
    usesCount: number;
    target: CouponTarget;
    targetId?: string | null; // ID do serviço/provedor específico
    status: CouponStatus;
    createdAt: string;
    updatedAt: string;
};

// NOVO: Tipo para Reclamação de Garantia
export type GuaranteeClaim = {
    id: string;
    bookingId: string;
    clientId: string;
    providerId: string;
    description: string;
    attachments?: string[];
    estimatedValue?: number | null;
    resolvedValue?: number | null;
    status: ClaimStatus;
    resolutionNotes?: string | null;
    resolvedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    booking?: Booking;
    client?: Client;
    provider?: Provider;
};

// NOVO: Tipo para Regra de Precificação Dinâmica
export type PricingRule = {
    id: string;
    zoneId?: string | null;
    dayOfWeek?: number | null; // 0 (Sunday) to 6 (Saturday)
    startTime?: string | null; // HH:mm
    endTime?: string | null; // HH:mm
    demandThreshold?: number | null;
    surgeFactor: number; // Ex: 1.25 para 25% de aumento
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

// NOVO: Tipo para Alerta de Pânico
export type PanicAlert = {
    id: string;
    userId: string;
    latitude: number;
    longitude: number;
    message?: string | null;
    status: string; // Ex: 'ACTIVE', 'RESOLVED'
    createdAt: string;
    user?: AuthUser; // Detalhes do usuário
};

// NOVO: Tipo para Relatório de Incidente
export type Incident = {
    id: string;
    reporterId: string;
    bookingId?: string | null;
    type: IncidentType;
    description: string;
    attachments?: string[];
    status: IncidentStatus;
    resolution?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    reporter?: AuthUser;
    booking?: Booking;
};

// NOVO: Tipo para Consentimento do Usuário (LGPD)
export type UserConsent = {
    userId: string;
    documentType: string; // Ex: 'TERMS_OF_SERVICE', 'PRIVACY_POLICY'
    version: string;
    consentedAt: string;
    user?: AuthUser;
};

// NOVO: Tipo para Solicitação de Exportação/Exclusão de Dados (LGPD)
export type DataRequest = {
    id: string;
    userId: string;
    type: 'EXPORT' | 'DELETION';
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    requestedAt: string;
    processedAt?: string | null;
    user?: AuthUser;
    reason?: string | null; // Para solicitações de exclusão
};

// NOVO: Tipo para Análise de Avaliações
export type DetailedRatingBreakdown = {
    averageRating: number;
    totalReviews: number;
    fiveStar: { count: number; percentage: number };
    fourStar: { count: number; percentage: number };
    threeStar: { count: number; percentage: number };
    twoStar: { count: number; percentage: number };
    oneStar: { count: number; percentage: number };
};

// NOVO: Tipo para Sugestões Inteligentes (IA)
export type SmartSuggestion = {
    id: string;
    providerId: string;
    type: 'PRICING' | 'AVAILABILITY' | 'SERVICE_OPTIMIZATION' | 'MARKETING';
    title: string;
    description: string;
    actionable: boolean;
    createdAt: string;
    status: 'PENDING' | 'APPLIED' | 'DISMISSED';
};

// NOVO: Tipo para Monitoramento de Fila/Worker
export type QueueInfo = {
    name: string;
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
};

export type QueueJob = {
    id: string;
    name: string;
    data: any;
    status: 'active' | 'waiting' | 'completed' | 'failed' | 'delayed';
    progress: number;
    attemptsMade: number;
    failedReason?: string;
    createdAt: string;
    finishedAt?: string;
};