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
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
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
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationEntity } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

type RequestWithUser = Request & {
  user?: {
    userId?: string;
    id?: string;
    role?: UserRole;
  };
};

const QA_PANEL_ENABLED =
  process.env.EXPO_PUBLIC_ENABLE_QA_PANEL === 'true' ||
  process.env.QA_PANEL_ENABLED === 'true' ||
  process.env.ENABLE_QA_PANEL === 'true';

class RegisterTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsOptional()
  platform?: string;
}

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
  @ApiOperation({
    summary: 'Criar uma nova notificação (apenas para administradores)',
  })
  @ApiBody({
    type: CreateNotificationDto,
    description: 'Dados para criar uma nova notificação',
  })
  @ApiResponse({
    status: 201,
    description: 'Notificação criada com sucesso.',
    type: NotificationEntity,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Acesso proibido (requer função de ADMIN).',
  })
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationEntity> {
    const createdNotification =
      await this.notificationsService.createNotification(createNotificationDto);
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
    @Req() req: RequestWithUser,
    @Query('includeRead') includeRead: string = 'false',
  ): Promise<NotificationEntity[]> {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    const shouldIncludeRead = includeRead.toLowerCase() === 'true';
    const notifications = await this.notificationsService.getUserNotifications(
      userId,
      shouldIncludeRead,
    );
    return notifications.map((n) => new NotificationEntity(n));
  }

  @Get('stream')
  @ApiOperation({
    summary:
      'Stream de eventos (AppEvents) desde um timestamp para reconciliação',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista ordenada de AppEvents.',
    type: [NotificationEntity],
  })
  async stream(
    @Req() req: RequestWithUser,
    @Query('since') since?: string,
  ): Promise<NotificationEntity[]> {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    let sinceDate: Date | undefined;
    if (since) {
      sinceDate = new Date(since);
      if (Number.isNaN(sinceDate.getTime())) {
        throw new BadRequestException('Invalid timestamp for since parameter');
      }
    }

    const notifications =
      await this.notificationsService.getUserNotificationStream(
        userId,
        sinceDate,
      );
    return notifications.map((n) => new NotificationEntity(n));
  }

  @Patch('me/mark-as-read')
  @ApiOperation({
    summary: 'Marcar notificações como lidas para o usuário logado',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificações marcadas como lidas com sucesso.',
    type: Object,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async markNotificationsAsRead(
    @Req() req: RequestWithUser,
    @Body() markAsReadDto: MarkAsReadDto,
  ): Promise<{ count: number }> {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
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
  @ApiResponse({
    status: 404,
    description: 'Notificação não encontrada ou acesso negado.',
  })
  async markNotificationByIdAsRead(
    @Req() req: RequestWithUser,
    @Param('id') notificationId: string,
  ): Promise<NotificationEntity> {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    const updatedNotification =
      await this.notificationsService.markNotificationByIdAsRead(
        notificationId,
        userId,
      );
    return new NotificationEntity(updatedNotification);
  }

  @Post(':id/ack')
  @ApiOperation({
    summary: 'Confirmar recebimento (ack) de um AppEvent/notification',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificação marcada como lida/ack.',
    type: NotificationEntity,
  })
  async ackNotification(
    @Req() req: RequestWithUser,
    @Param('id') notificationId: string,
  ): Promise<NotificationEntity> {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const acked = await this.notificationsService.ackNotification(
      notificationId,
      userId,
    );
    return new NotificationEntity(acked);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir uma notificação específica' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Notificação excluída com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({
    status: 404,
    description: 'Notificação não encontrada ou acesso negado.',
  })
  async deleteNotification(
    @Req() req: RequestWithUser,
    @Param('id') notificationId: string,
  ): Promise<void> {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    await this.notificationsService.deleteNotification(notificationId, userId);
  }

  // Enviar notificação imediata (alias mais claro para admin-web)
  @Post('send')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Enviar notificação imediata (apenas admin)' })
  async send(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.createNotification(dto);
  }

  @Post('qa/send')
  @ApiOperation({
    summary:
      'Enviar notificação de QA para o usuário autenticado (dev/painel QA)',
  })
  async sendQaNotification(
    @Req() req: RequestWithUser,
    @Body() dto: CreateNotificationDto,
  ) {
    if (!QA_PANEL_ENABLED) {
      throw new ForbiddenException('Painel QA desativado');
    }

    const resolvedUserId = dto.userId || req.user?.userId || req.user?.id;
    if (!resolvedUserId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.notificationsService.createNotification({
      ...dto,
      userId: resolvedUserId,
    });
  }

  // Agendar notificação (simples: aceita scheduleAt, por ora apenas cria registro/log)
  @Post('schedule')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Agendar notificação (apenas admin)' })
  async schedule(@Body() body: CreateNotificationDto) {
    return this.notificationsService.createNotification(body);
  }
  @Get('suggestions')
  @ApiOperation({
    summary: 'Obter sugestões inteligentes baseadas em um contexto',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de sugestões.',
    type: [String],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  getSuggestions(@Query('context') context: string): string[] {
    return this.notificationsService.getSmartSuggestions(context);
  }

  @Post('quick-action/:action')
  @ApiOperation({
    summary: 'Executar uma ação rápida associada a uma notificação',
  })
  @ApiParam({
    name: 'action',
    description: 'Tipo de ação rápida (ex: accept_booking, respond_review)',
    type: String,
  })
  @ApiBody({
    description: 'Dados adicionais para a ação rápida',
    required: false,
    type: Object,
  }) // Tipo Object para dados genéricos
  @ApiResponse({
    status: 200,
    description: 'Ação rápida executada com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Ação rápida desconhecida ou dados inválidos.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async executeQuickAction(
    @Param('action') action: string,
    @Body() data: Record<string, unknown>,
  ): Promise<void> {
    await this.notificationsService.executeQuickAction(action, data);
  }

  @Post('register-token')
  @ApiOperation({
    summary:
      'Registrar/atualizar o token de push do dispositivo para o usuário atual',
  })
  async registerToken(
    @Req() req: RequestWithUser,
    @Body() body: RegisterTokenDto,
  ): Promise<{ ok: true }> {
    const userId = req.user?.userId ?? req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.notificationsService.registerDeviceToken(userId, body.token);
  }
}
