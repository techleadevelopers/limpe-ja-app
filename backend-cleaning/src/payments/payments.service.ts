// src/payments/payments.service.ts
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingStatus, TransactionType, Prisma, PaymentIntentStatus } from '@prisma/client';
import axios from 'axios';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { BookingsService } from '../bookings/bookings.service';
import { CreatePixChargeDto, PixChargeResponseDto } from './dto/create-pix-charge.dto';
import { PaymentIntentResponseDto } from './dto/payment-intent-response.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { CouponsService } from '../coupons/coupons.service';
import { PayoutsService } from '../payouts/payouts.service';
import { Decimal } from '@prisma/client/runtime/library';





// Tipagem auxiliar para os dados que ser�o passados para a fun��o de cria��o de payload
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


  // Inje��o de propriedade para BookingsService para resolver depend�ncia circular
  @Inject(forwardRef(() => BookingsService))
  private bookingsService: BookingsService;

  constructor(
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private readonly providersService: ProvidersService,
    private readonly couponsService: CouponsService,
    private readonly payoutsService: PayoutsService,
  ) {
    this.pagseguroApiToken = this.configService.get<string>('PAGSEGURO_API_TOKEN');
    this.pagseguroApiBaseUrl = this.configService.get<string>('PAGSEGURO_API_BASE_URL', 'https://sandbox.api.pagseguro.com');
    this.appBaseUrl = this.configService.get<string>('API_BASE_URL');

    if (!this.pagseguroApiToken) {
      this.logger.error('PAGSEGURO_API_TOKEN nao configurado. As integra��es com PagSeguro nao funcionar�o.');
    }
    if (!this.appBaseUrl) {
      this.logger.warn('APP_BASE_URL nao configurado. Webhooks do PagSeguro podem nao funcionar corretamente.');
    }
  }
      this.logger.error('PAGSEGURO_API_TOKEN n�o configurado. As integra��es com PagSeguro n�o funcionar�o.');
    }
    if (!this.appBaseUrl) {
      this.logger.warn('APP_BASE_URL n�o configurado. Webhooks do PagSeguro podem n�o funcionar corretamente.');
    }
  }

  /**
   * M�todo interno para criar a transa��o PIX diretamente com a API do PagSeguro (Endpoint de Pedidos com QR Code).
   * Este m�todo agora recebe todos os detalhes necess�rios, evitando buscas redundantes.
   * @param bookingId ID da reserva/servi�o associado.
   * @param amount Custo do servi�o (Prisma.Decimal).
   * @param description Descri��o da cobran�a.
   * @param clientEmail E-mail do cliente.
   * @param clientFullName Nome completo do cliente.
   * @param clientPhone Telefone do cliente.
   * @param clientCpf CPF do cliente.
   * @param serviceName Nome do servi�o.
   * @param clientAddress Endere�o do cliente.
   * @returns Dados da transa��o, incluindo QR Code.
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
    this.logger.log(`[PaymentsService] createPixTransactionWithGateway - Iniciando cria��o de transa��o PIX (via /orders) para reserva ${bookingId}.`);

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
      throw new InternalServerErrorException('Falha ao criar transa��o de pagamento.');
    }
  }

  /**
   * Cria uma nova cobran�a PIX e registra a transa��o.
   * @param clientUserId O ID do usu�rio cliente que est� gerando a cobran�a (sub do JWT).
   * @param dto Os dados para a cria��o da cobran�a PIX.
   * @returns Os detalhes da cobran�a PIX gerada.
   */
  async createPixCharge(
    clientUserId: string,
    dto: CreatePixChargeDto,
  ): Promise<PixChargeResponseDto> {
    const { amount, description, bookingId, providerId } = dto;

    this.logger.log(`[PaymentsService] createPixCharge - In�cio da fun��o.`);
    this.logger.log(`[PaymentsService] createPixCharge - clientUserId recebido: ${clientUserId}`);
    this.logger.log(`[PaymentsService] createPixCharge - DTO recebido: amount=${amount}, description=${description}, bookingId=${bookingId}, providerId=${providerId}`);

    if (!providerId) {
      this.logger.error('[PaymentsService] createPixCharge - providerId � nulo ou indefinido.');
      throw new BadRequestException('O ID do provedor � necess�rio para criar uma cobran�a PIX.');
    }

    const providerExists = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });
    if (!providerExists) {
      this.logger.error(`[PaymentsService] createPixCharge - Provedor com ID "${providerId}" n�o encontrado.`);
      throw new NotFoundException('Provider with ID ' + providerId + ' not found.');
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
      this.logger.error(`[PaymentsService] createPixCharge - Usu�rio cliente com ID "${clientUserId}" n�o encontrado, sem perfil de cliente associado, ou sem email.`);
      this.logger.debug(`[PaymentsService] createPixCharge - clientUserWithDetails: ${JSON.stringify(clientUserWithDetails)}`);
      throw new NotFoundException('Provider with ID ' + providerId + ' not found.');
    }
    this.logger.log(`[PaymentsService] createPixCharge - Usu�rio cliente "${clientUserWithDetails.email}" (Nome: ${clientUserWithDetails.client.fullName}) encontrado.`);

    // Buscar o Booking e o nome do servi�o
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
      this.logger.error(`[PaymentsService] createPixCharge - Dados do agendamento ou servi�o para bookingId ${bookingId} n�o encontrados.`);
      throw new NotFoundException('Provider with ID ' + providerId + ' not found.');
    }
    const serviceName = bookingWithServiceDetails.providerService.service.name;
    this.logger.log(`[PaymentsService] createPixCharge - Nome do servi�o para booking ${bookingId}: ${serviceName}`);


    // 3. Criar uma transa��o pendente no banco de dados
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
    this.logger.log(`[PaymentsService] createPixCharge - Transa��o pendente criada com ID: ${transaction.id}`);

    try {
      // --- IN�CIO DA INTEGRA��O REAL COM GATEWAY DE PAGAMENTO PIX (PagSeguro) ---
      // Prepara os detalhes completos para o m�todo interno createPixTransactionWithGateway
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

      // Chama o m�todo interno createPixTransactionWithGateway
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
        this.logger.error(`[PaymentsService] createPixCharge - Resposta inv�lida do PagSeguro (dados PIX incompletos): ${JSON.stringify(pixResponseFromGateway)}`);
        throw new InternalServerErrorException('Falha ao gerar dados de PIX. Resposta incompleta do gateway.');
      }

      // Atualizar a transa��o criada anteriormente com o gatewayTransactionId
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          gatewayTransactionId: gatewayTransactionId,
          qrCodeUrl: qrCodeImage,
        },
      });
      this.logger.log(`[PaymentsService] createPixCharge - Transa��o local ${transaction.id} atualizada com gatewayTransactionId ${gatewayTransactionId}.`);

      let paymentIntentDto: PaymentIntentResponseDto | undefined;


      // Se houver um bookingId associado, atualize o status do agendamento para PENDING
      if (bookingId) {
        this.logger.log(`[PaymentsService] createPixCharge - Tentando buscar e atualizar Booking ID: ${bookingId}`);
        const booking = await this.prisma.booking.findUnique({
          where: { id: bookingId },
          include: { client: true },
        });

        if (!booking) {
          this.logger.error(`[PaymentsService] createPixCharge - Agendamento com ID "${bookingId}" n�o encontrado para atualiza��o de status.`);
      throw new NotFoundException('Provider with ID ' + providerId + ' not found.');
        }

        const amountNumber = Number(amount);
        const amountCents = Math.max(0, Math.round(amountNumber * 100));

        const paymentIntentRecord = await this.prisma.paymentIntent.upsert({
          where: { bookingId },
          update: {
            amountCents,
            status: PaymentIntentStatus.PENDING,
            gateway: 'PAGSEGURO_PIX',
            externalRef: gatewayTransactionId,
            qrCodeUrl: qrCodeImage,
            qrCodeText: brCode,
            expiresAt: expiresAtDate,
          },
          create: {
            bookingId,
            amountCents,
            status: PaymentIntentStatus.PENDING,
            gateway: 'PAGSEGURO_PIX',
            externalRef: gatewayTransactionId,
            qrCodeUrl: qrCodeImage,
            qrCodeText: brCode,
            expiresAt: expiresAtDate,
          },
        });

        paymentIntentDto = {
          id: paymentIntentRecord.id,
          bookingId: paymentIntentRecord.bookingId,
          amountCents: paymentIntentRecord.amountCents,
          amount: paymentIntentRecord.amountCents / 100,
          status: paymentIntentRecord.status,
          gateway: paymentIntentRecord.gateway,
          externalRef: paymentIntentRecord.externalRef,
          qrCodeUrl: paymentIntentRecord.qrCodeUrl,
          qrCodeText: paymentIntentRecord.qrCodeText,
          expiresAt: paymentIntentRecord.expiresAt ? paymentIntentRecord.expiresAt.toISOString() : null,
          createdAt: paymentIntentRecord.createdAt.toISOString(),
          updatedAt: paymentIntentRecord.updatedAt.toISOString(),
        };

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
        paymentIntent: paymentIntentDto,
      };

    } catch (error) {
      this.logger.error('Erro ao criar cobran�a PIX:', error.response?.data || error.message, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('N�o foi poss�vel gerar a cobran�a PIX. Verifique logs para detalhes.');
    }
  }

  /**
   * Simula o processamento de saque via PIX com um gateway de pagamento.
   * Em um cen�rio real, esta fun��o faria uma chamada HTTP para a API do gateway de pagamento
   * que suporta transfer�ncias PIX.
   * @param transactionId ID da transa��o interna.
   * @param amount Valor do saque.
   * @param pixKey Chave PIX.
   * @param pixKeyType Tipo da chave PIX.
   * @returns Um ID de transa��o do gateway simulado.
   */
  private async processWithdrawalWithGateway(
    transactionId: string,
    amount: Prisma.Decimal,
    pixKey: string,
    pixKeyType: PixKeyType
  ): Promise<string> {
    this.logger.log(`[PaymentsService] processWithdrawalWithGateway - Simulando processamento de saque PIX para transa��o ${transactionId} no valor de ${amount.toFixed(2)}.`);
    this.logger.debug(`[PaymentsService] processWithdrawalWithGateway - Chave PIX: ${pixKey} (Tipo: ${pixKeyType})`);

    // Simula��o de chamada a um gateway externo (ex: PagSeguro, Pagar.me, etc.)
    // A API real aqui dependeria do gateway escolhido e de como ele lida com transfer�ncias PIX.
    return new Promise((resolve) => {
      setTimeout(() => {
        const gatewayTxnId = `gateway_withdrawal_pix_${Date.now()}_${transactionId}`;
        this.logger.log(`[PaymentsService] processWithdrawalWithGateway - Saque PIX simulado enviado ao gateway. ID do Gateway: ${gatewayTxnId}`);
        resolve(gatewayTxnId);
      }, 2000); // Simula um atraso de 2 segundos para a comunica��o com o gateway
    });
  }

  /**
   * Processa uma solicita��o de saque de um provedor usando chave PIX.
   * @param providerId O ID do provedor que est� solicitando o saque.
   * @param dto Os dados da solicita��o de saque (chave PIX e valor).
   * @returns Uma mensagem de sucesso.
   */
    const { amount, pixKey, pixKeyType, notes } = dto;

    this.logger.log(`[PaymentsService] requestWithdrawal - Solicita��o de saque PIX para provedor ${providerId}, valor ${amount}, chave PIX ${pixKey} (${pixKeyType}).`);

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: { user: true } // Incluir dados do usu�rio para notifica��o
    });
    if (!provider) {
      this.logger.error(`[PaymentsService] requestWithdrawal - Provedor com ID "${providerId}" n�o encontrado.`);
      throw new NotFoundException('Provider with ID ' + providerId + ' not found.');
    }

    // 1. Validar valor do saque
    if (amount <= 0) {
      throw new BadRequestException('O valor do saque deve ser maior que zero.');
    }
    }

    // 2. Valida��o b�sica da chave PIX (pode ser expandida com valida��es de formato mais robustas)
    if (!pixKey || !pixKeyType) {
      throw new BadRequestException('Chave PIX e tipo de chave PIX s�o obrigat�rios.');
    }
    // TODO: Adicionar valida��es de formato para CPF, CNPJ, Email, Phone, etc.
    // Ex: if (pixKeyType === PixKeyType.CPF && !isValidCPF(pixKey)) { throw new BadRequestException('CPF inv�lido'); }

    try {
      let withdrawalTransaction;
      await this.prisma.$transaction(async (prisma) => {
        // 3. Calcular saldo dispon�vel
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
            // Considerar apenas saques COMPLETED, PROCESSING, PENDING para c�lculo de saldo
            status: { in: ['COMPLETED', 'PROCESSING', 'PENDING'] },
          },
          select: {
            amount: true,
          },
        });
        const totalWithdrawn = allWithdrawals.reduce((sum, trans) =>
          sum + trans.amount.toNumber(), 0);

        const availableBalance = totalEarnings - totalWithdrawn;
        this.logger.log(`[PaymentsService] requestWithdrawal - Saldo dispon�vel para ${providerId}: R$ ${availableBalance.toFixed(2)}. Saque solicitado: R$ ${amount.toFixed(2)}.`);

        if (availableBalance < amount) {
          throw new BadRequestException(`Saldo insuficiente para o saque. Saldo dispon�vel: R$ ${availableBalance.toFixed(2)}.`);
        }

        // 4. Criar transa��o de saque com status PENDING
        withdrawalTransaction = await prisma.transaction.create({
          data: {
            provider: { connect: { id: providerId } },
            amount: new Decimal(amount),
            type: TransactionType.WITHDRAWAL,
            status: 'PENDING', // Saque solicitado, aguardando processamento do gateway
            description: notes || `Solicita��o de saque PIX para chave ${pixKey} (${pixKeyType})`,
            pixKey: pixKey, // Salvar a chave PIX
            pixKeyType: pixKeyType, // Salvar o tipo da chave PIX
          },
        });
        this.logger.log(`[PaymentsService] requestWithdrawal - Transa��o de saque ID ${withdrawalTransaction.id} criada com status PENDING.`);

        // 5. Chamar o gateway de pagamento para processar o saque (simulado)
        const gatewayTransactionId = await this.processWithdrawalWithGateway(
          withdrawalTransaction.id,
          new Decimal(amount),
          pixKey,
          pixKeyType
        );

        // 6. Atualizar transa��o para status PROCESSING com o ID do gateway
        await prisma.transaction.update({
          where: { id: withdrawalTransaction.id },
          data: {
            status: 'PROCESSING', // Enviado ao gateway, aguardando confirma��o
            gatewayTransactionId: gatewayTransactionId,
          },
        });
        this.logger.log(`[PaymentsService] requestWithdrawal - Transa��o de saque ID ${withdrawalTransaction.id} atualizada para PROCESSING. Gateway ID: ${gatewayTransactionId}.`);
      });

      // --- Disparar Notifica��es de Saque Solicitado ---
      const notificationMessage = `Sua solicita��o de saque de R$ ${amount.toFixed(2)} para a chave PIX ${pixKeyType}: ${pixKey} foi recebida e est� sendo processada. O valor estar� dispon�vel em breve.`;
      const notificationTitle = 'Saque Solicitado';
      const targetUrl = `/app/(provider)/earnings`; // Exemplo de URL para o frontend

      // Notifica��o in-app (persistida no DB)
      const createNotificationDto: CreateNotificationDto = {
        userId: provider.userId,
        type: 'WITHDRAWAL_REQUESTED',
        message: notificationMessage,
        targetUrl: targetUrl,
      };

      // E-mail para o provedor
      if (provider.user?.email) {
          provider.user.email,
          provider.user.fullName,
          amount.toFixed(2),
          pixKeyType,
          pixKey,
          withdrawalTransaction.id
        );
      }

      // Push Notification (enfileirada)
        userId: provider.userId,
        title: notificationTitle,
        body: notificationMessage,
        data: {
          notificationType: 'WITHDRAWAL_REQUESTED',
          transactionId: withdrawalTransaction.id,
          targetUrl: targetUrl,
        },
      });

      return { message: 'Solicita��o de saque recebida com sucesso. O processamento pode levar alguns dias �teis.' };
    } catch (error) {
      this.logger.error('Erro ao solicitar saque:', error.response?.data || error.message, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('N�o foi poss�vel processar a solicita��o de saque. Verifique os dados e tente novamente.');
    }
  }

  async handlePixWebhook(webhookData: any): Promise<MessageResponseDto> {
    this.logger.log(`[PaymentsService] handlePixWebhook - Webhook PIX recebido: ${JSON.stringify(webhookData)}`);

    const transactionId = webhookData.transactionId; // Exemplo: ID da transa��o no seu sistema
    const status = webhookData.status; // Exemplo: status do pagamento do gateway (e.g., 'PAID', 'CANCELED')

    if (!transactionId || !status) {
      this.logger.error('[PaymentsService] handlePixWebhook - Dados de webhook incompletos: transactionId ou status ausentes.');
      throw new BadRequestException('Dados essenciais (transactionId, status) ausentes no webhook.');
    }

    try {
      const transaction = await this.prisma.transaction.findFirst({
        where: { gatewayTransactionId: transactionId }, // Assumindo que webhookData.transactionId � o gatewayTransactionId
        include: { provider: { include: { user: true } } } // Incluir dados do provedor e usu�rio para notifica��es
      });

      if (!transaction) {
        this.logger.warn(`Transa��o com gatewayTransactionId "${transactionId}" n�o encontrada para o webhook.`);
        return { message: `Transa��o com gatewayTransactionId "${transactionId}" n�o encontrada.` };
      }

      if (transaction.status === status) {
        this.logger.log(`Status da transa��o ${transaction.id} j� � "${status}". Ignorando atualiza��o duplicada.`);
        return { message: `Status da transa��o ${transaction.id} j� � "${status}".` };
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
          this.logger.warn(`Status do PagSeguro "${status}" n�o mapeado. Atualizando transa��o para ${newTransactionStatus}.`);
      }

      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: newTransactionStatus },
      });
      this.logger.log(`Status da transa��o ${transaction.id} atualizado para ${newTransactionStatus}.`);

      if (transaction.bookingId && newBookingStatus) {
        this.logger.log(`Atualizando status do agendamento ${transaction.bookingId} para ${newBookingStatus}.`);
        await this.prisma.booking.update({
          where: { id: transaction.bookingId },
          data: { status: newBookingStatus },
        });
        this.logger.log(`Status do agendamento "${transaction.bookingId}" atualizado para ${newBookingStatus}.`);
      } else if (newBookingStatus && !transaction.bookingId) {
        this.logger.warn(`Transa��o ${transaction.id} n�o possui bookingId associado. Agendamento n�o atualizado.`);
      }

      return { message: `Webhook processado com sucesso para transa��o ${transaction.id}.` };
    } catch (error) {
      this.logger.error('Erro ao processar webhook PIX:', error.response?.data || error.message, error.stack);
      // RECOMENDA��O: Retornar 200 OK mesmo em caso de erro interno para evitar reenvios do webhook
      return { message: 'Erro interno ao processar webhook PIX, mas o erro foi logado.' };
    }
  }

  // NEW: Placeholder for pausing recurring payments
  async pauseRecurringPayment(subscriptionId: string) {
    console.log('Pausing recurring payment for subscription ' + subscriptionId);
    return { message: 'Recurring payment paused.' };
  }

  // NEW: Placeholder for resuming recurring payments
  async resumeRecurringPayment(subscriptionId: string) {
    console.log('Resuming recurring payment for subscription ' + subscriptionId);
    return { message: 'Recurring payment resumed.' };
  }

  async requestWithdrawal(providerId: string, dto: RequestWithdrawalDto, idempotencyKey?: string) {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId }, select: { userId: true } });
    if (!provider) {
      throw new NotFoundException('Provider with ID ' + providerId + ' not found.');
    }
    return this.payoutsService.requestWithdrawal(provider.userId, dto, idempotencyKey);
  }

  async handleWithdrawalWebhook(signature: string, eventId: string, payload: any) {
    return this.payoutsService.handleGatewayWebhook(signature, eventId, payload);
  }
}
