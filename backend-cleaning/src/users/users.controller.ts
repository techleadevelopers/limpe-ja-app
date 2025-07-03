// src/users/users.controller.ts
import {
  Controller, Get, Body, Patch, Param, UseGuards, Req, NotFoundException, ForbiddenException, Delete, HttpCode, HttpStatus, Logger
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
    const requestUserPayload = req.user as RequestUserPayload; // Cast para a nova interface
    const userId = requestUserPayload?.userId; // AGORA LENDO 'userId'

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
    const userId = (req.user as RequestUserPayload).userId; // ATUALIZADO AQUI TAMBÉM
    this.logger.log(`[UsersController] updateMyProfile: Recebida solicitação de atualização para userId: ${userId}`);

    const updatedUser = await this.usersService.update(userId, updateUserDto);
    if (!updatedUser) {
      this.logger.warn(`[UsersController] updateMyProfile: Usuário com ID "${userId}" não encontrado para atualização.`);
      throw new NotFoundException(`Usuário com ID "${userId}" não encontrado.`);
    }
    this.logger.log(`[UsersController] updateMyProfile: Perfil de userId: ${userId} atualizado com sucesso.`);
    return new UserProfileDto(updatedUser as any);
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
  @ApiOperation({ summary: 'Deletar um usuário por ID (apenas para administradores)' })
  @ApiResponse({ status: 204, description: 'Usuário deletado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`[UsersController] remove: Recebida solicitação para deletar userId: ${id} (ADMIN).`);
    await this.usersService.remove(id);
    this.logger.log(`[UsersController] remove: Usuário userId: ${id} deletado com sucesso.`);
  }
}