// src/payments/payments.controller.ts
import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Logger, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePixChargeDto, PixChargeResponseDto } from './dto/create-pix-charge.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { UserRole } from '@prisma/client'; // Importar UserRole para a interface

// Interface para o payload do usuário injetado no req.user pelo JwtStrategy
interface RequestUserPayload {
  userId: string; // O ID do usuário (sub do JWT)
  email: string;
  role: UserRole;
  clientId?: string; // ID do perfil de cliente, se aplicável
  providerId?: string; // ID do perfil de provedor, se aplicável
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
    // CORREÇÃO AQUI: Passar o userId (ID do User) para o PaymentsService
    const requestUser = req.user as RequestUserPayload;
    const clientUserId = requestUser.userId; // Use userId, que é o ID do User (sub do JWT)

    this.logger.log(`[PaymentsController] createPixCharge: Recebida solicitação de cobrança PIX. User ID: ${clientUserId}, DTO: ${JSON.stringify(createPixChargeDto)}`);
    this.logger.debug(`[PaymentsController] createPixCharge: req.user payload: ${JSON.stringify(requestUser)}`);

    if (!clientUserId) {
      this.logger.error('[PaymentsController] createPixCharge: userId não encontrado no token do usuário.');
      throw new InternalServerErrorException('ID do usuário não disponível no token de autenticação.');
    }

    // O createPixChargeDto já contém providerId e clientEmail (se você o adicionou no DTO),
    // mas o backend o obtém do token/DB, então não é necessário passá-lo aqui.
    return this.paymentsService.createPixCharge(clientUserId, createPixChargeDto);
  }

  /**
   * Endpoint para um provedor solicitar um saque.
   * Requer autenticação de provedor.
   */
  @Post('withdrawal')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
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
    const requestUser = req.user as RequestUserPayload;
    const providerId = requestUser.providerId; // Acessa providerId do objeto populado pelo JwtStrategy

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
}