import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus, UserRole } from '@prisma/client';
import { BookingDetailsDto } from './booking-details.dto';
import { BookingWithDetailsRelations } from '../bookings.service';

const PENDING_STATUSES = new Set<BookingStatus>([
  BookingStatus.PENDING,
  BookingStatus.PENDING_PROVIDER_CONFIRMATION,
]);
const CHAT_STATUSES = new Set<BookingStatus>([BookingStatus.CONFIRMED]);

function computeBadgeLabel(status: BookingStatus, fallback?: string): string {
  if (status === BookingStatus.PENDING_PROVIDER_CONFIRMATION) {
    return 'Nova Solicitação';
  }
  if (status === BookingStatus.PENDING) {
    return 'Nova Solicitação';
  }
  if (status === BookingStatus.CONFIRMED) {
    return 'Confirmado';
  }
  return fallback || 'Agendado';
}

export interface BookingViewOptions {
  userRole?: UserRole;
}

export class BookingViewDto extends BookingDetailsDto {
  @ApiProperty({
    description:
      'Texto exibido no badge que indica o estado resumido do agendamento.',
    example: 'Nova Solicitação',
  })
  badgeLabel: string;

  @ApiProperty({
    description: 'Define se os botões Aceitar/Recusar devem aparecer.',
    example: true,
  })
  showAcceptRejectActions: boolean;

  @ApiProperty({
    description:
      'Define se o botão de chat deve ficar visível para o provedor.',
    example: true,
  })
  showChatAction: boolean;

  constructor(
    source: BookingWithDetailsRelations,
    options: BookingViewOptions = {},
  ) {
    super(source);
    this.badgeLabel = computeBadgeLabel(source.status, this.statusLabel);
    const role = options.userRole;
    this.showAcceptRejectActions =
      role === UserRole.PROVIDER && PENDING_STATUSES.has(source.status);
    this.showChatAction =
      role === UserRole.PROVIDER && CHAT_STATUSES.has(source.status);
  }
}
