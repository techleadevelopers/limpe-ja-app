// src/support/support.controller.ts

import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard'; // Assumindo que você tem este guard
import { Roles } from '../auth/decorators/roles.decorator'; // Assumindo que você tem este decorator
import { UserRole } from '@prisma/client'; // Assumindo que UserRole está no seu schema Prisma

@ApiTags('Support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Abre um novo ticket de suporte' })
  async createTicket(@Request() req, @Body() createTicketDto: CreateTicketDto) {
    // CORREÇÃO: Alterado req.user.id para req.user.userId
    const userId = req.user.userId;
    const userRole = req.user.role; // Assumindo que a role está no token JWT
    return this.supportService.createTicket(userId, userRole, createTicketDto);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Lista tickets de suporte (meus ou todos para admin)' })
  async getTickets(
    @Request() req,
    @Query('mine') mine: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    const userId = req.user.userId; // Ajuste similar pode ser necessário aqui se este endpoint for usado por não-admins
    const userRole = req.user.role;
    const showMine = mine === 'true';

    if (showMine || userRole !== UserRole.ADMIN) {
      return this.supportService.findTickets(userId, status, category);
    } else {
      // Apenas admins podem ver todos os tickets
      return this.supportService.findTickets(undefined, status, category);
    }
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Obtém detalhes de um ticket de suporte' })
  async getTicketDetails(@Request() req, @Param('id') ticketId: string) {
    const userId = req.user.userId; // Ajuste similar pode ser necessário aqui
    const userRole = req.user.role;
    const ticket = await this.supportService.findTicketById(ticketId);

    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado.');
    }

    // Garante que apenas o proprietário ou um admin pode ver o ticket
    if (ticket.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new NotFoundException('Ticket não encontrado ou sem permissão.'); // Usar NotFound para não vazar info
    }

    return ticket;
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Adiciona uma mensagem a um ticket de suporte' })
  async addMessage(
    @Request() req,
    @Param('id') ticketId: string,
    @Body('body') body: string,
  ) {
    const userId = req.user.userId; // Ajuste similar pode ser necessário aqui
    const userRole = req.user.role;
    return this.supportService.addMessageToTicket(ticketId, userId, userRole, body);
  }

  @Patch('tickets/:id/status')
  @Roles(UserRole.ADMIN) // Apenas admins podem mudar o status diretamente
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Atualiza o status de um ticket de suporte (apenas admin)' })
  async updateTicketStatus(
    @Param('id') ticketId: string,
    @Body('status') status: string,
  ) {
    return this.supportService.updateTicketStatus(ticketId, status);
  }

  @Patch('tickets/:id/assign/:agentId')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Atribui um ticket a um agente (apenas admin)' })
  async assignTicket(
    @Param('id') ticketId: string,
    @Param('agentId') agentId: string,
  ) {
    return this.supportService.assignTicket(ticketId, agentId);
  }
}