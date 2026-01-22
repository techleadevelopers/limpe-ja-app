import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  UseGuards,
  Req,
  Query,
  ParseEnumPipe,
  BadRequestException,
} from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger'; // NEW: ApiHeader
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client'; // Standardize UserRole from Prisma
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DisputeStatus } from '@prisma/client';
import { ThrottlerGuard } from '@nestjs/throttler'; // NEW: Import ThrottlerGuard

type RequestWithUser = Request & {
  user?: {
    userId?: string;
    role?: UserRole;
  };
};

@ApiBearerAuth()
@ApiTags('disputes')
@Controller('disputes')
@UseGuards(ThrottlerGuard, JwtAuthGuard) // NEW: Apply ThrottlerGuard globally to the controller
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @Roles(UserRole.CLIENT, UserRole.PROVIDER)
  @UseGuards(RolesGuard) // Apply RolesGuard specifically for this route
  @ApiOperation({ summary: 'Cria uma nova disputa para um agendamento' })
  @ApiHeader({
    name: 'Idempotency-Key',
    description:
      'Chave de idempotência para garantir que a operação seja processada apenas uma vez.',
    required: false,
  }) // NEW: Idempotency-Key header
  @ApiResponse({ status: 201, description: 'Disputa criada com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou disputa já existente.',
  })
  async create(
    @Body() createDisputeDto: CreateDisputeDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) {
      throw new BadRequestException('Usuário não autenticado.');
    }
    // NEW: Idempotency check (conceptual - requires a dedicated service/middleware for full implementation)
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    if (idempotencyKey) {
      // In a real scenario, you'd check a cache or DB for this key
      // If found and completed, return previous result. If found and in progress, wait or error.
      // For now, we'll just log its presence.
      this.disputeService['logger'].debug(
        `Idempotency-Key received for create dispute: ${idempotencyKey}`,
      );
    }

    const reporterUserId = userId; // Use userId from JWT payload
    const reporterRole = role;
    return this.disputeService.createDispute(
      createDisputeDto,
      reporterUserId,
      reporterRole,
    );
  }

  @Get('pending-count')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Contagem de disputas pendentes (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Quantidade de disputas pendentes.' })
  async getPendingCount(): Promise<{ count: number }> {
    const count = await this.disputeService.countPendingDisputes();
    return { count };
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Busca os detalhes de uma disputa' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da disputa retornados com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Disputa não encontrada.' })
  async findOne(@Param('id') id: string) {
    return this.disputeService.getDisputeDetails(id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lista disputas (apenas para administradores)' })
  @ApiQuery({
    name: 'status',
    enum: DisputeStatus,
    required: false,
    description: 'Filtra disputas por status.',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Limite de resultados por página.',
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    description: 'Offset para paginação.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de disputas retornada com sucesso.',
  })
  async findAll(
    @Query('status', new ParseEnumPipe(DisputeStatus, { optional: true }))
    status?: DisputeStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.disputeService.listDisputes(status, limit, offset);
  }

  @Post(':id/message')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Adiciona uma nova mensagem a uma disputa' })
  @ApiResponse({ status: 201, description: 'Mensagem adicionada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Disputa não encontrada.' })
  async addMessage(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body('content') content: string,
  ) {
    if (!content || content.trim().length === 0) {
      // Basic content validation
      throw new BadRequestException(
        'O conteúdo da mensagem não pode ser vazio.',
      );
    }
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Usuário não autenticado.');
    }
    return this.disputeService.addMessageToDispute(id, userId, content); // Use userId
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Atualiza o status de uma disputa (apenas para administradores)',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    description:
      'Chave de idempotência para garantir que a operação seja processada apenas uma vez.',
    required: false,
  }) // NEW: Idempotency-Key header
  @ApiResponse({ status: 200, description: 'Disputa atualizada com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos para a atualização.',
  })
  @ApiResponse({ status: 404, description: 'Disputa não encontrada.' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDisputeDto: UpdateDisputeDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Usuário não autenticado.');
    }
    // NEW: Idempotency check (conceptual)
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    if (idempotencyKey) {
      this.disputeService['logger'].debug(
        `Idempotency-Key received for update dispute status: ${idempotencyKey}`,
      );
    }
    return this.disputeService.updateDisputeStatus(
      id,
      updateDisputeDto,
      userId,
    ); // Use userId
  }
}
