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
  Post,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam, // <-- ADICIONE ESTA LINHA
} from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationEntity } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard) // Protege todas as rotas do controlador
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // NOVO ENDPOINT: Criar Notificação (apenas ADMIN)
  @Post()
  @Roles(UserRole.ADMIN) // Protege esta rota para admins
  @UseGuards(RolesGuard) // Ativa a guarda de roles
  @ApiOperation({ summary: 'Criar uma nova notificação (apenas para administradores)' })
  @ApiBody({ type: CreateNotificationDto, description: 'Dados para criar uma nova notificação' })
  @ApiResponse({ status: 201, description: 'Notificação criada com sucesso.', type: NotificationEntity })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido (requer função de ADMIN).' })
  async create(@Body() createNotificationDto: CreateNotificationDto): Promise<NotificationEntity> {
    const createdNotification = await this.notificationsService.createNotification(
      createNotificationDto.userId,
      createNotificationDto.type,
      createNotificationDto.message,
      createNotificationDto.targetUrl,
    );
    return new NotificationEntity(createdNotification);
  }

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
    @Query('includeRead') includeRead: string = 'false',
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
    type: Object,
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

  @Get('suggestions')
  @ApiOperation({ summary: 'Obter sugestões inteligentes baseadas em um contexto' })
  @ApiResponse({
    status: 200,
    description: 'Lista de sugestões.',
    type: [String],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async getSuggestions(
    @Query('context') context: string,
  ): Promise<string[]> {
    return this.notificationsService.getSmartSuggestions(context);
  }

  @Post('quick-action/:action')
  @ApiOperation({ summary: 'Executar uma ação rápida associada a uma notificação' })
  @ApiParam({ name: 'action', description: 'Tipo de ação rápida (ex: accept_booking, respond_review)', type: String })
  @ApiBody({ description: 'Dados adicionais para a ação rápida', required: false, type: Object }) // Tipo Object para dados genéricos
  @ApiResponse({ status: 200, description: 'Ação rápida executada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Ação rápida desconhecida ou dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async executeQuickAction(
    @Param('action') action: string,
    @Body() data: any,
  ): Promise<void> {
    await this.notificationsService.executeQuickAction(action, data);
  }
}