// src/notifications/dto/create-notification.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsObject,
  IsISO8601,
  IsInt,
} from 'class-validator'; // Added IsObject, IsISO8601

export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID do usuário que receberá a notificação',
    example: 'uuid-do-usuario',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Tipo da notificação (ex: BOOKING_UPDATE, NEW_MESSAGE)',
    example: 'BOOKING_UPDATE',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Mensagem da notificação',
    example: 'Seu agendamento foi confirmado!',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'URL para onde a notificação deve redirecionar no frontend',
    example: '/app/bookings/123',
  })
  @IsOptional()
  @IsString()
  targetUrl?: string;

  @ApiPropertyOptional({
    description: 'Título da notificação (usado em push ou in-app)',
    example: 'Agendamento Confirmado!',
  })
  @IsOptional()
  @IsString()
  title?: string; // NEW: Added title

  @ApiPropertyOptional({
    description: 'URL da imagem associada à notificação',
    example: 'https://example.com/image.png',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string; // NEW: Added imageUrl

  @ApiPropertyOptional({
    description: 'Botões de ação para a notificação (JSON)',
    type: 'object',
    example: {
      primary: {
        text: 'Ver',
        action: 'view_booking',
        data: { bookingId: '123' },
      },
    },
    additionalProperties: true, // FIX: Added for Swagger compatibility with object type
  })
  @IsOptional()
  @IsObject()
  actionButtons?: object; // NEW: Added actionButtons (using object for flexibility)

  @ApiPropertyOptional({
    description: 'Categoria da notificação (ex: booking, payment, dispute)',
    example: 'booking',
  })
  @IsOptional()
  @IsString()
  category?: string; // NEW: Added category for better filtering/UI handling

  @ApiPropertyOptional({
    description: 'Chave idempotente para evitar duplicação em webhooks/queues',
    example: 'payment_confirmed:booking-123',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiPropertyOptional({
    description: 'Chave de deduplicação do AppEvent (ex: type:bookingId:userId)',
    example: 'BOOKING_UPDATED:booking-123:client-456',
  })
  @IsOptional()
  @IsString()
  dedupeKey?: string;

  @ApiPropertyOptional({
    description: 'Identificador de entidade relacionada (bookingId, messageId, etc.)',
    example: 'booking-123',
  })
  @IsOptional()
  @IsString()
  relatedId?: string;

  @ApiPropertyOptional({
    description: 'Carga adicional de metadados (payload do AppEvent)',
    type: 'object',
    example: { bookingId: 'booking-123', channel: 'chat' },
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'TTL em segundos do AppEvent (para stream/fallback)',
    example: 300,
  })
  @IsOptional()
  @IsInt()
  ttlSeconds?: number;

  @ApiPropertyOptional({
    description: 'Data/hora do serviço confirmado (ex: para banners e filtros)',
    example: '2025-12-25T14:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;
}
