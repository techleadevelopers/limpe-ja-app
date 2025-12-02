// src/notifications/entities/notification.entity.ts
import { Notification as PrismaNotification, Prisma } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationEntity implements PrismaNotification {
  @ApiProperty({
    description: 'ID da notificação',
    example: 'uuid-da-notificacao',
  })
  id: string;

  @ApiProperty({
    description: 'ID do usuário que recebeu a notificação',
    example: 'uuid-do-usuario',
  })
  userId: string;

  @ApiProperty({
    description: 'Tipo da notificação (e.g., BOOKING_CONFIRMED, NEW_MESSAGE)',
    example: 'BOOKING_CONFIRMED',
  })
  type: string;

  @ApiProperty({
    description: 'Conteúdo da mensagem da notificação',
    example: 'Seu agendamento foi confirmado!',
  })
  message: string;

  @ApiProperty({
    description: 'Indica se a notificação foi lida',
    example: false,
  })
  isRead: boolean;

  @ApiPropertyOptional({
    description: 'URL para navegação no aplicativo ao clicar na notificação',
    example: '/app/bookings/123',
  })
  targetUrl: string | null;

  @ApiProperty({
    description: 'Data e hora de criação da notificação',
    example: '2025-06-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'URL da imagem associada à notificação',
    example: 'https://example.com/notification-image.jpg',
  })
  imageUrl: string | null;

  @ApiPropertyOptional({
    description: 'Botões de ação da notificação (JSON)',
    example: [{ label: 'Ver', action: 'view' }],
  })
  actionButtons: Prisma.JsonValue | null;

  @ApiPropertyOptional({
    description: 'Título da notificação',
    example: 'Agendamento Confirmado!',
  })
  title: string | null;

  @ApiPropertyOptional({
    description: 'Categoria da notificação (ex: booking, payment, dispute)',
    example: 'booking',
  })
  category: string | null; // NEW: Added category property

  // Campos premium adicionados pelo schema: idempotencyKey, scheduledAt, priority, readAt
  idempotencyKey: string | null;
  scheduledAt: Date | null;
  priority: number | null;
  readAt: Date | null;

  constructor(partial: Partial<PrismaNotification>) {
    Object.assign(this, partial);
  }
}
