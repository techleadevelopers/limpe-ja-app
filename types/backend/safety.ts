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
  accuracy?: number; // NOVO
  source?: 'FAB' | 'MENU' | 'AUTO'; // NOVO
}

export interface MessageResponse {
  message: string;
}

export interface IncidentReportDto {
  type: IncidentType;
  description: string;
  bookingId?: string;
  involvedUsers?: string[];
  attachments?: string[];
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
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PanicAlert {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  message?: string;
  status: string;
  createdAt: string;
}

/**
 * NOVO: Evento de pânico.
 */
export interface PanicEvent {
  id: string;
  status: 'ACTIVE' | 'ENDED';
  startedAt: string;
}

/**
 * NOVO: Relatório de incidente.
 */
export interface IncidentReport {
  id: string;
  panicId: string;
  description: string;
  attachments?: string[];
}