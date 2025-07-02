import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingStatus, TransactionType } from '@prisma/client';
import axios from 'axios';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePixChargeDto, PixChargeResponseDto } from './dto/create-pix-charge.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private pagseguroApiToken: string;
  private pagseguroApiBaseUrl: string;
  private appBaseUrl: string; // Adicionado para a URL base do app para webhooks

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.pagseguroApiToken = this.configService.get<string>('PAGSEGURO_API_TOKEN');
    // ALTERADO: Base URL agora aponta para o endpoint de 'orders'
    this.pagseguroApiBaseUrl = this.configService.get<string>('PAGSEGURO_API_BASE_URL', 'https://sandbox.api.pagseguro.com');
    this.appBaseUrl = this.configService.get<string>('APP_BASE_URL'); // Obtenha a URL base do seu app para webhooks

    if (!this.pagseguroApiToken) {
      this.logger.error('PAGSEGURO_API_TOKEN não configurado. As integrações com PagSeguro não funcionarão.');
      throw new Error('PAGSEGURO_API_TOKEN ausente.');
    }
    if (!this.appBaseUrl) {
      this.logger.warn('APP_BASE_URL não configurado. Webhooks do PagSeguro podem não funcionar corretamente.');
      // Não joga erro fatal, mas avisa
    }
  }

  /**
   * Método interno para criar a transação PIX diretamente com a API do PagSeguro (Endpoint de Pedidos com QR Code).
   * @param bookingId ID da reserva/serviço associado.
   * @param serviceCost Custo do serviço.
   * @param clientEmail E-mail do cliente.
   * @returns Dados da transação, incluindo QR Code.
   */
  async createPixTransaction(bookingId: string, serviceCost: number, clientEmail: string): Promise<any> {
    this.logger.log(`Iniciando criação de transação PIX (via /orders) para reserva ${bookingId} com custo ${serviceCost}.`);

    // ALTERADO: Endpoint agora é /orders conforme a documentação
    const url = `${this.pagseguroApiBaseUrl}/orders`;

    try {
      // Buscar o Booking e, a partir dele, o Cliente e seus dados completos
      const bookingWithClientDetails = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          totalPrice: true, // Adicionado para usar no item do pedido
          // CORREÇÃO: Acessar 'service' através de 'providerService'
          providerService: {
            select: {
              service: { // Agora sim, 'service' existe dentro de 'providerService'
                select: {
                  name: true,
                },
              },
            },
          },
          client: { // Incluir a relação 'client'
            select: {
              id: true,
              fullName: true,
              phone: true,
              cpf: true, // Agora CPF está no modelo Client
              user: { // Incluir a relação 'user' dentro de 'client'
                select: {
                  email: true,
                },
              },
              address: { // Incluir a relação 'address' dentro de 'client'
                select: {
                  cep: true,
                  street: true,
                  number: true,
                  complement: true,
                  neighborhood: true,
                  city: true,
                  state: true,
                },
              },
            },
          },
        },
      });

      // CORREÇÃO: Ajuste a condição de verificação de nulos para refletir a nova estrutura
      if (!bookingWithClientDetails || !bookingWithClientDetails.client || !bookingWithClientDetails.client.user || !bookingWithClientDetails.client.user.email || !bookingWithClientDetails.providerService?.service) {
        this.logger.error(`Dados completos do cliente/serviço para bookingId ${bookingId} não encontrados para PIX.`);
        throw new BadRequestException('Dados completos do cliente/serviço para PIX incompletos ou booking não encontrado.');
      }

      const client = bookingWithClientDetails.client;
      // CORREÇÃO: Acessar o nome do serviço corretamente
      const serviceName = bookingWithClientDetails.providerService.service.name;

      // Use o CPF real do cliente. TODO: Remover fallback '11111111111' em produção.
      // IMPORTANTE: Para testes no SANDBOX do PagSeguro, use um CPF válido fornecido por ELES!
      // Ex: '99999999999' ou '12345678909' (verificar na documentação do PagSeguro Sandbox)
      const customerTaxId = client.cpf || '30061150827'; // Fallback para CPF para evitar erro
      // Certifique-se de que o telefone tem pelo menos 11 dígitos para a divisão
      const customerPhoneArea = client.phone ? client.phone.substring(0, 2) : '00'; // Fallback para DDD
      const customerPhoneNumber = client.phone && client.phone.length >= 11 ? client.phone.substring(2) : '999999999'; // Fallback para número

      // --- MUDANÇA AQUI: COMO O ENDEREÇO É CONSTRUÍDO ---
      const addressPayload: any = {
        street: client.address?.street || 'Rua Teste',
        number: client.address?.number || '123',
        locality: client.address?.neighborhood || 'Bairro Teste', // 'locality' para bairro no PagSeguro
        city: client.address?.city || 'Cidade Teste',
        region_code: client.address?.state || 'SP', // Usar region_code para estado
        country: 'BRA',
        postal_code: client.address?.cep || '00000000',
      };

      // Condicionalmente adicione o 'complement' APENAS SE TIVER UM VALOR VÁLIDO.
      // Isso evita enviar "" para o PagSeguro, que causa o erro "must not be blank".
      if (client.address?.complement && client.address.complement.trim() !== '') {
        addressPayload.complement = client.address.complement;
      }
      // --- FIM DA MUDANÇA ---

      const payload = {
        reference_id: bookingId, // ID de referência do seu pedido
        customer: {
          name: client.fullName,
          email: client.user.email,
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
        items: [ // Itens do pedido, o PagSeguro espera um array
          {
            name: serviceName, // Nome do serviço
            quantity: 1,
            unit_amount: Math.round(serviceCost * 100), // Valor em centavos
          },
        ],
        qr_codes: [ // Objeto para QR Code PIX
          {
            amount: {
              value: Math.round(serviceCost * 100), // Valor em centavos novamente
            },
            // expiration_date: "2025-07-05T20:15:59-03:00", // Opcional: Define a expiração. Padrão: 24 horas.
            // Se não definir, PagSeguro usa 24h. Se definir, cuidado com o formato ISO 8601.
          },
        ],
        shipping: { // Dados de entrega/endereço do cliente (opcional, mas recomendado)
          address: addressPayload, // Usa o objeto addressPayload que já lida com o 'complement'
        },
        notification_urls: [`${this.appBaseUrl}/payments/webhook/pix`], // URL para seu webhook de PIX
      };

      this.logger.debug(`Enviando para PagSeguro (/orders): ${JSON.stringify(payload)}`);

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.pagseguroApiToken}`,
        },
      });

      this.logger.log(`Pedido PIX criado com sucesso para reserva ${bookingId}.`);
      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao criar pedido PIX para reserva ${bookingId}: ${error.message}`);
      if (axios.isAxiosError(error) && error.response) {
        this.logger.error(`Dados do erro da API PagSeguro: ${JSON.stringify(error.response.data)}`);
        const pagseguroErrorMessage = error.response.data?.error_messages?.[0]?.description || error.response.data?.message || 'Erro desconhecido do PagSeguro.';
        throw new InternalServerErrorException(`Falha no PagSeguro: ${pagseguroErrorMessage}`);
      }
      throw new InternalServerErrorException('Falha ao criar transação de pagamento.');
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

    // Buscar o email do cliente para o payload do PagSeguro
    const clientUser = await this.prisma.user.findUnique({
      where: { id: clientId },
      select: { email: true },
    });

    if (!clientUser || !clientUser.email) {
      this.logger.error(`Email do cliente ${clientId} não encontrado para criar cobrança PIX.`);
      throw new BadRequestException('Email do cliente necessário para criar cobrança PIX.');
    }

    try {
      // --- INÍCIO DA INTEGRAÇÃO REAL COM GATEWAY DE PAGAMENTO PIX (PagSeguro) ---
      // Chama o método interno createPixTransaction
      const pixResponseFromGateway = await this.createPixTransaction(
        bookingId, // Passa o bookingId para a função interna
        amount,
        clientUser.email, // Passa o email do cliente
      );

      // Extrair dados da resposta do PagSeguro (ajuste conforme a estrutura real da resposta da API de Pedidos do PagSeguro)
      // A documentação indica que a resposta tem um array qr_codes, e dentro dele um array links
      const pixQrCodeData = pixResponseFromGateway.qr_codes?.[0];
      const brCode = pixQrCodeData?.text; // BR Code (linha digitável)

      // Encontra a URL da imagem do QR Code
      const qrCodeImageLink = pixQrCodeData?.links?.find(link => link.media === 'image/png');
      const qrCodeImage = qrCodeImageLink?.href;

      const expiresAt = pixQrCodeData?.expiration_date ? new Date(pixQrCodeData.expiration_date) : new Date(Date.now() + 24 * 3600 * 1000); // Padrão 24h se não vier na resposta
      const gatewayTransactionId = pixResponseFromGateway.id; // ID da transação no PagSeguro, que é o ID do pedido

      if (!brCode || !qrCodeImage || !gatewayTransactionId) {
        this.logger.error(`[PaymentsService] createPixCharge - Resposta inválida do PagSeguro (dados PIX): ${JSON.stringify(pixResponseFromGateway)}`);
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
        brCode: brCode,
        qrCodeImage: qrCodeImage,
        expiresAt: expiresAt.toISOString(),
        amount: amount,
        description: description,
        bookingId: bookingId,
        providerId: providerId, // Esta linha foi adicionada/confirmada para o DTO de resposta
      };
    } catch (error) {
      this.logger.error('Erro ao criar cobrança PIX:', error.response?.data || error.message, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error; // Lança exceções já tratadas
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

    // --- RECOMENDAÇÃO DE SEGURANÇA: VALIDAÇÃO DE ASSINATURA DO WEBHOOK ---
    // O PagSeguro envia um cabeçalho com a assinatura da requisição (ex: 'x-ps-signature').
    // Você DEVE usar essa assinatura para verificar a autenticidade do webhook.
    // Isso geralmente envolve:
    // 1. Obter o valor do cabeçalho da assinatura.
    // 2. Obter o corpo RAW da requisição do webhook (antes de ser parseado).
    // 3. Usar um segredo de webhook (configurado no PagSeguro e no seu ambiente) para
    //    gerar uma assinatura a partir do corpo da requisição.
    // 4. Comparar a assinatura gerada com a assinatura recebida no cabeçalho.
    // Se as assinaturas não baterem, a requisição NÃO é válida e deve ser rejeitada.
    // Exemplo (pseudocódigo):
    /*
    const signature = request.headers['x-ps-signature']; // Ou o nome real do cabeçalho
    const rawBody = request.rawBody; // Você precisará configurar o NestJS para obter o rawBody
    const webhookSecret = this.configService.get<string>('PAGSEGURO_WEBHOOK_SECRET');

    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      this.logger.error('Assinatura de webhook PIX inválida. Requisição rejeitada.');
      throw new BadRequestException('Assinatura de webhook inválida.');
    }
    */
    // --- FIM DA RECOMENDAÇÃO DE SEGURANÇA ---


    // A estrutura do webhook do PagSeguro para "orders" (pedidos) pode variar.
    // Você precisará inspecionar o JSON real que o PagSeguro envia para o seu webhook.
    // Geralmente, eles enviam um 'event' ou 'type' e um 'resource' com os dados do pedido.
    // Para este exemplo, vou assumir uma estrutura comum que incluiria o ID do pedido (bookingId)
    // e o status. VOCÊ PRECISARÁ ADAPTAR ISSO BASEADO NO QUE O PAGSEGURO ENVIAR.

    // Exemplo de como pode ser a extração se o PagSeguro enviar algo como:
    // { "event": "order.paid", "resource": { "id": "ORDER_ID", "status": "PAID", ... } }
    const gatewayOrderId = webhookData.resource?.id || webhookData.id; // Pegar o ID do pedido do PagSeguro
    const gatewayStatus = webhookData.resource?.status || webhookData.status; // Pegar o status do pedido

    if (!gatewayOrderId || !gatewayStatus) {
      this.logger.error('Dados essenciais (gatewayOrderId, gatewayStatus) ausentes no webhook PIX:', webhookData);
      throw new BadRequestException('Dados essenciais (gatewayOrderId, gatewayStatus) ausentes no webhook.');
    }

    try {
      // Usar o gatewayTransactionId (que é o ID do pedido do PagSeguro) para encontrar a transação local
      const transaction = await this.prisma.transaction.findFirst({
        where: { gatewayTransactionId: gatewayOrderId },
      });

      if (!transaction) {
        this.logger.warn(`Transação com gatewayTransactionId "${gatewayOrderId}" não encontrada para o webhook.`);
        return { message: `Transação com gatewayTransactionId "${gatewayOrderId}" não encontrada.` };
      }

      // Mapear status do PagSeguro para seus status internos
      let newBookingStatus: BookingStatus | undefined;
      let newTransactionStatus: string;

      // Exemplos de status do PagSeguro para "orders"
      // Você precisará consultar a documentação de Webhooks/Notificações do PagSeguro para a lista exata.
      switch (gatewayStatus.toLowerCase()) {
        case 'paid':
        case 'completed': // Se o PagSeguro usa 'completed' para pedidos pagos
          newBookingStatus = BookingStatus.CONFIRMED;
          newTransactionStatus = 'COMPLETED'; // Ou 'PAID' se preferir
          this.logger.log(`Pagamento PIX CONFIRMADO para pedido ${gatewayOrderId}. Confirmando agendamento ${transaction.bookingId}.`);
          break;
        case 'canceled':
        case 'voided': // Ex: estornado
          newBookingStatus = BookingStatus.CANCELED;
          newTransactionStatus = 'CANCELED';
          this.logger.log(`Pagamento PIX ${gatewayStatus} para pedido ${gatewayOrderId}. Cancelando agendamento ${transaction.bookingId}.`);
          break;
        case 'processing':
        case 'pending':
          newTransactionStatus = 'PENDING';
          // Não altera o status do booking, pois já deve estar PENDING
          this.logger.log(`Status intermediário ${gatewayStatus} para pedido ${gatewayOrderId}.`);
          break;
        default:
          newTransactionStatus = gatewayStatus.toUpperCase();
          this.logger.warn(`Status do PagSeguro "${gatewayStatus}" não mapeado. Atualizando transação para ${newTransactionStatus}.`);
      }

      // Atualiza o status da transação
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: newTransactionStatus },
      });
      this.logger.log(`Status da transação ${transaction.id} atualizado para ${newTransactionStatus}.`);


      // Se um novo status de booking foi determinado, atualiza o agendamento
      if (newBookingStatus && transaction.bookingId) {
        this.logger.log(`Atualizando status do agendamento ${transaction.bookingId} para ${newBookingStatus}.`);
        await this.prisma.booking.update({
          where: { id: transaction.bookingId },
          data: { status: newBookingStatus },
        });
        this.logger.log(`Status do agendamento ${transaction.bookingId} atualizado para ${newBookingStatus}.`);
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
