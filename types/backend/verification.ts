// app/types/backend/verification.ts

// Espelha o enum VerificationStatus do backend
export enum VerificationStatus {
  PENDING_INITIAL_REVIEW = 'PENDING_INITIAL_REVIEW',
  PENDING_DOCUMENTS_UPLOAD = 'PENDING_DOCUMENTS_UPLOAD',
  PENDING_BACKGROUND_CHECK = 'PENDING_BACKGROUND_CHECK',
  PENDING_MANUAL_REVIEW = 'PENDING_MANUAL_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED',
}

// Para o endpoint POST /verification/cpf
export interface SubmitCpfRequest {
  cpf: string;
}

// Para o endpoint POST /verification/documents/identity
// O arquivo é enviado via FormData, então a interface é mais para metadados se houver
export enum DocumentPhotoType {
  FRONT = 'FRONT',
  BACK = 'BACK',
}

// Para o endpoint POST /verification/documents/selfie
// O arquivo é enviado via FormData
// Nenhuma propriedade adicional além do arquivo é necessária por enquanto

// Respostas genéricas do backend
export interface VerificationResponse {
  message: string;
  // Você pode adicionar outros campos, como o status atualizado do provedor, se o backend retornar
  // currentStatus?: VerificationStatus;
}

// Se você precisar de uma interface para o objeto Provider com o status de verificação
export interface ProviderVerificationInfo {
  id: string;
  fullName: string;
  email: string;
  verificationStatus: VerificationStatus;
  documentPhotoFrontUrl?: string;
  documentPhotoBackUrl?: string;
  selfieWithDocumentUrl?: string;
  rejectionReason?: string;
  // ... outros campos relevantes do provedor
}