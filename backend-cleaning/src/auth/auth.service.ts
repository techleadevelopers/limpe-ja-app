// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger, InternalServerErrorException, forwardRef, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto';
import { Prisma, UserRole, User, Client, Provider, Address, ProviderService, Service, Review, VerificationStatus, Booking, BookingStatus } from '@prisma/client';
import { ProvidersService, ProviderWithCalculatedRating } from '../providers/providers.service';
import { ClientWithIncludes as ImportedClientWithIncludes } from '../clients/clients.service';
import { EmailService } from '../common/services/email.service';
import { GeocodingService } from '../common/services/geocoding.service';
import { ConfigService } from '@nestjs/config';
import { ReferralsService } from '../referrals/referrals.service'; // NOVO: Importar ReferralsService

// --- INÍCIO DAS CORREÇÕES DE TIPAGEM E ESTRUTURA ---

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
    where: { status: BookingStatus.COMPLETED },
    orderBy: { createdAt: Prisma.SortOrder.desc },
    take: 100,
  },
  // CORREÇÃO: Adicionado availability para resolver erro de tipagem no mapProviderToCalculatedRating
  availability: true,
};

const loginClientInclude = {
  user: true,
  address: true,
  bookings: true,
  reviewsMade: true,
  _count: {
    select: { bookings: true }
  }
};

export type ProviderWithIncludes = Prisma.ProviderGetPayload<{
  include: typeof loginProviderInclude;
}>;

export type ClientWithIncludes = Prisma.ClientGetPayload<{
  include: typeof loginClientInclude;
}>;

// Adicionado includes de Loyalty e Referral para UserWithAllRelations
export type UserWithAllRelations = Prisma.UserGetPayload<{
  include: {
    client?: {
      include: typeof loginClientInclude;
    };
    provider?: {
      include: typeof loginProviderInclude;
    };
    loyalty: true;
    referredBy: true;
    referralsMade: true;
  };
}>;

type NewUserClientPayload = Prisma.UserGetPayload<{
  include: {
    client: {
      include: typeof loginClientInclude;
    };
    loyalty: true;
    referredBy: true;
    referralsMade: true;
  };
}>;

