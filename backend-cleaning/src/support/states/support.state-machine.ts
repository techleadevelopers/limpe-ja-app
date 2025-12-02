// src/support/states/support.state-machine.ts

import { SupportTicketStatus } from '@prisma/client'; // Importa o enum do Prisma

interface Transition {
  from: SupportTicketStatus | SupportTicketStatus[];
  to: SupportTicketStatus;
}

export const supportTicketTransitions: Transition[] = [
  { from: SupportTicketStatus.OPEN, to: SupportTicketStatus.IN_PROGRESS },
  { from: SupportTicketStatus.OPEN, to: SupportTicketStatus.CLOSED }, // Cliente pode fechar
  {
    from: SupportTicketStatus.IN_PROGRESS,
    to: SupportTicketStatus.WAITING_USER,
  },
  { from: SupportTicketStatus.IN_PROGRESS, to: SupportTicketStatus.RESOLVED },
  {
    from: SupportTicketStatus.WAITING_USER,
    to: SupportTicketStatus.IN_PROGRESS,
  }, // Cliente respondeu
  { from: SupportTicketStatus.WAITING_USER, to: SupportTicketStatus.CLOSED }, // Cliente pode fechar
  { from: SupportTicketStatus.RESOLVED, to: SupportTicketStatus.CLOSED },
  { from: SupportTicketStatus.RESOLVED, to: SupportTicketStatus.IN_PROGRESS }, // Cliente reabriu
  // { from: SupportTicketStatus.ESCALATED, to: SupportTicketStatus.IN_PROGRESS }, // Se você tiver status ESCALATED
];

export class SupportStateMachine {
  canTransition(
    currentStatus: SupportTicketStatus,
    newStatus: SupportTicketStatus,
  ): boolean {
    return supportTicketTransitions.some((transition) => {
      const fromStatuses = Array.isArray(transition.from)
        ? transition.from
        : [transition.from];
      return (
        fromStatuses.includes(currentStatus) && transition.to === newStatus
      );
    });
  }

  // Opcional: método para obter o próximo status com base em um "evento" implícito
  // getNextStatus(currentStatus: SupportTicketStatus, event: SupportTicketEvent): SupportTicketStatus { ... }
}
