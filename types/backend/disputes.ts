// types/backend/disputes.ts

/**
 * @description Enum para o motivo da disputa
 * Deve corresponder ao enum DisputeReason no seu schema.prisma
 */
export enum DisputeReason {
  SERVICE_NOT_PERFORMED = 'SERVICE_NOT_PERFORMED',
  SERVICE_INCOMPLETE = 'SERVICE_INCOMPLETE',
  QUALITY_ISSUES = 'QUALITY_ISSUES',
  PROVIDER_DID_NOT_SHOW = 'PROVIDER_DID_NOT_SHOW',
  CLIENT_DID_NOT_SHOW = 'CLIENT_DID_NOT_SHOW',
  OTHER = 'OTHER',
}

/**
 * @description Interface para o modelo Dispute (como retornado pelo backend/banco de dados)
 */
export interface Dispute {
  id: string;
  bookingId: string;
  reporterUserId: string;
  reason: DisputeReason;
  description: string;
  refundAmountProposed?: number; // Decimal no Prisma é number em TS
  attachments?: string[]; // URLs de anexos/evidências
  status: string; // Ex: "PENDING_REVIEW", "RESOLVED", "REJECTED"
  resolutionNotes?: string;
  resolvedAt: string; // CORREÇÃO: DateTime do Prisma é string em TS, e não opcional se a disputa for resolvida
  createdAt: string; // DateTime do Prisma é string em TS
  updatedAt: string; // DateTime do Prisma é string em TS

  // Opcional: Incluir detalhes do booking ou dos usuários envolvidos
  booking?: {
    id: string;
    // outros campos relevantes do booking
  };
  reporterUser?: {
    id: string;
    email: string;
    fullName?: string;
  };
}

/**
 * @description DTO para reportar uma nova disputa (enviado ao backend)
 */
export interface ReportDisputeDto {
  reason: DisputeReason;
  description: string;
  refundAmountProposed?: number;
  attachments?: string[]; // URLs de anexos/evidências
}

/**
 * @description DTO para a resposta de uma disputa (retornado pelo backend)
 */
export interface DisputeResponse {
  dispute: Dispute;
}