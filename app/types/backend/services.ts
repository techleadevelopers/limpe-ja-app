// LimpeJaApp/src/types/backend/services.ts

/**
 * @interface Service
 * Representa um tipo de serviço oferecido na plataforma (ex: "Limpeza de Casa").
 * Retornado por GET /services.
 */
export interface Service {
  id: string;
  name: string; // Mantido 'name' se o backend de serviços usa 'name'
  icon: string; // Ex: nome do ícone para o frontend
  backgroundColor?: string; // Ex: cor para o card da categoria
  description?: string; // Adicionar se existir no backend
}