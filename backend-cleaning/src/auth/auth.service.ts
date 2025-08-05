// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { UserRole, User, Prisma, Client, Provider, Address, ProviderService, Service, Review, VerificationStatus, Booking } from '@prisma/client'; // Importante: 'Prisma' deve estar aqui
import { AuthResponseDto } from './dto/auth-response.dto'; //
import { UserProfileDto } from '../users/dto/user-profile.dto';
import { ProvidersService, ProviderWithIncludes, ProviderWithCalculatedRating } from '../providers/providers.service';
import { ClientWithIncludes } from '../clients/clients.service'; // Corrected import path
import { EmailService } from '../common/services/email.service';
import { GeocodingService } from '../common/services/geocoding.service';
// REMOVIDO: import { SmsService } from '../sms/sms.service';
import { ConfigService } from '@nestjs/config'; // Para acessar JWT_EXPIRATION_TIME

// Tipo Auxiliar: UserWithAllRelations (mantido)
export type UserWithAllRelations = User & {
  client?: (Client & {
    user: User;
    address: Address | null;
    bookings: Booking[];
    reviewsMade: Review[];
    _count?: { bookings: number };
    createdAt: Date;
    updatedAt: Date;
    noShowCount: number; // NEW
    cancellationCount: number; // NEW
  }) | null;
  provider?: ProviderWithIncludes | null; // Usar ProviderWithIncludes atualizado
};

