// src/notifications/dto/create-notification.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsObject } from 'class-validator'; // Added IsObject

export class CreateNotificationDto {
  @ApiProperty({ description: 'ID do usuário que receberá a notificação', example: 'uuid-do-usuario' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Tipo da notificação (ex: BOOKING_UPDATE, NEW_MESSAGE)', example: 'BOOKING_UPDATE' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Mensagem da notificação', example: 'Seu agendamento foi confirmado!' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'URL para onde a notificação deve redirecionar no frontend', example: '/app/bookings/123' })
  @IsOptional()
  @IsString()
  targetUrl?: string;

  @ApiPropertyOptional({ description: 'Título da notificação (usado em push ou in-app)', example: 'Agendamento Confirmado!' })
  @IsOptional()
  @IsString()
  title?: string; // NEW: Added title

  @ApiPropertyOptional({ description: 'URL da imagem associada à notificação', example: 'https://example.com/image.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string; // NEW: Added imageUrl

  @ApiPropertyOptional({
    description: 'Botões de ação para a notificação (JSON)',
    type: 'object',
    example: { primary: { text: 'Ver', action: 'view_booking', data: { bookingId: '123' } } },
    additionalProperties: true, // FIX: Added for Swagger compatibility with object type
  })
  @IsOptional()
  @IsObject()
  actionButtons?: object; // NEW: Added actionButtons (using object for flexibility)

  @ApiPropertyOptional({ description: 'Categoria da notificação (ex: booking, payment, dispute)', example: 'booking' })
  @IsOptional()
  @IsString()
  category?: string; // NEW: Added category for better filtering/UI handling
}