type NewUserProviderPayload = Prisma.UserGetPayload<{
  include: {
    provider: {
      include: typeof loginProviderInclude;
    };
    loyalty: true;
    referredBy: true;
    referralsMade: true;
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
    @Inject(forwardRef(() => ReferralsService)) // NOVO: Injetar ReferralsService
    private referralsService: ReferralsService,
  ) {}

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
        loyalty: true, // Incluído
        referredBy: true, // Incluído
        referralsMade: true, // Incluído
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
      // CORREÇÃO: Agora o include tem availability, então a tipagem bate
      mappedProvider = this.providersService.mapProviderToCalculatedRating(fullUser.provider);
    }

    // CORREÇÃO: O objeto passado para o DTO deve incluir as relações de Loyalty e Referral
    const userProfileDataForDto = {
      ...fullUser,
      client: fullUser.client ? {
        ...(fullUser.client as ClientWithIncludes),
        noShowCount: (fullUser.client as any).noShowCount,
        cancellationCount: (fullUser.client as any).cancellationCount,
      } : undefined,
      provider: mappedProvider, // mappedProvider já é ProviderWithCalculatedRating
      loyalty: fullUser.loyalty, // Adicionado
      referredBy: fullUser.referredBy, // Adicionado
      referralsMade: fullUser.referralsMade, // Adicionado
    };

    const userProfile = new UserProfileDto(userProfileDataForDto as any); // Usando 'as any' temporariamente para o objeto complexo

    // Telemetria: user_logged_in
    this.logger.log(`[TELEMETRY] user_logged_in: { userId: ${fullUser.id}, role: ${fullUser.role} }`);

    return {
      accessToken,
      user: userProfile,
    };
  }

  async registerClient(registerClientDto: RegisterClientDto): Promise<AuthResponseDto> {
    const { email, password, fullName, phone, address, cpf, referralCode } = registerClientDto; // NOVO: referralCode

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
          fullName: fullName, // Adicionado fullName ao User
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
          },
          loyalty: true, // Incluído
          referredBy: true, // Incluído
          referralsMade: true, // Incluído
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

      // --- NOVO: Lógica de Indicação no Registro ---
      if (referralCode) {
        try {
          // ASSUNÇÃO: O referralCode fornecido no DTO é o ID do usuário indicador.
          // Em um cenário real, você pode ter uma tabela de códigos de indicação
          // ou um código gerado que precisa ser mapeado de volta para um userId.
          const referrerUser = await this.prisma.user.findUnique({
            where: { id: referralCode }, // Tenta encontrar o usuário pelo ID fornecido como referralCode
          });

          if (referrerUser) {
            await this.referralsService.createReferral({
              referredUserId: newUserClient.id,
              referrerUserId: referrerUser.id,
              referralCode: referralCode, // Passa o código original para o registro da indicação
            });
            this.logger.log(`[AuthService] Cliente ${newUserClient.id} registrado com código de indicação ${referralCode} do indicador ${referrerUser.id}.`);
          } else {
            this.logger.warn(`[AuthService] Código de indicação ${referralCode} não corresponde a nenhum usuário indicador. Registro sem vínculo de indicação.`);
          }
        } catch (e) {
          this.logger.error(`[AuthService] Falha ao processar indicação para cliente ${newUserClient.id} com código ${referralCode}: ${e?.message || e}`);
        }
      }
      // --- Fim da Lógica de Indicação ---

      // Telemetria: client_registered
      this.logger.log(`[TELEMETRY] client_registered: { userId: ${newUserClient.id}, email: ${newUserClient.email} }`);

      return this.login(newUserClient);
    } catch (error) {
      this.logger.error('Erro ao registrar cliente:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          if (error.meta?.target === 'User_phone_key') {
            throw new ConflictException('Este número de telefone já está cadastrado.');
          }
          if (error.meta?.target === 'Client_cpf_key') {
            throw new ConflictException('Este CPF já está cadastrado como cliente.');
          }
        }
      }
      throw new BadRequestException('Não foi possível registrar o cliente. Verifique os dados.');
    }
  }

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
      referralCode, // NOVO: referralCode
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
          fullName: fullName, // Adicionado fullName ao User
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
              acceptanceRate: 0, // NOVO: Default
              averageResponseTime: 0, // NOVO: Default
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
          },
          loyalty: true, // Incluído
          referredBy: true, // Incluído
          referralsMade: true, // Incluído
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

      // --- NOVO: Lógica de Indicação no Registro (para provedor) ---
      if (referralCode) {
        try {
          // ASSUNÇÃO: O referralCode fornecido no DTO é o ID do usuário indicador.
          const referrerUser = await this.prisma.user.findUnique({
            where: { id: referralCode }, // Tenta encontrar o usuário pelo ID fornecido como referralCode
          });

          if (referrerUser) {
            await this.referralsService.createReferral({
              referredUserId: newUserProvider.id,
              referrerUserId: referrerUser.id,
              referralCode: referralCode, // Passa o código original para o registro da indicação
            });
            this.logger.log(`[AuthService] Provedor ${newUserProvider.id} registrado com código de indicação ${referralCode} do indicador ${referrerUser.id}.`);
          } else {
            this.logger.warn(`[AuthService] Código de indicação ${referralCode} não corresponde a nenhum usuário indicador. Registro sem vínculo de indicação.`);
          }
        } catch (e) {
          this.logger.error(`[AuthService] Falha ao processar indicação para provedor ${newUserProvider.id} com código ${referralCode}: ${e?.message || e}`);
        }
      }
      // --- Fim da Lógica de Indicação ---

      // Telemetria: provider_registered
      this.logger.log(`[TELEMETRY] provider_registered: { userId: ${newUserProvider.id}, email: ${newUserProvider.email} }`);

      return this.login(newUserProvider);
    } catch (error) {
      this.logger.error('Erro ao registrar provedor:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          if (error.meta?.target === 'User_phone_key') {
            throw new ConflictException('Este número de telefone já está cadastrado.');
          }
          if (error.meta?.target === 'Provider_cpf_key') {
            throw new ConflictException('Este CPF já está cadastrado como provedor.');
          }
        }
      }
      throw new BadRequestException('Não foi possível registrar o provedor. Verifique os dados e o console do servidor para mais detalhes.');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(`Tentativa de redefinição de senha para email não encontrado: ${email}`);
      return;
    }

    const resetToken = this.jwtService.sign({ userId: user.id }, { expiresIn: '1h' });
    const appBaseUrl = this.configService.get<string>('jwt.appBaseUrl'); // Corrected appBaseUrl access
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
      // Telemetria: forgot_password_email_sent
      this.logger.log(`[TELEMETRY] forgot_password_email_sent: { email: ${email} }`);
    } catch (emailError: any) {
      this.logger.error(`Falha ao enviar email de redefinição de senha para ${email}: ${emailError.message}`);
      // Telemetria: forgot_password_email_failed
      this.logger.log(`[TELEMETRY] forgot_password_email_failed: { email: ${email}, error: ${emailError.message} }`);
    }
  }
}