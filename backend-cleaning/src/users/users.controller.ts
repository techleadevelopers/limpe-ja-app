// src/users/users.controller.ts
import {
  Controller, Get, Body, Patch, Param, UseGuards, Req, NotFoundException, ForbiddenException, Delete, HttpCode, HttpStatus, Logger,
  Post, InternalServerErrorException,
} from '@nestjs/common';
import { UsersService, UserWithIncludes } from './users.service'; // CORRIGIDO: Importe UserWithIncludes
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client'; // Removido PrismaUser desnecessário
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário.', type: UserProfileDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor (ex: query falhou).' })
  async getMyProfile(@Req() req: Request): Promise<UserProfileDto> {
    try {
      const requestUserPayload = req.user as RequestUserPayload;
      const userId = requestUserPayload?.userId;

      this.logger.log(`[UsersController] getMyProfile: req.user payload: ${JSON.stringify(requestUserPayload)}`);
      this.logger.log(`[UsersController] getMyProfile: Extrair userId: ${userId}`);

      if (!userId) {
        this.logger.error('[UsersController] getMyProfile: userId undefined. Payload completo:', requestUserPayload);
        throw new NotFoundException('ID do usuário não encontrado no token ou não logado.');
      }

      const user = await this.usersService.findOne(userId) as UserWithIncludes | null; // Tipado corretamente
      if (!user) {
        this.logger.warn(`[UsersController] getMyProfile: Usuário ${userId} não encontrado.`);
        throw new NotFoundException(`Usuário com ID "${userId}" não encontrado.`);
      }

      // CORRIGIDO: Removida verificação problemática (DTO lida com opcionais); valide só null
      if (!user.client && user.role === UserRole.CLIENT) {
        this.logger.warn(`[UsersController] getMyProfile: Client details ausentes para ${userId} - verifique schema.`);
      }
      if (!user.provider && user.role === UserRole.PROVIDER) {
        this.logger.warn(`[UsersController] getMyProfile: Provider details ausentes para ${userId}.`);
      }
      if (!user.loyalty) {
        this.logger.warn(`[UsersController] getMyProfile: Loyalty ausente para ${userId}.`);
      }

      this.logger.log(`[UsersController] getMyProfile: Perfil pronto para ${userId}.`);
      return new UserProfileDto(user); // Agora tipado, sem 'as any'
    } catch (error) {
      this.logger.error(`[UsersController] getMyProfile: Erro geral: ${error.message}. Stack: ${error.stack}`);
      if (error instanceof NotFoundException) throw error;
      // Não mascarar como 404: responder 500 para erros internos reais
      throw new InternalServerErrorException('Falha ao carregar perfil do usuário. Tente novamente em instantes.');
    }
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado.', type: UserProfileDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno.' })
  async updateMyProfile(@Req() req: Request, @Body() updateUserDto: UpdateUserDto): Promise<UserProfileDto> {
    try {
      const userId = (req.user as RequestUserPayload).userId;
      this.logger.log(`[UsersController] updateMyProfile: Atualizando para userId: ${userId}. DTO: ${JSON.stringify(updateUserDto)}`);

      const updatedUser = await this.usersService.update(userId, updateUserDto) as UserWithIncludes;
      if (!updatedUser) {
        this.logger.warn(`[UsersController] updateMyProfile: Usuário ${userId} não encontrado para update.`);
        throw new NotFoundException(`Usuário com ID "${userId}" não encontrado.`);
      }

      this.logger.log(`[UsersController] updateMyProfile: Perfil atualizado para ${userId}.`);
      return new UserProfileDto(updatedUser); // Tipado
    } catch (error) {
      this.logger.error(`[UsersController] updateMyProfile: Erro: ${error.message}`);
      throw error;
    }
  }

  // ENDPOINT ADMIN: Listar todos
  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os usuários (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Lista de usuários.', type: [UserProfileDto] })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 500, description: 'Erro interno.' })
  async findAll(): Promise<UserProfileDto[]> {
    try {
      this.logger.log(`[UsersController] findAll: Listando usuários (ADMIN).`);
      const users = await this.usersService.findAllUsers() as UserWithIncludes[];
      this.logger.log(`[UsersController] findAll: Mapeando ${users.length} usuários para DTOs.`);
      return users.map(user => new UserProfileDto(user)); // Tipado
    } catch (error) {
      this.logger.error(`[UsersController] findAll: Erro: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil por ID (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário.', type: UserProfileDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno.' })
  async findOne(@Param('id') id: string): Promise<UserProfileDto> {
    try {
      this.logger.log(`[UsersController] findOne: Obtendo perfil de ${id} (ADMIN).`);
      const user = await this.usersService.findOne(id) as UserWithIncludes | null;
      if (!user) {
        this.logger.warn(`[UsersController] findOne: Usuário ${id} não encontrado.`);
        throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
      }
      this.logger.log(`[UsersController] findOne: Perfil pronto para ${id}.`);
      return new UserProfileDto(user); // Tipado
    } catch (error) {
      this.logger.error(`[UsersController] findOne: Erro: ${error.message}`);
      throw error;
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar para exclusão por ID (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Marcado para exclusão.', type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponseDto> {
    try {
      this.logger.log(`[UsersController] remove: Marcando exclusão de ${id} (ADMIN).`);
      await this.usersService.remove(id);
      this.logger.log(`[UsersController] remove: Sucesso para ${id}.`);
      return { message: `Usuário com ID ${id} foi marcado para exclusão.` };
    } catch (error) {
      this.logger.error(`[UsersController] remove: Erro: ${error.message}`);
      throw error;
    }
  }

  @Post('data-export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitar exportação de dados (LGPD)' })
  @ApiResponse({ status: 202, description: 'Solicitação recebida.', type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 500, description: 'Erro interno.' })
  @HttpCode(HttpStatus.ACCEPTED)
  async requestDataExport(@Req() req: Request): Promise<MessageResponseDto> {
    try {
      const userId = (req.user as RequestUserPayload).userId;
      this.logger.log(`[UsersController] requestDataExport: Para ${userId}.`);
      await this.usersService.requestDataExport(userId);
      return { message: 'Solicitação de exportação recebida. Link será enviado por e-mail.' };
    } catch (error) {
      this.logger.error(`[UsersController] requestDataExport: Erro: ${error.message}`);
      throw error;
    }
  }

  @Delete('delete-account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitar exclusão de conta (LGPD)' })
  @ApiResponse({ status: 202, description: 'Solicitação recebida.', type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 500, description: 'Erro interno.' })
  @HttpCode(HttpStatus.ACCEPTED)
  async requestAccountDeletion(@Req() req: Request): Promise<MessageResponseDto> {
    try {
      const userId = (req.user as RequestUserPayload).userId;
      this.logger.log(`[UsersController] requestAccountDeletion: Para ${userId}.`);
      await this.usersService.requestAccountDeletion(userId);
      return { message: 'Solicitação de exclusão recebida. Conta será desativada após carência. E-mail de confirmação será enviado.' };
    } catch (error) {
      this.logger.error(`[UsersController] requestAccountDeletion: Erro: ${error.message}`);
      throw error;
    }
  }
}
