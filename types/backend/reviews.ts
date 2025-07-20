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
  serviceName?: string;
  providerName?: string;
  providerId?: string; // <--- ADICIONADO: ID do provedor, opcional
  // bookId?: string; // Se o review está ligado a um agendamento específico
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
  targetId: string;
  reviewerId: string; // Quem fez a avaliação
  rating: number;
  comment: string;
  createdAt: string; // ISO string
  type: 'service' | 'provider_profile' | 'app_feedback';
  // Inclua outras propriedades que o backend pode retornar (ex: detalhes do cliente/provedor avaliado)
}