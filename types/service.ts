// LimpeJaApp/src/types/service.ts

// Representa um tipo de serviço que um provedor pode oferecer
export interface ServiceOffering {
  id: string;          // ID único do tipo de serviço oferecido pelo provedor
  providerId: string;  // ID do provedor que oferece este serviço
  name: string;        // Ex: "Limpeza Padrão Residencial", "Passar Roupa"
  description?: string;
  priceType: 'hourly' | 'fixed' | 'per_item' | 'quote'; // por hora, preço fixo, por peça, orçamento
  priceValue?: number;  // Valor (se aplicável, ex: R$ 50 para por hora)
  currency: string;    // Ex: "BRL"
  estimatedDurationMinutes?: number; // Duração estimada em minutos (para serviços por hora ou fixos)
  itemsIncluded?: string[]; // O que está incluído (ex: "Limpeza de banheiros", "Tirar pó")
  additionalDetails?: string; // Outros detalhes relevantes
  isActive: boolean;     // Se o provedor está atualmente oferecendo este serviço
}

// Representa o perfil de serviço mais amplo de um provedor (pode conter múltiplas ServiceOfferings)
export interface ProviderServiceProfile {
  providerId: string;
  bio?: string;
  yearsOfExperience?: number;
  specialties?: string[]; // Ex: "Limpeza pós-obra", "Produtos ecológicos"
  areasServed?: string[]; // Lista de bairros, cidades ou um raio
  ratingsAverage?: number;
  totalReviews?: number;
  isVerified?: boolean;
  // offeredServices: ServiceOffering[]; // Poderia ser uma sub-coleção ou buscado separadamente
}