import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PayoutsService } from './payouts.service';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';

interface RequestUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  clientId?: string;
  providerId?: string;
}

@Controller('payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get('balance')
  @Roles(UserRole.PROVIDER)
  async getBalance(@Req() req: Request) {
    const user = req.user as RequestUserPayload;
    return this.payoutsService.getBalance(user.userId);
  }

  @Post('withdrawals')
  @Roles(UserRole.PROVIDER)
  async createWithdrawal(
    @Req() req: Request,
    @Body() dto: RequestWithdrawalDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const user = req.user as RequestUserPayload;
    return this.payoutsService.requestWithdrawal(
      user.userId,
      dto,
      idempotencyKey,
    );
  }
}
