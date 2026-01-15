// src/users/users.controller.ts
import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express-serve-static-core';
import { MessageResponseDto } from '../common/dto/message-response.dto';

// Interface para req.user (alinhado com JwtStrategy)
interface RequestUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  clientId?: string;
  providerId?: string;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  private formatError(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário.',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @ApiResponse({
    status: 500,
    description: 'Erro interno no servidor (ex: query falhou).',
  })
  async getMyProfile(@Req() req: Request): Promise<UserProfileDto> {
    try {
      const requestUserPayload = req.user as RequestUserPayload;
      const userId = requestUserPayload?.userId;

      this.logger.log(
        `[UsersController] getMyProfile: req.user payload: ${JSON.stringify(requestUserPayload)}`,
      );
      this.logger.log(
        `[UsersController] getMyProfile: Extrair userId: ${userId}`,
      );

      if (!userId) {
        this.logger.error(
          '[UsersController] getMyProfile: userId undefined. Payload completo:',
          requestUserPayload,
        );
        throw new NotFoundException(
          'ID do usuário não encontrado no token ou usuário não logado.',
        );
      }

      const user = await this.usersService.findOne(userId);
      if (!user) {
        this.logger.warn(
          `[UsersController] getMyProfile: Usuário ${userId} não encontrado.`,
        );
        throw new NotFoundException(
          `Usuário com ID "${userId}" não encontrado.`,
        );
      }

      if (!user.client && user.role === UserRole.CLIENT) {
        this.logger.warn(
          `[UsersController] getMyProfile: Client details ausentes para ${userId} - verifique schema.`,
        );
      }
      if (!user.provider && user.role === UserRole.PROVIDER) {
        this.logger.warn(
          `[UsersController] getMyProfile: Provider details ausentes para ${userId}.`,
        );
      }
      if (!user.loyalty) {
        this.logger.warn(
          `[UsersController] getMyProfile: Loyalty ausente para ${userId}.`,
        );
      }

      this.logger.log(
        `[UsersController] getMyProfile: Perfil pronto para ${userId}.`,
      );
      return new UserProfileDto(user);
    } catch (error: unknown) {
      const message = this.formatError(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `[UsersController] getMyProfile: Erro geral: ${message}. Stack: ${stack}`,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Falha ao carregar perfil do usuário. Tente novamente em instantes.',
      );
    }
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar perfil do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado.',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno.' })
  async updateMyProfile(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserProfileDto> {
    try {
      const userId = (req.user as RequestUserPayload).userId;
      this.logger.log(
        `[UsersController] updateMyProfile: Atualizando para userId: ${userId}. DTO: ${JSON.stringify(
          updateUserDto,
        )}`,
      );
      if (updateUserDto.fcmToken) {
        this.logger.log(
          `[UsersController] updateMyProfile: Recebido fcmToken para ${userId}: ${updateUserDto.fcmToken}`,
        );
      }

      const updatedUser = await this.usersService.update(userId, updateUserDto);
      if (!updatedUser) {
        this.logger.warn(
          `[UsersController] updateMyProfile: Usuário ${userId} não encontrado para update.`,
        );
        throw new NotFoundException(
          `Usuário com ID "${userId}" não encontrado.`,
        );
      }

      this.logger.log(
        `[UsersController] updateMyProfile: Perfil atualizado para ${userId}.`,
      );
      return new UserProfileDto(updatedUser);
    } catch (error: unknown) {
      const message = this.formatError(error);
      this.logger.error(
        `[UsersController] updateMyProfile: Erro ao atualizar perfil: ${message}`,
      );
      throw error;
    }
  }

  // ENDPOINT ADMIN: Listar todos
  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os usuários (apenas admin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários.',
    type: [UserProfileDto],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 500, description: 'Erro interno.' })
  async findAll(): Promise<UserProfileDto[]> {
    try {
      this.logger.log('[UsersController] findAll: Listando usuários (ADMIN).');
      const users = await this.usersService.findAllUsers();
      this.logger.log(
        `[UsersController] findAll: Mapeando ${users.length} usuários para DTOs.`,
      );
      return users.map((user) => new UserProfileDto(user));
    } catch (error: unknown) {
      const message = this.formatError(error);
      this.logger.error(`[UsersController] findAll: Erro: ${message}`);
      throw error;
    }
  }

  // DELETE /users/me – deve vir ANTES do DELETE /users/:id para evitar conflito
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitar exclusão da própria conta (LGPD)' })
  @ApiResponse({
    status: 202,
    description: 'Solicitação recebida.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 500, description: 'Erro interno.' })
  @HttpCode(HttpStatus.ACCEPTED)
  async deleteMyAccount(@Req() req: Request): Promise<MessageResponseDto> {
    try {
      const userId = (req.user as RequestUserPayload).userId;
      this.logger.log(`[UsersController] deleteMyAccount: Para ${userId}.`);
      await this.usersService.requestAccountDeletion(userId);
      return {
        message:
          'Solicitação de exclusão recebida. Sua conta será desativada e removida após o período de carência. Um e-mail de confirmação será enviado.',
      };
    } catch (error: unknown) {
      const message = this.formatError(error);
      this.logger.error(
        `[UsersController] deleteMyAccount: Erro ao solicitar exclusão: ${message}`,
      );
      throw error;
    }
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil por ID (apenas admin)' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário.',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno.' })
  async findOne(@Param('id') id: string): Promise<UserProfileDto> {
    try {
      this.logger.log(
        `[UsersController] findOne: Obtendo perfil de ${id} (ADMIN).`,
      );
      const user = await this.usersService.findOne(id);
      if (!user) {
        this.logger.warn(
          `[UsersController] findOne: Usuário ${id} não encontrado.`,
        );
        throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
      }
      this.logger.log(`[UsersController] findOne: Perfil pronto para ${id}.`);
      return new UserProfileDto(user);
    } catch (error: unknown) {
      const message = this.formatError(error);
      this.logger.error(`[UsersController] findOne: Erro: ${message}`);
      throw error;
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar para exclusão por ID (apenas admin)' })
  @ApiResponse({
    status: 200,
    description: 'Marcado para exclusão.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponseDto> {
    try {
      this.logger.log(
        `[UsersController] remove: Marcando exclusão de ${id} (ADMIN).`,
      );
      await this.usersService.remove(id);
      this.logger.log(`[UsersController] remove: Sucesso para ${id}.`);
      return { message: `Usuário com ID ${id} foi marcado para exclusão.` };
    } catch (error: unknown) {
      const message = this.formatError(error);
      this.logger.error(`[UsersController] remove: Erro: ${message}`);
      throw error;
    }
  }

  @Post('data-export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitar exportação de dados (LGPD)' })
  @ApiResponse({
    status: 202,
    description: 'Solicitação recebida.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 500, description: 'Erro interno.' })
  @HttpCode(HttpStatus.ACCEPTED)
  async requestDataExport(@Req() req: Request): Promise<MessageResponseDto> {
    try {
      const userId = (req.user as RequestUserPayload).userId;
      this.logger.log(`[UsersController] requestDataExport: Para ${userId}.`);
      await this.usersService.requestDataExport(userId);
      return {
        message:
          'Solicitação de exportação recebida. Link será enviado por e-mail quando os dados estiverem prontos.',
      };
    } catch (error: unknown) {
      const message = this.formatError(error);
      this.logger.error(
        `[UsersController] requestDataExport: Erro ao solicitar exportação: ${message}`,
      );
      throw error;
    }
  }
}
