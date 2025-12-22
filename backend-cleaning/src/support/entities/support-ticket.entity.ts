// src/support/entities/support-ticket.entity.ts

// Apenas a seção de enums é relevante para o erro de sintaxe TypeScript
enum SupportTicketStatus {
  OPEN,
  IN_PROGRESS,
  WAITING_USER,
  RESOLVED,
  CLOSED,
  ESCALATED, // Opcional, se você quiser um status para tickets escalados
}

enum SupportTicketCategory {
  PAYMENT,
  QUALITY,
  APP,
  OTHER,
}

// Os modelos Prisma abaixo são sintaxe do schema.prisma e não do TypeScript,
// mas são mantidos aqui para contexto, caso você os esteja usando em um ORM ou similar.
// Se este arquivo for estritamente um arquivo de entidade TypeScript,
// e não uma parte do seu schema.prisma, você precisaria de classes ou interfaces
// que representem esses modelos, e não a sintaxe `model`.
// No entanto, o erro reportado é especificamente sobre a sintaxe do enum.

/*
// Se este arquivo for o seu schema.prisma, a sintaxe estaria correta para Prisma,
// mas o erro indica que o compilador TypeScript está tentando parsear isso como TS.
// Se for um arquivo .ts, você não pode ter `model` aqui.
// Apenas para ilustrar como seria se fossem classes/interfaces TS:

// import { User, Booking, UserRole } from '@prisma/client'; // Exemplo de importação de tipos Prisma

// export class SupportTicket {
//   id: string;
//   userId: string;
//   user: User;
//   role: UserRole;
//   subject: string;
//   category: SupportTicketCategory;
//   description: string;
//   bookingId?: string;
//   booking?: Booking;
//   status: SupportTicketStatus;
//   assignedToId?: string;
//   assignedTo?: User;
//   createdAt: Date;
//   updatedAt: Date;
//   closedAt?: Date;
//   messages: SupportMessage[];
//   slaLogs: SupportSlaLog[];
// }

// export class SupportMessage {
//   id: string;
//   ticketId: string;
//   ticket: SupportTicket;
//   userId: string;
//   user: User;
//   role: UserRole;
//   body: string;
//   attachments: string[];
//   createdAt: Date;
// }

// export class SupportSlaLog {
//   id: string;
//   ticketId: string;
//   ticket: SupportTicket;
//   fromStatus: SupportTicketStatus;
//   toStatus: SupportTicketStatus;
//   createdAt: Date;
// }

*/
