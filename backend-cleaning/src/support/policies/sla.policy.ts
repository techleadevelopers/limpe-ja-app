// src/support/policies/sla.policy.ts

import { Injectable } from '@nestjs/common';
import { SupportTicketCategory } from '@prisma/client';

@Injectable()
export class SupportSlaPolicy {
  // Define o SLA em horas para cada categoria
  private readonly slaHours: Record<SupportTicketCategory, number> = {
    [SupportTicketCategory.PAYMENT]: 24, // 24 horas
    [SupportTicketCategory.QUALITY]: 48, // 48 horas
    [SupportTicketCategory.APP]: 72, // 72 horas
    [SupportTicketCategory.OTHER]: 48, // 48 horas
  };

  /**
   * Calcula a data de vencimento do SLA para uma determinada categoria de ticket.
   * @param category A categoria do ticket.
   * @returns A data e hora de vencimento do SLA.
   */
  getSlaDueDate(category: SupportTicketCategory): Date | null {
    const hours = this.slaHours[category];
    if (hours === undefined) {
      return null; // Nenhuma SLA definida para esta categoria
    }

    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + hours);
    return dueDate;
  }

  // Outras regras de SLA podem ser adicionadas aqui, como prioridades, horários de trabalho, etc.
}