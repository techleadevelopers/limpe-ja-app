import { Controller, Post, Body, Param, Get, Patch, UseGuards, Req, Query, ParseEnumPipe } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../shared/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DisputeStatus } from '@prisma/client';

@ApiBearerAuth()
@ApiTags('disputes')
@Controller('disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.PROVIDER)
  @ApiOperation({ summary: 'Cria uma nova disputa para um agendamento' })
  @ApiResponse({ status: 201, description: 'Disputa criada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou disputa já existente.' })
  async create(
    @Body() createDisputeDto: CreateDisputeDto,
    @Req() req: any
  ) {
    const reporterUserId = req.user.id;
    const reporterRole = req.user.role;
    return this.disputeService.createDispute(createDisputeDto, reporterUserId, reporterRole);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Busca os detalhes de uma disputa' })
  @ApiResponse({ status: 200, description: 'Detalhes da disputa retornados com sucesso.' })
  @ApiResponse({ status: 404, description: 'Disputa não encontrada.' })
  async findOne(@Param('id') id: string) {
    return this.disputeService.getDisputeDetails(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lista disputas (apenas para administradores)' })
  @ApiQuery({ name: 'status', enum: DisputeStatus, required: false, description: 'Filtra disputas por status.' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Limite de resultados por página.' })
  @ApiQuery({ name: 'offset', type: Number, required: false, description: 'Offset para paginação.' })
  @ApiResponse({ status: 200, description: 'Lista de disputas retornada com sucesso.' })
  async findAll(
    @Query('status', new ParseEnumPipe(DisputeStatus, { optional: true })) status?: DisputeStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.disputeService.listDisputes(status, limit, offset);
  }

  @Post(':id/message')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Adiciona uma nova mensagem a uma disputa' })
  @ApiResponse({ status: 201, description: 'Mensagem adicionada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Disputa não encontrada.' })
  async addMessage(
    @Param('id') id: string,
    @Req() req: any,
    @Body('content') content: string
  ) {
    return this.disputeService.addMessageToDispute(id, req.user.id, content);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualiza o status de uma disputa (apenas para administradores)' })
  @ApiResponse({ status: 200, description: 'Disputa atualizada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos para a atualização.' })
  @ApiResponse({ status: 404, description: 'Disputa não encontrada.' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDisputeDto: UpdateDisputeDto,
    @Req() req: any
  ) {
    return this.disputeService.updateDisputeStatus(id, updateDisputeDto, req.user.id);
  }
}