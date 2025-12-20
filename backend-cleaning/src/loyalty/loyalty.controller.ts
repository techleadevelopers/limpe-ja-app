// src/modules/loyalty/loyalty.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoyaltyService } from './loyalty.service';

type RequestWithUser = Request & { user: { userId: string } };

@ApiTags('Loyalty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obter o saldo de pontos do usuário logado' })
  async getMyPoints(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    const points = await this.loyaltyService.getUserPoints(userId);
    return { userId, currentPoints: points };
  }

  @Get('me/history')
  @ApiOperation({
    summary: 'Obter o histórico de transações de pontos do usuário logado',
  })
  async getMyLoyaltyHistory(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.loyaltyService.getLoyaltyHistory(userId);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Resgatar pontos por uma recompensa' })
  async redeemPoints(
    @Req() req: RequestWithUser,
    @Body() redeemPointsDto: RedeemPointsDto,
  ) {
    const userId = req.user.userId;
    return this.loyaltyService.redeemPoints(userId, redeemPointsDto);
  }

  @Get('rewards')
  @ApiOperation({ summary: 'Lista recompensas ativas para resgate' })
  async getRewards(
    @Req() _req: RequestWithUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('type') type?: string,
    @Query('q') q?: string,
  ) {
    const take = limit ? parseInt(limit, 10) : undefined;
    const skip = offset ? parseInt(offset, 10) : undefined;
    return this.loyaltyService.getActiveRewards(take, skip, type, q);
  }
}
