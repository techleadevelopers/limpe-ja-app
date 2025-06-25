import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
// Importar o novo enum VerificationStatus
import { UserRole, User, Prisma, Client, Provider, Address, ProviderService, Service, Review, VerificationStatus, Booking } from '@prisma/client';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto';

// =========================================================================
// Tipo Auxiliar: UserWithAllRelations - CORRIGIDO E ATUALIZADO
// =========================================================================
export type UserWithAllRelations = User & {
  client?: (Client & {
    user: User; // O user completo do cliente
    address: Address | null;
    bookings: Booking[]; // <--- ESSENCIAL: ADICIONADO bookings
    reviewsMade: Review[]; // <--- ESSENCIAL: ADICIONADO reviewsMade
    _count?: { bookings: number };
    createdAt: Date;
    updatedAt: Date;
  }) | null;
  provider?: (Provider & {
    user: User; // O user completo do provedor
    address: Address | null;
    providerServices: (ProviderService & { service: Service })[];
    // reviewReceived agora precisa ter o client completo para o DTO
    reviewsReceived: (Review & { client: Client & { user: User } })[];
    createdAt: Date;
    updatedAt: Date;
    verificationStatus: VerificationStatus; // Inclua verificationStatus
    documentPhotoFrontUrl: string | null;
    documentPhotoBackUrl: string | null;
    selfieWithDocumentUrl: string | null;
    backgroundCheckResult: Prisma.JsonValue | null;
    rejectionReason: string | null;
  }) | null;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
      include: { // Incluir TODAS as relações necessárias para o UserProfileDto
        client: {
          include: {
            user: true,
            address: true,
            bookings: true,    // <-- ADICIONADO: Incluir bookings para o Client
            reviewsMade: true, // <-- ADICIONADO: Incluir reviewsMade para o Client
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
            // REMOVIDO: Linhas que causavam erro porque são campos diretos, não relações:
            // verificationStatus: true,
            // documentPhotoFrontUrl: true,
            // documentPhotoBackUrl: true,
            // selfieWithDocumentUrl: true,
            // backgroundCheckResult: true,
            // rejectionReason: true,
          },
        },
      },
    }) as UserWithAllRelations;

    if (!fullUser) {
      throw new UnauthorizedException('Usuário não encontrado após validação.');
    }

    const payload = { email: fullUser.email, sub: fullUser.id, role: fullUser.role };
    const accessToken = this.jwtService.sign(payload);

    const userProfile = new UserProfileDto(fullUser);

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
              // REMOVIDO: Linhas que causavam erro porque são campos diretos, não relações:
              // verificationStatus: true,
              // documentPhotoFrontUrl: true,
              // documentPhotoBackUrl: true,
              // selfieWithDocumentUrl: true,
              // backgroundCheckResult: true,
              // rejectionReason: true,
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
  }
}