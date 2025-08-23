// src/payments/payments.controller.ts
import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Logger, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePixChargeDto, PixChargeResponseDto } from './dto/create-pix-charge.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto'; // DTO de saque atualizado
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { UserRole } from '@prisma/client';

// Interface para o payload do usuário injetado no req.user pelo JwtStrategy
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
   * Endpoint para criar uma nova cobrança PIX.
   * Requer autenticação de cliente.
   */
  @Post('pix-charge')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cria uma nova cobrança PIX para um serviço ou provedor.',
    description: 'Este endpoint permite que um cliente gere uma cobrança PIX para efetuar o pagamento.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cobrança PIX criada com sucesso.',
    type: PixChargeResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos ou provedor não especificado.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Provedor ou agendamento não encontrado.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Erro interno do servidor.' })
  async createPixCharge(
    @Req() req: Request,
    @Body() createPixChargeDto: CreatePixChargeDto,
  ): Promise<PixChargeResponseDto> {
    const requestUser = req.user as RequestUserPayload;
    const clientUserId = requestUser.userId;

    this.logger.log(`[PaymentsController] createPixCharge: Recebida solicitação de cobrança PIX. User ID: ${clientUserId}, DTO: ${JSON.stringify(createPixChargeDto)}`);
    this.logger.debug(`[PaymentsController] createPixCharge: req.user payload: ${JSON.stringify(requestUser)}`);

    if (!clientUserId) {
      this.logger.error('[PaymentsController] createPixCharge: userId não encontrado no token do usuário.');
      throw new InternalServerErrorException('ID do usuário não disponível no token de autenticação.');
    }

    return this.paymentsService.createPixCharge(clientUserId, createPixChargeDto);
  }

  /**
   * Endpoint para um provedor solicitar um saque via PIX.
   * Requer autenticação de provedor.
   */
  @Post('withdrawal')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Solicita um saque de valores disponíveis para um provedor via chave PIX.',
    description: 'Este endpoint permite que um provedor solicite o saque de seus ganhos para uma chave PIX.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Solicitação de saque recebida com sucesso.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos (valor, chave PIX).' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Provedor não encontrado.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Erro interno do servidor.' })
  async requestWithdrawal(
    @Req() req: Request,
    @Body() requestWithdrawalDto: RequestWithdrawalDto,
  ): Promise<MessageResponseDto> {
    const requestUser = req.user as RequestUserPayload;
    const providerId = requestUser.providerId;

    this.logger.log(`[PaymentsController] requestWithdrawal: Recebida solicitação de saque. Provedor ID: ${providerId}`);
    this.logger.debug(`[PaymentsController] requestWithdrawal: req.user payload: ${JSON.stringify(requestUser)}`);

    if (!providerId) {
      this.logger.error('[PaymentsController] requestWithdrawal: providerId não encontrado no token do usuário. Payload:', requestUser);
      throw new InternalServerErrorException('ID do provedor não disponível no token de autenticação.');
    }

    return this.paymentsService.requestWithdrawal(providerId, requestWithdrawalDto);
  }

  /**
   * NOVO ENDPOINT: Endpoint para receber notificações de webhook de pagamento PIX.
   */
  @Post('webhook/pix')
  @HttpCode(HttpStatus.OK) // Sempre retorna 200 OK para o PagSeguro
  @ApiOperation({
    summary: 'Recebe notificações de webhook de pagamento PIX.',
    description: 'Este endpoint é chamado pelo gateway de pagamento para notificar sobre o status de uma transação PIX.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Webhook recebido e processado com sucesso (ou erro logado internamente).' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados do webhook inválidos (se a validação básica falhar antes do service).' })
  async handlePixWebhook(@Body() webhookData: any): Promise<MessageResponseDto> {
    this.logger.log('Recebendo webhook PIX...');
    this.logger.debug(`[PaymentsController] handlePixWebhook: Dados do webhook: ${JSON.stringify(webhookData)}`);
    try {
      const result = await this.paymentsService.handlePixWebhook(webhookData);
      this.logger.log('[PaymentsController] handlePixWebhook: Webhook processado com sucesso.');
      return result;
    } catch (error) {
      this.logger.error('Erro inesperado no controller ao processar webhook PIX:', error.message, error.stack);
      return { message: 'Erro interno ao processar webhook PIX, mas o erro foi logado.' };
    }
  }

  /**
   * NOVO ENDPOINT: Endpoint para receber notificações de webhook de saque.
   * Este endpoint simula o recebimento de notificações de um gateway de pagamento
   * sobre o status de uma transferência de saque.
   */
  @Post('webhook/withdrawal')
  @HttpCode(HttpStatus.OK) // Retornar 200 OK para o gateway, mesmo em caso de erro interno
  @ApiOperation({
    summary: 'Recebe notificações de webhook de saque.',
    description: 'Este endpoint é chamado pelo gateway de pagamento para notificar sobre o status de uma transação de saque.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Webhook de saque recebido e processado com sucesso (ou erro logado internamente).' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados do webhook inválidos.' })
  async handleWithdrawalWebhook(@Body() webhookData: any): Promise<MessageResponseDto> {
    this.logger.log('Recebendo webhook de saque...');
    this.logger.debug(`[PaymentsController] handleWithdrawalWebhook: Dados do webhook: ${JSON.stringify(webhookData)}`);
    try {
      const result = await this.paymentsService.handleWithdrawalWebhook(webhookData);
      this.logger.log('[PaymentsController] handleWithdrawalWebhook: Webhook de saque processado com sucesso.');
      return result;
    } catch (error) {
      this.logger.error('Erro inesperado no controller ao processar webhook de saque:', error.message, error.stack);
      return { message: 'Erro interno ao processar webhook de saque, mas o erro foi logado.' };
    }
  }
}