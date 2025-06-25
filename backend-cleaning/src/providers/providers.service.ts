// src/providers/providers.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common'; // <-- Adicionado 'Logger' aqui
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Provider, User, UserRole, Address, ProviderService, Service, Review, Client, VerificationStatus } from '@prisma/client';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { ProviderSearchDto } from './dto/provider-search.dto';
import { SortByOption } from '../search/dto/search-query.dto';

// =========================================================================
// Tipos Auxiliares Refinados
// =========================================================================

// ATUALIZADO: reviewsReceived agora inclui o ID do cliente e o User do cliente (com avatarUrl)
export type ProviderWithIncludes = Provider & {
  user: {
    email: string;
    role: UserRole;
  };
  address: Address | null;
  providerServices: (ProviderService & { service: Service })[];
  // === INÍCIO DA MUDANÇA NA TIPAGEM reviewsReceived ===
  reviewsReceived: (Review & { client: (Client & { user: { id: string; avatarUrl: string | null } }) })[];
  // === FIM DA MUDANÇA NA TIPAGEM reviewsReceived ===
  createdAt: Date;
  updatedAt: Date;
  verificationStatus: VerificationStatus;
};

export type ProviderWithCalculatedRating = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  bio: string | null;
  verificationStatus: VerificationStatus;
  address: Address | null;
  providerServices: (ProviderService & { service: Service })[];
  averageRating: number;
  reviewCount: number;
  yearsOfExperience: number | null;
  cpf: string;
  dateOfBirth: string | null;
  createdAt: string; // Esperado como string ISO
  updatedAt: string; // Esperado como string ISO
  pixKey: string | null;
};

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name); // <-- NOVO: Instanciar Logger

  constructor(private prisma: PrismaService) {}

  async findOne(id: string): Promise<ProviderWithIncludes | null> {
    this.logger.log(`[ProvidersService] findOne: Buscando provedor por ID: ${id}`); // Log
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, role: true } },
        address: true,
        providerServices: { include: { service: true } },
        // === INÍCIO DA MUDANÇA NA CONSULTA reviewsReceived ===
        reviewsReceived: { 
          include: { 
            client: { 
              include: { 
                user: { select: { id: true, avatarUrl: true } } // Inclui o ID e avatarUrl do User do Client
              } 
            } 
          } 
        },
        // === FIM DA MUDANÇA NA CONSULTA reviewsReceived ===
      },
    });
    this.logger.log(`[ProvidersService] findOne: Resultado para ID ${id}: ${provider ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`); // Log
    // O cast `as ProviderWithIncludes | null` é necessário porque o TypeScript
    // precisa da confirmação de que a estrutura resultante corresponde ao tipo.
    return provider as ProviderWithIncludes | null;
  }

  async findByUserId(userId: string): Promise<ProviderWithIncludes | null> {
    this.logger.log(`[ProvidersService] findByUserId: Buscando provedor para userId: ${userId}`); // <-- NOVO LOG A
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, role: true } },
        address: true,
        providerServices: { include: { service: true } },
        // === INÍCIO DA MUDANÇA NA CONSULTA reviewsReceived ===
        reviewsReceived: { 
          include: { 
            client: { 
              include: { 
                user: { select: { id: true, avatarUrl: true } } 
              } 
            } 
          } 
        },
        // === FIM DA MUDANÇA NA CONSULTA reviewsReceived ===
      },
    });
    this.logger.log(`[ProvidersService] findByUserId: Resultado para userId ${userId}: ${provider ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`); // <-- NOVO LOG B
    if (provider) {
      this.logger.log(`[ProvidersService] Provedor Encontrado: ID=${provider.id}, FullName=${provider.fullName}, Email=${provider.user?.email}`); // <-- NOVO LOG C
    }
    return provider as ProviderWithIncludes | null;
  }

  async updateByUserId(userId: string, data: UpdateProviderProfileDto): Promise<ProviderWithIncludes | null> {
    this.logger.log(`[ProvidersService] updateByUserId: Tentando atualizar provedor para userId: ${userId}`); // Log
    const provider = await this.prisma.provider.findUnique({ where: { userId } });

    if (!provider) {
      this.logger.warn(`[ProvidersService] updateByUserId: Provedor com userId ${userId} não encontrado para atualização.`); // Log
      return null;
    }

    const updateData: Prisma.ProviderUpdateInput = {
      fullName: data.fullName,
      cpf: data.cpf,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      phone: data.phone,
      avatarUrl: data.avatarUrl,
      yearsOfExperience: data.yearsOfExperience,
      bio: data.bio,
    };

    if (data.address) {
      updateData.address = {
        upsert: {
          create: data.address,
          update: data.address,
        },
      };
    }

    const updatedProvider = await this.prisma.provider.update({
      where: { userId },
      data: updateData,
      include: {
        user: { select: { email: true, role: true } },
        address: true,
        providerServices: { include: { service: true } },
        // === INÍCIO DA MUDANÇA NA CONSULTA reviewsReceived ===
        reviewsReceived: { 
          include: { 
            client: { 
              include: { 
                user: { select: { id: true, avatarUrl: true } } 
              } 
            } 
          } 
        },
        // === FIM DA MUDANÇA NA CONSULTA reviewsReceived ===
      },
    });
    this.logger.log(`[ProvidersService] updateByUserId: Provedor com userId ${userId} atualizado com sucesso.`); // Log
    return updatedProvider as ProviderWithIncludes;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`[ProvidersService] remove: Tentando remover provedor com ID: ${id}`); // Log
    const provider = await this.prisma.provider.findUnique({ where: { id } });
    if (!provider) {
      this.logger.warn(`[ProvidersService] remove: Provedor com ID "${id}" não encontrado.`); // Log
      throw new NotFoundException(`Provedor com ID "${id}" não encontrado.`);
    }
    await this.prisma.provider.delete({ where: { id } });
    this.logger.log(`[ProvidersService] remove: Provedor com ID ${id} removido com sucesso.`); // Log
  }

  async search(searchDto: ProviderSearchDto): Promise<ProviderWithCalculatedRating[]> {
    this.logger.log(`[ProvidersService] search: Iniciando busca de provedores com termo: ${searchDto.searchTerm || 'N/A'}`); // Log
    const { searchTerm, serviceId, location, minRating, limit, offset, sortBy } = searchDto;

    const where: Prisma.ProviderWhereInput = {
      verificationStatus: VerificationStatus.APPROVED,
    };

    if (searchTerm) {
      where.OR = [
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
        { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
        { providerServices: { some: { service: { name: { contains: searchTerm, mode: 'insensitive' } } } }, },
        { bio: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (serviceId) {
      where.providerServices = {
        some: {
          serviceId: serviceId,
        },
      };
    }

    if (location) {
      where.address = {
        OR: [
          { city: { contains: location, mode: 'insensitive' } },
          { state: { contains: location, mode: 'insensitive' } },
          { street: { contains: location, mode: 'insensitive' } },
          { neighborhood: { contains: location, mode: 'insensitive' } },
        ],
      };
    }

    const providers = await this.prisma.provider.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' } as Prisma.ProviderOrderByWithRelationInput,
      // === INÍCIO DA MUDANÇA NA CONSULTA reviewsReceived ===
      include: {
        user: { select: { email: true, role: true } },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: { // Agora inclui tudo o que a tipagem ProviderWithIncludes espera
          include: {
            client: {
              include: {
                user: { select: { id: true, avatarUrl: true } }
              }
            }
          }
        }
      },
      // === FIM DA MUDANÇA NA CONSULTA reviewsReceived ===
    }) as ProviderWithIncludes[]; // O cast aqui agora está correto com a nova tipagem

    this.logger.log(`[ProvidersService] search: Encontrados ${providers.length} provedores após query.`); // Log

    const providersWithCalculatedRating: ProviderWithCalculatedRating[] = providers.map(provider => {
      const totalRating = provider.reviewsReceived?.reduce((sum, review) => sum + review.rating, 0) || 0;
      const averageRating = provider.reviewsReceived?.length > 0
        ? parseFloat((totalRating / provider.reviewsReceived.length).toFixed(1))
        : 0;

      let formattedDateOfBirth: string | null = null;
      if (provider.dateOfBirth) {
        if (typeof provider.dateOfBirth === 'string') {
          formattedDateOfBirth = provider.dateOfBirth;
        } else if (provider.dateOfBirth instanceof Date) {
          formattedDateOfBirth = provider.dateOfBirth.toISOString();
        }
      }

      let formattedCreatedAt: string;
      if (provider.createdAt instanceof Date) {
        formattedCreatedAt = provider.createdAt.toISOString();
      } else if (typeof provider.createdAt === 'string') {
        formattedCreatedAt = provider.createdAt;
      } else {
        formattedCreatedAt = new Date().toISOString(); // Fallback seguro
      }

      let formattedUpdatedAt: string;
      if (provider.updatedAt instanceof Date) {
        formattedUpdatedAt = provider.updatedAt.toISOString();
      } else if (typeof provider.updatedAt === 'string') {
        formattedUpdatedAt = provider.updatedAt; // <-- CORREÇÃO AQUI
      } else {
        formattedUpdatedAt = new Date().toISOString(); // Fallback seguro
      }

      return {
        id: provider.id,
        fullName: provider.fullName,
        email: provider.user?.email || '',
        avatarUrl: provider.avatarUrl || null,
        phone: provider.phone || null,
        bio: provider.bio || null,
        verificationStatus: provider.verificationStatus,
        address: provider.address,
        providerServices: provider.providerServices,
        averageRating: averageRating,
        reviewCount: provider.reviewsReceived?.length || 0,
        yearsOfExperience: provider.yearsOfExperience || null,
        cpf: provider.cpf,
        dateOfBirth: formattedDateOfBirth,
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
        pixKey: provider.pixKey || null,
      };
    });

    let filteredProviders = providersWithCalculatedRating;

    if (minRating) {
      filteredProviders = filteredProviders.filter(p => p.averageRating >= minRating);
    }

    if (sortBy === SortByOption.Rating) {
      filteredProviders.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sortBy === SortByOption.Experience) {
      filteredProviders.sort((a, b) => (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0));
    }

    return filteredProviders;
  }

  async findTopRatedOrExperiencedProviders(): Promise<ProviderWithCalculatedRating[]> {
    this.logger.log('[ProvidersService] findTopRatedOrExperiencedProviders: Buscando provedores mais bem avaliados/experientes.'); // Log
    const providers = await this.prisma.provider.findMany({
      where: {
        verificationStatus: VerificationStatus.APPROVED,
      },
      // === INÍCIO DA MUDANÇA NA CONSULTA reviewsReceived ===
      include: {
        user: { select: { email: true, role: true } },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: { // Agora inclui tudo o que a tipagem ProviderWithIncludes espera
          include: {
            client: {
              include: {
                user: { select: { id: true, avatarUrl: true } }
              }
            }
          }
        }
      },
      // === FIM DA MUDANÇA NA CONSULTA reviewsReceived ===
      orderBy: {
        yearsOfExperience: 'desc',
      },
      take: 5
    }) as ProviderWithIncludes[];
    this.logger.log(`[ProvidersService] findTopRatedOrExperiencedProviders: Encontrados ${providers.length} provedores.`); // Log

    const providersWithCalculatedRating: ProviderWithCalculatedRating[] = providers.map(provider => {
      const totalRating = provider.reviewsReceived?.reduce((sum, review) => sum + review.rating, 0) || 0;
      const averageRating = provider.reviewsReceived?.length > 0
        ? parseFloat((totalRating / provider.reviewsReceived.length).toFixed(1))
        : 0;

      let formattedDateOfBirth: string | null = null;
      if (provider.dateOfBirth) {
        if (typeof provider.dateOfBirth === 'string') {
          formattedDateOfBirth = provider.dateOfBirth;
        } else if (provider.dateOfBirth instanceof Date) {
          formattedDateOfBirth = provider.dateOfBirth.toISOString();
        }
      }

      let formattedCreatedAt: string;
      if (provider.createdAt instanceof Date) {
        formattedCreatedAt = provider.createdAt.toISOString();
      } else if (typeof provider.createdAt === 'string') {
        formattedCreatedAt = provider.createdAt;
      } else {
        formattedCreatedAt = new Date().toISOString(); // Fallback seguro
      }

      let formattedUpdatedAt: string;
      if (provider.updatedAt instanceof Date) {
        formattedUpdatedAt = provider.updatedAt.toISOString();
      } else if (typeof provider.updatedAt === 'string') {
        formattedUpdatedAt = provider.updatedAt;
      } else {
        formattedUpdatedAt = new Date().toISOString(); // Fallback seguro
      }

      return {
        id: provider.id,
        fullName: provider.fullName,
        email: provider.user?.email || '',
        avatarUrl: provider.avatarUrl || null,
        phone: provider.phone || null,
        bio: provider.bio || null,
        verificationStatus: provider.verificationStatus,
        address: provider.address,
        providerServices: provider.providerServices,
        averageRating: averageRating,
        reviewCount: provider.reviewsReceived?.length || 0,
        yearsOfExperience: provider.yearsOfExperience || null,
        cpf: provider.cpf,
        dateOfBirth: formattedDateOfBirth,
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
        pixKey: provider.pixKey || null,
      };
    });

    return providersWithCalculatedRating;
  }

  async findAllProviders(params?: { limit?: number; offset?: number; search?: string; serviceId?: string }): Promise<ProviderWithCalculatedRating[]> {
    this.logger.log(`[ProvidersService] findAllProviders: Buscando todos os provedores com params: ${JSON.stringify(params)}`); // Log
    const { limit, offset, search, serviceId } = params || {};
    const where: Prisma.ProviderWhereInput = {
      verificationStatus: VerificationStatus.APPROVED,
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (serviceId) {
      where.providerServices = {
        some: {
          serviceId: serviceId
        }
      };
    }

    const providers = await this.prisma.provider.findMany({
      where,
      // === INÍCIO DA MUDANÇA NA CONSULTA reviewsReceived ===
      include: {
        user: { select: { email: true, role: true } },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: { // Agora inclui tudo o que a tipagem ProviderWithIncludes espera
          include: {
            client: {
              include: {
                user: { select: { id: true, avatarUrl: true } }
              }
            }
          }
        }
      },
      // === FIM DA MUDANÇA NA CONSULTA reviewsReceived ===
      take: limit,
      skip: offset,
      orderBy: {
        fullName: 'asc',
      }
    }) as ProviderWithIncludes[];
    this.logger.log(`[ProvidersService] findAllProviders: Encontrados ${providers.length} provedores após filtro.`); // Log

    const providersWithCalculatedRating: ProviderWithCalculatedRating[] = providers.map(provider => {
      const totalRating = provider.reviewsReceived?.reduce((sum, review) => sum + review.rating, 0) || 0;
      const averageRating = provider.reviewsReceived?.length > 0
        ? parseFloat((totalRating / provider.reviewsReceived.length).toFixed(1))
        : 0;

      let formattedDateOfBirth: string | null = null;
      if (provider.dateOfBirth) {
        if (typeof provider.dateOfBirth === 'string') {
          formattedDateOfBirth = provider.dateOfBirth;
        } else if (provider.dateOfBirth instanceof Date) {
          formattedDateOfBirth = provider.dateOfBirth.toISOString();
        }
      }

      let formattedCreatedAt: string;
      if (provider.createdAt instanceof Date) {
        formattedCreatedAt = provider.createdAt.toISOString();
      } else if (typeof provider.createdAt === 'string') {
        formattedCreatedAt = provider.createdAt;
      } else {
        formattedCreatedAt = new Date().toISOString(); // Fallback seguro
      }

      let formattedUpdatedAt: string;
      if (provider.updatedAt instanceof Date) {
        formattedUpdatedAt = provider.updatedAt.toISOString();
      } else if (typeof provider.updatedAt === 'string') {
        formattedUpdatedAt = provider.updatedAt; // <-- CORREÇÃO AQUI
      } else {
        formattedUpdatedAt = new Date().toISOString(); // Fallback seguro
      }

      return {
        id: provider.id,
        fullName: provider.fullName,
        email: provider.user?.email || '',
        avatarUrl: provider.avatarUrl || null,
        phone: provider.phone || null,
        bio: provider.bio || null,
        verificationStatus: provider.verificationStatus,
        address: provider.address,
        providerServices: provider.providerServices,
        averageRating: averageRating,
        reviewCount: provider.reviewsReceived?.length || 0,
        yearsOfExperience: provider.yearsOfExperience || null,
        cpf: provider.cpf,
        dateOfBirth: formattedDateOfBirth,
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
        pixKey: provider.pixKey || null,
      };
    });

    return providersWithCalculatedRating;
  }
}