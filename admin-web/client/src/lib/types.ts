// admin-web/src/lib/types.ts

// Enums compartilhadas com o backend
export enum VerificationStatus {
    PENDING_DOCUMENTS_UPLOAD = "PENDING_DOCUMENTS_UPLOAD",
    PENDING_MANUAL_REVIEW = "PENDING_MANUAL_REVIEW",
    PENDING_INITIAL_REVIEW = "PENDING_INITIAL_REVIEW",
    PENDING_BACKGROUND_CHECK = "PENDING_BACKGROUND_CHECK",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    BLOCKED = "BLOCKED",
}

export enum ActivityType {
    PROVIDER_STATUS_CHANGE = "PROVIDER_STATUS_CHANGE",
    PROVIDER_REGISTRATION = "PROVIDER_REGISTRATION",
    BOOKING_COMPLETED = "BOOKING_COMPLETED",
    PAYMENT_PROCESSED = "PAYING_PROCESSED",
    NEW_DISPUTE = "NEW_DISPUTE",
    COUPON_CREATED = "COUPON_CREATED",
    SUBSCRIPTION_STARTED = "SUBSCRIPTION_STARTED",
    SAFETY_ALERT = "SAFETY_ALERT",
}

export enum PricingType {
    FIXED_PRICE = "FIXED_PRICE",
    HOURLY = "HOURLY",
    BY_SIZE = "BY_SIZE",
    CUSTOM_QUOTE = "CUSTOM_QUOTE",
}

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
    NO_SHOW = "NO_SHOW",
}

export enum TransactionType {
    PAYMENT = "PAYMENT",
    WITHDRAWAL = "WITHDRAWAL",
    COMMISSION = "COMMISSION",
    REFUND = "REFUND",
}

export enum DisputeReason {
    SERVICE_NOT_PERFORMED = "SERVICE_NOT_PERFORMED",
    SERVICE_INCOMPLETE = "SERVICE_INCOMPLETE",
    QUALITY_ISSUES = "QUALITY_ISSUES",
    PROVIDER_DID_NOT_SHOW = "PROVIDER_DID_NOT_SHOW",
    CLIENT_DID_NOT_SHOW = "CLIENT_DID_NOT_SHOW",
    OTHER = "OTHER",
}

export enum DisputeStatus {
    PENDING = "PENDING",
    IN_REVIEW = "IN_REVIEW",
    RESOLVED = "RESOLVED",
    REJECTED = "REJECTED",
}

export enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    CANCELED = "CANCELED",
    COMPLETED = "COMPLETED",
}

export enum SubscriptionFrequency {
    WEEKLY = "WEEKLY",
    BI_WEEKLY = "BI_WEEKLY",
    MONTHLY = "MONTHLY",
}

export enum IncidentType {
    DAMAGE = "DAMAGE",
    MISCONDUCT = "MISCONDUCT",
    THEFT = "THEFT",
    NO_SHOW = "NO_SHOW",
    OTHER = "OTHER",
}

export enum IncidentStatus {
    PENDING_REVIEW = "PENDING_REVIEW",
    INVESTIGATING = "INVESTIGATING",
    RESOLVED = "RESOLVED",
    REJECTED = "REJECTED",
}

export enum CouponType {
    PERCENTAGE = "PERCENTAGE",
    FIXED_AMOUNT = "FIXED_AMOUNT",
}

export enum CouponTarget {
    ALL = "ALL",
    NEW_CLIENTS = "NEW_CLIENTS",
    SPECIFIC_SERVICE = "SPECIFIC_SERVICE",
    SPECIFIC_PROVIDER = "SPECIFIC_PROVIDER",
}

export enum CouponStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    EXPIRED = "EXPIRED",
    USED_UP = "USED_UP",
}

export enum ClaimStatus {
    PENDING = "PENDING",
    UNDER_REVIEW = "UNDER_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    SETTLED = "SETTLED",
}

// Enums para Missões
export enum MissionStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    COMPLETED = "COMPLETED",
    EXPIRED = "EXPIRED",
}

export enum MissionTargetAudience {
    ALL = "ALL",
    NEW_CLIENTS = "NEW_CLIENTS",
    SPECIFIC_PROVIDER = "SPECIFIC_PROVIDER",
    SPECIFIC_CLIENT = "SPECIFIC_CLIENT",
    SPECIFIC_SERVICE = "SPECIFIC_SERVICE",
}

// NOVO: Enum para o status da Indicação
export enum ReferralStatus {
    PENDING = "PENDING",
    CONVERTED = "CONVERTED", // Indicado realizou a primeira ação (ex: primeira reserva)
    REWARDED = "REWARDED",   // Recompensa emitida
    CANCELED = "CANCELED",   // Indicação cancelada
}