// REMOVIDO: Interface para o retorno do verifyOtp (não mais necessário)
// interface VerifyOtpResponse extends AuthResponseDto {
//   isNewUser: boolean;
// }

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private providersService: ProvidersService,
    private emailService: EmailService,
    private geocodingService: GeocodingService,
    // REMOVIDO: private smsService: SmsService,
    private configService: ConfigService, // Injeta ConfigService para JWT_EXPIRATION_TIME
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
          include: {
            user: true,
            address: true,
            bookings: true,
            reviewsMade: true,
            _count: {
              select: { bookings: true }
            }
          },
        },
        provider: {
          include: {
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
            bookings: { // Added for provider badges/metrics
              where: { status: 'COMPLETED' },
              orderBy: { createdAt: 'desc' },
              take: 100,
            },
          },
        },
      },
    }) as UserWithAllRelations;

    if (!fullUser) {
      throw new UnauthorizedException('Usuário não encontrado após validação.');
    }

    const payload = { email: fullUser.email, sub: fullUser.id, role: fullUser.role };
    const expiresIn = this.configService.get<string>('jwt.expirationTime'); // Acessando do config.ts
    const accessToken = this.jwtService.sign(payload, { expiresIn });

    let mappedProvider: ProviderWithCalculatedRating | undefined;
    if (fullUser.provider) {
      mappedProvider = this.providersService.mapProviderToCalculatedRating(fullUser.provider);
    }

    const userProfileDataForDto = {
      ...fullUser,
      client: fullUser.client,
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
    // Check if phone number already exists (ainda relevante, mesmo sem OTP principal)
    if (phone) {
      const existingPhoneUser = await this.prisma.user.findUnique({ where: { phone } });
      if (existingPhoneUser) {
        throw new ConflictException('Este número de telefone já está cadastrado.');
      }
    }
    // Check if CPF already exists
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

      const newUser = await this.prisma.user.create({
        data: {
          email,
          phone: phone || null,
          passwordHash: hashedPassword,
          role: UserRole.CLIENT,
          isPhoneVerified: !!phone, // Se o telefone foi fornecido, considerá-lo verificado para este fluxo inicial
          client: {
            create: {
              fullName,
              phone: phone ?? null,
              cpf: cpf ?? null,
              noShowCount: 0, // NEW
              cancellationCount: 0, // NEW
              address: {
                create: {
                  cep: address.cep,
                  street: address.street,
                  number: address.number,
                  neighborhood: address.neighborhood,
                  city: address.city,
                  state: address.state,
                  complement: address.complement ?? null,
                  latitude: geoCoordinates?.latitude, // Assuming DTO includes these
                  longitude: geoCoordinates?.longitude, // Assuming DTO includes these
                },
              },
            },
          },
        },
        include: {
          client: {
            include: {
              user: true,
              address: true,
              bookings: true,
              reviewsMade: true,
              _count: {
                select: { bookings: true }
              }
            }
          }
        }
      });

      // === INÍCIO DA CORREÇÃO PARA CAMPO 'LOCATION' NO REGISTRO DE CLIENTE ===
      // This part might be redundant if latitude/longitude are directly set in address.create
      // but keeping it for explicit geospatial indexing if needed.
      if (geoCoordinates && newUser.client?.address?.id) {
        const wktPoint = `POINT(${geoCoordinates.longitude} ${geoCoordinates.latitude})`; // Formata como string WKT
        await this.prisma.$executeRaw(Prisma.sql`
            UPDATE "Address"
            SET location = ST_GeomFromText(${wktPoint}, 4326)
            WHERE id = ${newUser.client.address.id}
        `);
        this.logger.log(`[AuthService] Endereço do cliente ID: ${newUser.client.address.id} atualizado com localização geoespacial.`);
      }
      // === FIM DA CORREÇÃO PARA CAMPO 'LOCATION' NO REGISTRO DE CLIENTE ===

      return this.login(newUser);
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

      const newUser = await this.prisma.user.create({
        data: {
          email,
          phone: phone || null,
          passwordHash: hashedPassword,
          role: UserRole.PROVIDER,
          isPhoneVerified: !!phone, // Se o telefone foi fornecido, considerá-lo verificado para este fluxo inicial
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
              badges: [], // NEW: Initialize with empty badges
              address: {
                create: {
                  cep: address.cep,
                  street: address.street,
                  number: address.number,
                  neighborhood: address.neighborhood,
                  city: address.city,
                  state: address.state,
                  complement: address.complement ?? null,
                  latitude: geoCoordinates?.latitude, // Assuming DTO includes these
                  longitude: geoCoordinates?.longitude, // Assuming DTO includes these
                },
              },
            },
          },
        },
        include: {
          provider: {
            include: {
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
              bookings: { // Added for provider badges/metrics
                where: { status: 'COMPLETED' },
                orderBy: { createdAt: 'desc' },
                take: 100,
              },
            }
          }
        }
      });

      // === INÍCIO DA CORREÇÃO PARA CAMPO 'LOCATION' NO REGISTRO DE PROVEDOR ===
      // This part might be redundant if latitude/longitude are directly set in address.create
      // but keeping it for explicit geospatial indexing if needed.
      if (geoCoordinates && newUser.provider?.address?.id) {
        const wktPoint = `POINT(${geoCoordinates.longitude} ${geoCoordinates.latitude})`; // Formata como string WKT

        // Usa $executeRaw para inserir/atualizar o campo de geometria diretamente via SQL
        await this.prisma.$executeRaw(Prisma.sql`
            UPDATE "Address"
            SET location = ST_GeomFromText(${wktPoint}, 4326)
            WHERE id = ${newUser.provider.address.id}
        `);
        this.logger.log(`[AuthService] Endereço do provedor ID: ${newUser.provider.address.id} atualizado com localização geoespacial.`);
      }
      // === FIM DA CORREÇÃO PARA CAMPO 'LOCATION' NO REGISTRO DE PROVEDOR ===

      return this.login(newUser);
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
    // Use a APP_BASE_URL do ConfigService para construir o link
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

  // REMOVIDO: checkPhoneNumberExistence
  // REMOVIDO: sendOtp
  // REMOVIDO: verifyOtp
  // REMOVIDO: loginWithPhoneNumberAndPassword
  // REMOVIDO: formatPhoneNumberToE164 (função auxiliar, não mais usada)
}