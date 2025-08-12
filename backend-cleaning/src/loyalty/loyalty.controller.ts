// src/modules/loyalty/loyalty.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
    const userId = req.user.id;
    const points = await this.loyaltyService.getUserPoints(userId);
    return { userId, currentPoints: points };
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Obter o histórico de transações de pontos do usuário logado' })
  async getMyLoyaltyHistory(@Req() req) {
    const userId = req.user.id;
    return this.loyaltyService.getLoyaltyHistory(userId);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Resgatar pontos por uma recompensa' })
  async redeemPoints(@Req() req, @Body() redeemPointsDto: RedeemPointsDto) {
    const userId = req.user.id;
    // CORREÇÃO: Passe userId como um argumento separado
    return this.loyaltyService.redeemPoints(userId, redeemPointsDto);
  }
}