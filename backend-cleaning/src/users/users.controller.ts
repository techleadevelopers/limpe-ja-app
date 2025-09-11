// src/users/users.controller.ts
import {
  Controller, Get, Body, Patch, Param, UseGuards, Req, NotFoundException, ForbiddenException, Delete, HttpCode, HttpStatus, Logger,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, User as PrismaUser } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express-serve-static-core';
import { MessageResponseDto } from '../common/dto/message-response.dto';

// A interface JwtPayload para o que *esperamos* do JWT
interface JwtPayload {
  sub: string; // O ID do usuário (do payload JWT original)
  email: string;
  role: UserRole;
}

// A interface para o que o JwtStrategy *realmente* anexa ao req.user
interface RequestUserPayload {
  userId: string; // ID do usuário (como o JwtStrategy o formata)
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
  async getMyProfile(@Req() req: Request): Promise<UserProfileDto> {
    const requestUserPayload = req.user as RequestUserPayload;
    const userId = requestUserPayload?.userId;

    this.logger.log(`[UsersController] getMyProfile: req.user payload recebido: ${JSON.stringify(requestUserPayload)}`);
    this.logger.log(`[UsersController] getMyProfile: Tentando extrair userId: ${userId}`);

    if (!userId) {
      this.logger.error('[UsersController] getMyProfile: userId é undefined ou nulo após JWT Payload. Payload:', requestUserPayload);
      throw new NotFoundException('ID do usuário não encontrado no token de autenticação ou usuário não logado.');
    }

    const user = await this.usersService.findOne(userId);

    if (!user) {
      this.logger.warn(`[UsersController] getMyProfile: Usuário com ID "${userId}" não encontrado no serviço UsersService.`);
      throw new NotFoundException(`Usuário com ID "${userId}" não encontrado.`);
    }

    this.logger.log(`[UsersController] getMyProfile: Perfil encontrado para userId: ${userId}. Retornando UserProfileDto.`);
    return new UserProfileDto(user as any);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário atualizado com sucesso.', type: UserProfileDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async updateMyProfile(@Req() req: Request, @Body() updateUserDto: UpdateUserDto): Promise<UserProfileDto> {
    const userId = (req.user as RequestUserPayload).userId;
    this.logger.log(`[UsersController] updateMyProfile: Recebida solicitação de atualização para userId: ${userId}`);

    const updatedUser = await this.usersService.update(userId, updateUserDto);
    if (!updatedUser) {
      this.logger.warn(`[UsersController] updateMyProfile: Usuário com ID "${userId}" não encontrado para atualização.`);
      throw new NotFoundException(`Usuário com ID "${userId}" não encontrado.`);
    }
    this.logger.log(`[UsersController] updateMyProfile: Perfil de userId: ${userId} atualizado com sucesso.`);
    return new UserProfileDto(updatedUser as any);
  }

  // NOVO ENDPOINT: Listar todos os usuários (apenas para administradores)
  @Get() // Este é o endpoint GET /users
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os usuários (apenas para administradores)' })
  @ApiResponse({ status: 200, description: 'Lista de usuários.', type: [UserProfileDto] }) // Retorna um array de UserProfileDto
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  async findAll(): Promise<UserProfileDto[]> {
    this.logger.log(`[UsersController] findAll: Recebida solicitação para listar todos os usuários (ADMIN).`);
    const users = await this.usersService.findAllUsers(); // Você precisará criar este método no UsersService
    this.logger.log(`[UsersController] findAll: Retornando ${users.length} usuários.`);
    // Mapear para UserProfileDto se o UsersService retornar o modelo Prisma diretamente
    return users.map(user => new UserProfileDto(user as any));
  }


  @Get(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil de um usuário por ID (apenas para administradores)' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário.', type: UserProfileDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async findOne(@Param('id') id: string): Promise<UserProfileDto> {
    this.logger.log(`[UsersController] findOne: Recebida solicitação para obter perfil de userId: ${id} (ADMIN).`);
    const user = await this.usersService.findOne(id);
    if (!user) {
      this.logger.warn(`[UsersController] findOne: Usuário com ID "${id}" não encontrado para ADMIN.`);
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
    }
    this.logger.log(`[UsersController] findOne: Perfil encontrado para userId: ${id} (ADMIN).`);
    return new UserProfileDto(user as any);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar usuário para exclusão por ID (apenas para administradores)' })
  @ApiResponse({ status: 200, description: 'Usuário marcado para exclusão com sucesso.', type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponseDto> {
    this.logger.log(`[UsersController] remove: Recebida solicitação para marcar exclusão de userId: ${id} (ADMIN).`);
    await this.usersService.remove(id);
    this.logger.log(`[UsersController] remove: Usuário userId: ${id} marcado para exclusão com sucesso.`);
    return { message: `Usuário com ID ${id} foi marcado para exclusão.` };
  }

  @Post('data-export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitar exportação dos dados do usuário logado (LGPD)' })
  @ApiResponse({ status: 202, description: 'Solicitação de exportação de dados recebida. O link para download será enviado por e-mail.', type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @HttpCode(HttpStatus.ACCEPTED)
  async requestDataExport(@Req() req: Request): Promise<MessageResponseDto> {
    const userId = (req.user as RequestUserPayload).userId;
    this.logger.log(`[UsersController] requestDataExport: Recebida solicitação de exportação de dados para userId: ${userId}.`);
    await this.usersService.requestDataExport(userId);
    return { message: 'Sua solicitação de exportação de dados foi recebida. Um link para download será enviado para o seu e-mail cadastrado.' };
  }

  @Delete('delete-account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitar exclusão da conta do usuário logado (LGPD)' })
  @ApiResponse({ status: 202, description: 'Solicitação de exclusão de conta recebida. A conta será desativada e excluída permanentemente após um período de carência.', type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @HttpCode(HttpStatus.ACCEPTED)
  async requestAccountDeletion(@Req() req: Request): Promise<MessageResponseDto> {
    const userId = (req.user as RequestUserPayload).userId;
    this.logger.log(`[UsersController] requestAccountDeletion: Recebida solicitação de exclusão de conta para userId: ${userId}.`);
    await this.usersService.requestAccountDeletion(userId);
    return { message: 'Sua solicitação de exclusão de conta foi recebida. Sua conta será desativada e excluída permanentemente após um período de carência. Você receberá um e-mail de confirmação.' };
  }
}