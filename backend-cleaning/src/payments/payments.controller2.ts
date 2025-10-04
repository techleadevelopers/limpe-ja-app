// src/payments/payments.controller2.ts
import { Controller, Get, Post, Body, UseGuards, Req, Param, HttpCode, HttpStatus, Logger, InternalServerErrorException, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePixChargeDto, PixChargeResponseDto } from './dto/create-pix-charge.dto';
import { PaymentIntentResponseDto } from './dto/payment-intent-response.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { UserRole } from '@prisma/client';

interface RequestUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  clientId?: string;
  providerId?: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  // Cria uma nova cobrança PIX
  @Post('pix-charge')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria uma nova cobrança PIX para um serviço ou provedor.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cobrança PIX criada com sucesso.', type: PixChargeResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  async createPixCharge(
    @Req() req: Request,
    @Body() createPixChargeDto: CreatePixChargeDto,
  ): Promise<PixChargeResponseDto> {
    const requestUser = req.user as RequestUserPayload;
    const clientUserId = requestUser.userId;
    if (!clientUserId) throw new InternalServerErrorException('ID do usuário não disponível no token.');
    return this.paymentsService.createPixCharge(clientUserId, createPixChargeDto);
  }

  // Obtém o PaymentIntent de um booking
  @Get('intent/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recupera o PaymentIntent associado a um agendamento' })
  @ApiResponse({ status: HttpStatus.OK, type: PaymentIntentResponseDto })
  async getPaymentIntent(
    @Req() req: Request,
    @Param('bookingId') bookingId: string,
  ): Promise<PaymentIntentResponseDto> {
    const requestUser = req.user as RequestUserPayload;
    return this.paymentsService.getPaymentIntentForBooking(bookingId, requestUser.userId);
  }

  // Solicita saque para provedor
  @Post('withdrawal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicita um saque via chave PIX (provedor).' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Solicitação de saque recebida.' })
  async requestWithdrawal(
    @Req() req: Request,
    @Body() requestWithdrawalDto: RequestWithdrawalDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const requestUser = req.user as RequestUserPayload;
    const providerId = requestUser.providerId;
    this.logger.log(`[PaymentsController] requestWithdrawal: providerId=${providerId}`);
    this.logger.debug(`[PaymentsController] requestWithdrawal user payload: ${JSON.stringify(requestUser)}`);
    if (!providerId) throw new InternalServerErrorException('providerId não disponível no token.');
    return this.paymentsService.requestWithdrawal(providerId, requestWithdrawalDto, idempotencyKey);
  }

  // Webhook PIX
  @Post('webhook/pix')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recebe notificações de webhook PIX.' })
  @ApiResponse({ status: HttpStatus.OK })
  async handlePixWebhook(
    @Headers('x-signature') signature: string,
    @Headers('x-event-id') eventId: string,
    @Body() webhookData: any,
  ): Promise<MessageResponseDto> {
    return this.paymentsService.handlePixWebhook(signature, eventId, webhookData);
  }

  // Webhook de saque
  @Post('webhook/withdrawal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recebe notificações de webhook de saque.' })
  @ApiResponse({ status: HttpStatus.OK })
  async handleWithdrawalWebhook(
    @Headers('x-signature') signature: string,
    @Headers('x-event-id') eventId: string,
    @Body() payload: any,
  ) {
    return this.paymentsService.handleWithdrawalWebhook(signature, eventId, payload);
  }
}
