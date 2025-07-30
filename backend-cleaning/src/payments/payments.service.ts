// src/payments/payments.service.ts
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingStatus, TransactionType, Prisma } from '@prisma/client';
import axios from 'axios';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { BookingsService } from '../bookings/bookings.service'; // Importar BookingsService
import { CreatePixChargeDto, PixChargeResponseDto } from './dto/create-pix-charge.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';

// Tipagem auxiliar para os dados que serão passados para a função de criação de payload
interface PixChargeDetailsForGateway {
  bookingId: string;
  amount: Prisma.Decimal;
  description: string;
  clientEmail: string;
  clientFullName: string;
  clientPhone?: string | null;
  clientCpf?: string | null;
  serviceName: string;
  clientAddress?: {
    cep: string;
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
  } | null;
  providerId: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private pagseguroApiToken: string;
  private pagseguroApiBaseUrl: string;
  private appBaseUrl: string;

  // Injeção de propriedade para BookingsService para resolver dependência circular
  @Inject(forwardRef(() => BookingsService))
  private bookingsService: BookingsService; // Removido do construtor

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private readonly providersService: ProvidersService,
    // Removido bookingsService do construtor
  ) {
    this.pagseguroApiToken = this.configService.get<string>('PAGSEGURO_API_TOKEN');
    this.pagseguroApiBaseUrl = this.configService.get<string>('PAGSEGURO_API_BASE_URL', 'https://sandbox.api.pagseguro.com');
    this.appBaseUrl = this.configService.get<string>('APP_BASE_URL');

    if (!this.pagseguroApiToken) {
      this.logger.error('PAGSEGURO_API_TOKEN não configurado. As integrações com PagSeguro não funcionarão.');
    }
    if (!this.appBaseUrl) {
      this.logger.warn('APP_BASE_URL não configurado. Webhooks do PagSeguro podem não funcionar corretamente.');
    }
  }

  /**
   * Método interno para criar a transação PIX diretamente com a API do PagSeguro (Endpoint de Pedidos com QR Code).
   * Este método agora recebe todos os detalhes necessários, evitando buscas redundantes.
   * @param bookingId ID da reserva/serviço associado.
   * @param amount Custo do serviço (Prisma.Decimal).
   * @param description Descrição da cobrança.
   * @param clientEmail E-mail do cliente.
   * @param clientFullName Nome completo do cliente.
   * @param clientPhone Telefone do cliente.
   * @param clientCpf CPF do cliente.
   * @param serviceName Nome do serviço.
   * @param clientAddress Endereço do cliente.
   * @returns Dados da transação, incluindo QR Code.
   */
  private async createPixTransactionWithGateway(
    bookingId: string,
    amount: Prisma.Decimal,
    description: string,
    clientEmail: string,
    clientFullName: string,
    clientPhone: string | null | undefined,
    clientCpf: string | null | undefined,
    serviceName: string,
    clientAddress: {
      cep: string;
      street: string;
      number: string;
      complement?: string | null;
      neighborhood: string;
      city: string;
      state: string;
    } | null,
  ): Promise<any> {
    this.logger.log(`[PaymentsService] createPixTransactionWithGateway - Iniciando criação de transação PIX (via /orders) para reserva ${bookingId}.`);

    const url = `${this.pagseguroApiBaseUrl}/orders`;

    try {
      const customerTaxId = clientCpf || '30061150827';
      const customerPhoneArea = clientPhone ? clientPhone.substring(0, 2) : '00';
      const customerPhoneNumber = clientPhone && clientPhone.length >= 11 ? clientPhone.substring(2) : '999999999';

      const addressPayload: any = {
        street: clientAddress?.street || 'Rua Teste',
        number: clientAddress?.number || '123',
        locality: clientAddress?.neighborhood || 'Bairro Teste',
        city: clientAddress?.city || 'Cidade Teste',
        region_code: clientAddress?.state || 'SP',
        country: 'BRA',
        postal_code: clientAddress?.cep || '00000000',
      };

      if (clientAddress?.complement && clientAddress.complement.trim() !== '') {
        addressPayload.complement = clientAddress.complement;
      }

      const payload = {
        reference_id: bookingId,
        customer: {
          name: clientFullName,
          email: clientEmail,
          tax_id: customerTaxId,
          phones: [
            {
              country: '55',
              area: customerPhoneArea,
              number: customerPhoneNumber,
              type: 'MOBILE',
            },
          ],
        },
        items: [
          {
            name: serviceName,
            quantity: 1,
            unit_amount: Math.round(amount.toNumber() * 100),
          },
        ],
        qr_codes: [
          {
            amount: {
              value: Math.round(amount.toNumber() * 100),
            },
            expiration_date: new Date(Date.now() + 3600 * 1000).toISOString(),
          },
        ],
        shipping: {
          address: addressPayload,
        },
        notification_urls: [`${this.appBaseUrl}/payments/webhook/pix`],
      };

      this.logger.debug(`[PaymentsService] createPixTransactionWithGateway - Enviando para PagSeguro (/orders): ${JSON.stringify(payload)}`);

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.pagseguroApiToken}`,
        },
      });

      this.logger.log(`[PaymentsService] createPixTransactionWithGateway - Pedido PIX criado com sucesso para reserva ${bookingId}.`);
      return response.data;
    } catch (error) {
      this.logger.error(`[PaymentsService] createPixTransactionWithGateway - Erro ao criar pedido PIX para reserva ${bookingId}: ${error.message}`);
      if (axios.isAxiosError(error) && error.response) {
        this.logger.error(`[PaymentsService] createPixTransactionWithGateway - Dados do erro da API PagSeguro: ${JSON.stringify(error.response.data)}`);
        const pagseguroErrorMessage = error.response.data?.error_messages?.[0]?.description || error.response.data?.message || 'Erro desconhecido do PagSeguro.';
        throw new InternalServerErrorException(`Falha no PagSeguro: ${pagseguroErrorMessage}`);
      }
      throw new InternalServerErrorException('Falha ao criar transação de pagamento.');
    }
  }

  /**
   * Cria uma nova cobrança PIX e registra a transação.
   * @param clientUserId O ID do usuário cliente que está gerando a cobrança (sub do JWT).
   * @param dto Os dados para a criação da cobrança PIX.
   * @returns Os detalhes da cobrança PIX gerada.
   */
  async createPixCharge(
    clientUserId: string, // Renomeado para clientUserId para clareza
    dto: CreatePixChargeDto,
  ): Promise<PixChargeResponseDto> {
    const { amount, description, bookingId, providerId } = dto;

    this.logger.log(`[PaymentsService] createPixCharge - Início da função.`);
    this.logger.log(`[PaymentsService] createPixCharge - clientUserId recebido: ${clientUserId}`);
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

    // Buscar o email, nome completo, telefone e CPF do cliente
    // CORREÇÃO AQUI: Buscar o cliente pelo userId e incluir a relação 'client'
    this.logger.debug(`[PaymentsService] createPixCharge - Tentando buscar clientUserWithDetails para ID: ${clientUserId}`);
    const clientUserWithDetails = await this.prisma.user.findUnique({
      where: { id: clientUserId }, // Use clientUserId (que é o ID do User) para buscar na tabela User
      select: {
        email: true,
        client: { // Inclua a relação 'client' para acessar fullName, phone, cpf, address
          select: {
            id: true, // ID do cliente
            fullName: true,
            phone: true,
            cpf: true,
            address: true,
          },
        },
      },
    });

    this.logger.debug(`[PaymentsService] createPixCharge - Resultado da busca por clientUserWithDetails (ID: ${clientUserId}): ${JSON.stringify(clientUserWithDetails)}`);

    if (!clientUserWithDetails || !clientUserWithDetails.client || !clientUserWithDetails.email) {
      this.logger.error(`[PaymentsService] createPixCharge - Usuário cliente com ID "${clientUserId}" não encontrado, sem perfil de cliente associado, ou sem email.`);
      this.logger.debug(`[PaymentsService] createPixCharge - clientUserWithDetails: ${JSON.stringify(clientUserWithDetails)}`);
      throw new NotFoundException(`Usuário cliente com ID "${clientUserId}" não encontrado ou dados incompletos.`);
    }
    this.logger.log(`[PaymentsService] createPixCharge - Usuário cliente "${clientUserWithDetails.email}" (Nome: ${clientUserWithDetails.client.fullName}) encontrado.`);

    // Buscar o Booking e o nome do serviço
    const bookingWithServiceDetails = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        totalPrice: true,
        providerService: {
          select: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!bookingWithServiceDetails || !bookingWithServiceDetails.providerService?.service) {
      this.logger.error(`[PaymentsService] createPixCharge - Dados do agendamento ou serviço para bookingId ${bookingId} não encontrados.`);
      throw new NotFoundException(`Agendamento ou serviço associado ao bookingId "${bookingId}" não encontrado.`);
    }
    const serviceName = bookingWithServiceDetails.providerService.service.name;
    this.logger.log(`[PaymentsService] createPixCharge - Nome do serviço para booking ${bookingId}: ${serviceName}`);


    // 3. Criar uma transação pendente no banco de dados
    const transaction = await this.prisma.transaction.create({
      data: {
        providerId: dto.providerId,
        bookingId: dto.bookingId || null,
        amount: new Prisma.Decimal(dto.amount),
        type: TransactionType.PAYMENT,
        status: 'PENDING',
        description: dto.description,
      },
    });
    this.logger.log(`[PaymentsService] createPixCharge - Transação pendente criada com ID: ${transaction.id}`);

    try {
      // --- INÍCIO DA INTEGRAÇÃO REAL COM GATEWAY DE PAGAMENTO PIX (PagSeguro) ---
      // Prepara os detalhes completos para o método interno createPixTransactionWithGateway
      const pixDetailsForGateway = {
        bookingId: bookingId,
        amount: new Prisma.Decimal(amount),
        description: description,
        clientEmail: clientUserWithDetails.email,
        clientFullName: clientUserWithDetails.client.fullName,
        clientPhone: clientUserWithDetails.client.phone,
        clientCpf: clientUserWithDetails.client.cpf,
        serviceName: serviceName,
        clientAddress: clientUserWithDetails.client.address,
        providerId: dto.providerId,
      };

      // Chama o método interno createPixTransactionWithGateway
      const pixResponseFromGateway = await this.createPixTransactionWithGateway(
        pixDetailsForGateway.bookingId,
        pixDetailsForGateway.amount,
        pixDetailsForGateway.description,
        pixDetailsForGateway.clientEmail,
        pixDetailsForGateway.clientFullName,
        pixDetailsForGateway.clientPhone,
        pixDetailsForGateway.clientCpf,
        pixDetailsForGateway.serviceName,
        pixDetailsForGateway.clientAddress,
      );

      // Extrair dados da resposta do PagSeguro (ajuste conforme a estrutura real da resposta da API de Pedidos do PagSeguro)
      const pixQrCodeData = pixResponseFromGateway.qr_codes?.[0];
      const brCode = pixQrCodeData?.text;
      const qrCodeImageLink = pixQrCodeData?.links?.find(link => link.media === 'image/png');
      const qrCodeImage = qrCodeImageLink?.href;
      const expiresAtDate = pixQrCodeData?.expiration_date ? new Date(pixQrCodeData.expiration_date) : new Date(Date.now() + 24 * 3600 * 1000);
      const gatewayTransactionId = pixResponseFromGateway.id;

      if (!brCode || !qrCodeImage || !gatewayTransactionId) {
        this.logger.error(`[PaymentsService] createPixCharge - Resposta inválida do PagSeguro (dados PIX incompletos): ${JSON.stringify(pixResponseFromGateway)}`);
        throw new InternalServerErrorException('Falha ao gerar dados de PIX. Resposta incompleta do gateway.');
      }

      // Atualizar a transação criada anteriormente com o gatewayTransactionId
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          gatewayTransactionId: gatewayTransactionId,
          qrCodeUrl: qrCodeImage,
        },
      });
      this.logger.log(`[PaymentsService] createPixCharge - Transação local ${transaction.id} atualizada com gatewayTransactionId ${gatewayTransactionId}.`);


      // Se houver um bookingId associado, atualize o status do agendamento para PENDING
      if (bookingId) {
        this.logger.log(`[PaymentsService] createPixCharge - Tentando buscar e atualizar Booking ID: ${bookingId}`);
        const booking = await this.prisma.booking.findUnique({
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
        brCode: brCode,
        qrCodeImage: qrCodeImage,
        expiresAt: expiresAtDate.toISOString(),
        amount: amount,
        description: description,
        bookingId: bookingId,
        providerId: providerId,
      };
    } catch (error) {
      this.logger.error('Erro ao criar cobrança PIX:', error.response?.data || error.message, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof InternalServerErrorException) {
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
            description: notes || `Solicitação de saque para ${bankName || 'conta padrão'} Ag: ${agencyNumber || 'N/A'} Cc: ${accountNumber || 'N/A'}`,
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

  async handlePixWebhook(webhookData: any): Promise<MessageResponseDto> {
    this.logger.log(`[PaymentsService] handlePixWebhook - Webhook PIX recebido: ${JSON.stringify(webhookData)}`);

    const transactionId = webhookData.transactionId; // Exemplo: ID da transação no seu sistema
    const status = webhookData.status; // Exemplo: status do pagamento do gateway (e.g., 'PAID', 'CANCELED')

    if (!transactionId || !status) {
      this.logger.error('[PaymentsService] handlePixWebhook - Dados de webhook incompletos: transactionId ou status ausentes.');
      throw new BadRequestException('Dados essenciais (transactionId, status) ausentes no webhook.');
    }

    try {
      // Usar o gatewayTransactionId (que é o ID do pedido do PagSeguro) para encontrar a transação local
      const transaction = await this.prisma.transaction.findFirst({
        where: { gatewayTransactionId: transactionId }, // Assumindo que webhookData.transactionId é o gatewayTransactionId
      });

      if (!transaction) {
        this.logger.warn(`Transação com gatewayTransactionId "${transactionId}" não encontrada para o webhook.`);
        return { message: `Transação com gatewayTransactionId "${transactionId}" não encontrada.` };
      }

      if (transaction.status === status) {
        this.logger.log(`Status da transação ${transactionId} já é "${status}". Ignorando atualização duplicada.`);
        return { message: `Status da transação ${transactionId} já é "${status}".` };
      }

      let newBookingStatus: BookingStatus | undefined;
      let newTransactionStatus: string;

      switch (status.toLowerCase()) { // Usar toLowerCase para robustez
        case 'paid':
        case 'completed':
          newBookingStatus = BookingStatus.CONFIRMED;
          newTransactionStatus = 'COMPLETED';
          break;
        case 'canceled':
        case 'voided':
          newBookingStatus = BookingStatus.CANCELED;
          newTransactionStatus = 'CANCELED';
          break;
        case 'processing':
        case 'pending':
          newTransactionStatus = 'PENDING';
          break;
        default:
          newTransactionStatus = status.toUpperCase();
          this.logger.warn(`Status do PagSeguro "${status}" não mapeado. Atualizando transação para ${newTransactionStatus}.`);
      }

      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: newTransactionStatus },
      });
      this.logger.log(`Status da transação ${transaction.id} atualizado para ${newTransactionStatus}.`);

      if (transaction.bookingId && newBookingStatus) {
        this.logger.log(`Atualizando status do agendamento ${transaction.bookingId} para ${newBookingStatus}.`);
        await this.prisma.booking.update({
          where: { id: transaction.bookingId },
          data: { status: newBookingStatus },
        });
        this.logger.log(`Status do agendamento "${transaction.bookingId}" atualizado para ${newBookingStatus}.`);
      } else if (newBookingStatus && !transaction.bookingId) {
        this.logger.warn(`Transação ${transaction.id} não possui bookingId associado. Agendamento não atualizado.`);
      }

      return { message: `Webhook processado com sucesso para transação ${transaction.id}.` };
    } catch (error) {
      this.logger.error('Erro ao processar webhook PIX:', error.response?.data || error.message, error.stack);
      // RECOMENDAÇÃO: Retornar 200 OK mesmo em caso de erro interno para evitar reenvios do webhook
      return { message: 'Erro interno ao processar webhook PIX, mas o erro foi logado.' };
    }
  }
}