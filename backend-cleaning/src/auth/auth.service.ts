import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { UserRole, User, Prisma, Client, Provider, Address, ProviderService, Service, Review, VerificationStatus, Booking } from '@prisma/client';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto';
import * as admin from 'firebase-admin';
import { ProvidersService, ProviderWithIncludes, ProviderWithCalculatedRating } from '../providers/providers.service';
import { ClientWithIncludes } from '../users/dto/user-profile.dto';
import { EmailService } from '../common/services/email.service';
import { GeocodingService } from '../common/services/geocoding.service';

// Tipo Auxiliar: UserWithAllRelations
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
            // CORREÇÃO: Removido ocrResult: true e livenessResult: true daqui
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

  async registerClient(registerClientDto: RegisterClientDto): Promise<AuthResponseDto> {
    const { email, password, fullName, phone, address } = registerClientDto;
    const { cep, street, number, neighborhood, city, state, complement } = address;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Este email já está cadastrado.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const geoCoordinates = await this.geocodingService.geocodeAddress(
        `${street}, ${number}, ${neighborhood}, ${city}, ${state}, ${cep}`
      );

      const newUser = await this.prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: UserRole.CLIENT,
          client: {
            create: {
              fullName,
              phone: phone ?? null,
              address: {
                create: {
                  cep,
                  street,
                  number,
                  neighborhood,
                  city,
                  state,
                  complement: complement ?? null,
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

      // Se geoCoordinates existirem, atualize o endereço com a localização
      if (geoCoordinates && newUser.client?.address?.id) {
        await this.prisma.address.update({
          where: { id: newUser.client.address.id },
          data: {
            location: `SRID=4326;POINT(${geoCoordinates.longitude} ${geoCoordinates.latitude})`,
          } as any, // Cast para any porque 'location' é um tipo Unsupported
        });
      }

      return this.login(newUser);
    } catch (error) {
      console.error('Erro ao registrar cliente:', error);
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
    } = registerProviderDto;
    const { cep, street, number, neighborhood, city, state, complement } = address;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Este email já está cadastrado.');
    }
    const existingProvider = await this.prisma.provider.findUnique({ where: { cpf } });
    if (existingProvider) {
      throw new ConflictException('Este CPF já está cadastrado.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const geoCoordinates = await this.geocodingService.geocodeAddress(
        `${street}, ${number}, ${neighborhood}, ${city}, ${state}, ${cep}`
      );

      const newUser = await this.prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: UserRole.PROVIDER,
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
                  cep,
                  street,
                  number,
                  neighborhood,
                  city,
                  state,
                  complement: complement ?? null,
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
              // CORREÇÃO: Removido ocrResult: true e livenessResult: true daqui
            }
          }
        }
      });

      // Se geoCoordinates existirem, atualize o endereço com a localização
      if (geoCoordinates && newUser.provider?.address?.id) {
        await this.prisma.address.update({
          where: { id: newUser.provider.address.id },
          data: {
            location: `SRID=4326;POINT(${geoCoordinates.longitude} ${geoCoordinates.latitude})`,
          } as any, // Cast para any porque 'location' é um tipo Unsupported
        });
      }

      return this.login(newUser);
    } catch (error) {
      console.error('Erro ao registrar provedor:', error);
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
        <p>Se você não solicitou uma redefinição de senha, por favor, ignore este e-mail.</p>
        <p>Atenciosamente,<br>Equipe Limpeja</p>
        `
      );
      this.logger.log(`Email de redefinição de senha enviado para ${email}`);
    } catch (emailError) {
      this.logger.error(`Falha ao enviar email de redefinição de senha para ${email}: ${emailError.message}`);
    }
  }

  async verifyFirebaseIdToken(idToken: string): Promise<AuthResponseDto> {
    try {
      this.logger.log('[AuthService] Verificando Firebase ID Token...');
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const firebaseUid = decodedToken.uid;
      const firebaseEmail = decodedToken.email;
      const firebasePhoneNumber = decodedToken.phone_number;

      // CORREÇÃO: Incluir client e provider nas consultas findUnique para garantir tipagem correta
      let user = await this.prisma.user.findUnique({
        where: { firebaseUid },
        include: { client: true, provider: true } // <--- CORREÇÃO AQUI
      });

      if (!user) {
        this.logger.log(`[AuthService] Usuário não encontrado para Firebase UID ${firebaseUid}. Tentando encontrar por email/telefone...`);
        if (firebaseEmail) {
          user = await this.prisma.user.findUnique({
            where: { email: firebaseEmail },
            include: { client: true, provider: true } // <--- CORREÇÃO AQUI
          });
        }
        if (!user && firebasePhoneNumber) {
          user = await this.prisma.user.findUnique({
            where: { phone: firebasePhoneNumber },
            include: { client: true, provider: true } // <--- CORREÇÃO AQUI
          });
        }

        if (user) {
          this.logger.log(`[AuthService] Usuário existente (${user.id}) encontrado por email/telefone. Atualizando com Firebase UID.`);
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { firebaseUid: firebaseUid },
            include: { client: true, provider: true } // <--- CORREÇÃO AQUI
          });
        } else {
          this.logger.log(`[AuthService] Criando novo usuário para Firebase UID ${firebaseUid}.`);
          const defaultRole = UserRole.CLIENT; 

          user = await this.prisma.user.create({
            data: {
              firebaseUid: firebaseUid,
              email: firebaseEmail || `${firebaseUid}@firebase.limpeja.com`,
              phone: firebasePhoneNumber,
              role: defaultRole,
              isPhoneVerified: !!firebasePhoneNumber,
            },
            include: { client: true, provider: true } // <--- CORREÇÃO AQUI
          });

          if (user.role === UserRole.CLIENT && !user.client) { // A verificação !user.client é mais segura agora
            await this.prisma.client.create({
              data: {
                userId: user.id,
                fullName: decodedToken.name || `Usuário ${firebasePhoneNumber || firebaseEmail || firebaseUid}`,
                phone: firebasePhoneNumber,
              },
            });
            // Após criar o cliente, recarregar o usuário para ter a relação populada
            user = await this.prisma.user.findUnique({
              where: { id: user.id },
              include: { client: true, provider: true }
            });
          }
        }
      }

      // CORREÇÃO: userToLogin agora pode ser simplesmente 'user', pois 'user' já está carregado com as relações necessárias.
      const userToLogin = user;

      if (!userToLogin) {
        throw new UnauthorizedException('Usuário não encontrado após processamento do Firebase Token.');
      }

      this.logger.log(`[AuthService] Login bem-sucedido para usuário Firebase UID: ${firebaseUid}`);
      return this.login(userToLogin);

    } catch (error) {
      this.logger.error(`[AuthService] Erro ao verificar Firebase ID Token: ${error.message}`, error.stack);
      throw new UnauthorizedException('ID Token inválido ou expirado.');
    }
  }
}