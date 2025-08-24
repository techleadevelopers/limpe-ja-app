// LimpeJaApp/src/types/backend/faqs.ts

/**
 * @interface FAQItem
 * Representa uma pergunta frequente (FAQ) e sua resposta, vinda do backend.
 * Alinhado com o que a tela de ajuda espera exibir.
 */
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  keywords?: string[];
  category?: string;
  order?: number;
}