// src/modules/loyalty/loyalty.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Obter o saldo de pontos do usuÃ¡rio logado' })
  async getMyPoints(@Req() req) {
    const userId = req.user.userId;
    const points = await this.loyaltyService.getUserPoints(userId);
    return { userId, currentPoints: points };
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Obter o histÃ³rico de transaÃ§Ãµes de pontos do usuÃ¡rio logado' })
  async getMyLoyaltyHistory(@Req() req) {
    const userId = req.user.userId;
    return this.loyaltyService.getLoyaltyHistory(userId);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Resgatar pontos por uma recompensa' })
  async redeemPoints(@Req() req, @Body() redeemPointsDto: RedeemPointsDto) {
    const userId = req.user.userId;
    // CORREÃ‡ÃƒO: Passe userId como um argumento separado
    return this.loyaltyService.redeemPoints(userId, redeemPointsDto);
  }

  @Get('rewards')
  @ApiOperation({ summary: 'Lista recompensas ativas para resgate' })
  async getRewards(@Req() req, @Query('limit') limit?: string, @Query('offset') offset?: string, @Query('type') type?: string, @Query('q') q?: string) {
    // auth via controller guard; just forward to service
    const take = limit ? parseInt(limit, 10) : undefined;
    const skip = offset ? parseInt(offset, 10) : undefined;
    return this.loyaltyService.getActiveRewards(take, skip, type, q);
  }}



