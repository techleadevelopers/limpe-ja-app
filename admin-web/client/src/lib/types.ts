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
    PAYMENT_PROCESSED = "PAYMENT_PROCESSED",
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

export type Provider = {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
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
    phone?: string | null;
    cpf?: string | null;
    dateOfBirth?: string | null;
    address?: Address | null;
    completedBookingsCount: number;
    noShowCount: number;
    cancellationCount: number;
    memberSince: string;
    status: 'active' | 'inactive' | 'blocked';
    lastActivity: string;
    loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
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
    price: number;
    icon?: string | null;
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

export type PricingRule = {
    id: string;
    zoneId?: string | null;
    dayOfWeek?: number | null;
    startTime?: string | null;
    endTime?: string | null;
    demandThreshold?: number | null;
    surgeFactor: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type PanicAlert = {
    id: string;
    userId: string;
    latitude: number;
    longitude: number;
    message?: string | null;
    status: string;
    createdAt: string;
    user?: AuthUser;
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
    description: string;
    discountPercentage: number;
    validUntil: string;
};

export type Referral = {
    id: string;
    referrerId: string;
    referredId: string;
    status: 'pending' | 'completed' | 'canceled';
    createdAt: string;
};

export type FAQItem = {
    id: string;
    question: string;
    answer: string;
    category?: string | null;
    order: number;
};