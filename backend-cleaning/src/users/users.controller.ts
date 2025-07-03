// src/users/users.controller.ts
import {
  Controller, Get, Body, Patch, Param, UseGuards, Req, NotFoundException, ForbiddenException, Delete, HttpCode, HttpStatus
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

// Adicione uma interface para o payload do JWT se ainda não tiver uma
interface JwtPayload {
  sub: string; // O ID do usuário
  email: string;
  role: UserRole;
  // Outros campos do payload do seu JWT
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário.', type: UserProfileDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async getMyProfile(@Req() req: Request): Promise<UserProfileDto> {
    // CORREÇÃO: Acesse o ID do usuário via 'sub' do payload do JWT
    const userId = (req.user as JwtPayload).sub; 
    // O usersService.findOne precisa retornar o user com todas as relações para o UserProfileDto.
    // O tipo de 'user' retornado pelo findOne precisa ser compatível com o construtor de UserProfileDto.
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException(`Usuário com ID "${userId}" não encontrado.`);
    }
    return new UserProfileDto(user as any); // Manter o cast temporário se necessário, mas o ideal é alinhar os tipos
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário atualizado com sucesso.', type: UserProfileDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async updateMyProfile(@Req() req: Request, @Body() updateUserDto: UpdateUserDto): Promise<UserProfileDto> {
    // CORREÇÃO: Acesse o ID do usuário via 'sub' do payload do JWT
    const userId = (req.user as JwtPayload).sub;
    // O usersService.update precisa retornar o user com todas as relações para o UserProfileDto.
    const updatedUser = await this.usersService.update(userId, updateUserDto);
    if (!updatedUser) {
      throw new NotFoundException(`Usuário com ID "${userId}" não encontrado.`);
    }
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
    // Este `id` vem do @Param, então já é o ID correto
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
    }
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
    await this.usersService.remove(id);
  }
}