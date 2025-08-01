// admin-web/src/lib/types.ts

// Enums compartilhadas com o backend
export enum VerificationStatus {
    PENDING_DOCUMENTS_UPLOAD = "PENDING_DOCUMENTS_UPLOAD",
    PENDING_MANUAL_REVIEW = "PENDING_MANUAL_REVIEW",
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
    totalEarnings: string;
    latitude?: string | null; // Tornando opcional, pois nem todos os mocks tinham
    longitude?: string | null; // Tornando opcional
    createdAt: string; // Alterado para string para corresponder ao formato JSON da API
    updatedAt: string; // Alterado para string
    // Adicionando propriedades que são usadas na UI, mas não estavam na interface
    city?: string;
    specialties?: string[];
    jobsCompleted?: number; // Usado em verification-modal.tsx
};

export type Activity = {
    id: string;
    type: ActivityType;
    description: string;
    entityId?: string | null;
    entityType?: string | null;
    status?: string | null;
    createdAt: string; // Alterado para string
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