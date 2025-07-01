// src/notifications/dto/create-notification.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

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
}