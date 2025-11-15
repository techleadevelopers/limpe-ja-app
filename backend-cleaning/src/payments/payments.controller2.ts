// src/payments/payments.controller2.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Req,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  InternalServerErrorException,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePixChargeDto, PixChargeResponseDto } from './dto/create-pix-charge.dto';
import { PaymentIntentResponseDto } from './dto/payment-intent-response.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

  // Cria uma cobrança PIX
  @Post('pix-charge')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cria uma nova cobrança PIX para um serviço ou provedor.',
    description: 'Permite que um cliente gere uma cobrança PIX para efetuar o pagamento.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cobrança PIX criada com sucesso.', type: PixChargeResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos ou provedor não especificado.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Provedor ou agendamento não encontrado.' })
  async createPixCharge(
    @Req() req: Request,
    @Body() createPixChargeDto: CreatePixChargeDto,
  ): Promise<PixChargeResponseDto> {
    const requestUser = req.user as RequestUserPayload;
    const clientUserId = requestUser.userId;
    this.logger.log(`[PaymentsController] createPixCharge: userId=${clientUserId} dto=${JSON.stringify(createPixChargeDto)}`);
    if (!clientUserId) {
      this.logger.error('[PaymentsController] createPixCharge: userId não encontrado no token.');
      throw new InternalServerErrorException('ID do usuário não disponível no token de autenticação.');
    }
    return this.paymentsService.createPixCharge(clientUserId, createPixChargeDto);
  }

  // Recupera PaymentIntent por booking
  @Get('intent/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recupera o PaymentIntent associado a um agendamento' })
  @ApiResponse({ status: HttpStatus.OK, description: 'PaymentIntent encontrado com sucesso.', type: PaymentIntentResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Usuário não autorizado a visualizar o PaymentIntent.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'PaymentIntent não encontrado.' })
  async getPaymentIntent(
    @Req() req: Request,
    @Param('bookingId') bookingId: string,
  ): Promise<PaymentIntentResponseDto> {
    const requestUser = req.user as RequestUserPayload;
    this.logger.log(`[PaymentsController] getPaymentIntent: userId=${requestUser.userId} bookingId=${bookingId}`);
    return this.paymentsService.getPaymentIntentForBooking(bookingId, requestUser.userId);
  }

  // Solicita saque via PIX (provedor)
  @Post('withdrawal')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Solicita um saque de valores disponíveis para um provedor via chave PIX.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Solicitação de saque recebida com sucesso.', type: MessageResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos (valor, chave PIX).' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Provedor não encontrado.' })
  async requestWithdrawal(
    @Req() req: Request,
    @Body() requestWithdrawalDto: RequestWithdrawalDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const requestUser = req.user as RequestUserPayload;
    const providerId = requestUser.providerId;
    this.logger.log(`[PaymentsController] requestWithdrawal: providerId=${providerId}`);
    this.logger.debug(`[PaymentsController] requestWithdrawal: req.user=${JSON.stringify(requestUser)}`);
    if (!providerId) {
      this.logger.error('[PaymentsController] requestWithdrawal: providerId não encontrado no token.', requestUser as any);
      throw new InternalServerErrorException('ID do provedor não disponível no token de autenticação.');
    }
    return this.paymentsService.requestWithdrawal(providerId, requestWithdrawalDto, idempotencyKey);
  }

  // Webhook de PIX
  @Post('webhook/pix')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recebe notificações de webhook de pagamento PIX.',
    description: 'Chamado pelo PSP para notificar status de uma transação PIX.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Webhook recebido e processado.' })
  async handlePixWebhook(
    @Headers('x-signature') signature: string,
    @Headers('x-event-id') eventId: string,
    @Body() webhookData: any,
    @Req() req: Request,
  ): Promise<MessageResponseDto> {
    this.logger.log('[PaymentsController] handlePixWebhook: recebido.');
    this.logger.debug(`[PaymentsController] handlePixWebhook: payload=${JSON.stringify(webhookData)}`);
    try {
      const rawBody: Buffer | undefined = (req as any)?.rawBody;
      return await this.paymentsService.handlePixWebhook(signature, eventId, webhookData, rawBody);
    } catch (error: any) {
      this.logger.error('Erro ao processar webhook PIX no controller:', error?.message, error?.stack);
      return { message: 'Erro interno ao processar webhook PIX, mas o erro foi logado.' };
    }
  }

  // Webhook de saque/withdrawal
  @Post('webhook/withdrawal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recebe notificações de webhook de saque.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Webhook de saque recebido e processado.' })
  async handleWithdrawalWebhook(
    @Headers('x-signature') signature: string,
    @Headers('x-event-id') eventId: string,
    @Body() payload: any,
  ) {
    this.logger.log('[PaymentsController] handleWithdrawalWebhook: received event from PSP.');
    return this.paymentsService.handleWithdrawalWebhook(signature, eventId, payload);
  }

  // ADMIN: Listar transações
  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista transações (admin)' })
  async listTransactions(@Req() req: any) {
    const role = req.user?.role;
    if (role !== 'ADMIN') throw new InternalServerErrorException('Admin only');
    const type = req.query?.type as string | undefined;
    const status = req.query?.status as string | undefined;
    return this.paymentsService.listTransactions(type, status);
  }

  // ADMIN: Iniciar reembolso
  @Post(':transactionId/refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inicia reembolso (admin)' })
  async refund(@Req() req: any, @Param('transactionId') transactionId: string, @Body() body: { amount?: number }) {
    const role = req.user?.role;
    if (role !== 'ADMIN') throw new InternalServerErrorException('Admin only');
    return this.paymentsService.initiateRefund(transactionId, body?.amount);
  }

  // ADMIN: Listar solicitações de saque
  @Get('withdrawals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista solicitações de saque (admin)' })
  async listWithdrawals(@Req() req: any) {
    const role = req.user?.role;
    if (role !== 'ADMIN') throw new InternalServerErrorException('Admin only');
    const status = req.query?.status as string | undefined;
    return this.paymentsService.listWithdrawals(status);
  }

  // ADMIN: Registrar webhooks (PIX e Payouts)
  @Post('webhooks/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registra webhooks de PIX e Payouts no PagBank (admin)' })
  async registerWebhooks(@Req() req: any, @Body() body: { pixUrl?: string; payoutsUrl?: string }) {
    const role = req.user?.role;
    if (role !== 'ADMIN') throw new InternalServerErrorException('Admin only');
    return this.paymentsService.registerAllWebhooks(body?.pixUrl, body?.payoutsUrl);
  }

  // ADMIN: Aprovar saque
  @Patch('withdrawals/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprova solicitação de saque (admin)' })
  async approveWithdrawal(@Req() req: any, @Param('id') id: string) {
    const role = req.user?.role;
    if (role !== 'ADMIN') throw new InternalServerErrorException('Admin only');
    return this.paymentsService.approveWithdrawal(id);
  }

  // ADMIN: Rejeitar saque
  @Patch('withdrawals/:id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rejeita solicitação de saque (admin)' })
  async rejectWithdrawal(@Req() req: any, @Param('id') id: string, @Body() body: { reason?: string }) {
    const role = req.user?.role;
    if (role !== 'ADMIN') throw new InternalServerErrorException('Admin only');
    return this.paymentsService.rejectWithdrawal(id, body?.reason);
  }
}
