// LimpeJaApp/functions/src/types/payment.types.ts
import * as admin from "firebase-admin"; // Para Timestamp, se necessário em outros tipos de pagamento

// Tipos para o histórico de pagamentos/transações do usuário
export interface PaymentHistoryItem {
  id: string; // Pode ser o ID do agendamento, ID da solicitação de repasse, etc.
  type: 
    | "payment_made"          // Pagamento feito por um cliente por um serviço
    | "earning_received"      // Ganho recebido por um prestador por um serviço
    | "payout_requested"      // Solicitação de repasse feita por um prestador
    | "payout_completed"      // Repasse concluído para um prestador
    | "payout_failed"         // Falha no repasse para um prestador
    | "refund_processed";     // Reembolso processado para um cliente
  description: string;        // Ex: "Limpeza Residencial com Ana Oliveira" ou "Repasse de Saldo"
  amount: number;             // Valor em centavos (positivo para ganhos/repasses, negativo para pagamentos feitos)
  currency: string;           // Ex: "BRL"
  date: string;               // Data da transação/evento em formato ISO string
  status: string;             // Status da transação, ex: 'Concluído', 'Pendente', 'Falhou'
  details?: {                 // Detalhes adicionais dependendo do tipo
    bookingId?: string;
    providerId?: string;
    clientId?: string;
    payoutRequestId?: string;
    // Adicione outros campos conforme necessário
  };
  createdAt?: admin.firestore.Timestamp | admin.firestore.FieldValue; // Opcional
}

// Você pode adicionar outras interfaces relacionadas a pagamentos aqui, como:
// export interface PayoutRequest { ... }
// export interface PaymentIntentDetails { ... }