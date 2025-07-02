// src/payments/payments.controller.ts
import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Logger, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePixChargeDto, PixChargeResponseDto } from './dto/create-pix-charge.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { MessageResponseDto } from '../common/dto/message-response.dto';

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
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cria uma nova cobrança PIX para um serviço ou provedor.',
    description: 'Este endpoint permite que um cliente gere uma cobrança PIX para efetuar um pagamento.',
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
    const clientId = req.user['id'];
    return this.paymentsService.createPixCharge(clientId, createPixChargeDto);
  }

  /**
   * Endpoint para um provedor solicitar um saque.
   * Requer autenticação de provedor.
   */
  @Post('withdrawal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicita um saque de valores disponíveis para um provedor.',
    description: 'Este endpoint permite que um provedor solicite o saque de seus ganhos para uma conta bancária.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Solicitação de saque recebida com sucesso.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Provedor não encontrado.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Erro interno do servidor.' })
  async requestWithdrawal(
    @Req() req: Request,
    @Body() requestWithdrawalDto: RequestWithdrawalDto,
  ): Promise<MessageResponseDto> {
    const providerId = req.user['id'];
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
  // Removendo ApiResponse de 500, pois queremos sempre retornar 200 OK ao PagSeguro para webhooks
  async handlePixWebhook(@Body() webhookData: any): Promise<MessageResponseDto> {
    this.logger.log('Recebendo webhook PIX...');
    try {
      // O service já lida com os erros internos e retorna um MessageResponseDto
      // ou lança BadRequestException se dados essenciais estiverem faltando.
      // Se o service lançar uma BadRequestException, o NestJS já a mapeará para um 400 Bad Request.
      // Para qualquer outro erro (que o service não tratou e relançou),
      // nós o logamos e retornamos um 200 OK para o PagSeguro,
      // pois o erro já foi tratado e logado internamente.
      return await this.paymentsService.handlePixWebhook(webhookData);
    } catch (error) {
      this.logger.error('Erro inesperado no controller ao processar webhook PIX:', error.message, error.stack);
      // Retorne um 200 OK aqui para evitar que o PagSeguro reenvie o webhook.
      return { message: 'Erro interno ao processar webhook PIX, mas o erro foi logado.' };
    }
  }
}
