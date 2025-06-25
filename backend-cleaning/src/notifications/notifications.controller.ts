// src/notifications/notifications.controller.ts
import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  UseGuards,
  Query,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationEntity } from './entities/notification.entity';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard) // Protege todas as rotas do controlador
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obter notificações do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificações do usuário.',
    type: [NotificationEntity],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async getUserNotifications(
    @Req() req: Request,
    @Query('includeRead') includeRead: string = 'false', // Query param para incluir lidas
  ): Promise<NotificationEntity[]> {
    const userId = req.user['userId'];
    const shouldIncludeRead = includeRead.toLowerCase() === 'true';
    const notifications = await this.notificationsService.getUserNotifications(
      userId,
      shouldIncludeRead,
    );
    return notifications.map((n) => new NotificationEntity(n));
  }

  @Patch('me/mark-as-read')
  @ApiOperation({ summary: 'Marcar notificações como lidas para o usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Notificações marcadas como lidas com sucesso.',
    type: Object, // Pode ser um objeto simples { count: number }
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async markNotificationsAsRead(
    @Req() req: Request,
    @Body() markAsReadDto: MarkAsReadDto,
  ): Promise<{ count: number }> {
    const userId = req.user['userId'];
    return this.notificationsService.markNotificationsAsRead(
      userId,
      markAsReadDto,
    );
  }

  @Patch(':id/mark-as-read')
  @ApiOperation({ summary: 'Marcar uma notificação específica como lida' })
  @ApiResponse({
    status: 200,
    description: 'Notificação marcada como lida com sucesso.',
    type: NotificationEntity,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada ou acesso negado.' })
  async markNotificationByIdAsRead(
    @Req() req: Request,
    @Param('id') notificationId: string,
  ): Promise<NotificationEntity> {
    const userId = req.user['userId'];
    const updatedNotification = await this.notificationsService.markNotificationByIdAsRead(
      notificationId,
      userId,
    );
    return new NotificationEntity(updatedNotification);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir uma notificação específica' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Notificação excluída com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada ou acesso negado.' })
  async deleteNotification(
    @Req() req: Request,
    @Param('id') notificationId: string,
  ): Promise<void> {
    const userId = req.user['userId'];
    await this.notificationsService.deleteNotification(notificationId, userId);
  }
}