// NOVO: Enum para o status do PanicAlert (conforme README.md)
export enum PanicStatus {
    RECEIVED = 'RECEIVED',
    ACKED = 'ACKED',
    DISPATCHED = 'DISPATCHED',
    CLOSED = 'CLOSED',
}

export type Provider = {
    id: string;
    name?: string;
    fullName?: string;
    email: string;
    phone?: string | null;
    userPhone?: string | null;
    verificationStatus: VerificationStatus;
    documentPhotoFrontUrl?: string | null;
    documentPhotoBackUrl?: string | null;
    selfieWithDocumentUrl?: string | null;
    ocrResult?: any | null;
    livenessResult?: any | null;
    rejectionReason?: string | null;
    fiveStarReviewCount: number;
    monthlyBookingsCount: number;
    totalEarnings: string;
    latitude?: string | null;
    longitude?: string | null;
    address?: Address | null;
    createdAt: string;
    updatedAt: string;
    city?: string;
    specialties?: string[];
    jobsCompleted?: number;
    yearsOfExperience?: number;
    bio?: string;
    pixKey?: string;
    avatarUrl?: string;
    badges?: string[];
};

export type Client = {
    id: string;
    userId: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    role?: 'ADMIN' | 'CLIENT' | 'PROVIDER';
    phone?: string | null;
    cpf?: string | null;
    dateOfBirth?: string | null;
    address?: Address | null;
    completedBookingsCount: number;
    noShowCount: number;
    cancellationCount: number;
    totalSpent?: number | null;
    memberSince: string;
    status: 'active' | 'inactive' | 'blocked';
    lastActivity: string;
    lastLogin?: string | null;
    loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
    verificationStatus?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type Address = {
    id: string;
    cep: string;
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
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
export type RevenueTrendPoint = {
    month: string;
    revenue: number;
};


export type AuthUser = {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'CLIENT' | 'PROVIDER';
};

export type AuthResponse = {
    accessToken: string;
    user: AuthUser;
};

export type Service = {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    defaultPricingType?: PricingType | null;
    createdAt: string;
    updatedAt: string;
};

export type ProviderService = {
    id: string;
    providerId: string;
    serviceId: string;
    price: number;
    durationMinutes?: number | null;
    description?: string | null;
    pricingType: PricingType;
    pricePerHour?: number | null;
    pricePerSquareMeter?: number | null;
    pricePerRoom?: number | null;
    service?: Service;
    createdAt: string;
    updatedAt: string;
};

export type Availability = {
    id: string;
    providerId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    createdAt: string;
    updatedAt: string;
};

export type Booking = {
    id: string;
    clientId: string;
    providerId: string;
    providerServiceId: string;
    scheduledDate: string;
    scheduledTime: string;
    status: BookingStatus;
    totalPrice: number;
    notes?: string | null;
    address?: Address | null;
    client?: Client;
    provider?: Provider;
    service?: Service;
    providerService?: ProviderService;
    createdAt: string;
    updatedAt: string;
};

export type Transaction = {
    id: string;
    providerId?: string | null;
    userId?: string | null;
    amount: number;
    type: TransactionType;
    status: string;
    description?: string | null;
    createdAt: string;
    bookingId?: string | null;
    gatewayTransactionId?: string | null;
    qrCodeUrl?: string | null;
    transactionRef?: string | null;
    couponId?: string | null;
};

export type WithdrawalRequest = {
    id: string;
    providerId: string;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestedAt: string;
    processedAt?: string | null;
    provider?: Provider;
};

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
    messages?: DisputeMessage[];
    booking?: Booking;
    reporterUser?: AuthUser;
};

export type DisputeMessage = {
    id: string;
    disputeId: string;
    senderUserId: string;
    content: string;
    createdAt: string;
    sender?: AuthUser;
};

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
    targetId?: string | null;
    status: CouponStatus;
    createdAt: string;
    updatedAt: string;
};

export type Mission = {
    id: string;
    title: string;
    description: string;
    rewardAmount: number; // Valor da recompensa (ex: R$ ou pontos)
    rewardType: 'FIXED_AMOUNT' | 'POINTS'; // Tipo de recompensa
    status: MissionStatus;
    targetAudience: MissionTargetAudience;
    targetId?: string | null; // ID do alvo (cliente, provedor, serviço, etc.)
    startDate: string;
    endDate: string;
    timesCompleted: number; // Quantas vezes a missão foi completada
    maxCompletions?: number | null; // Limite de vezes que pode ser completada (0 para ilimitado)
    createdAt: string;
    updatedAt: string;
};

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

