import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BookingStatus, UserRole } from '@prisma/client';
import { BookingsService } from '../bookings/bookings.service';
import { PaymentsService } from '../payments/payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin-payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Post('pix/force-confirm')
  async forceConfirm(@Body('referenceId') referenceId: string) {
    if (!referenceId || !referenceId.trim()) {
      throw new BadRequestException('referenceId é obrigatório.');
    }
    await this.paymentsService.forceConfirmPixPayment(referenceId.trim());
    return { ok: true };
  }

  @Post('bookings/:id/force-status')
  async forceStatus(
    @Param('id') bookingId: string,
    @Body('status') status: BookingStatus,
  ) {
    if (!bookingId || !bookingId.trim()) {
      throw new BadRequestException('bookingId é obrigatório.');
    }
    if (!Object.values(BookingStatus).includes(status)) {
      throw new BadRequestException('status inválido.');
    }
    await this.bookingsService.systemChangeStatus(bookingId.trim(), status);
    return { ok: true };
  }
}
