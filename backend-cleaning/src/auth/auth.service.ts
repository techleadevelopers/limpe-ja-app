// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
// Importe BookingStatus e Prisma (para Prisma.SortOrder) do Prisma
import { UserRole, User, Prisma, Client, Provider, Address, ProviderService, Service, Review, VerificationStatus, Booking, BookingStatus } from '@prisma/client';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto';
import { ProvidersService, ProviderWithCalculatedRating } from '../providers/providers.service';
import { ClientWithIncludes as ImportedClientWithIncludes } from '../clients/clients.service';
import { EmailService } from '../common/services/email.service';
import { GeocodingService } from '../common/services/geocoding.service';
import { ConfigService } from '@nestjs/config';

// --- INÍCIO DAS CORREÇÕES DE TIPAGEM E ESTRUTURA ---

// 1. Define a estrutura de include para a relação 'provider' no User
// CORRIGIDO: Usando BookingStatus.COMPLETED e Prisma.SortOrder.desc
const loginProviderInclude = {
  user: true,
  address: true,
  providerServices: {
    include: {
      service: true
    }
  },
  reviewsReceived: {
    include: {
      client: {
        include: { user: true }
      }
    }
  },
  bookings: {
    where: { status: BookingStatus.COMPLETED }, // CORRIGIDO: Usando o enum BookingStatus
    orderBy: { createdAt: Prisma.SortOrder.desc }, // CORRIGIDO: Usando Prisma.SortOrder.desc
    take: 100,
  },
};

// 2. Define a estrutura de include para a relação 'client' no User
const loginClientInclude = {
  user: true,
  address: true,
  bookings: true,
  reviewsMade: true,
  _count: {
    select: { bookings: true }
  }
};

// 3. Redefine ProviderWithIncludes e ClientWithIncludes localmente.
// ESTE PASSO É CRÍTICO para resolver o erro '2344' no UserWithAllRelations
// e para garantir que o tipo de 'fullUser.provider' seja reconhecido corretamente.
//
// ATENÇÃO: VOCÊ DEVE GARANTIR QUE AS DEFINIÇÕES DESTES TIPOS EM
// `providers/providers.service.ts` e `clients/clients.service.ts`
// SEJAM IDÊNTICAS A ESTAS DEFINIÇÕES. CASO CONTRÁRIO, VOCÊ TERÁ ERROS DE TIPAGEM
// EM OUTROS LUGARES ONDE ESTES TIPOS SÃO IMPORTADOS E USADOS.
export type ProviderWithIncludes = Prisma.ProviderGetPayload<{
  include: typeof loginProviderInclude;
}>;

export type ClientWithIncludes = Prisma.ClientGetPayload<{
  include: typeof loginClientInclude;
}>;

// 4. Tipo Auxiliar: UserWithAllRelations
// Este tipo agora reflete exatamente a estrutura do `include` na query do Prisma,
// usando as constantes definidas acima. Isso resolve o erro '2344'.
export type UserWithAllRelations = Prisma.UserGetPayload<{
  include: {
    client?: {
      include: typeof loginClientInclude;
    };
    provider?: {
      include: typeof loginProviderInclude;
    };
  };
}>;

// Tipos para os retornos de `create` em registerClient e registerProvider
type NewUserClientPayload = Prisma.UserGetPayload<{
  include: {
    client: {
      include: typeof loginClientInclude;
    };
  };
}>;

type NewUserProviderPayload = Prisma.UserGetPayload<{
  include: {
    provider: {
      include: typeof loginProviderInclude;
    };
  };
}>;

