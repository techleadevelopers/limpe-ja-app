// src/providers/providers.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Provider, User, UserRole, Address, ProviderService, Service, Review, Client, VerificationStatus } from '@prisma/client';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { ProviderSearchDto } from './dto/provider-search.dto';
import { SortByOption } from '../search/dto/search-query.dto';

// =========================================================================
// Tipos Auxiliares Refinados
// =========================================================================

export type ProviderWithIncludes = Prisma.ProviderGetPayload<{
  include: {
    user: { select: { email: true, role: true } };
    address: true;
    providerServices: { include: { service: true } };
    reviewsReceived: {
      include: {
        client: {
          include: {
            user: { select: { id: true, avatarUrl: true } }
          }
        }
      }
    };
    // REMOVIDO: ocrResult: true; livenessResult: true; (campos escalares não vão em 'include')
  };
}>;

export type ServiceForFrontend = Omit<Service, 'price' | 'createdAt' | 'updatedAt'> & {
  price: number;
  createdAt: string;
  updatedAt: string;
};

export type ProviderServiceForFrontend = Omit<ProviderService, 'price' | 'service' | 'createdAt' | 'updatedAt'> & {
  price: number;
  service: ServiceForFrontend;
  createdAt: string;
  updatedAt: string;
};

export type ProviderWithCalculatedRating = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  bio: string | null;
  verificationStatus: VerificationStatus;
  address: Address | null;
  providerServices: ProviderServiceForFrontend[];
  averageRating: number;
  reviewCount: number;
  yearsOfExperience: number | null;
  cpf: string | null;
  dateOfBirth: string | null;
  createdAt: string;
  updatedAt: string;
  pixKey: string | null;
  distance?: number;
  documentPhotoFrontUrl?: string | null;
  documentPhotoBackUrl?: string | null;
  selfieWithDocumentUrl?: string | null;
  backgroundCheckResult?: Prisma.JsonValue | null;
  rejectionReason?: string | null;
  // ADICIONADO: Novos campos do schema.prisma (estes são propriedades diretas do modelo)
  ocrResult: Prisma.JsonValue | null;
  livenessResult: Prisma.JsonValue | null;
};

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);

  constructor(private prisma: PrismaService) {}

  public mapProviderToCalculatedRating(provider: ProviderWithIncludes, distance?: number): ProviderWithCalculatedRating {
    const totalRating = provider.reviewsReceived?.reduce((sum, review) => sum + review.rating, 0) || 0;
    const averageRating = provider.reviewsReceived?.length > 0
      ? parseFloat((totalRating / provider.reviewsReceived.length).toFixed(1))
      : 0;

    const formattedDateOfBirth = provider.dateOfBirth ? provider.dateOfBirth.toISOString() : null;
    const formattedCreatedAt = provider.createdAt.toISOString();
    const formattedUpdatedAt = provider.updatedAt.toISOString();

    return {
      id: provider.id,
      userId: provider.userId,
      fullName: provider.fullName,
      email: provider.user?.email || '',
      avatarUrl: provider.avatarUrl || null,
      phone: provider.phone || null,
      bio: provider.bio || null,
      verificationStatus: provider.verificationStatus,
      address: provider.address,
      providerServices: provider.providerServices.map(ps => ({
        id: ps.id,
        providerId: ps.providerId,
        serviceId: ps.serviceId,
        price: ps.price.toNumber(),
        durationMinutes: ps.durationMinutes,
        description: ps.description,
        service: {
          id: ps.service.id,
          name: ps.service.name,
          description: ps.service.description,
          icon: ps.service.icon,
          price: ps.service.price.toNumber(),
          createdAt: ps.service.createdAt.toISOString(),
          updatedAt: ps.service.updatedAt.toISOString(),
        },
        createdAt: ps.createdAt.toISOString(),
        updatedAt: ps.updatedAt.toISOString(),
      })) as ProviderServiceForFrontend[],
      averageRating: averageRating,
      reviewCount: provider.reviewsReceived?.length || 0,
      yearsOfExperience: provider.yearsOfExperience || null,
      cpf: provider.cpf,
      dateOfBirth: formattedDateOfBirth,
      createdAt: formattedCreatedAt,
      updatedAt: formattedUpdatedAt,
      pixKey: provider.pixKey || null,
      distance: distance,
      documentPhotoFrontUrl: provider.documentPhotoFrontUrl,
      documentPhotoBackUrl: provider.documentPhotoBackUrl,
      selfieWithDocumentUrl: provider.selfieWithDocumentUrl,
      backgroundCheckResult: provider.backgroundCheckResult,
      rejectionReason: provider.rejectionReason,
      // ADICIONADO: Novos campos mapeados (estão no ProviderWithIncludes base)
      ocrResult: provider.ocrResult,
      livenessResult: provider.livenessResult,
    };
  }

  async findOne(id: string): Promise<ProviderWithCalculatedRating | null> {
    this.logger.log(`[ProvidersService] findOne: Buscando provedor por ID: ${id}`);
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, role: true } },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: {
          include: {
            client: {
              include: {
                user: { select: { id: true, avatarUrl: true } }
              }
            }
          }
        },
        // CORREÇÃO: Removido ocrResult: true e livenessResult: true daqui
      },
    });

    this.logger.log(`[ProvidersService] findOne: Resultado para ID ${id}: ${provider ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
    if (provider) {
      return this.mapProviderToCalculatedRating(provider as ProviderWithIncludes); 
    }
    return null;
  }

  async findByUserId(userId: string): Promise<ProviderWithCalculatedRating | null> {
    this.logger.log(`[ProvidersService] findByUserId: Buscando provedor para userId: ${userId}`);
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, role: true } },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: {
          include: {
            client: {
              include: {
                user: { select: { id: true, avatarUrl: true } }
              }
            }
          }
        },
        // CORREÇÃO: Removido ocrResult: true e livenessResult: true daqui
      },
    });
    if (provider) {
        return this.mapProviderToCalculatedRating(provider as ProviderWithIncludes);
    }
    return null;
  }

  async updateByUserId(userId: string, data: UpdateProviderProfileDto): Promise<ProviderWithCalculatedRating | null> {
    this.logger.log(`[ProvidersService] updateByUserId: Tentando atualizar provedor para userId: ${userId}`);
    const provider = await this.prisma.provider.findUnique({ where: { userId } });

    if (!provider) {
      this.logger.warn(`[ProvidersService] updateByUserId: Provedor com userId ${userId} não encontrado para atualização.`);
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
      // CORREÇÃO: Removido a tentativa de incluir ocrResult e livenessResult no DTO de update
      // ocrResult: data.ocrResult, // Assumindo que você adicionaria isso no DTO se fosse editável
      // livenessResult: data.livenessResult, // Assumindo que você adicionaria isso no DTO se fosse editável
    };

    if (data.address) {
      updateData.address = {
        upsert: {
          create: data.address,
          update: data.address,
        },
      };
      // TODO: Adicionar lógica para geocodificar o endereço (CEP, rua, etc.)
      // e preencher o campo `location` do PostGIS (address.location).
      // Isso pode envolver uma chamada a um serviço de geocodificação externo
      // ou uma função utilitária que use bibliotecas para converter endereço em coordenadas.
      // Exemplo conceitual:
      // const geoData = await this.geocodingService.geocodeAddress(data.address);
      // if (geoData) {
      //   updateData.address.upsert.update.location = `ST_SetSRID(ST_MakePoint(${geoData.longitude}, ${geoData.latitude}), 4326)`;
      //   updateData.address.upsert.create.location = `ST_SetSRID(ST_MakePoint(${geoData.longitude}, ${geoData.latitude}), 4326)`;
      // }
    }

    const updatedProvider = await this.prisma.provider.update({
      where: { userId },
      data: updateData,
      include: {
        user: { select: { email: true, role: true } },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: {
          include: {
            client: {
              include: {
                user: { select: { id: true, avatarUrl: true } }
              }
            }
          }
        },
        // CORREÇÃO: Removido ocrResult: true e livenessResult: true daqui
      },
    });

    this.logger.log(`[ProvidersService] updateByUserId: Provedor com userId ${userId} atualizado com sucesso.`);
    if (updatedProvider) {
      return this.mapProviderToCalculatedRating(updatedProvider as ProviderWithIncludes);
    }
    return null;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`[ProvidersService] remove: Tentando remover provedor com ID: ${id}`);
    const provider = await this.prisma.provider.findUnique({ where: { id } });
    if (!provider) {
      this.logger.warn(`[ProvidersService] remove: Provedor com ID "${id}" não encontrado.`);
      throw new NotFoundException(`Provedor com ID "${id}" não encontrado.`);
    }
    await this.prisma.provider.delete({ where: { id } });
    this.logger.log(`[ProvidersService] remove: Provedor com ID ${id} removido com sucesso.`);
  }

  async search(searchDto: ProviderSearchDto): Promise<ProviderWithCalculatedRating[]> {
    this.logger.log(`[ProvidersService] search: Iniciando busca com DTO: ${JSON.stringify(searchDto)}`);
    const {
      searchTerm,
      serviceId,
      location,
      minRating,
      limit,
      offset,
      sortBy,
      latitude,
      longitude,
      radius
    } = searchDto;

    const where: Prisma.ProviderWhereInput = {
      verificationStatus: VerificationStatus.APPROVED,
    };

    if (searchTerm) {
      where.OR = [
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
        { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
        { bio: { contains: searchTerm, mode: 'insensitive' } },
        { providerServices: { some: { service: { name: { contains: searchTerm, mode: 'insensitive' } } } } },
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

    let providersWithDistance: ProviderWithCalculatedRating[] = [];

    if (latitude !== undefined && longitude !== undefined && radius !== undefined) {
      this.logger.log(`[ProvidersService] search: Aplicando busca geoespacial com lat=${latitude}, lon=${longitude}, radius=${radius}km`);

      try {
        const rawProviders: any[] = await this.prisma.$queryRaw(Prisma.sql`
            SELECT
              p.id,
              p."userId",
              p."fullName",
              p.phone,
              p.bio,
              p."yearsOfExperience",
              p.cpf,
              p."dateOfBirth",
              p."avatarUrl",
              p."verificationStatus",
              p."pixKey",
              p."createdAt",
              p."updatedAt",
              p."documentPhotoFrontUrl",
              p."documentPhotoBackUrl",
              p."selfieWithDocumentUrl",
              p."backgroundCheckResult",
              p."rejectionReason",
              p."ocrResult",     -- ADICIONADO: Novo campo na query RAW
              p."livenessResult", -- ADICIONADO: Novo campo na query RAW
              u.email,
              u.role,
              a.id AS "addressId",
              a.cep,
              a.street,
              a.number,
              a.complement,
              a.neighborhood,
              a.city,
              a.state,
              a."providerId",
              ST_DistanceSphere(
                  a.location,
                  ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
              ) / 1000 AS distance_km,
              COALESCE(AVG(r.rating), 0)::numeric AS "averageRating",
              COUNT(r.id)::int AS "reviewCount",
              json_agg(
                  json_build_object(
                      'id', ps.id,
                      'providerId', ps."providerId",
                      'serviceId', ps."serviceId",
                      'price', ps.price,
                      'durationMinutes', ps."durationMinutes",
                      'createdAt', ps."createdAt",
                      'updatedAt', ps."updatedAt",
                      'description', ps.description,
                      'service', json_build_object(
                          'id', s.id,
                          'name', s.name,
                          'description', s.description,
                          'icon', s.icon,
                          'price', s.price,
                          'createdAt', s."createdAt",
                          'updatedAt', s."updatedAt"
                      )
                  )
                  ORDER BY ps.id
              ) FILTER (WHERE ps.id IS NOT NULL) AS "providerServicesAgg"
            FROM
                "Provider" p
            JOIN
                "User" u ON p."userId" = u.id
            LEFT JOIN
                "Address" a ON p.id = a."providerId"
            LEFT JOIN
                "ProviderService" ps ON p.id = ps."providerId"
            LEFT JOIN
                "Service" s ON ps."serviceId" = s.id
            LEFT JOIN
                "Review" r ON p.id = r."providerId"
            WHERE
                p."verificationStatus" = ${Prisma.raw(VerificationStatus.APPROVED)} AND
                a.location IS NOT NULL AND
                ST_DWithin(a.location, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326), ${radius * 1000})
                ${searchTerm ? Prisma.sql`AND (p."fullName" ILIKE ${'%' + searchTerm + '%'} OR u.email ILIKE ${'%' + searchTerm + '%'} OR p.bio ILIKE ${'%' + searchTerm + '%'} OR s.name ILIKE ${'%' + searchTerm + '%'})` : Prisma.empty}
                ${serviceId ? Prisma.sql`AND ps."serviceId" = ${serviceId}` : Prisma.empty}
                ${location ? Prisma.sql`AND (a.city ILIKE ${'%' + location + '%'} OR a.state ILIKE ${'%' + location + '%'} OR a.street ILIKE ${'%' + location + '%'} OR a.neighborhood ILIKE ${'%' + location + '%'})` : Prisma.empty}
            GROUP BY
                p.id, u.email, u.role, a.id, a.cep, a.street, a.number, a.complement, a.neighborhood, a.city, a.state, a."providerId", a.location
            ORDER BY
                distance_km ASC
            LIMIT ${limit || 10} OFFSET ${offset || 0};
        `);

providersWithDistance = rawProviders.map((rp: any) => {
            const providerWithIncludes: ProviderWithIncludes = {
                id: rp.id,
                userId: rp.userId,
                fullName: rp.fullName,
                cpf: rp.cpf,
                dateOfBirth: rp.dateOfBirth, // dateOfBirth from raw query will be a Date object
                phone: rp.phone,
                yearsOfExperience: rp.yearsOfExperience,
                avatarUrl: rp.avatarUrl,
                bio: rp.bio,
                verificationStatus: rp.verificationStatus,
                pixKey: rp.pixKey,
                createdAt: rp.createdAt, // createdAt from raw query will be a Date object
                updatedAt: rp.updatedAt, // updatedAt from raw query will be a Date object
                documentPhotoFrontUrl: rp.documentPhotoFrontUrl,
                documentPhotoBackUrl: rp.documentPhotoBackUrl,
                selfieWithDocumentUrl: rp.selfieWithDocumentUrl,
                backgroundCheckResult: rp.backgroundCheckResult,
                rejectionReason: rp.rejectionReason,
                ocrResult: rp.ocrResult,
                livenessResult: rp.livenessResult,
                user: { email: rp.email, role: rp.role },
                address: rp.addressId ? ({ // <--- ATENÇÃO AQUI: Abre parênteses para o cast
                    id: rp.addressId,
                    cep: rp.cep,
                    street: rp.street,
                    number: rp.number,
                    complement: rp.complement,
                    neighborhood: rp.neighborhood,
                    city: rp.city,
                    state: rp.state,
                    clientId: null,
                    providerId: rp.providerId,
                    location: undefined, // A propriedade 'location' é opcional e não vem da query RAW neste ponto
                } as Address) : null, // <--- ATENÇÃO AQUI: Fecha parênteses e adiciona 'as Address'
                providerServices: rp.providerServicesAgg ? rp.providerServicesAgg.map((ps: any) => ({
                    ...ps,
                    price: new Prisma.Decimal(ps.price),
                    service: {
                        ...ps.service,
                        price: new Prisma.Decimal(ps.service.price),
                    }
                })) : [],
                reviewsReceived: [],
            };
            return this.mapProviderToCalculatedRating(providerWithIncludes, parseFloat(rp.distance_km));
        });

      } catch (rawQueryError: any) {
        this.logger.error(`Erro na query RAW geoespacial em search: ${rawQueryError.message}`);
        this.logger.warn('Busca geoespacial falhou. Tentando busca não-geoespacial como fallback.');
      }
    }

    if (providersWithDistance.length > 0) {
      if (minRating !== undefined) {
        providersWithDistance = providersWithDistance.filter(p => p.averageRating >= minRating);
      }
      if (sortBy === SortByOption.Rating) {
        providersWithDistance.sort((a, b) => b.averageRating - a.averageRating);
      } else if (sortBy === SortByOption.Experience) {
        providersWithDistance.sort((a, b) => (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0));
      } else if (sortBy === SortByOption.Distance) {
        providersWithDistance.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      }
      return providersWithDistance;
    }

    let orderBy: Prisma.ProviderOrderByWithRelationInput = { fullName: 'asc' };

    if (sortBy === SortByOption.Rating) {
      this.logger.log('[ProvidersService] search (fallback): Ordenação por Rating será aplicada em memória.');
    } else if (sortBy === SortByOption.Experience) {
      orderBy = { yearsOfExperience: 'desc' };
    }

    const providers = await this.prisma.provider.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: orderBy,
      include: {
        user: { select: { email: true, role: true } },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: {
          include: {
            client: {
              include: {
                user: { select: { id: true, avatarUrl: true } }
              }
            }
          }
        },
        // CORREÇÃO: Removido ocrResult: true e livenessResult: true daqui
      },
    });

    this.logger.log(`[ProvidersService] search (fallback): Encontrados ${providers.length} provedores após filtro.`);

    const providersWithCalculatedRating: ProviderWithCalculatedRating[] = providers.map(provider =>
      this.mapProviderToCalculatedRating(provider as ProviderWithIncludes)
    );

    let filteredProviders = providersWithCalculatedRating;

    if (minRating !== undefined) {
      filteredProviders = filteredProviders.filter(p => p.averageRating >= minRating);
      this.logger.log(`[ProvidersService] search (fallback): Filtrados ${filteredProviders.length} provedores após minRating >= ${minRating}.`);
    }

    if (sortBy === SortByOption.Rating) {
      this.logger.log('[ProvidersService] search (fallback): Ordenando resultados por averageRating em memória.');
      filteredProviders.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sortBy === SortByOption.Experience) {
      this.logger.log('[ProvidersService] search (fallback): Ordenando resultados por yearsOfExperience em memória.');
      filteredProviders.sort((a, b) => (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0));
    }

    return filteredProviders;
  }

  async findAllProviders(params: { limit?: number; latitude?: number; longitude?: number; radius?: number; sortBy?: SortByOption }): Promise<ProviderWithCalculatedRating[]> {
    this.logger.log(`[ProvidersService] findAllProviders: Chamado com params: ${JSON.stringify(params)}`);
    const searchDto: ProviderSearchDto = {
      limit: params.limit,
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius,
      sortBy: params.sortBy,
    };
    return this.search(searchDto);
  }

  async findTopRatedOrExperiencedProviders(): Promise<ProviderWithCalculatedRating[]> {
    this.logger.log('[ProvidersService] findTopRatedOrExperiencedProviders: Buscando provedores mais bem avaliados/experientes.');
    const providers = await this.prisma.provider.findMany({
      where: {
        verificationStatus: VerificationStatus.APPROVED,
      },
      include: {
        user: { select: { email: true, role: true } },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: {
          include: {
            client: {
              include: {
                user: { select: { id: true, avatarUrl: true } }
              }
            }
          }
        },
        // CORREÇÃO: Removido ocrResult: true e livenessResult: true daqui
      },
      orderBy: {
        yearsOfExperience: 'desc',
      },
      take: 5
    });

    this.logger.log(`[ProvidersService] findTopRatedOrExperiencedProviders: Encontrados ${providers.length} provedores.`);

    const providersWithCalculatedRating: ProviderWithCalculatedRating[] = providers.map(provider =>
      this.mapProviderToCalculatedRating(provider as ProviderWithIncludes)
    );

    return providersWithCalculatedRating;
  }
}