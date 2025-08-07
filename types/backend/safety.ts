// LimpeJaApp/src/types/backend/safety.ts
export enum PanicType {
  MEDICAL = 'MEDICAL',
  THREAT = 'THREAT',
  ACCIDENT = 'ACCIDENT',
  OTHER = 'OTHER',
}

export enum IncidentType {
  DAMAGE = 'DAMAGE',
  MISCONDUCT = 'MISCONDUCT',
  THEFT = 'THEFT',
  NO_SHOW = 'NO_SHOW',
  OTHER = 'OTHER',
}

export enum IncidentStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export interface ReportPanicDto {
  type: PanicType;
  latitude: number;
  longitude: number;
  message?: string;
}

export interface MessageResponse {
  message: string;
}

export interface IncidentReportDto {
  type: IncidentType;
  description: string;
  bookingId?: string;
  involvedUsers?: string[]; // CORREÇÃO: Array de user IDs
  attachments?: string[]; // CORREÇÃO: URLs of uploaded files
}

export interface Incident {
  id: string;
  reporterId: string;
  bookingId?: string;
  type: IncidentType;
  description: string;
  attachments?: string[];
  status: IncidentStatus;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface PanicAlert {
  id: string;
  userId: string;
  latitude: number; // CORREÇÃO: Decimal no Prisma é number aqui
  longitude: number; // CORREÇÃO: Decimal no Prisma é number aqui
  message?: string;
  status: string; // "ACTIVE", "RESOLVED", "FALSE_ALARM"
  createdAt: string;
}