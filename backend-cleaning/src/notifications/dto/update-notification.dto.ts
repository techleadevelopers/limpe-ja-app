// src/notifications/dto/update-notification.dto.ts
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateNotificationDto } from './create-notification.dto';

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {
  @ApiPropertyOptional({ description: 'Indica se a notificação foi lida', example: true })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  // Se você quiser permitir a atualização de outros campos, adicione-os aqui.
  // Ex:
  // @ApiPropertyOptional({ description: 'Novo URL de destino', example: '/app/new-page' })
  // @IsOptional()
  // @IsString()
  // newTargetUrl?: string;
}