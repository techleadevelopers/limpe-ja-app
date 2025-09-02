// src/payments/payments.service.ts
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingStatus, TransactionType, Prisma } from '@prisma/client';
import axios from 'axios';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { BookingsService } from '../bookings/bookings.service';
import { CreatePixChargeDto, PixChargeResponseDto } from './dto/create-pix-charge.dto';
import { RequestWithdrawalDto, PixKeyType } from './dto/request-withdrawal.dto';
import { CouponsService } from '../coupons/coupons.service';
import { Decimal } from '@prisma/client/runtime/library';
import { NotificationsService } from '../notifications/notifications.service'; // NEW
import { EmailService } from '../email/email.service'; // NEW
import { QueuesService } from '../queues/queues.service'; // NEW
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto'; // NEW

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
  private minWithdrawalAmount: number;

  // Injeção de propriedade para BookingsService para resolver dependência circular
  @Inject(forwardRef(() => BookingsService))
  private bookingsService: BookingsService;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private readonly providersService: ProvidersService,
    private readonly couponsService: CouponsService,
    private readonly notificationsService: NotificationsService, // NEW
    private readonly emailService: EmailService, // NEW
    private readonly queuesService: QueuesService, // NEW
  ) {
    this.pagseguroApiToken = this.configService.get<string>('PAGSEGURO_API_TOKEN');
    this.pagseguroApiBaseUrl = this.configService.get<string>('PAGSEGURO_API_BASE_URL', 'https://sandbox.api.pagseguro.com');
    this.appBaseUrl = this.configService.get<string>('API_BASE_URL');
    this.minWithdrawalAmount = this.configService.get<number>('MIN_WITHDRAWAL_AMOUNT', 10.00); // Default to 10.00

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
        notification_urls: [`${this.configService.get('API_BASE_URL')}/payments/webhook/pix`],

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
    clientUserId: string,
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
    this.logger.debug(`[PaymentsService] createPixCharge - Tentando buscar clientUserWithDetails para ID: ${clientUserId}`);
    const clientUserWithDetails = await this.prisma.user.findUnique({
      where: { id: clientUserId },
      select: {
        email: true,
        client: {
          select: {
            id: true,
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
        couponId: true,
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
        provider: { connect: { id: dto.providerId } },
        ...(dto.bookingId && { booking: { connect: { id: dto.bookingId } } }),
        amount: new Prisma.Decimal(dto.amount),
        type: TransactionType.PAYMENT,
        status: 'PENDING',
        description: dto.description,
        ...(bookingWithServiceDetails.couponId && { coupon: { connect: { id: bookingWithServiceDetails.couponId } } }),
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
   * Simula o processamento de saque via PIX com um gateway de pagamento.
   * Em um cenário real, esta função faria uma chamada HTTP para a API do gateway de pagamento
   * que suporta transferências PIX.
   * @param transactionId ID da transação interna.
   * @param amount Valor do saque.
   * @param pixKey Chave PIX.
   * @param pixKeyType Tipo da chave PIX.
   * @returns Um ID de transação do gateway simulado.
   */
  private async processWithdrawalWithGateway(
    transactionId: string,
    amount: Prisma.Decimal,
    pixKey: string,
    pixKeyType: PixKeyType
  ): Promise<string> {
    this.logger.log(`[PaymentsService] processWithdrawalWithGateway - Simulando processamento de saque PIX para transação ${transactionId} no valor de ${amount.toFixed(2)}.`);
    this.logger.debug(`[PaymentsService] processWithdrawalWithGateway - Chave PIX: ${pixKey} (Tipo: ${pixKeyType})`);

    // Simulação de chamada a um gateway externo (ex: PagSeguro, Pagar.me, etc.)
    // A API real aqui dependeria do gateway escolhido e de como ele lida com transferências PIX.
    return new Promise((resolve) => {
      setTimeout(() => {
        const gatewayTxnId = `gateway_withdrawal_pix_${Date.now()}_${transactionId}`;
        this.logger.log(`[PaymentsService] processWithdrawalWithGateway - Saque PIX simulado enviado ao gateway. ID do Gateway: ${gatewayTxnId}`);
        resolve(gatewayTxnId);
      }, 2000); // Simula um atraso de 2 segundos para a comunicação com o gateway
    });
  }

  /**
   * Processa uma solicitação de saque de um provedor usando chave PIX.
   * @param providerId O ID do provedor que está solicitando o saque.
   * @param dto Os dados da solicitação de saque (chave PIX e valor).
   * @returns Uma mensagem de sucesso.
   */
  async requestWithdrawal(providerId: string, dto: RequestWithdrawalDto): Promise<MessageResponseDto> {
    const { amount, pixKey, pixKeyType, notes } = dto;

    this.logger.log(`[PaymentsService] requestWithdrawal - Solicitação de saque PIX para provedor ${providerId}, valor ${amount}, chave PIX ${pixKey} (${pixKeyType}).`);

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: { user: true } // Incluir dados do usuário para notificação
    });
    if (!provider) {
      this.logger.error(`[PaymentsService] requestWithdrawal - Provedor com ID "${providerId}" não encontrado.`);
      throw new NotFoundException(`Provedor com ID "${providerId}" não encontrado.`);
    }

    // 1. Validar valor do saque
    if (amount <= 0) {
      throw new BadRequestException('O valor do saque deve ser maior que zero.');
    }
    if (amount < this.minWithdrawalAmount) {
      throw new BadRequestException(`O valor mínimo para saque é de R$ ${this.minWithdrawalAmount.toFixed(2)}.`);
    }

    // 2. Validação básica da chave PIX (pode ser expandida com validações de formato mais robustas)
    if (!pixKey || !pixKeyType) {
      throw new BadRequestException('Chave PIX e tipo de chave PIX são obrigatórios.');
    }
    // TODO: Adicionar validações de formato para CPF, CNPJ, Email, Phone, etc.
    // Ex: if (pixKeyType === PixKeyType.CPF && !isValidCPF(pixKey)) { throw new BadRequestException('CPF inválido'); }

    try {
      let withdrawalTransaction;
      await this.prisma.$transaction(async (prisma) => {
        // 3. Calcular saldo disponível
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
            // Considerar apenas saques COMPLETED, PROCESSING, PENDING para cálculo de saldo
            status: { in: ['COMPLETED', 'PROCESSING', 'PENDING'] },
          },
          select: {
            amount: true,
          },
        });
        const totalWithdrawn = allWithdrawals.reduce((sum, trans) =>
          sum + trans.amount.toNumber(), 0);

        const availableBalance = totalEarnings - totalWithdrawn;
        this.logger.log(`[PaymentsService] requestWithdrawal - Saldo disponível para ${providerId}: R$ ${availableBalance.toFixed(2)}. Saque solicitado: R$ ${amount.toFixed(2)}.`);

        if (availableBalance < amount) {
          throw new BadRequestException(`Saldo insuficiente para o saque. Saldo disponível: R$ ${availableBalance.toFixed(2)}.`);
        }

        // 4. Criar transação de saque com status PENDING
        withdrawalTransaction = await prisma.transaction.create({
          data: {
            provider: { connect: { id: providerId } },
            amount: new Decimal(amount),
            type: TransactionType.WITHDRAWAL,
            status: 'PENDING', // Saque solicitado, aguardando processamento do gateway
            description: notes || `Solicitação de saque PIX para chave ${pixKey} (${pixKeyType})`,
            pixKey: pixKey, // Salvar a chave PIX
            pixKeyType: pixKeyType, // Salvar o tipo da chave PIX
          },
        });
        this.logger.log(`[PaymentsService] requestWithdrawal - Transação de saque ID ${withdrawalTransaction.id} criada com status PENDING.`);

        // 5. Chamar o gateway de pagamento para processar o saque (simulado)
        const gatewayTransactionId = await this.processWithdrawalWithGateway(
          withdrawalTransaction.id,
          new Decimal(amount),
          pixKey,
          pixKeyType
        );

        // 6. Atualizar transação para status PROCESSING com o ID do gateway
        await prisma.transaction.update({
          where: { id: withdrawalTransaction.id },
          data: {
            status: 'PROCESSING', // Enviado ao gateway, aguardando confirmação
            gatewayTransactionId: gatewayTransactionId,
          },
        });
        this.logger.log(`[PaymentsService] requestWithdrawal - Transação de saque ID ${withdrawalTransaction.id} atualizada para PROCESSING. Gateway ID: ${gatewayTransactionId}.`);
      });

      // --- Disparar Notificações de Saque Solicitado ---
      const notificationMessage = `Sua solicitação de saque de R$ ${amount.toFixed(2)} para a chave PIX ${pixKeyType}: ${pixKey} foi recebida e está sendo processada. O valor estará disponível em breve.`;
      const notificationTitle = 'Saque Solicitado';
      const targetUrl = `/app/(provider)/earnings`; // Exemplo de URL para o frontend

      // Notificação in-app (persistida no DB)
      const createNotificationDto: CreateNotificationDto = {
        userId: provider.userId,
        type: 'WITHDRAWAL_REQUESTED',
        message: notificationMessage,
        targetUrl: targetUrl,
      };
      await this.notificationsService.createNotification(createNotificationDto);

      // E-mail para o provedor
      if (provider.user?.email) {
        await this.emailService.sendWithdrawalRequestedEmail(
          provider.user.email,
          provider.user.fullName,
          amount.toFixed(2),
          pixKeyType,
          pixKey,
          withdrawalTransaction.id
        );
      }

      // Push Notification (enfileirada)
      await this.queuesService.addNotificationJob('send-push-notification', {
        userId: provider.userId,
        title: notificationTitle,
        body: notificationMessage,
        data: {
          notificationType: 'WITHDRAWAL_REQUESTED',
          transactionId: withdrawalTransaction.id,
          targetUrl: targetUrl,
        },
      });

      return { message: 'Solicitação de saque recebida com sucesso. O processamento pode levar alguns dias úteis.' };
    } catch (error) {
      this.logger.error('Erro ao solicitar saque:', error.response?.data || error.message, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Não foi possível processar a solicitação de saque. Verifique os dados e tente novamente.');
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
      const transaction = await this.prisma.transaction.findFirst({
        where: { gatewayTransactionId: transactionId }, // Assumindo que webhookData.transactionId é o gatewayTransactionId
        include: { provider: { include: { user: true } } } // Incluir dados do provedor e usuário para notificações
      });

      if (!transaction) {
        this.logger.warn(`Transação com gatewayTransactionId "${transactionId}" não encontrada para o webhook.`);
        return { message: `Transação com gatewayTransactionId "${transactionId}" não encontrada.` };
      }

      if (transaction.status === status) {
        this.logger.log(`Status da transação ${transaction.id} já é "${status}". Ignorando atualização duplicada.`);
        return { message: `Status da transação ${transaction.id} já é "${status}".` };
      }

      let newBookingStatus: BookingStatus | undefined;
      let newTransactionStatus: string;

      switch (status.toLowerCase()) { // Usar toLowerCase para robustez
        case 'paid':
        case 'completed':
          newBookingStatus = BookingStatus.CONFIRMED;
          newTransactionStatus = 'COMPLETED';
          // NEW: Mark coupon as used if it was applied
          if (transaction.couponId) {
            await this.couponsService.markCouponAsUsed(transaction.couponId);
            this.logger.log(`Coupon ${transaction.couponId} marked as used for transaction ${transaction.id}.`);
          }
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

  /**
   * NOVO: Processa notificações de webhook para saques.
   * Este método simula a atualização do status da transação de saque com base na notificação do gateway.
   * @param webhookData Dados recebidos do webhook do gateway de pagamento.
   * @returns Uma mensagem de sucesso ou erro.
   */
  async handleWithdrawalWebhook(webhookData: any): Promise<MessageResponseDto> {
    this.logger.log(`[PaymentsService] handleWithdrawalWebhook - Webhook de saque recebido: ${JSON.stringify(webhookData)}`);

    const { gatewayTransactionId, status } = webhookData; // Assume que o webhook envia o ID do gateway e o status

    if (!gatewayTransactionId || !status) {
      this.logger.error('[PaymentsService] handleWithdrawalWebhook - Dados de webhook incompletos: gatewayTransactionId ou status ausentes.');
      throw new BadRequestException('Dados essenciais (gatewayTransactionId, status) ausentes no webhook.');
    }

    try {
      const transaction = await this.prisma.transaction.findFirst({
        where: { gatewayTransactionId: gatewayTransactionId, type: TransactionType.WITHDRAWAL },
        include: { provider: { include: { user: true } } } // Incluir dados do provedor e usuário para notificações
      });

      if (!transaction) {
        this.logger.warn(`Transação de saque com gatewayTransactionId "${gatewayTransactionId}" não encontrada para o webhook.`);
        return { message: `Transação de saque com gatewayTransactionId "${gatewayTransactionId}" não encontrada.` };
      }

      if (transaction.status === status) {
        this.logger.log(`Status da transação de saque ${transaction.id} já é "${status}". Ignorando atualização duplicada.`);
        return { message: `Status da transação de saque ${transaction.id} já é "${status}".` };
      }

      let newTransactionStatus: string;
      let notificationMessage: string;
      let notificationTitle: string;
      let notificationType: string;
      let targetUrl = `/app/(provider)/earnings`; // Exemplo de URL para o frontend

      switch (status.toLowerCase()) {
        case 'completed':
        case 'success':
          newTransactionStatus = 'COMPLETED';
          notificationTitle = 'Saque Concluído!';
          notificationMessage = `Seu saque de R$ ${transaction.amount.toFixed(2)} foi concluído com sucesso e o valor foi transferido para sua chave PIX ${transaction.pixKeyType}: ${transaction.pixKey}. Verifique seu extrato bancário.`;
          notificationType = 'WITHDRAWAL_COMPLETED';
          break;
        case 'failed':
        case 'error':
        case 'canceled':
          newTransactionStatus = 'FAILED';
          notificationTitle = 'Saque Falhou!';
          const failureReason = webhookData.reason || 'Motivo desconhecido. Por favor, entre em contato com o suporte.';
          notificationMessage = `Seu saque de R$ ${transaction.amount.toFixed(2)} para a chave PIX ${transaction.pixKeyType}: ${transaction.pixKey} falhou. Motivo: ${failureReason}. Por favor, verifique os dados da sua chave PIX e tente novamente ou entre em contato com o suporte.`;
          notificationType = 'WITHDRAWAL_FAILED';

          // --- Notificação para Administradores (Saque Falho) ---
          const adminEmailSubject = `ALERTA: Saque do provedor ${transaction.provider.user.fullName} (${transaction.providerId}) falhou!`;
          const adminEmailText = `Saque de R$ ${transaction.amount.toFixed(2)} para a chave PIX ${transaction.pixKeyType}: ${transaction.pixKey} falhou. Transação ID: ${transaction.id}. Gateway ID: ${gatewayTransactionId}. Motivo: ${failureReason}.`;
          const adminEmailHtml = `<p>ALERTA: Saque do provedor <strong>${transaction.provider.user.fullName}</strong> (ID: ${transaction.providerId}) falhou!</p><p>Valor: R$ ${transaction.amount.toFixed(2)}</p><p>Chave PIX: ${transaction.pixKey} (${transaction.pixKeyType})</p><p>Transação ID: ${transaction.id}</p><p>Gateway ID: ${gatewayTransactionId}</p><p>Motivo da Falha: ${failureReason}</p><p>Necessita investigação.</p>`;

          await this.emailService.sendAdminWithdrawalFailedEmail(
            adminEmailSubject,
            adminEmailText,
            adminEmailHtml
          );
          break;
        case 'processing':
          newTransactionStatus = 'PROCESSING';
          notificationTitle = 'Saque em Processamento';
          notificationMessage = `Seu saque de R$ ${transaction.amount.toFixed(2)} para a chave PIX ${transaction.pixKeyType}: ${transaction.pixKey} está em processamento.`;
          notificationType = 'WITHDRAWAL_PROCESSING';
          break;
        default:
          newTransactionStatus = status.toUpperCase();
          this.logger.warn(`Status do gateway de saque "${status}" não mapeado. Atualizando transação para ${newTransactionStatus}.`);
          notificationTitle = 'Atualização de Saque';
          notificationMessage = `Seu saque de R$ ${transaction.amount.toFixed(2)} teve o status atualizado para ${newTransactionStatus}.`;
          notificationType = 'WITHDRAWAL_STATUS_UPDATE';
      }

      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: newTransactionStatus },
      });
      this.logger.log(`Status da transação de saque ${transaction.id} atualizado para ${newTransactionStatus}.`);

      // --- Disparar Notificações para o Provedor ---
      if (transaction.provider?.user?.id) {
        const createNotificationDto: CreateNotificationDto = {
          userId: transaction.provider.user.id,
          type: notificationType,
          message: notificationMessage,
          targetUrl: targetUrl,
        };
        await this.notificationsService.createNotification(createNotificationDto);

        if (transaction.provider.user.email) {
          if (newTransactionStatus === 'COMPLETED') {
            await this.emailService.sendWithdrawalCompletedEmail(
              transaction.provider.user.email,
              transaction.provider.user.fullName,
              transaction.amount.toFixed(2),
              transaction.pixKeyType,
              transaction.pixKey,
              transaction.id
            );
          } else if (newTransactionStatus === 'FAILED') {
            await this.emailService.sendWithdrawalFailedEmail(
              transaction.provider.user.email,
              transaction.provider.user.fullName,
              transaction.amount.toFixed(2),
              transaction.pixKeyType,
              transaction.pixKey,
              transaction.id,
              webhookData.reason || 'Motivo desconhecido.'
            );
          }
        }

        await this.queuesService.addNotificationJob('send-push-notification', {
          userId: transaction.provider.user.id,
          title: notificationTitle,
          body: notificationMessage,
          data: {
            notificationType: notificationType,
            transactionId: transaction.id,
            targetUrl: targetUrl,
          },
        });
      }


      return { message: `Webhook de saque processado com sucesso para transação ${transaction.id}.` };
    } catch (error) {
      this.logger.error('Erro ao processar webhook de saque:', error.response?.data || error.message, error.stack);
      return { message: 'Erro interno ao processar webhook de saque, mas o erro foi logado.' };
    }
  }

  // NEW: Placeholder for recurring payment setup
  async setupRecurringPayment(clientId: string, subscriptionId: string, amount: number, frequency: string) {
    console.log(`Setting up recurring payment for client ${clientId}, subscription ${subscriptionId}, amount ${amount}, frequency ${frequency}`);
    // This would involve creating a subscription with your payment gateway (e.g., Stripe Subscriptions, PagSeguro Recorrência)
    // and storing the gateway's subscription ID.
    return { message: 'Recurring payment setup initiated.' };
  }

  // NEW: Placeholder for processing a single recurring payment
  async processRecurringPayment(clientId: string, subscriptionId: string, bookingId: string, amount: number) {
    console.log(`Processing recurring payment for client ${clientId}, subscription ${subscriptionId}, booking ${bookingId}, amount ${amount}`);
    // This would trigger a charge against the stored payment method for the subscription.
    // It would create a new transaction record linked to the booking and subscription.

    // Obter providerId do booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { providerId: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found for recurring payment.`);
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        provider: { connect: { id: booking.providerId } },
        amount: new Decimal(amount),
        status: 'COMPLETED', // Simulate success
        type: TransactionType.PAYMENT,
        transactionRef: `recurring_txn_${Date.now()}_${bookingId}`,
        booking: {
          connect: {
            id: bookingId,
          },
        },
      },
    });
    return transaction;
  }

  // NEW: Placeholder for pausing recurring payments
  async pauseRecurringPayment(subscriptionId: string) {
    console.log(`Pausing recurring payment for subscription ${subscriptionId}`);
    // Call payment gateway API to pause the subscription
    return { message: 'Recurring payment paused.' };
  }

  // NEW: Placeholder for resuming recurring payments
  async resumeRecurringPayment(subscriptionId: string) {
    console.log(`Resuming recurring payment for subscription ${subscriptionId}`);
    // Call payment gateway API to resume the subscription
    return { message: 'Recurring payment resumed.' };
  }
}