// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { UserRole, User, Prisma, Client, Provider, Address, ProviderService, Service, Review, VerificationStatus, Booking } from '@prisma/client';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto';
import { ProvidersService, ProviderWithIncludes, ProviderWithCalculatedRating } from '../providers/providers.service';
import { ClientWithIncludes } from '../users/dto/user-profile.dto';
import { EmailService } from '../common/services/email.service';
import { GeocodingService } from '../common/services/geocoding.service';
import { SmsService } from '../sms/sms.service'; // NOVO: Importa o SmsService
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
  }) | null;
  provider?: ProviderWithIncludes | null; // Usar ProviderWithIncludes atualizado
};

// NOVO: Interface para o retorno do verifyOtp
interface VerifyOtpResponse extends AuthResponseDto {
  isNewUser: boolean;
}

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
          isPhoneVerified: !!phone, // Marca como verificado se o telefone foi fornecido no registro (ajustar se quiser forçar verificação por OTP)
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
          isPhoneVerified: !!phone, // Marca como verificado se o telefone foi fornecido no registro (ajustar se quiser forçar verificação por OTP)
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

  // NOVO: Verifica se o número de telefone existe e se tem senha
  async checkPhoneNumberExistence(phoneNumber: string): Promise<{ exists: boolean; hasPassword?: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { phone: phoneNumber } });
    return { exists: !!user, hasPassword: !!user?.passwordHash };
  }

  // NOVO: Envia OTP para o número de telefone usando Twilio Verify
  async sendOtp(phoneNumber: string): Promise<void> {
    this.logger.log(`[AuthService] Recebida solicitação para enviar OTP para: ${phoneNumber}`);

    // Formatar o número para E.164 se necessário. Ex: de 19993388983 para +5519993388983
    const formattedPhoneNumber = this.formatPhoneNumberToE164(phoneNumber);

    // Validação básica do número antes de enviar para o Twilio
    if (!formattedPhoneNumber || formattedPhoneNumber.length < 10) {
      throw new BadRequestException('Número de telefone inválido.');
    }

    try {
      // O Twilio Verify Service gera e envia o OTP. Não precisamos armazená-lo localmente.
      await this.smsService.startVerification(formattedPhoneNumber, 'sms');
      this.logger.log(`[AuthService] Solicitação de OTP enviada ao Twilio para ${formattedPhoneNumber}.`);
    } catch (error) {
      this.logger.error(`[AuthService] Falha ao iniciar verificação OTP para ${formattedPhoneNumber}: ${error.message}`, error.stack);
      // Erros do Twilio podem ser mais específicos, mas para o usuário final, uma mensagem genérica é melhor.
      throw new InternalServerErrorException('Falha ao enviar o código OTP. Tente novamente.');
    }
  }

  // NOVO: Verifica o OTP e realiza o login/registro usando Twilio Verify
  async verifyOtp(phoneNumber: string, otpCode: string): Promise<AuthResponseDto> {
    this.logger.log(`[AuthService] Recebida solicitação para verificar OTP para: ${phoneNumber} com código: ${otpCode}`);
    const formattedPhoneNumber = this.formatPhoneNumberToE164(phoneNumber);

    if (!formattedPhoneNumber || !otpCode || otpCode.length === 0) {
      throw new BadRequestException('Número de telefone ou código OTP inválido.');
    }

    try {
      // Verifica o OTP com o Twilio Verify Service
      const isVerified = await this.smsService.checkVerification(formattedPhoneNumber, otpCode);

      if (!isVerified) {
        throw new UnauthorizedException('Código OTP inválido ou expirado.');
      }

      let user = await this.prisma.user.findUnique({ where: { phone: formattedPhoneNumber } });
      let isNewUser = false; // Flag para indicar se o usuário é novo

      if (!user) {
        // Se o usuário não existe, crie um novo usuário com o número de telefone.
        // O `isPhoneVerified` é definido como true aqui, pois o OTP foi validado.
        user = await this.prisma.user.create({
          data: {
            phone: formattedPhoneNumber,
            role: UserRole.CLIENT, // Papel padrão para novos usuários via telefone
            isPhoneVerified: true, // Telefone verificado via OTP
            email: `temp_${Date.now()}@limpeja.com`, // Email placeholder, pode ser atualizado depois
            passwordHash: null, // Sem senha inicialmente, autenticado por OTP
          },
        });
        this.logger.log(`[AuthService] Novo usuário criado via OTP: ${formattedPhoneNumber}`);
        isNewUser = true; // Define como novo usuário
      } else {
        // Se o usuário existe, apenas atualize o status de verificação do telefone se ainda não estiver verificado
        if (!user.isPhoneVerified) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { isPhoneVerified: true },
          });
          user.isPhoneVerified = true; // Atualiza o objeto user em memória
        }
        this.logger.log(`[AuthService] Usuário existente logado via OTP: ${formattedPhoneNumber}`);
        isNewUser = false; // Define como usuário existente
      }

      // Gera a resposta de autenticação (token e perfil do usuário)
      const authResponse = await this.login(user); // Reutiliza a lógica de login existente

      // Retorna a AuthResponse junto com a flag isNewUser
      return {
        ...authResponse,
        isNewUser: isNewUser,
      };

    } catch (error) {
      this.logger.error(`[AuthService] Falha ao verificar OTP para ${formattedPhoneNumber}: ${error.message}`, error.stack);
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error; // Re-lança exceções específicas
      }
      throw new InternalServerErrorException('Falha na verificação do OTP. Por favor, tente novamente.');
    }
  }

  // NOVO: Login com número de telefone e senha
  async loginWithPhoneNumberAndPassword(phoneNumber: string, password: string): Promise<AuthResponseDto> {
    this.logger.log(`[AuthService] Tentando login com telefone e senha para: ${phoneNumber}`);
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

  // Função auxiliar para formatar o número de telefone para E.164
  private formatPhoneNumberToE164(phoneNumber: string): string {
    // Remove caracteres não numéricos
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Adiciona o código do país se não estiver presente.
    // Assumindo Brasil (+55) para números de 11 dígitos (DDD + 9 + 8 dígitos)
    // ou 10 dígitos (DDD + 8 dígitos)
    // Esta lógica pode precisar ser mais robusta dependendo dos países suportados
    if (cleaned.length === 11 && cleaned.startsWith('1')) { // Ex: 11999999999
      return `+55${cleaned}`;
    }
    if (cleaned.length === 10 && cleaned.startsWith('1')) { // Ex: 1188888888
      return `+55${cleaned}`;
    }
    // Se já começar com +, assume que está no formato correto
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    // Caso contrário, tenta adicionar o +55 se for um número brasileiro sem o 9 inicial (antigo formato)
    // ou se for um número com DDD e 9 dígitos (novo padrão)
    if (cleaned.length >= 10 && cleaned.length <= 11) { // Ex: 11999999999 ou 1133333333
        // Heurística simples: se não tem + e parece um número local, adiciona +55
        return `+55${cleaned}`;
    }

    // Retorna o número limpo se nenhuma regra se aplicar (pode ser um número internacional já formatado ou inválido)
    // Ou você pode lançar um erro se o formato não for reconhecido como E.164
    return cleaned;
  }
}