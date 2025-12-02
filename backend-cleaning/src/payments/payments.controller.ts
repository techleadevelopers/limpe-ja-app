// src/payments/payments.controller.ts
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { PaymentsService } from './payments.service';
import {
  CreatePixChargeDto,
  PixChargeResponseDto,
} from './dto/create-pix-charge.dto';
import { PaymentIntentResponseDto } from './dto/payment-intent-response.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';

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

  /**
   * Cria uma nova cobranca PIX.
   */
  @Post('pix-charge')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cria uma nova cobranca PIX para um servico ou provedor.',
    description: 'Permite que um cliente gere uma cobranca PIX para pagamento.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cobranca PIX criada com sucesso.',
    type: PixChargeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados invalidos ou provedor nao especificado.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Nao autorizado.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Provedor ou agendamento nao encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor.',
  })
  async createPixCharge(
    @Req() req: Request,
    @Body() createPixChargeDto: CreatePixChargeDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<PixChargeResponseDto> {
    const requestUser = req.user as RequestUserPayload;
    const clientUserId = requestUser.userId;

    this.logger.log(
      `[PaymentsController] createPixCharge: Usuario ${clientUserId} criando cobranca PIX. DTO: ${JSON.stringify(createPixChargeDto)}`,
    );

    if (!clientUserId) {
      this.logger.error(
        '[PaymentsController] createPixCharge: userId nao encontrado no token do usuario.',
      );
      throw new InternalServerErrorException(
        'ID do usuario nao disponivel no token de autenticacao.',
      );
    }

    return this.paymentsService.createPixCharge(
      clientUserId,
      createPixChargeDto,
      idempotencyKey,
    );
  }

  /**
   * Recupera o PaymentIntent associado a um agendamento.
   */
  @Get('intent/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Recupera o PaymentIntent associado a um agendamento.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PaymentIntent encontrado com sucesso.',
    type: PaymentIntentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Booking ID invalido.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuario nao autorizado a visualizar o PaymentIntent.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'PaymentIntent nao encontrado.',
  })
  async getPaymentIntent(
    @Req() req: Request,
    @Param('bookingId') bookingId: string,
  ): Promise<PaymentIntentResponseDto> {
    const requestUser = req.user as RequestUserPayload;
    this.logger.log(
      `[PaymentsController] getPaymentIntent: Usuario ${requestUser.userId} consultando PaymentIntent para booking ${bookingId}.`,
    );
    return this.paymentsService.getPaymentIntentForBooking(
      bookingId,
      requestUser.userId,
    );
  }

  /**
   * Consulta status do pagamento para um booking.
   */
  @Get(':bookingId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consulta status do pagamento de um booking.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status recuperado com sucesso.',
    type: PaymentIntentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Booking ID invalido.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuario nao autorizado a visualizar o PaymentIntent.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'PaymentIntent nao encontrado.',
  })
  async getPaymentStatus(
    @Req() req: Request,
    @Param('bookingId') bookingId: string,
  ): Promise<PaymentIntentResponseDto> {
    const requestUser = req.user as RequestUserPayload;
    this.logger.log(
      `[PaymentsController] getPaymentStatus: Usuario ${requestUser.userId} consultando status de pagamento para booking ${bookingId}.`,
    );
    return this.paymentsService.getPaymentIntentForBooking(
      bookingId,
      requestUser.userId,
    );
  }

  /**
   * Solicita saque via PIX para um provedor autenticado.
   */
  @Post('withdrawal')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Solicita saque via PIX para um provedor.',
    description:
      'Permite que um provedor solicite o saque de seus ganhos para uma chave PIX.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Solicitacao de saque recebida com sucesso.',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados invalidos (valor, chave PIX).',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Nao autorizado.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Provedor nao encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor.',
  })
  async requestWithdrawal(
    @Req() req: Request,
    @Body() requestWithdrawalDto: RequestWithdrawalDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const requestUser = req.user as RequestUserPayload;
    const providerId = requestUser.providerId;

    this.logger.log(
      '[PaymentsController] requestWithdrawal: Recebida solicitacao de saque.',
    );
    this.logger.debug(
      `[PaymentsController] requestWithdrawal: req.user payload: ${JSON.stringify(requestUser)}`,
    );

    if (!providerId) {
      this.logger.error(
        '[PaymentsController] requestWithdrawal: providerId nao encontrado no token do usuario.',
        requestUser,
      );
      throw new InternalServerErrorException(
        'ID do provedor nao disponivel no token de autenticacao.',
      );
    }

    return this.paymentsService.requestWithdrawal(
      providerId,
      requestWithdrawalDto,
      idempotencyKey,
    );
  }

  /**
   * Webhook de PIX (fluxo legado).
   */
  @Post('webhook/pix')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recebe notificacoes de webhook de pagamento PIX.',
    description:
      'Chamado pelo gateway para notificar sobre o status de uma transacao PIX.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook recebido e processado.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados do webhook invalidos.',
  })
  async handlePixWebhook(
    @Headers('x-signature') signature: string,
    @Headers('x-event-id') eventId: string,
    @Body() webhookData: any,
  ): Promise<MessageResponseDto> {
    this.logger.log('Recebendo webhook PIX...');
    this.logger.debug(
      `[PaymentsController] handlePixWebhook: payload: ${JSON.stringify(webhookData)}`,
    );
    try {
      return await this.paymentsService.handlePixWebhook(
        signature,
        eventId,
        webhookData,
      );
    } catch (error: any) {
      this.logger.error(
        'Erro inesperado ao processar webhook PIX:',
        error?.message,
        error?.stack,
      );
      return {
        message:
          'Erro interno ao processar webhook PIX, mas o erro foi logado.',
      };
    }
  }

  /**
   * Webhook de saque.
   */
  @Post('webhook/withdrawal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recebe notificacoes de webhook de saque.',
    description:
      'Chamado pelo gateway para notificar sobre o status de uma transferencia de saque.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook de saque recebido e processado.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados do webhook invalidos.',
  })
  async handleWithdrawalWebhook(
    @Headers('x-signature') signature: string,
    @Headers('x-event-id') eventId: string,
    @Body() payload: any,
  ) {
    this.logger.log(
      '[PaymentsController] handleWithdrawalWebhook: received event from PSP.',
    );
    return this.paymentsService.handleWithdrawalWebhook(
      signature,
      eventId,
      payload,
    );
  }
}
