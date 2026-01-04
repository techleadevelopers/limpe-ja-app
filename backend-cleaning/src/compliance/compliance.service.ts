import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra o consentimento do usuário para termos de serviço ou política de privacidade.
   * @param userId ID do usuário.
   * @param documentType Tipo do documento (e.g., 'TERMS_OF_SERVICE', 'PRIVACY_POLICY').
   * @param version Versão do documento consentido.
   * @returns O registro de consentimento criado/atualizado.
   */
  async recordConsent(
    userId: string,
    documentType: string,
    version: string,
    options?: {
      source?: string;
      ip?: string;
      userAgent?: string;
      acceptedAt?: Date;
    },
  ) {
    this.logger.log(
      `[ComplianceService] Registrando consentimento para userId: ${userId}, tipo: ${documentType}, versão: ${version}, source=${options?.source ?? 'unknown'}, ip=${options?.ip ?? 'unknown'}`,
    );

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado.`);
    }

    // Cria ou atualiza o registro de consentimento
    const consent = await this.prisma.userConsent.upsert({
      where: {
        userId_documentType: {
          userId: userId,
          documentType: documentType,
        },
      },
      update: {
        version: version,
        consentedAt: options?.acceptedAt ?? new Date(),
        ipAddress: options?.ip ?? undefined,
        userAgent: options?.userAgent ?? undefined,
      },
      create: {
        userId: userId,
        documentType: documentType,
        version: version,
        consentedAt: options?.acceptedAt ?? new Date(),
        ipAddress: options?.ip ?? undefined,
        userAgent: options?.userAgent ?? undefined,
      },
    });

    this.logger.log(
      `[ComplianceService] Consentimento registrado com sucesso para userId: ${userId}.`,
    );
    return consent;
  }

  /**
   * Verifica se um usuário consentiu com uma versão específica de um documento.
   * @param userId ID do usuário.
   * @param documentType Tipo do documento.
   * @param requiredVersion Versão mínima exigida.
   * @returns True se o usuário consentiu com a versão exigida ou superior, false caso contrário.
   */
  async checkConsent(
    userId: string,
    documentType: string,
    requiredVersion: string,
  ): Promise<boolean> {
    this.logger.log(
      `[ComplianceService] Verificando consentimento para userId: ${userId}, tipo: ${documentType}, versão mínima: ${requiredVersion}`,
    );

    const consent = await this.prisma.userConsent.findUnique({
      where: {
        userId_documentType: {
          userId: userId,
          documentType: documentType,
        },
      },
    });

    if (!consent) {
      this.logger.warn(
        `[ComplianceService] Consentimento para ${documentType} não encontrado para userId: ${userId}.`,
      );
      return false;
    }

    // Lógica simples de comparação de versão (pode ser mais complexa dependendo do formato da versão)
    const hasConsent = consent.version >= requiredVersion;
    this.logger.log(
      `[ComplianceService] Consentimento para ${documentType} (versão ${consent.version}) para userId: ${userId} é ${hasConsent ? 'válido' : 'inválido'} para a versão ${requiredVersion}.`,
    );
    return hasConsent;
  }

  async listUserConsents(userId: string) {
    return this.prisma.userConsent.findMany({
      where: { userId },
      orderBy: { consentedAt: 'desc' },
    });
  }

  /**
   * Gera um orçamento itemizado para um agendamento.
   * Este método é um placeholder e deve ser integrado com a lógica de precificação real.
   * @param bookingId ID do agendamento.
   * @returns Objeto com os detalhes do orçamento.
   */
  async generateItemizedQuote(bookingId: string) {
    this.logger.log(
      `[ComplianceService] Gerando orçamento itemizado para agendamento: ${bookingId}`,
    );

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        providerService: { include: { service: true } },
        address: true,
        provider: { select: { fullName: true } },
        client: { select: { fullName: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException(
        `Agendamento com ID ${bookingId} não encontrado.`,
      );
    }

    // Exemplo simplificado de orçamento itemizado
    const quoteDetails = {
      bookingId: booking.id,
      serviceName: booking.providerService.service.name,
      providerName: booking.provider.fullName,
      clientName: booking.client.fullName,
      scheduledDate: booking.scheduledDate.toISOString().split('T')[0],
      scheduledTime: booking.scheduledTime,
      address: `${booking.address.street}, ${booking.address.number}, ${booking.address.neighborhood}, ${booking.address.city} - ${booking.address.state}`,
      items: [
        {
          description: `Serviço de ${booking.providerService.service.name}`,
          quantity: 1,
          unitPrice: booking.totalPrice.toNumber(),
          total: booking.totalPrice.toNumber(),
        },
        // Adicionar outros itens como taxas, materiais, etc., se aplicável
      ],
      subtotal: booking.totalPrice.toNumber(),
      taxes: 0, // Exemplo
      totalAmount: booking.totalPrice.toNumber(),
      paymentConditions: 'Pagamento via PIX após a confirmação do serviço.',
      validity: '7 dias a partir da emissão.',
    };

    this.logger.log(
      `[ComplianceService] Orçamento itemizado gerado para agendamento ${bookingId}.`,
    );
    return quoteDetails;
  }

  /**
   * Processa uma solicitação de acesso de dados do titular (DSAR) conforme a LGPD.
   * @param userId ID do usuário que solicitou o acesso.
   * @returns Um objeto contendo os dados do usuário.
   */
  async processDataSubjectAccessRequest(userId: string) {
    this.logger.log(
      `[ComplianceService] Processando solicitação de acesso de dados (DSAR) para userId: ${userId}`,
    );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        client: {
          include: { address: true, bookings: true, reviewsMade: true },
        },
        provider: {
          include: {
            address: true,
            bookings: true,
            reviewsReceived: true,
            providerServices: true,
          },
        },
        notifications: true,
        userConsents: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado.`);
    }

    // Filtra e formata os dados para serem retornados ao titular
    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl, // Acessando o avatarUrl do modelo User
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Incluir outros dados relevantes, excluindo senhas e dados sensíveis de terceiros
      clientDetails: user.client
        ? {
            id: user.client.id,
            cpf: user.client.cpf,
            dateOfBirth: user.client.dateOfBirth,
            address: user.client.address,
            bookings: user.client.bookings.map((b) => ({
              id: b.id,
              scheduledDate: b.scheduledDate,
              totalPrice: b.totalPrice,
              status: b.status,
            })),
            reviewsMade: user.client.reviewsMade.map((r) => ({
              id: r.id,
              rating: r.rating,
              comment: r.comment,
            })),
          }
        : null,
      providerDetails: user.provider
        ? {
            id: user.provider.id,
            cpf: user.provider.cpf,
            dateOfBirth: user.provider.dateOfBirth,
            bio: user.provider.bio,
            yearsOfExperience: user.provider.yearsOfExperience,
            pixKey: user.provider.pixKey,
            verificationStatus: user.provider.verificationStatus,
            address: user.provider.address,
            providerServices: user.provider.providerServices.map((ps) => ({
              id: ps.id,
              serviceId: ps.serviceId,
              price: ps.price,
              pricingType: ps.pricingType,
            })),
            bookings: user.provider.bookings.map((b) => ({
              id: b.id,
              scheduledDate: b.scheduledDate,
              totalPrice: b.totalPrice,
              status: b.status,
            })),
            reviewsReceived: user.provider.reviewsReceived.map((r) => ({
              id: r.id,
              rating: r.rating,
              comment: r.comment,
            })),
          }
        : null,
      notifications: user.notifications.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      consents: user.userConsents.map((c) => ({
        documentType: c.documentType,
        version: c.version,
        consentedAt: c.consentedAt,
      })),
    };

    this.logger.log(
      `[ComplianceService] DSAR para userId: ${userId} processado. Retornando dados.`,
    );
    return userData;
  }

  /**
   * Processa uma solicitação de exclusão de dados do titular (Right to Erasure) conforme a LGPD.
   * Este método deve ser usado com extrema cautela e geralmente envolve anonimização.
   * @param userId ID do usuário a ser anonimizado/excluído.
   */
  async processErasureRequest(userId: string) {
    this.logger.warn(
      `[ComplianceService] Processando solicitação de exclusão de dados (Right to Erasure) para userId: ${userId}.`,
    );

    // Correção: Adicionar 'include' para garantir que os dados de client e provider estejam disponíveis
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        client: true,
        provider: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado.`);
    }

    // Em um cenário real, a exclusão direta de dados pode violar a integridade referencial
    // ou requisitos legais de retenção de dados. A anonimização é geralmente a abordagem preferida.

    // Exemplo de anonimização (NÃO É UMA EXCLUSÃO COMPLETA)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `anon_${userId.substring(0, 8)}@anon.com`,
        fullName: 'Usuário Anonimizado',
        phone: null,
        // CPF está no modelo Client e Provider
        // dataOfBirth está no modelo Client e Provider
        avatarUrl: null,
      },
    });

    // Remover ou anonimizar dados específicos de cliente/provedor se existirem
    if (user.role === 'CLIENT' && user.client) {
      // Verificando se user.client existe
      await this.prisma.client.update({
        where: { userId: userId },
        data: {
          fullName: 'Cliente Anonimizado',
          cpf: null,
          dateOfBirth: null,
          // Anonimizar endereço ou remover
          address: {
            update: {
              street: 'Anonimizado',
              number: '0',
              complement: null,
              neighborhood: 'Anonimizado',
              city: 'Anonimizado',
              state: 'AN',
              cep: '00000-000',
              latitude: 0,
              longitude: 0,
            },
          },
        },
      });
    } else if (user.role === 'PROVIDER' && user.provider) {
      // Verificando se user.provider existe
      await this.prisma.provider.update({
        where: { userId: userId },
        data: {
          fullName: 'Provedor Anonimizado',
          cpf: null,
          dateOfBirth: null,
          bio: 'Dados anonimizados.',
          yearsOfExperience: 0,
          pixKey: null,
          documentPhotoFrontUrl: null,
          documentPhotoBackUrl: null,
          selfieWithDocumentUrl: null,
          backgroundCheckResult: Prisma.JsonNull, // Ou um valor JSON que indique anonimizado
          ocrResult: Prisma.JsonNull,
          livenessResult: Prisma.JsonNull,
          rejectionReason: null,
          address: {
            update: {
              street: 'Anonimizado',
              number: '0',
              complement: null,
              neighborhood: 'Anonimizado',
              city: 'Anonimizado',
              state: 'AN',
              cep: '00000-000',
              latitude: 0,
              longitude: 0,
            },
          },
        },
      });
    }

    // Remover notificações e consentimentos
    await this.prisma.notification.deleteMany({ where: { userId: userId } });
    await this.prisma.userConsent.deleteMany({ where: { userId: userId } });

    this.logger.log(
      `[ComplianceService] Dados do userId: ${userId} foram anonimizados.`,
    );
    return {
      message: `Dados do usuário ${userId} foram anonimizados com sucesso.`,
    };
  }
}