// Modificado PricingRule type para incluir campos do README
export type PricingRule = {
    id: string;
    scope: 'GLOBAL' | 'CITY' | 'CATEGORY' | 'SERVICE' | 'PROVIDER';
    refId?: string | null;
    kind: 'SURGE' | 'DISTANCE_FEE' | 'FLOOR' | 'CAP' | 'PACKAGE_DISCOUNT' | 'ABSOLUTE_ADJUST';
    valueType: 'MULTIPLIER' | 'FIXED' | 'PERCENT';
    value: number;
    maxEffect?: number | null;

    daysOfWeek?: number[] | null;
    timeStart?: string | null;
    timeEnd?: string | null;
    activeFrom?: string | null;
    activeTo?: string | null;

    priority?: number | null;
    isActive: boolean;
    description?: string | null;

    createdAt: string;
    updatedAt: string;
};

export type PanicAlert = {
    id: string;
    bookingId?: string | null; // Adicionado conforme README.md
    userId: string;
    role: 'CLIENT' | 'PROVIDER'; // Adicionado conforme README.md
    message?: string | null;
    locationLat?: number | null; // Renomeado de 'latitude' e tornado opcional/anulável
    locationLon?: number | null; // Renomeado de 'longitude' e tornado opcional/anulável
    status: PanicStatus; // Alterado para o enum PanicStatus
    ackByUserId?: string | null; // Adicionado conforme README.md
    ackAt?: string | null; // Adicionado conforme README.md (usando string para consistência de data)
    dispatchedAt?: string | null; // Adicionado conforme README.md
    closedAt?: string | null; // Adicionado conforme README.md
    createdAt: string;
    updatedAt?: string; // Adicionado para consistência, mesmo que não explicitamente no PanicAlert do README.md
    user?: AuthUser; // Mantido para conveniência do frontend
};

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

export type UserConsent = {
    userId: string;
    documentType: string;
    version: string;
    consentedAt: string;
    user?: AuthUser;
};

export type DataRequest = {
    id: string;
    userId: string;
    type: 'EXPORT' | 'DELETION';
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    requestedAt: string;
    processedAt?: string | null;
    user?: AuthUser;
    reason?: string | null;
};

export type DetailedRatingBreakdown = {
    averageRating: number;
    totalReviews: number;
    fiveStar: { count: number; percentage: number };
    fourStar: { count: number; percentage: number };
    threeStar: { count: number; percentage: number };
    twoStar: { count: number; percentage: number };
    oneStar: { count: number; percentage: number };
};

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

// --- Tipos adicionados para resolver os erros de importação ---

export type Review = {
    id: string;
    bookingId: string;
    rating: number;
    comment?: string | null;
    clientId: string;
    providerId: string;
    createdAt: string;
};

export type Offer = {
    id: string;
    title: string;
    description?: string | null;
    discountPercentage?: number | null; // Valor percentual do desconto
    fixedDiscountAmount?: number | null; // Valor fixo do desconto
    validUntil: string; // Data de validade
    imageUrl?: string | null; // URL da imagem da oferta
    createdAt: string;
    updatedAt: string;
    target: OfferTarget; // Público-alvo da oferta
    targetId?: string | null; // ID do alvo específico (serviço/provedor)
    status: OfferStatus; // Status da oferta
};

// NOVO: Tipo para o modelo de Indicação (Referral)
export type Referral = {
    id: string;
    referredUserId: string;
    referredUser?: { fullName?: string }; // Adicionado para exibir o nome no frontend
    referrerUserId: string;
    referrerUser?: { fullName?: string }; // Adicionado para exibir o nome no frontend
    referralCode?: string | null; // Código de indicação usado
    status: ReferralStatus; // Status da indicação
    createdAt: string;
    updatedAt: string;
    convertedAt?: string; // Data de conversão
    rewardIssued: boolean; // Se a recompensa foi emitida
    notes?: string; // Notas adicionais para o admin
};

// Modificado FAQItem type para incluir campos do README
export type FAQItem = {
    id: string;
    question: string;
    answer: string;
    audience?: 'CLIENT' | 'PROVIDER' | 'ALL';
    category?: string | null;
    tags?: string[] | null;
    language?: string;
    isActive: boolean;
    order?: number;
    createdAt: string;
    updatedAt: string;
};

export enum OfferTarget {
    GENERAL = "GENERAL",
    SPECIFIC_SERVICE = "SPECIFIC_SERVICE",
    SPECIFIC_PROVIDER = "SPECIFIC_PROVIDER",
    NEW_CLIENTS = "NEW_CLIENTS",
}

export enum OfferStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    EXPIRED = "EXPIRED",
}
