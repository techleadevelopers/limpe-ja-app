import { Controller, Get, Body, Patch, UseGuards, Req, NotFoundException, Param } from '@nestjs/common';
// 
import { ClientsService } from './clients.service';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { ClientDashboardDto } from './dto/client-dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ClientEntity } from './entities/client.entity';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('me/dashboard')
  @Roles(UserRole.CLIENT) // Apenas clientes podem acessar seu próprio dashboard
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter dados do dashboard do cliente logado' })
  @ApiResponse({ status: 200, description: 'Dados do dashboard do cliente.', type: ClientDashboardDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  async getClientDashboard(@Req() req: Request): Promise<ClientDashboardDto> {
    const userId = req.user['userId']; // ID do User do JWT
    const client = await this.clientsService.findClientByUserId(userId);
    if (!client) {
      throw new NotFoundException(`Cliente associado ao usuário com ID "${userId}" não encontrado.`);
    }
    return this.clientsService.getClientDashboardData(client.id);
  }

  @Patch('me')
  @Roles(UserRole.CLIENT) // Apenas clientes podem atualizar seu próprio perfil
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar perfil do cliente logado' })
  @ApiResponse({ status: 200, description: 'Perfil do cliente atualizado com sucesso.', type: ClientEntity })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  async updateMyProfile(@Req() req: Request, @Body() updateClientProfileDto: UpdateClientProfileDto): Promise<ClientEntity> {
    const userId = req.user['userId'];
    const client = await this.clientsService.findClientByUserId(userId);
    if (!client) {
      throw new NotFoundException(`Cliente associado ao usuário com ID "${userId}" não encontrado.`);
    }
    const updatedClient = await this.clientsService.updateClient(client.id, updateClientProfileDto);
    return new ClientEntity(updatedClient);
  }

  // Exemplo de rota para administradores obterem dados de qualquer cliente
  @Get(':id')
  @Roles(UserRole.ADMIN) // Apenas administradores podem ver perfis de outros clientes
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil de um cliente por ID (apenas para administradores)' })
  @ApiResponse({ status: 200, description: 'Perfil do cliente.', type: ClientEntity })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  async findOne(@Param('id') id: string): Promise<ClientEntity> {
    const client = await this.clientsService.findClientById(id);
    if (!client) {
      throw new NotFoundException(`Cliente com ID "${id}" não encontrado.`);
    }
    return new ClientEntity(client);
  }
}