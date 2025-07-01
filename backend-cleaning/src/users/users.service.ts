// src/users/users.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
// Importe todos os modelos necessários
import { User, UserRole, Client, Provider, Prisma, Address, ProviderService, Service, Review, Booking, VerificationStatus } from '@prisma/client';
// Não precisa importar UserProfileDto aqui se ele não for usado para instanciar (apenas para tipagem)
// import { UserProfileDto } from './dto/user-profile.dto';

// =========================================================================
// Tipo Auxiliar: UserWithAllRelations - CORRIGIDO E ATUALIZADO
// =========================================================================
export type UserWithAllRelations = User & {
  client?: (Client & {
    user: User; // O user completo do cliente
    address: Address | null;
    bookings: Booking[]; // <--- ESSENCIAL: ADICIONADO bookings
    reviewsMade: Review[]; // <--- ESSENCIAL: ADICIONADO reviewsMade
    _count?: { bookings: number }; // <--- CORREÇÃO AQUI: de 'true' para 'number'
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
    // Campos diretos do Provider que são importantes para o tipo
    verificationStatus: VerificationStatus;
    documentPhotoFrontUrl: string | null;
    documentPhotoBackUrl: string | null;
    selfieWithDocumentUrl: string | null;
    backgroundCheckResult: Prisma.JsonValue | null;
    rejectionReason: string | null;
    pixKey: string | null;
  }) | null;
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string): Promise<UserWithAllRelations | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            user: true, // Garante User completo para clientDetails
            address: true,
            bookings: true, // <--- ADICIONADO: Incluir bookings para o Client
            reviewsMade: true, // <--- ADICIONADO: Incluir reviewsMade para o Client
            _count: {
              select: { bookings: true }
            }
          }
        },
        provider: {
          include: {
            user: true, // Garante User completo para providerDetails
            address: true,
            providerServices: {
              include: {
                service: true
              }
            },
            reviewsReceived: {
              include: {
                client: {
                  // MUDADO: Selecionar o client completo e seu user aninhado para o DTO
                  include: { user: true }
                }
              }
            },
          }
        },
      },
    });
    return user as UserWithAllRelations | null;
  }

  async findByEmail(email: string): Promise<UserWithAllRelations | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      // MUDADO: Incluir todas as relações necessárias para o UserProfileDto
      include: {
        client: {
          include: {
            user: true,
            address: true,
            bookings: true, // <--- ADICIONADO: Incluir bookings para o Client
            reviewsMade: true, // <--- ADICIONADO: Incluir reviewsMade para o Client
            _count: {
              select: { bookings: true }
            }
          }
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
          }
        },
      },
    });
    return user as UserWithAllRelations | null;
  }


  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserWithAllRelations | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        email: updateUserDto.email,
        // Adicione outros campos do User aqui se UpdateUserDto os contiver
        // avatarUrl: updateUserDto.avatarUrl, // Se o DTO permitir atualizar o avatarUrl do user
        // passwordHash: updateUserDto.password ? await bcrypt.hash(updateUserDto.password, 10) : undefined,
      },
      include: { // Incluir TODAS as relações necessárias para o UserProfileDto
        client: {
          include: {
            user: true,
            address: true,
            bookings: true, // <--- ADICIONADO: Incluir bookings para o Client
            reviewsMade: true, // <--- ADICIONADO: Incluir reviewsMade para o Client
            _count: {
              select: { bookings: true }
            }
          }
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
          }
        },
      },
    });

    return updatedUser as UserWithAllRelations;
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(`Não foi possível deletar o usuário com ID "${id}" devido a dados relacionados. Verifique as configurações de onDelete no seu schema.`);
      }
      throw error;
    }
  }
}