// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
  InternalServerErrorException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto';
import {
  Prisma,
  UserRole,
  User,
  Client,
  Provider,
  Address,
  ProviderService,
  Service,
  Review,
  VerificationStatus,
  Booking,
  BookingStatus,
} from '@prisma/client';
import { ClientWithIncludes as ImportedClientWithIncludes } from '../clients/clients.service';
import { EmailService } from '../common/services/email.service';
import { GeocodingService } from '../common/services/geocoding.service';
import { ConfigService } from '@nestjs/config';
import { ReferralsService } from '../referrals/referrals.service'; // NOVO: Importar ReferralsService
import { UserWithIncludes } from '../users/users.service';

// --- INÍCIO DAS CORREÇÕES DE TIPAGEM E ESTRUTURA ---
const loginProviderInclude = {
  user: true,
  address: true,
  providerServices: {
    include: {
      service: true,
    },
  },
  reviewsReceived: {
    include: {
      client: {
        include: { user: true },
      },
    },
  },
  bookings: {
    where: { status: BookingStatus.FINISHED },
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
    select: { bookings: true },
  },
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
    const fullUser = (await this.prisma.user.findUnique({
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
    })) as UserWithAllRelations;

    if (!fullUser) {
      throw new UnauthorizedException('Usuário não encontrado após validação.');
    }

    const payload = {
      email: fullUser.email,
      sub: fullUser.id,
      role: fullUser.role,
    };
    const expiresIn = this.configService.get<string>('jwt.expirationTime');
    const accessToken = this.jwtService.sign(payload, { expiresIn });

    const clientWithCounts = fullUser.client
      ? {
          ...fullUser.client,
          noShowCount: fullUser.client.noShowCount ?? 0,
          cancellationCount: fullUser.client.cancellationCount ?? 0,
        }
      : undefined;

    const userProfileDataForDto: UserWithIncludes = {
      ...fullUser,
      client: clientWithCounts,
    } as UserWithIncludes;

    const userProfile = new UserProfileDto(userProfileDataForDto);

    // Telemetria: user_logged_in
    this.logger.log(
      `[TELEMETRY] user_logged_in: { userId: ${fullUser.id}, role: ${fullUser.role} }`,
    );

    return {
      accessToken,
      user: userProfile,
    };
  }

  async registerClient(
    registerClientDto: RegisterClientDto,
  ): Promise<AuthResponseDto> {
    const { email, password, fullName, phone, address, cpf, referralCode } =
      registerClientDto; // NOVO: referralCode

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Este email já está cadastrado.');
    }
    if (phone) {
      const existingPhoneUser = await this.prisma.user.findUnique({
        where: { phone },
      });
      if (existingPhoneUser) {
        throw new ConflictException(
          'Este número de telefone já está cadastrado.',
        );
      }
    }
    if (cpf) {
      const existingCpfClient = await this.prisma.client.findUnique({
        where: { cpf },
      });
      if (existingCpfClient) {
        throw new ConflictException(
          'Este CPF já está cadastrado como cliente.',
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const geoCoordinates = await this.geocodingService.geocodeAddress(
        `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city}, ${address.state}, ${address.cep}`,
      );

      const newUserClient: NewUserClientPayload = await this.prisma.user.create(
        {
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
                    // PROVISÓRIO: evitar 22P03 no cadastro de provedor (lat/lng nulos aqui, tratar depois no perfil)
                    latitude: null,
                    longitude: null,
                  },
                },
              },
            },
          },
          include: {
            client: {
              include: loginClientInclude,
            },
            loyalty: true, // Incluído
            referredBy: true, // Incluído
            referralsMade: true, // Incluído
          },
        },
      );

      if (geoCoordinates && newUserClient.client?.address?.id) {
        const wktPoint = `POINT(${geoCoordinates.longitude} ${geoCoordinates.latitude})`;
        await this.prisma.$executeRaw(Prisma.sql`
            UPDATE "Address"
            SET location = ST_GeomFromText(${wktPoint}, 4326)
            WHERE id = ${newUserClient.client.address.id}
        `);
        this.logger.log(
          `[AuthService] Endereço do cliente ID: ${newUserClient.client.address.id} atualizado com localização geoespacial.`,
        );
      }

      // --- NOVO: Lógica de Indicação no Registro ---
      if (referralCode) {
        await this.handleReferralCode(referralCode, newUserClient.id);
      }
      // --- Fim da Lógica de Indicação ---

      // Telemetria: client_registered
      this.logger.log(
        `[TELEMETRY] client_registered: { userId: ${newUserClient.id}, email: ${newUserClient.email} }`,
      );

      return this.login(newUserClient);
    } catch (error) {
      this.logger.error('Erro ao registrar cliente:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack,
        data: registerClientDto, // Log dos dados de entrada (sem senha)
      });

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          if (error.meta?.target === 'User_phone_key') {
            throw new ConflictException(
              'Este número de telefone já está cadastrado.',
            );
          }
          if (error.meta?.target === 'Client_cpf_key') {
            throw new ConflictException(
              'Este CPF já está cadastrado como cliente.',
            );
          }
          throw new ConflictException(
            'Dados duplicados. Verifique email, telefone ou CPF.',
          );
        }
        if (error.code === 'P2000') {
          throw new BadRequestException(
            'Dados inválidos (ex: valores decimais ou datas incorretas). Verifique o formato.',
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException(
            'Usuário ou entidade relacionada não encontrada.',
          );
        }
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Não foi possível registrar o cliente. Verifique os dados.',
      );
    }
  }

  async registerProvider(
    registerProviderDto: RegisterProviderDto,
  ): Promise<AuthResponseDto> {
    this.logger.log('[AuthService] registerProvider VERSION=v5-minimal');
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

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Este email já está cadastrado.');
    }
    const existingProvider = await this.prisma.provider.findUnique({
      where: { cpf },
    });
    if (existingProvider) {
      throw new ConflictException('Este CPF já está cadastrado como provedor.');
    }
    if (phone) {
      const existingPhoneUser = await this.prisma.user.findUnique({
        where: { phone },
      });
      if (existingPhoneUser) {
        throw new ConflictException(
          'Este número de telefone já está cadastrado.',
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // Validação robusta de dateOfBirth
      let parsedDateOfBirth: Date | undefined;
      if (dateOfBirth) {
        parsedDateOfBirth = new Date(dateOfBirth);
        if (isNaN(parsedDateOfBirth.getTime())) {
          throw new BadRequestException(
            'Data de nascimento inválida. Use o formato YYYY-MM-DD.',
          );
        }
      } else {
        throw new BadRequestException(
          'Data de nascimento é obrigatória para provedores.',
        );
      }

      // Etapa 1: cria apenas o User (sem nested provider)
      const createdUser = await this.prisma.user.create({
        data: {
          email,
          phone: phone || null,
          passwordHash: hashedPassword,
          role: UserRole.PROVIDER,
          isPhoneVerified: !!phone,
          fullName: fullName,
        },
      });

      // Normaliza latitude/longitude para garantir apenas number ou null (evitar 22P03)
      let normalizedLatitude: number | null = null;
      let normalizedLongitude: number | null = null;
      if (address) {
        const latRaw: any = (address as any).latitude;
        const lonRaw: any = (address as any).longitude;

        const latNum =
          typeof latRaw === 'number'
            ? latRaw
            : latRaw !== undefined && latRaw !== null
              ? Number(latRaw)
              : null;
        const lonNum =
          typeof lonRaw === 'number'
            ? lonRaw
            : lonRaw !== undefined && lonRaw !== null
              ? Number(lonRaw)
              : null;

        normalizedLatitude =
          latNum !== null && Number.isFinite(latNum) ? latNum : null;
        normalizedLongitude =
          lonNum !== null && Number.isFinite(lonNum) ? lonNum : null;

        this.logger.log(
          `[AuthService] registerProvider address lat/lng normalizados: lat=${normalizedLatitude}, lng=${normalizedLongitude}`,
        );
      }

      // Etapa 2: cria o Provider sem address nested (evita bind incorreto no campo geometry)
      const createdProvider = await this.prisma.provider.create({
        data: {
          userId: createdUser.id,
          fullName,
          cpf,
          dateOfBirth: parsedDateOfBirth,
          phone: phone ?? null,
          yearsOfExperience: yearsOfExperience ?? 0,
          avatarUrl: avatarUrl ?? null,
          verificationStatus: VerificationStatus.PENDING_INITIAL_REVIEW,
          bio: null,
          badges: [],
        },
      });

      // Cria o endereço separado e seta location via raw (geom point) apenas se houver address
      if (address) {
        const createdAddress = await this.prisma.address.create({
          data: {
            cep: address.cep,
            street: address.street,
            number: address.number,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            complement: address.complement ?? null,
            latitude: normalizedLatitude,
            longitude: normalizedLongitude,
            providerId: createdProvider.id,
          },
        });

        if (
          createdAddress.id &&
          normalizedLatitude !== null &&
          normalizedLongitude !== null
        ) {
          const wktPoint = `POINT(${normalizedLongitude} ${normalizedLatitude})`;
          await this.prisma.$executeRaw(Prisma.sql`
            UPDATE "Address"
            SET location = ST_GeomFromText(${wktPoint}, 4326)
            WHERE id = ${createdAddress.id}
          `);
        }
      }

      // Indicação (se existir referralCode)
      if (referralCode) {
        await this.handleReferralCode(referralCode, createdUser.id);
      }

      // Telemetria: provider_registered
      this.logger.log(
        `[TELEMETRY] provider_registered: { userId: ${createdUser.id}, email: ${createdUser.email} }`,
      );

      // Reusa lógica do login para montar o payload completo
      return this.login(createdUser);
    } catch (error) {
      // MELHORIA: Logging mais detalhado no catch para debug
      this.logger.error('Erro ao registrar provedor:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack,
        data: { email, cpf, phone, dateOfBirth, referralCode }, // Log dos dados de entrada (sem senha)
      });

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          if (error.meta?.target === 'User_phone_key') {
            throw new ConflictException(
              'Este número de telefone já está cadastrado.',
            );
          }
          if (error.meta?.target === 'Provider_cpf_key') {
            throw new ConflictException(
              'Este CPF já está cadastrado como provedor.',
            );
          }
          if (error.meta?.target === 'User_email_idx') {
            // Assumindo unique index para email
            throw new ConflictException('Este email já está cadastrado.');
          }
          throw new ConflictException(
            'Dados duplicados. Verifique email, telefone ou CPF.',
          );
        }
        if (error.code === 'P2000') {
          // Validação de tipo/dados inválidos
          throw new BadRequestException(
            'Dados inválidos (ex: data de nascimento ou valores numéricos incorretos). Verifique o formato.',
          );
        }
        if (error.code === 'P2025') {
          // Record not found (ex: foreign key)
          throw new NotFoundException(
            'Entidade relacionada não encontrada (ex: endereço ou serviço).',
          );
        }
        if (error.code === 'P2021') {
          // Input required
          throw new BadRequestException(
            'Campos obrigatórios ausentes. Verifique CPF, data de nascimento ou endereço.',
          );
        }
      }
      if (error instanceof BadRequestException) {
        throw error; // Relança se já for BadRequest (ex: de validação de data)
      }
      // Para erros não-Prisma (ex: geocoding falhou, mas isolado acima)
      throw new BadRequestException(
        'Não foi possível registrar o provedor. Verifique os dados e consulte o console do servidor para detalhes técnicos.',
      );
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(
        `Tentativa de redefinição de senha para email não encontrado: ${email}`,
      );
      return;
    }

    const resetToken = this.jwtService.sign(
      { userId: user.id },
      { expiresIn: '1h' },
    );
    const appBaseUrl =
      this.configService.get<string>('appBaseUrl') ||
      this.configService.get<string>('APP_BASE_URL');
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
        `,
      );
      this.logger.log(`Email de redefinição de senha enviado para ${email}`);
      // Telemetria: forgot_password_email_sent
      this.logger.log(
        `[TELEMETRY] forgot_password_email_sent: { email: ${email} }`,
      );
    } catch (emailError: any) {
      this.logger.error(
        `Falha ao enviar email de redefinição de senha para ${email}: ${emailError.message}`,
      );
      // Telemetria: forgot_password_email_failed
      this.logger.log(
        `[TELEMETRY] forgot_password_email_failed: { email: ${email}, error: ${emailError.message} }`,
      );
    }
  }

  /**
   * Resolve e aplica um código de indicação seguro, evitando uso direto do userId.
   * Aceita apenas códigos registrados em myReferralCode; em desenvolvimento permite fallback para id.
   */
  private async handleReferralCode(
    referralCode: string,
    referredUserId: string,
  ) {
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    const referrerUser = await this.prisma.user.findFirst({
      where: {
        myReferralCode: referralCode,
      },
    });

    if (!referrerUser && nodeEnv !== 'production') {
      // Fallback apenas para ambientes não-prod para compatibilidade legada
      const legacy = await this.prisma.user.findUnique({
        where: { id: referralCode },
      });
      if (legacy) {
        await this.referralsService.createReferral({
          referredUserId,
          referrerUserId: legacy.id,
          referralCode,
        });
        this.logger.warn(
          `[AuthService] Código de indicação usando userId em ambiente não-prod: ${referralCode}. Recomende atualizar para myReferralCode.`,
        );
        return;
      }
    }

    if (!referrerUser) {
      this.logger.warn(
        `[AuthService] Código de indicação inválido ou expirado: ${referralCode}. Ignorando vínculo.`,
      );
      return;
    }

    await this.referralsService.createReferral({
      referredUserId,
      referrerUserId: referrerUser.id,
      referralCode,
    });
    this.logger.log(
      `[AuthService] Usuário ${referredUserId} vinculado ao indicador ${referrerUser.id} via código ${referralCode}.`,
    );
  }
}
