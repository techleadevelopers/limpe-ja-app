// LimpeJaApp/src/types/backend/services.ts

/**
 * @enum PricingType
 * Enumeração para o tipo de precificação do serviço.
 */
export enum PricingType {
  FIXED_PRICE = 'FIXED_PRICE', HOURLY = 'HOURLY', BY_SIZE = 'BY_SIZE', CUSTOM_QUOTE = 'CUSTOM_QUOTE'
}

/**
 * @interface Service
 * Representa um tipo de serviço oferecido na plataforma (ex: "Limpeza de Casa").
 * Retornado por GET /services.
 */
export interface Service {
  id: string;
  name: string; // Mantido 'name' se o backend de serviços usa 'name'
  icon?: string; // Ex: nome do ícone para o frontend (opcional agora)
  backgroundColor?: string | null; // Ex: cor para o card da categoria, permitir null
  description?: string | null; // Adicionar se existir no backend, permitir null
  price?: number | null; // Preço de referência da categoria de serviço (se existir no Service model) (CORREÇÃO: Decimal no Prisma é number aqui)
}

/**
 * @type ServiceDetails
 * Alias para Service, usado para importações em outros módulos.
 */
export type ServiceDetails = Service; // <--- CORREÇÃO: Nova exportação
