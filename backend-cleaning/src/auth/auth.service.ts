import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { UserRole, User, Prisma, Client, Provider, Address, ProviderService, Service, Review, VerificationStatus, Booking } from '@prisma/client';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto';

// Importar ProvidersService e seus tipos relevantes
import { ProvidersService, ProviderWithIncludes, ProviderWithCalculatedRating } from '../providers/providers.service';
// Importar ClientWithIncludes (assumindo que está em user-profile.dto.ts ou em um arquivo de tipos de cliente)
import { ClientWithIncludes } from '../users/dto/user-profile.dto'; // Ou o caminho correto onde ClientWithIncludes está definido

// =========================================================================
// Tipo Auxiliar: UserWithAllRelations
// Este tipo deve refletir EXATAMENTE o que o prisma.user.findUnique retorna com os includes.
// Ou seja, o 'provider' aqui será do tipo ProviderWithIncludes, não ProviderWithCalculatedRating.
// =========================================================================
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
  // O provedor aqui é do tipo ProviderWithIncludes, que é o que o Prisma retorna.
  // Ele será mapeado para ProviderWithCalculatedRating antes de ser passado para o DTO.
  provider?: ProviderWithIncludes | null;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private providersService: ProvidersService, // <-- ADICIONADO: Injetar ProvidersService
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
    // Incluir TODAS as relações necessárias para o UserWithAllRelations
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
    }) as UserWithAllRelations; // <-- O cast é para UserWithAllRelations, que agora tem ProviderWithIncludes

    if (!fullUser) {
      throw new UnauthorizedException('Usuário não encontrado após validação.');
    }

    const payload = { email: fullUser.email, sub: fullUser.id, role: fullUser.role };
    const accessToken = this.jwtService.sign(payload);

    // =====================================================================
    // CORREÇÃO CRÍTICA: Mapear o provedor para ProviderWithCalculatedRating
    // =====================================================================
    let mappedProvider: ProviderWithCalculatedRating | undefined;
    if (fullUser.provider) {
      // Usa o método do ProvidersService para converter o objeto ProviderWithIncludes
      // para ProviderWithCalculatedRating, que é o que UserProfileDto espera.
      mappedProvider = this.providersService.mapProviderToCalculatedRating(fullUser.provider);
    }

    // Cria um objeto que corresponde à estrutura esperada pelo construtor de UserProfileDto
    const userProfileDataForDto = {
      ...fullUser, // Copia as propriedades diretas do User (id, email, role, etc.)
      client: fullUser.client, // O cliente já está no formato ClientWithIncludes
      provider: mappedProvider, // Usa o provedor JÁ MAPEADO
    };

    // Assumindo que UserProfileDto.ts está configurado para aceitar esta estrutura
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
        // Incluir as relações necessárias para que o login() possa construir o UserProfileDto
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
        // Incluir as relações necessárias para que o login() possa construir o UserProfileDto
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
      return this.login(newUser);
    } catch (error) {
      console.error('Erro ao registrar provedor:', error);
      throw new BadRequestException('Não foi possível registrar o provedor. Verifique os dados e o console do servidor para mais detalhes.');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.warn(`Tentativa de redefinição de senha para email não encontrado: ${email}`);
      return;
    }
    console.log(`Simulação: Email de redefinição de senha enviado para ${email}`);
    // TODO: Implementar envio de email real com link de redefinição de senha
  }

  async requestOtp(phone: string): Promise<void> {
    // Gerar código OTP de 6 dígitos
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

    // Buscar ou criar usuário com este telefone
    let user = await this.prisma.user.findUnique({ where: { phone } });
    
    if (!user) {
      // Criar novo usuário se não existir
      user = await this.prisma.user.create({
        data: {
          phone,
          email: `${phone}@sms.limpeja.com`, // Email temporário
          role: UserRole.CLIENT,
          otpCode,
          otpExpiresAt: expiresAt,
          isPhoneVerified: false,
        },
      });
    } else {
      // Atualizar OTP para usuário existente
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode,
          otpExpiresAt: expiresAt,
        },
      });
    }

    console.log(`Simulação: SMS enviado para ${phone} com código: ${otpCode}`);
    // TODO: Implementar envio de SMS real
  }

  async verifyOtp(phone: string, otpCode: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { phone },
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
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new UnauthorizedException('Código OTP não solicitado.');
    }

    if (user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('Código OTP expirado.');
    }

    if (user.otpCode !== otpCode) {
      throw new UnauthorizedException('Código OTP inválido.');
    }

    // Marcar telefone como verificado e limpar OTP
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isPhoneVerified: true,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    // Criar cliente se não existir
    if (!user.client && user.role === UserRole.CLIENT) {
      await this.prisma.client.create({
        data: {
          userId: user.id,
          fullName: `Usuário ${phone}`,
          phone,
        },
      });
    }

    return this.login(user);
  }
}