// src/users/users.controller.ts
import { Controller, Get, Body, Patch, Param, UseGuards, Req, NotFoundException, ForbiddenException, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, User as PrismaUser } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express-serve-static-core';

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
    const userId = (req.user as PrismaUser).id;
    // O usersService.findOne precisa retornar o user com todas as relações para o UserProfileDto.
    // O tipo de 'user' retornado pelo findOne precisa ser compatível com o construtor de UserProfileDto.
    const user = await this.usersService.findOne(userId); // <-- usersService.findOne precisa incluir relações
    if (!user) {
      throw new NotFoundException(`Usuário com ID "${userId}" não encontrado.`);
    }
    return new UserProfileDto(user as any); // <-- CORREÇÃO: Cast temporário (precisa alinhar UserProfileDto com o retorno real do Service)
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário atualizado com sucesso.', type: UserProfileDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async updateMyProfile(@Req() req: Request, @Body() updateUserDto: UpdateUserDto): Promise<UserProfileDto> {
    const userId = (req.user as PrismaUser).id;
    // O usersService.update precisa retornar o user com todas as relações para o UserProfileDto.
    const updatedUser = await this.usersService.update(userId, updateUserDto); // <-- usersService.update precisa incluir relações
    if (!updatedUser) {
      throw new NotFoundException(`Usuário com ID "${userId}" não encontrado.`);
    }
    return new UserProfileDto(updatedUser as any); // <-- CORREÇÃO: Cast temporário (precisa alinhar UserProfileDto com o retorno real do Service)
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
    const user = await this.usersService.findOne(id); // <-- usersService.findOne precisa incluir relações
    if (!user) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
    }
    return new UserProfileDto(user as any); // <-- CORREÇÃO: Cast temporário (precisa alinhar UserProfileDto com o retorno real do Service)
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