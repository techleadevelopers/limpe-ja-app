// backend-cleaning/src/referrals/referrals.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateReferralDto } from './dto/create-referral.dto';
import { ReferralsService } from './referrals.service';
import { ReferralEntity } from './entities/referral.entity'; // Importe a entidade (ou DTO de resposta)

@ApiTags('referrals')
@Controller('referrals')
export class ReferralsController {
  private readonly logger = new Logger(ReferralsController.name);

  constructor(private readonly referralsService: ReferralsService) {}

  @Post()
  @Roles(UserRole.CLIENT, UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar uma nova indicação' })
  @ApiResponse({
    status: 201,
    description: 'Indicação registrada com sucesso.',
    type: ReferralEntity,
  })
  @ApiResponse({ status: 400, description: 'Dados de indicação inválidos.' })
  @ApiResponse({ status: 409, description: 'Indicação já existe.' })
  async createReferral(
    @Req() req,
    @Body() createReferralDto: CreateReferralDto,
  ) {
    this.logger.log(
      `[ReferralsController] createReferral: Registrando indicação de ${req.user.userId} para ${createReferralDto.referredUserId}`,
    );
    // Garante que o referrerUserId do DTO é o usuário autenticado
    createReferralDto.referrerUserId = req.user.userId;
    const referral =
      await this.referralsService.createReferral(createReferralDto);
    return referral;
  }

  @Get('me')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter minhas indicações' })
  @ApiResponse({
    status: 200,
    description: 'Lista de indicações feitas pelo usuário.',
    type: [ReferralEntity],
  })
  async getMyReferrals(@Req() req) {
    this.logger.log(
      `[ReferralsController] getMyReferrals: Buscando indicações para userId: ${req.user.userId}`,
    );
    const referrals = await this.referralsService.findReferralsByReferrer(
      req.user.userId,
    );
    return referrals;
  }

  @Get('me/code') // NOVO ENDPOINT
  @Roles(UserRole.CLIENT, UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obter o código de indicação do usuário autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Código de indicação gerado com sucesso.',
    type: String,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async getMyReferralCode(@Req() req): Promise<{ referralCode: string }> {
    this.logger.log(
      `[ReferralsController] getMyReferralCode: Gerando/obtendo código de indicação para userId: ${req.user.userId}`,
    );
    const referralCode = await this.referralsService.generateReferralCode(
      req.user.userId,
    );
    return { referralCode };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN) // Apenas admin pode ver indicações por ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obter indicação por ID (apenas para administradores)',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da indicação.',
    type: ReferralEntity,
  })
  @ApiResponse({ status: 404, description: 'Indicação não encontrada.' })
  async getReferralById(@Param('id') id: string) {
    this.logger.log(
      `[ReferralsController] getReferralById: Buscando indicação por ID: ${id}`,
    );
    const referral = await this.referralsService.findOne(id);
    if (!referral) {
      throw new NotFoundException(`Indicação com ID "${id}" não encontrada.`);
    }
    return referral;
  }
}
