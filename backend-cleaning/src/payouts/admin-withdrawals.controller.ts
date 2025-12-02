import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PayoutsService } from './payouts.service';
import { AdminConfirmWithdrawalDto } from './dto/admin-confirm-withdrawal.dto';
import { Request } from 'express';

@Controller('admin/withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminWithdrawalsController {
  constructor(private readonly payouts: PayoutsService) {}

  @Get()
  async list(
    @Query('status') status?: string,
    @Query('email') email?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: 'asc' | 'desc',
  ) {
    return this.payouts.listAdminWithdrawals(
      status,
      email,
      userId,
      from,
      to,
      sortBy,
      sortDir,
    );
  }

  @Patch(':id/confirm')
  async confirm(
    @Param('id') id: string,
    @Body() body: AdminConfirmWithdrawalDto,
    @Req() req: Request,
  ) {
    const adminUserId = (req.user as any)?.userId as string | undefined;
    return this.payouts.adminConfirmWithdrawal(id, {
      gatewayTxnId: body?.gatewayTxnId,
      note: body?.note,
      confirmedByUserId: adminUserId,
    });
  }

  @Patch(':id/fail')
  async fail(
    @Param('id') id: string,
    @Body() body: AdminConfirmWithdrawalDto,
    @Req() req: Request,
  ) {
    const adminUserId = (req.user as any)?.userId as string | undefined;
    return this.payouts.adminFailWithdrawal(id, {
      gatewayTxnId: body?.gatewayTxnId,
      note: body?.note,
      confirmedByUserId: adminUserId,
    });
  }

  @Patch(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() body: AdminConfirmWithdrawalDto,
    @Req() req: Request,
  ) {
    const adminUserId = (req.user as any)?.userId as string | undefined;
    return this.payouts.adminCancelWithdrawal(id, {
      gatewayTxnId: body?.gatewayTxnId,
      note: body?.note,
      confirmedByUserId: adminUserId,
    });
  }
}
