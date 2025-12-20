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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, SupportTicketCategory } from '@prisma/client';
import { Request as ExpressRequest } from 'express';

type RequestWithUser = ExpressRequest & {
  user?: {
    userId?: string;
    role?: UserRole;
  };
};

@ApiTags('Support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('meta')
  @ApiOperation({
    summary: 'Lista metadados de suporte (categorias e severidades)',
  })
  getMeta() {
    const categories = Object.keys(SupportTicketCategory);
    const severities = ['LOW', 'MEDIUM', 'HIGH'];
    return { categories, severities };
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Abre um novo ticket de suporte' })
  async createTicket(
    @Request() req: RequestWithUser,
    @Body() createTicketDto: CreateTicketDto,
  ) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
      throw new NotFoundException('Dados de usuário ausentes na requisição.');
    }
    return this.supportService.createTicket(userId, userRole, createTicketDto);
  }

  @Get('tickets')
  @ApiOperation({
    summary: 'Lista tickets de suporte (meus ou todos para admin)',
  })
  async getTickets(
    @Request() req: RequestWithUser,
    @Query('mine') mine: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
      throw new NotFoundException('Dados de usuário ausentes na requisição.');
    }
    const showMine = mine === 'true';

    if (showMine || userRole !== UserRole.ADMIN) {
      return this.supportService.findTickets(userId, status, category);
    } else {
      return this.supportService.findTickets(undefined, status, category);
    }
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Obtém detalhes de um ticket de suporte' })
  async getTicketDetails(
    @Request() req: RequestWithUser,
    @Param('id') ticketId: string,
  ) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
      throw new NotFoundException('Dados de usuário ausentes na requisição.');
    }
    const ticket = await this.supportService.findTicketById(ticketId);

    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado.');
    }

    if (ticket.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new NotFoundException('Ticket não encontrado ou sem permissão.');
    }

    return ticket;
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Adiciona uma mensagem a um ticket de suporte' })
  async addMessage(
    @Request() req: RequestWithUser,
    @Param('id') ticketId: string,
    @Body('body') body: string,
  ) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
      throw new NotFoundException('Dados de usuário ausentes na requisição.');
    }
    return this.supportService.addMessageToTicket(
      ticketId,
      userId,
      userRole,
      body,
    );
  }

  @Patch('tickets/:id/status')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Atualiza o status de um ticket de suporte (apenas admin)',
  })
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
