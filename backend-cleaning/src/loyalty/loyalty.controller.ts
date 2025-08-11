// src/modules/loyalty/loyalty.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assumindo que você tem um guard de autenticação
import { AddPointsDto } from './dto/add-points.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Loyalty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obter o saldo de pontos do usuário logado' })
  async getMyPoints(@Req() req) {
    const userId = req.user.id; // Assumindo que o ID do usuário está no token JWT
    const points = await this.loyaltyService.getUserPoints(userId);
    return { userId, currentPoints: points };
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Obter o histórico de transações de pontos do usuário logado' })
  async getMyLoyaltyHistory(@Req() req) {
    const userId = req.user.id;
    return this.loyaltyService.getLoyaltyHistory(userId);
  }

  // Este endpoint seria para uso interno (ex: por um ADMIN ou um worker de fila)
  // Não deve ser exposto diretamente para usuários comuns sem validação rigorosa.
  // @Post('add')
  // @ApiOperation({ summary: 'Adicionar pontos a um usuário (uso interno/admin)' })
  // async addPoints(@Body() addPointsDto: AddPointsDto) {
  //   return this.loyaltyService.addPoints(addPointsDto);
  // }

  @Post('redeem')
  @ApiOperation({ summary: 'Resgatar pontos por uma recompensa' })
  async redeemPoints(@Req() req, @Body() redeemPointsDto: RedeemPointsDto) {
    const userId = req.user.id;
    return this.loyaltyService.redeemPoints({ ...redeemPointsDto, userId });
  }
}