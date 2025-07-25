import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { UserRole, User, Prisma, Client, Provider, Address, ProviderService, Service, Review, VerificationStatus, Booking } from '@prisma/client';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto';
// REMOVIDO: import * as admin from 'firebase-admin';
import { ProvidersService, ProviderWithIncludes, ProviderWithCalculatedRating } from '../providers/providers.service';
import { ClientWithIncludes } from '../users/dto/user-profile.dto';
import { EmailService } from '../common/services/email.service';
import { GeocodingService } from '../common/services/geocoding.service';
import { SmsService } from '../sms/sms.service'; // NOVO: Importa o SmsService

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
  }) | null;
  provider?: ProviderWithIncludes | null; // Usar ProviderWithIncludes atualizado
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private providersService: ProvidersService,
    private emailService: EmailService,
    private geocodingService: GeocodingService,
    private smsService: SmsService, // NOVO: Injeta o SmsService
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

  // login (email/password) - Mantido
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
          },
        },
      },
    }) as UserWithAllRelations;

    if (!fullUser) {
      throw new UnauthorizedException('Usuário não encontrado após validação.');
    }

    const payload = { email: fullUser.email, sub: fullUser.id, role: fullUser.role };
    const accessToken = this.jwtService.sign(payload);

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

  // registerClient (email/password) - Mantido, com validação de telefone/CPF
  async registerClient(registerClientDto: RegisterClientDto): Promise<AuthResponseDto> {
    const { email, password, fullName, phone, address, cpf } = registerClientDto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Este email já está cadastrado.');
    }
    // Check if phone number already exists
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
          isPhoneVerified: !!phone, // Marca como verificado se o telefone foi fornecido no registro
          client: {
            create: {
              fullName,
              phone: phone ?? null,
              cpf: cpf ?? null,
              address: {
                create: {
                  cep: address.cep,
                  street: address.street,
                  number: address.number,
                  neighborhood: address.neighborhood,
                  city: address.city,
                  state: address.state,
                  complement: address.complement ?? null,
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

      if (geoCoordinates && newUser.client?.address?.id) {
        await this.prisma.address.update({
          where: { id: newUser.client.address.id },
          data: {
            location: `SRID=4326;POINT(${geoCoordinates.longitude} ${geoCoordinates.latitude})`,
          } as any,
        });
      }

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

  // registerProvider (email/password) - Mantido, com validação de telefone/CPF
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
          isPhoneVerified: !!phone, // Marca como verificado se o telefone foi fornecido no registro
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
              address: {
                create: {
                  cep: address.cep,
                  street: address.street,
                  number: address.number,
                  neighborhood: address.neighborhood,
                  city: address.city,
                  state: address.state,
                  complement: address.complement ?? null,
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
            }
          }
        }
      });

      if (geoCoordinates && newUser.provider?.address?.id) {
        await this.prisma.address.update({
          where: { id: newUser.provider.address.id },
          data: {
            location: `SRID=4326;POINT(${geoCoordinates.longitude} ${geoCoordinates.latitude})`,
          } as any,
        });
      }

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
    const resetLink = `http://seu-app.com/reset-password?token=${resetToken}`;

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

  // REMOVIDO: verifyFirebaseIdToken
  // async verifyFirebaseIdToken(idToken: string): Promise<AuthResponseDto> { ... }

  // NOVO: Verifica se o número de telefone existe e se tem senha
  async checkPhoneNumberExistence(phoneNumber: string): Promise<{ exists: boolean; hasPassword?: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { phone: phoneNumber } });
    return { exists: !!user, hasPassword: !!user?.passwordHash };
  }

  // NOVO: Envia OTP para o número de telefone
  async sendOtp(phoneNumber: string): Promise<void> {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // OTP de 6 dígitos
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // Expira em 5 minutos

    let user = await this.prisma.user.findUnique({ where: { phone: phoneNumber } });

    if (user) {
      // Atualiza usuário existente com novo OTP
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otpCode, otpExpiresAt },
      });
    } else {
      // Cria um usuário temporário se não existir (será totalmente registrado depois)
      user = await this.prisma.user.create({
        data: {
          phone: phoneNumber,
          role: UserRole.CLIENT, // Papel padrão para novos usuários via telefone
          otpCode,
          otpExpiresAt,
          email: `temp_${Date.now()}@limpeja.com`, // E-mail placeholder
          passwordHash: null, // Sem senha inicialmente
          isPhoneVerified: false, // Não verificado até o OTP ser confirmado
        },
      });
    }

    const message = `Seu código de verificação LimpeJá é: ${otpCode}. Ele expira em 5 minutos.`;
    try {
      await this.smsService.sendSms(phoneNumber, message);
      this.logger.log(`OTP enviado para ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`Falha ao enviar SMS de OTP para ${phoneNumber}: ${error.message}`);
      throw new InternalServerErrorException('Falha ao enviar o código OTP. Tente novamente.');
    }
  }

  // NOVO: Verifica o OTP e realiza o login/registro
  async verifyOtp(phoneNumber: string, otpCode: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { phone: phoneNumber } });

    if (!user) {
      throw new UnauthorizedException('Número de telefone não registrado.');
    }

    if (user.otpCode !== otpCode || user.otpExpiresAt < new Date()) {
      // Invalida o OTP em caso de falha para evitar reuso
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otpCode: null, otpExpiresAt: null },
      });
      throw new UnauthorizedException('Código OTP inválido ou expirado.');
    }

    // Invalida o OTP após uso bem-sucedido
    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiresAt: null, isPhoneVerified: true },
    });

    return this.login(user);
  }

  // NOVO: Login com número de telefone e senha
  async loginWithPhoneNumberAndPassword(phoneNumber: string, password: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { phone: phoneNumber } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Número de telefone ou senha inválidos.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Número de telefone ou senha inválidos.');
    }

    return this.login(user);
  }
}