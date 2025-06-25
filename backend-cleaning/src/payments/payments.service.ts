// src/payments/payments.service.ts
import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePixChargeDto, PixChargeResponseDto } from './dto/create-pix-charge.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { TransactionType, BookingStatus, UserRole } from '@prisma/client';
import { TransactionEntity } from './entities/transaction.entity';
import { MessageResponseDto } from '../common/dto/message-response.dto';
// REMOVIDO: import { BookingsService } from '../bookings/bookings.service'; // REMOVA ESTA LINHA

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    // REMOVIDO: private bookingsService: BookingsService,
  ) {}

  /**
   * Cria uma nova cobrança PIX e registra a transação.
   * @param clientId O ID do cliente que está gerando a cobrança.
   * @param dto Os dados para a criação da cobrança PIX.
   * @returns Os detalhes da cobrança PIX gerada.
   */
  async createPixCharge(
    clientId: string, // Este clientId é o userId do cliente logado, conforme o JWT.
    dto: CreatePixChargeDto,
  ): Promise<PixChargeResponseDto> {
    const { amount, description, bookingId, providerId } = dto;

    // --- LOGS DE DEPURACAO AQUI ---
    this.logger.log(`[PaymentsService] createPixCharge - Início da função.`);
    this.logger.log(`[PaymentsService] createPixCharge - clientId recebido: ${clientId}`);
    this.logger.log(`[PaymentsService] createPixCharge - DTO recebido: amount=${amount}, description=${description}, bookingId=${bookingId}, providerId=${providerId}`);
    // --- FIM DOS LOGS DE DEPURACAO ---

    // Embora o `bookings.service` já valide que o provedor existe,
    // esta é uma camada extra de segurança se este serviço for chamado diretamente.
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
      const transaction = await this.prisma.transaction.create({
        data: {
          providerId: providerId,
          amount: amount,
          type: TransactionType.PAYMENT,
          status: 'PENDING',
          description: description,
          ...(bookingId && { bookingId: bookingId }), // Condicionalmente adiciona bookingId se presente
        },
      });
      this.logger.log(`[PaymentsService] createPixCharge - Transação criada com ID: ${transaction.id}`);


      // Simulação de dados de retorno da API PIX
      const simulatedBrCode = `00020101021226580014BR.GOV.BCB.PIX0136${transaction.id}5204000053039865802BR5913CLIENTE TESTE6008BRASILIA62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const simulatedQrCodeImage = `https://api.example.com/pix/qrcode/${transaction.id}.png`;
      const simulatedExpiresAt = new Date(Date.now() + 3600 * 1000); // Expira em 1 hora

      // Se houver um bookingId associado, atualize o status do agendamento para PENDING
      if (bookingId) {
        this.logger.log(`[PaymentsService] createPixCharge - Tentando buscar e atualizar Booking ID: ${bookingId}`);
        const booking = await this.prisma.booking.findFirst({
          where: { id: bookingId }, // Buscar o booking APENAS pelo ID
        });

        if (!booking) {
          this.logger.error(`[PaymentsService] createPixCharge - Agendamento com ID "${bookingId}" não encontrado para atualização de status.`);
          throw new NotFoundException(`Agendamento com ID "${bookingId}" não encontrado.`);
        }
        this.logger.log(`[PaymentsService] createPixCharge - Agendamento "${bookingId}" encontrado. Atualizando status para PENDING.`);
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.PENDING }, // Altera o status do booking para PENDING
        });
        this.logger.log(`[PaymentsService] createPixCharge - Status do agendamento "${bookingId}" atualizado para PENDING.`);
      }

      // Retorna os detalhes da cobrança PIX gerada
      return {
        transactionId: transaction.id,
        status: 'PENDING',
        brCode: simulatedBrCode,
        qrCodeImage: simulatedQrCodeImage,
        expiresAt: simulatedExpiresAt,
        amount: amount,
        description: description,
        bookingId: bookingId, // Adiciona o bookingId à resposta, se presente.
      };
    } catch (error) {
      this.logger.error('Erro ao criar cobrança PIX:', error.response?.data || error.message, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Não foi possível gerar a cobrança PIX.');
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
      const transaction = await this.prisma.transaction.create({
        data: {
          providerId: providerId,
          amount: amount,
          type: TransactionType.WITHDRAWAL,
          status: 'REQUESTED',
          description: notes || `Solicitação de saque para ${bankName} Ag: ${agencyNumber} Cc: ${accountNumber}`,
        },
      });

      this.logger.log(`Saque de R$ ${amount} solicitado pelo provedor ${providerId}. Transação ID: ${transaction.id}`);

      return { message: 'Solicitação de saque recebida com sucesso. Será processada em breve.' };
    } catch (error) {
      this.logger.error('Erro ao solicitar saque:', error.response?.data || error.message, error.stack);
      if (error instanceof NotFoundException) {
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