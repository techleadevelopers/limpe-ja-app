// src/payments/payments.service.ts
import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePixChargeDto, PixChargeResponseDto } from './dto/create-pix-charge.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { TransactionType, BookingStatus, UserRole } from '@prisma/client';
import { TransactionEntity } from './entities/transaction.entity';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { ConfigService } from '@nestjs/config'; // Importe ConfigService
import axios from 'axios'; // Importe axios para fazer requisições HTTP

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private pagseguroApiToken: string;
  private pagseguroApiBaseUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService, // Injete ConfigService aqui
  ) {
    this.pagseguroApiToken = this.configService.get<string>('PAGSEGURO_API_TOKEN');
    this.pagseguroApiBaseUrl = this.configService.get<string>('PAGSEGURO_API_BASE_URL', 'https://api.pagseguro.com'); // Default para produção

    if (!this.pagseguroApiToken) {
      this.logger.error('PAGSEGURO_API_TOKEN não configurado. As integrações com PagSeguro não funcionarão.');
      throw new Error('PAGSEGURO_API_TOKEN ausente.');
    }
  }

  /**
   * Cria uma nova cobrança PIX e registra a transação.
   * @param clientId O ID do cliente que está gerando a cobrança.
   * @param dto Os dados para a criação da cobrança PIX.
   * @returns Os detalhes da cobrança PIX gerada.
   */
  async createPixCharge(
    clientId: string,
    dto: CreatePixChargeDto,
  ): Promise<PixChargeResponseDto> {
    const { amount, description, bookingId, providerId } = dto;

    this.logger.log(`[PaymentsService] createPixCharge - Início da função.`);
    this.logger.log(`[PaymentsService] createPixCharge - clientId recebido: ${clientId}`);
    this.logger.log(`[PaymentsService] createPixCharge - DTO recebido: amount=${amount}, description=${description}, bookingId=${bookingId}, providerId=${providerId}`);

    if (!providerId) {
      this.logger.error('[PaymentsService] createPixCharge - providerId é nulo ou indefinido.');
      throw new BadRequestException('O ID do provedor é necessário para criar uma cobrança PIX.');
    }

    const providerExists = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });
    if (!providerExists) {
      this.logger.error(`[PaymentsService] createPixCharge - Provedor com ID "${providerId}" não encontrado.`);
      throw new NotFoundException(`Provedor com ID "${providerId}" não encontrado.`);
    }
    this.logger.log(`[PaymentsService] createPixCharge - Provedor "${providerId}" encontrado.`);

    try {
      // --- INÍCIO DA INTEGRAÇÃO REAL COM GATEWAY DE PAGAMENTO PIX (PagSeguro) ---
      const pixGatewayResponse = await axios.post(`${this.pagseguroApiBaseUrl}/charges`, {
        reference_id: bookingId || `booking_${Date.now()}`, // ID de referência para sua aplicação
        description: description,
        amount: {
          value: Math.round(amount * 100), // Valor em centavos
          currency: 'BRL',
        },
        payment_method: {
          type: 'PIX',
        },
        // Dados do cliente (exemplo, ajuste conforme seu DTO e dados disponíveis)
        customer: {
          email: clientId, // Usando clientId como email temporariamente, ajuste para o email real do cliente
          // name: 'Nome do Cliente', // Adicione nome do cliente se disponível
          // tax_id: 'CPF do Cliente', // Adicione CPF se disponível
        },
        notification_urls: [`${this.configService.get<string>('APP_BASE_URL')}/webhook/pagseguro`], // URL para webhooks
        // Outros campos conforme a documentação da API de Pedidos do PagSeguro
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.pagseguroApiToken}`,
        },
      });

      // Extrair dados da resposta do PagSeguro
      const brCode = pixGatewayResponse.data.qr_codes?.[0]?.text; // BR Code (linha digitável)
      const qrCodeImage = pixGatewayResponse.data.qr_codes?.[0]?.links?.[0]?.href; // URL da imagem do QR Code
      const expiresAt = pixGatewayResponse.data.qr_codes?.[0]?.expiration_date ? new Date(pixGatewayResponse.data.qr_codes[0].expiration_date) : new Date(Date.now() + 3600 * 1000); // Exemplo de expiração
      const gatewayTransactionId = pixGatewayResponse.data.id; // ID da transação no PagSeguro

      if (!brCode || !qrCodeImage || !gatewayTransactionId) {
        this.logger.error(`[PaymentsService] createPixCharge - Resposta inválida do PagSeguro: ${JSON.stringify(pixGatewayResponse.data)}`);
        throw new InternalServerErrorException('Falha ao gerar dados de PIX. Resposta incompleta do gateway.');
      }
      // --- FIM DA INTEGRAÇÃO REAL COM GATEWAY DE PAGAMENTO PIX ---

      const transaction = await this.prisma.transaction.create({
        data: {
          providerId: providerId,
          amount: amount,
          type: TransactionType.PAYMENT,
          status: 'PENDING', // O status inicial deve refletir a espera pela confirmação do pagamento
          description: description,
          ...(bookingId && { bookingId: bookingId }),
          gatewayTransactionId: gatewayTransactionId, // Armazena o ID da transação do gateway
          qrCodeUrl: qrCodeImage, // Armazena a URL da imagem do QR Code
        },
      });
      this.logger.log(`[PaymentsService] createPixCharge - Transação criada com ID: ${transaction.id}`);

      // Se houver um bookingId associado, atualize o status do agendamento para PENDING
      if (bookingId) {
        this.logger.log(`[PaymentsService] createPixCharge - Tentando buscar e atualizar Booking ID: ${bookingId}`);
        const booking = await this.prisma.booking.findFirst({
          where: { id: bookingId },
        });

        if (!booking) {
          this.logger.error(`[PaymentsService] createPixCharge - Agendamento com ID "${bookingId}" não encontrado para atualização de status.`);
          throw new NotFoundException(`Agendamento com ID "${bookingId}" não encontrado.`);
        }
        this.logger.log(`[PaymentsService] createPixCharge - Agendamento "${bookingId}" encontrado. Atualizando status para PENDING.`);
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.PENDING },
        });
        this.logger.log(`[PaymentsService] createPixCharge - Status do agendamento "${bookingId}" atualizado para PENDING.`);
      }

      return {
        transactionId: transaction.id,
        status: 'PENDING',
        brCode: brCode, // Use brCode do gateway
        qrCodeImage: qrCodeImage, // Use qrCodeImage do gateway
        expiresAt: expiresAt, // Use expiresAt do gateway
        amount: amount,
        description: description,
        bookingId: bookingId,
      };
    } catch (error) {
      this.logger.error('Erro ao criar cobrança PIX:', error.response?.data || error.message, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Não foi possível gerar a cobrança PIX. Verifique logs para detalhes.');
    }
  }

  /**
   * Processa uma solicitação de saque de um provedor.
   * @param providerId O ID do provedor que está solicitando o saque.
   * @param dto Os dados da solicitação de saque.
   * @returns Uma mensagem de sucesso.
   */
  async requestWithdrawal(providerId: string, dto: RequestWithdrawalDto): Promise<MessageResponseDto> {
    const { amount, bankName, agencyNumber, accountNumber, accountType, notes } = dto;

    const providerExists = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });
    if (!providerExists) {
      throw new NotFoundException(`Provedor com ID "${providerId}" não encontrado.`);
    }

    try {
      await this.prisma.$transaction(async (prisma) => {
        const completedBookings = await prisma.booking.findMany({
          where: {
            providerId: providerId,
            status: BookingStatus.COMPLETED,
          },
          select: {
            totalPrice: true,
          },
        });
        const totalEarnings = completedBookings.reduce((sum, booking) =>
          sum + booking.totalPrice.toNumber(), 0);

        const allWithdrawals = await prisma.transaction.findMany({
          where: {
            providerId: providerId,
            type: TransactionType.WITHDRAWAL,
          },
          select: {
            amount: true,
          },
        });
        const totalWithdrawn = allWithdrawals.reduce((sum, trans) =>
          sum + trans.amount.toNumber(), 0);

        const availableBalance = totalEarnings - totalWithdrawn;

        if (availableBalance < amount) {
          throw new BadRequestException('Saldo insuficiente para saque.');
        }

        if (amount <= 0) {
          throw new BadRequestException('O valor do saque deve ser maior que zero.');
        }

        const withdrawalTransaction = await prisma.transaction.create({
          data: {
            providerId: providerId,
            amount: amount,
            type: TransactionType.WITHDRAWAL,
            status: 'REQUESTED',
            description: notes || `Solicitação de saque para ${bankName || 'conta'} Ag: ${agencyNumber || 'N/A'} Cc: ${accountNumber || 'N/A'}`,
          },
        });

        this.logger.log(`Saque de R$ ${amount} solicitado pelo provedor ${providerId}. Transação ID: ${withdrawalTransaction.id}`);
      });

      return { message: 'Solicitação de saque recebida com sucesso. Será processada em breve.' };
    } catch (error) {
      this.logger.error('Erro ao solicitar saque:', error.response?.data || error.message, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Não foi possível processar a solicitação de saque.');
    }
  }

  /**
   * NOVO MÉTODO: Lida com notificações de webhook de pagamento PIX.
   *
   * @param webhookData Os dados brutos recebidos do webhook do gateway de pagamento.
   * @returns Uma mensagem de sucesso ou erro.
   */
  async handlePixWebhook(webhookData: any): Promise<MessageResponseDto> {
    this.logger.log('Webhook PIX recebido:', JSON.stringify(webhookData));

    const { transactionId, status, bookingId } = webhookData;

    if (!transactionId || !status) {
      this.logger.error('Dados essenciais ausentes no webhook PIX:', webhookData);
      throw new BadRequestException('Dados essenciais (transactionId, status) ausentes no webhook.');
    }

    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        this.logger.warn(`Transação com ID "${transactionId}" não encontrada para o webhook.`);
        return { message: `Transação com ID "${transactionId}" não encontrada.` };
      }

      if (transaction.status === status) {
        this.logger.warn(`Webhook para transação ${transaction.id} já processado com status ${status}. Ignorando.`);
        return { message: `Webhook já processado para transação ${transaction.id}.` };
      }

      let newBookingStatus: BookingStatus;
      let newTransactionStatus: string;

      if (status === 'COMPLETED' || status === 'PAID') {
        newBookingStatus = BookingStatus.CONFIRMED;
        newTransactionStatus = 'COMPLETED';
        this.logger.log(`Pagamento PIX COMPLETED para transação ${transaction.id}. Confirmando agendamento.`);
      }
      else if (status === 'FAILED' || status === 'CANCELED' || status === 'REFUNDED') {
        newBookingStatus = BookingStatus.CANCELED;
        newTransactionStatus = status.toUpperCase();
        this.logger.log(`Pagamento PIX ${status} para transação ${transaction.id}. Cancelando agendamento.`);
      } else {
        newTransactionStatus = status.toUpperCase();
        this.logger.log(`Status intermediário ${status} para transação ${transaction.id}.`);
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: newTransactionStatus },
        });
        return { message: `Status da transação ${transaction.id} atualizado para ${newTransactionStatus}.` };
      }

      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: newTransactionStatus },
      });

      const associatedBookingId = bookingId || transaction.bookingId;

      if (associatedBookingId) {
        this.logger.log(`Atualizando status do agendamento ${associatedBookingId} para ${newBookingStatus}.`);
        await this.prisma.booking.update({
          where: { id: associatedBookingId },
          data: { status: newBookingStatus },
        });
      } else {
        this.logger.warn(`Transação ${transaction.id} não possui bookingId associado. Agendamento não atualizado.`);
      }

      return { message: `Webhook PIX processado com sucesso. Transação ${transaction.id} e agendamento ${associatedBookingId || 'N/A'} atualizados.` };
    } catch (error) {
      this.logger.error('Erro ao processar webhook PIX:', error.response?.data || error.message, error.stack);
      throw new InternalServerErrorException('Erro ao processar webhook PIX.');
    }
  }
}