// --- FIM DAS CORREÇÕES DE TIPAGEM E ESTRUTURA ---

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private providersService: ProvidersService,
    private emailService: EmailService,
    private geocodingService: GeocodingService,
    private configService: ConfigService,
  ) {}

  // validateUser (email/password) - Mantido
  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }
    return user;
  }

  // login (email/password) - Mantido. Este método é chamado internamente após validação.
  async login(user: User): Promise<AuthResponseDto> {
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        client: {
          include: loginClientInclude,
        },
        provider: {
          include: loginProviderInclude,
        },
      },
    }) as UserWithAllRelations;

    if (!fullUser) {
      throw new UnauthorizedException('Usuário não encontrado após validação.');
    }

    const payload = { email: fullUser.email, sub: fullUser.id, role: fullUser.role };
    const expiresIn = this.configService.get<string>('jwt.expirationTime');
    const accessToken = this.jwtService.sign(payload, { expiresIn });

    let mappedProvider: ProviderWithCalculatedRating | undefined;
    if (fullUser.provider) {
      mappedProvider = this.providersService.mapProviderToCalculatedRating(fullUser.provider);
    }

    const userProfileDataForDto = {
      ...fullUser,
      client: fullUser.client ? {
        ...(fullUser.client as ClientWithIncludes),
        noShowCount: (fullUser.client as any).noShowCount,
        cancellationCount: (fullUser.client as any).cancellationCount,
      } : undefined,
      provider: mappedProvider,
    };

    const userProfile = new UserProfileDto(userProfileDataForDto);

    return {
      accessToken,
      user: userProfile,
    };
  }

  // registerClient (email/password) - Mantido. Lógica de phoneExists ainda é válida para email/senha.
  async registerClient(registerClientDto: RegisterClientDto): Promise<AuthResponseDto> {
    const { email, password, fullName, phone, address, cpf } = registerClientDto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Este email já está cadastrado.');
    }
    if (phone) {
      const existingPhoneUser = await this.prisma.user.findUnique({ where: { phone } });
      if (existingPhoneUser) {
        throw new ConflictException('Este número de telefone já está cadastrado.');
      }
    }
    if (cpf) {
      const existingCpfClient = await this.prisma.client.findUnique({ where: { cpf } });
      if (existingCpfClient) {
        throw new ConflictException('Este CPF já está cadastrado como cliente.');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const geoCoordinates = await this.geocodingService.geocodeAddress(
        `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city}, ${address.state}, ${address.cep}`
      );

      const newUserClient: NewUserClientPayload = await this.prisma.user.create({
        data: {
          email,
          phone: phone || null,
          passwordHash: hashedPassword,
          role: UserRole.CLIENT,
          isPhoneVerified: !!phone,
          client: {
            create: {
              fullName,
              phone: phone ?? null,
              cpf: cpf ?? null,
              noShowCount: 0,
              cancellationCount: 0,
              address: {
                create: {
                  cep: address.cep,
                  street: address.street,
                  number: address.number,
                  neighborhood: address.neighborhood,
                  city: address.city,
                  state: address.state,
                  complement: address.complement ?? null,
                  latitude: geoCoordinates?.latitude,
                  longitude: geoCoordinates?.longitude,
                },
              },
            },
          },
        },
        include: {
          client: {
            include: loginClientInclude
          }
        }
      });

      if (geoCoordinates && newUserClient.client?.address?.id) {
        const wktPoint = `POINT(${geoCoordinates.longitude} ${geoCoordinates.latitude})`;
        await this.prisma.$executeRaw(Prisma.sql`
            UPDATE "Address"
            SET location = ST_GeomFromText(${wktPoint}, 4326)
            WHERE id = ${newUserClient.client.address.id}
        `);
        this.logger.log(`[AuthService] Endereço do cliente ID: ${newUserClient.client.address.id} atualizado com localização geoespacial.`);
      }

      return this.login(newUserClient);
    } catch (error) {
      this.logger.error('Erro ao registrar cliente:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        if (error.meta?.target === 'User_phone_key') {
          throw new ConflictException('Este número de telefone já está cadastrado.');
        }
        if (error.meta?.target === 'Client_cpf_key') {
          throw new ConflictException('Este CPF já está cadastrado como cliente.');
        }
      }
      throw new BadRequestException('Não foi possível registrar o cliente. Verifique os dados.');
    }
  }

  // registerProvider (email/password) - Mantido. Lógica de phoneExists ainda é válida para email/senha.
  async registerProvider(registerProviderDto: RegisterProviderDto): Promise<AuthResponseDto> {
    const {
      email,
      password,
      fullName,
      cpf,
      dateOfBirth,
      phone,
      address,
      yearsOfExperience,
      avatarUrl,
    } = registerProviderDto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Este email já está cadastrado.');
    }
    const existingProvider = await this.prisma.provider.findUnique({ where: { cpf } });
    if (existingProvider) {
      throw new ConflictException('Este CPF já está cadastrado como provedor.');
    }
    if (phone) {
      const existingPhoneUser = await this.prisma.user.findUnique({ where: { phone } });
      if (existingPhoneUser) {
        throw new ConflictException('Este número de telefone já está cadastrado.');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const geoCoordinates = await this.geocodingService.geocodeAddress(
        `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city}, ${address.state}, ${address.cep}`
      );

      const newUserProvider: NewUserProviderPayload = await this.prisma.user.create({
        data: {
          email,
          phone: phone || null,
          passwordHash: hashedPassword,
          role: UserRole.PROVIDER,
          isPhoneVerified: !!phone,
          provider: {
            create: {
              fullName,
              cpf,
              dateOfBirth: new Date(dateOfBirth),
              phone: phone ?? null,
              yearsOfExperience: yearsOfExperience ?? 0,
              avatarUrl: avatarUrl ?? null,
              verificationStatus: VerificationStatus.PENDING_INITIAL_REVIEW,
              bio: null,
              badges: [],
              address: {
                create: {
                  cep: address.cep,
                  street: address.street,
                  number: address.number,
                  neighborhood: address.neighborhood,
                  city: address.city,
                  state: address.state,
                  complement: address.complement ?? null,
                  latitude: geoCoordinates?.latitude,
                  longitude: geoCoordinates?.longitude,
                },
              },
            },
          },
        },
        include: {
          provider: {
            include: loginProviderInclude
          }
        }
      });

      if (geoCoordinates && newUserProvider.provider?.address?.id) {
        const wktPoint = `POINT(${geoCoordinates.longitude} ${geoCoordinates.latitude})`;

        await this.prisma.$executeRaw(Prisma.sql`
            UPDATE "Address"
            SET location = ST_GeomFromText(${wktPoint}, 4326)
            WHERE id = ${newUserProvider.provider.address.id}
        `);
        this.logger.log(`[AuthService] Endereço do provedor ID: ${newUserProvider.provider.address.id} atualizado com localização geoespacial.`);
      }

      return this.login(newUserProvider);
    } catch (error) {
      this.logger.error('Erro ao registrar provedor:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        if (error.meta?.target === 'User_phone_key') {
          throw new ConflictException('Este número de telefone já está cadastrado.');
        }
        if (error.meta?.target === 'Provider_cpf_key') {
          throw new ConflictException('Este CPF já está cadastrado como provedor.');
        }
      }
      throw new BadRequestException('Não foi possível registrar o provedor. Verifique os dados e o console do servidor para mais detalhes.');
    }
  }

  // forgotPassword - Mantido
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(`Tentativa de redefinição de senha para email não encontrado: ${email}`);
      return;
    }

    const resetToken = this.jwtService.sign({ userId: user.id }, { expiresIn: '1h' });
    const appBaseUrl = this.configService.get<string>('appBaseUrl');
    const resetLink = `${appBaseUrl}/reset-password?token=${resetToken}`;

    try {
      await this.emailService.sendEmail(
        email,
        'Redefinição de Senha - Limpeja',
        `
        Olá,

        Recebemos uma solicitação para redefinir a senha da sua conta Limpeja.
        Para redefinir sua senha, clique no link abaixo:

        ${resetLink}

        Este link de redefinição de senha expirará em 1 hora.

        Se você não solicitou uma redefinição de senha, por favor, ignore este e-mail.

        Atenciosamente,
        Equipe Limpeja
        `,
        `
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta Limpeja.</p>
        <p>Para redefinir sua senha, clique no link abaixo:</p>
        <p><a href="${resetLink}">Redefinir Senha</a></p>
        <p>Este link de redefinição de senha expirará em 1 hora.</p>
        <p>Se você não solicitou uma redefinição de senha, por favor, ignore este este e-mail.</p>
        <p>Atenciosamente,<br>Equipe Limpeja</p>
        `
      );
      this.logger.log(`Email de redefinição de senha enviado para ${email}`);
    } catch (emailError) {
      this.logger.error(`Falha ao enviar email de redefinição de senha para ${email}: ${emailError.message}`);
    }
  }
}