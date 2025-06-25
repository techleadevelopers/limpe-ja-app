// src/notifications/dto/mark-as-read.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, IsString } from 'class-validator';

export class MarkAsReadDto {
  @ApiPropertyOptional({
    description: 'Lista de IDs de notificações a serem marcadas como lidas. Se vazio, todas as notificações não lidas do usuário serão marcadas como lidas.',
    type: [String],
    example: ['uuid-notificacao-1', 'uuid-notificacao-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notificationIds?: string[];
}