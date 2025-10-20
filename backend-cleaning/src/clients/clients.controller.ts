// src/clients/clients.controller.ts
import { Controller, Get, Body, Patch, UseGuards, Req, NotFoundException, Param, Logger } from '@nestjs/common'; // Adicionado Logger
import { ClientsService } from './clients.service';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { ClientDashboardDto } from './dto/client-dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express'; // Importa Request do Express para tipagem explícita
import { ClientEntity } from './entities/client.entity';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  private readonly logger = new Logger(ClientsController.name); // Instancia o logger

  constructor(private readonly clientsService: ClientsService) {}

  // --- ENDPOINT PARA O DASHBOARD DO CLIENTE ---
  @Get('me/dashboard')
  @Roles(UserRole.CLIENT) // Apenas clientes podem acessar seu próprio dashboard
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter dados do dashboard do cliente logado' })
  @ApiResponse({ status: 200, description: 'Dados do dashboard do cliente.', type: ClientDashboardDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  async getClientDashboard(@Req() req: ExpressRequest): Promise<ClientDashboardDto> {
    const userId = req.user['userId']; // ID do User do JWT
    this.logger.log(`[ClientsController] getClientDashboard: Buscando dashboard para userId: ${userId}`);

    const client = await this.clientsService.findClientByUserId(userId);
    if (!client) {
      this.logger.warn(`[ClientsController] getClientDashboard: Cliente não encontrado para userId: ${userId}`);
      throw new NotFoundException(`Cliente associado ao usuário com ID "${userId}" não encontrado.`);
    }

    this.logger.log(`[ClientsController] getClientDashboard: Cliente ${client.id} encontrado. Buscando dados do dashboard.`);
    return this.clientsService.getClientDashboardData(client.id);
  }
  // --- FIM DO ENDPOINT DO DASHBOARD ---

  @Patch('me')
  @Roles(UserRole.CLIENT) // Apenas clientes podem atualizar seu próprio perfil
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar perfil do cliente logado' })
  @ApiResponse({ status: 200, description: 'Perfil do cliente atualizado com sucesso.', type: ClientEntity })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  async updateMyProfile(@Req() req: ExpressRequest, @Body() updateClientProfileDto: UpdateClientProfileDto): Promise<ClientEntity> {
    const userId = req.user['userId'];
    this.logger.log(`[ClientsController] updateMyProfile: Iniciando atualização para userId: ${userId}`);

    const client = await this.clientsService.findClientByUserId(userId);
    if (!client) {
      this.logger.warn(`[ClientsController] updateMyProfile: Cliente não encontrado para userId: ${userId}`);
      throw new NotFoundException(`Cliente associado ao usuário com ID "${userId}" não encontrado.`);
    }

    const updatedClient = await this.clientsService.updateClient(client.id, updateClientProfileDto);
    this.logger.log(`[ClientsController] updateMyProfile: Perfil do cliente ${client.id} atualizado com sucesso.`);
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
    this.logger.log(`[ClientsController] findOne: Buscando cliente por ID: ${id}`);
    const client = await this.clientsService.findClientById(id);
    if (!client) {
      this.logger.warn(`[ClientsController] findOne: Cliente com ID "${id}" não encontrado.`);
      throw new NotFoundException(`Cliente com ID "${id}" não encontrado.`);
    }
    this.logger.log(`[ClientsController] findOne: Cliente ${id} encontrado.`);
    return new ClientEntity(client);
  }

  // ADMIN: Atualizar perfil de um cliente por ID
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar perfil de um cliente por ID (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Perfil do cliente atualizado com sucesso.', type: ClientEntity })
  async updateById(@Param('id') id: string, @Body() updateClientProfileDto: UpdateClientProfileDto): Promise<ClientEntity> {
    this.logger.log(`[ClientsController] updateById: Atualizando cliente ${id}`);
    const updated = await this.clientsService.updateClient(id, updateClientProfileDto);
    return new ClientEntity(updated);
  }
}
