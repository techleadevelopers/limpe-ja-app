export type VerificationStatus =
  | "APPROVED"
  | "REJECTED"
  | "PENDING_MANUAL_REVIEW"
  | "PENDING_DOCUMENTS_UPLOAD"
  | "BLOCKED";

export interface BaseRecord {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface User extends BaseRecord {
    username: string;
    password: string;
    email: string;
    name?: string;
    status?: "active" | "inactive" | "blocked";
    role?: string;
}

export interface InsertUser {
  username: string;
  password: string;
  email: string;
  name?: string;
  role?: string;
}

export interface Provider extends BaseRecord {
    userId: string;
    name: string;
    email: string;
    phone?: string | null;
    verificationStatus: VerificationStatus;
  documentPhotoFrontUrl?: string | null;
  documentPhotoBackUrl?: string | null;
  selfieWithDocumentUrl?: string | null;
  rejectionReason?: string | null;
  ocrResult?: Record<string, unknown> | null;
  livenessResult?: Record<string, unknown> | null;
  fiveStarReviewCount: number;
  monthlyBookingsCount: number;
  totalEarnings: string;
    latitude?: string | null;
    longitude?: string | null;
}

export interface InsertProvider {
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  verificationStatus?: VerificationStatus;
  documentPhotoFrontUrl?: string | null;
  documentPhotoBackUrl?: string | null;
  selfieWithDocumentUrl?: string | null;
  rejectionReason?: string | null;
  ocrResult?: Record<string, unknown> | null;
  livenessResult?: Record<string, unknown> | null;
  fiveStarReviewCount?: number;
  monthlyBookingsCount?: number;
  totalEarnings?: string;
  latitude?: string | null;
  longitude?: string | null;
}

export interface Service extends BaseRecord {
    name: string;
    description?: string | null;
    isActive: boolean;
}

export interface InsertService {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface Booking extends BaseRecord {
    providerId: string;
    clientId: string;
    status: string;
    commissionAmount?: string | null;
    completedAt?: Date | null;
}

export interface InsertBooking {
  providerId: string;
  clientId: string;
  status?: string;
  commissionAmount?: string | null;
}

export interface Activity extends BaseRecord {
  type: string;
  description: string;
  entityId: string | null;
  entityType: string | null;
  status: string | null;
}

export interface InsertActivity {
  type: string;
  description: string;
  entityId?: string | null;
  entityType?: string | null;
  status?: string;
}
