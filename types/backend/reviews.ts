// LimpeJaApp/src/types/backend/reviews.ts

/**
 * @interface SubmitReviewDto
 * DTO para enviar uma avaliação/feedback (POST /reviews).
 */
export interface SubmitReviewDto {
  targetId: string; // ID do serviço, provedor, ou app
  type: 'service' | 'provider_profile' | 'app_feedback'; // Tipo de feedback
  rating: number; // Avaliação por estrelas (1-5)
  comment: string; // Comentário/feedback textual
  userId: string; // ID do usuário que está enviando o feedback (cliente)

  // Se o backend espera esses dados para contexto, inclua
  serviceName?: string | null; // Permitir null
  providerName?: string | null; // Permitir null
  providerId?: string | null; // ADICIONADO: ID do provedor, opcional, permitir null
  bookingId?: string | null; // Se o review está ligado a um agendamento específico, permitir null
}

/**
 * @interface ReviewEntity
 * Representa uma entidade de avaliação conforme retornada pelo backend.
 * NOTA: Esta interface não contém a propriedade 'client', que é o foco do erro.
 * O componente ReviewCard deve estar esperando uma estrutura diferente ou
 * a 'client' é adicionada em tempo de execução ou por outra interface.
 */
export interface ReviewEntity {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string; // Ou Date, dependendo de como o backend envia
  updatedAt: string; // Ou Date
  bookingId: string; // <<-- CORREÇÃO: Adicionado bookingId
  clientId: string;  // <<-- CORREÇÃO: Adicionado clientId
  providerId: string; // <<-- CORREÇÃO: Adicionado providerId
  client?: { // <<-- CORREÇÃO: Adicionado client
    fullName: string;
    user?: {
      avatarUrl?: string | null;
    } | null;
  } | null;
  // Adicione quaisquer outras propriedades que ReviewEntity possa ter
}