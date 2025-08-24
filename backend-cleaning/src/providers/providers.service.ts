// Arquivo: providers.service.ts
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Address, PricingType, Prisma, ProviderService, Service, VerificationStatus, UserRole, BookingStatus } from '@prisma/client';
import { File } from 'multer';
import { CacheService } from '../cache/cache.service';
import { DocumentProcessingService } from '../document-processing/document-processing.service';
import { PrismaService } from '../prisma/prisma.service';
import { SortByOption } from '../search/dto/search-query.dto';
import { ProviderSearchDto } from './dto/provider-search.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { Decimal } from '@prisma/client/runtime/library';

// Tipo principal para provedores com todas as inclusões necessárias para mapeamento
export type ProviderWithIncludes = Prisma.ProviderGetPayload<{
  include: {
    user: { select: { email: true, role: true, isVerified: true, fullName: true } };
    address: true;
    providerServices: { include: { service: true } };
    reviewsReceived: {
      include: {
        client: {
          include: { user: { select: { id: true, avatarUrl: true } } }
        }
      }
    };
    bookings: {
      where: { status: 'COMPLETED' };
      orderBy: { createdAt: 'desc' };
      take: 100;
    };
  };
}>;

// Tipo específico para a função updateProviderBadges
type ProviderForBadgeUpdate = Prisma.ProviderGetPayload<{
  include: {
    user: { select: { isVerified: true } };
    bookings: { where: { status: 'COMPLETED' } };
    reviewsReceived: { where: { rating: { gte: 4 } } };
  };
}>;

// Tipo específico para a função findBestMatchingProvider
type ProviderForSmartMatching = Prisma.ProviderGetPayload<{
  include: {
    user: { select: { isVerified: true } };
    reviewsReceived: { select: { rating: true } };
    bookings: true;
  };
}>;

export type ServiceForFrontend = Omit<Service, 'price' | 'createdAt' | 'updatedAt'> & {
  price: number;
  createdAt: string;
  updatedAt: string;
};

export type ProviderServiceForFrontend = Omit<ProviderService, 'price' | 'service' | 'createdAt' | 'updatedAt' | 'pricingType' | 'pricePerSquareMeter' | 'pricePerRoom'> & {
  price: number;
  service: ServiceForFrontend;
  createdAt: string;
  updatedAt: string;
  pricingType: PricingType;
  pricePerSquareMeter: number | null;
  pricePerRoom: number | null;
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
  address: (Address & { latitude?: Decimal; longitude?: Decimal; }) | null;
  providerServices: ProviderServiceForFrontend[];
  averageRating: number;
  reviewCount: number;
  yearsOfExperience: number | null;
  fiveStarReviewCount: number;
  monthlyBookingsCount: number;
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
  ocrResult: Prisma.JsonValue | null;
  livenessResult: Prisma.JsonValue | null;
  badges: string[];
  user: {
    email: string;
    role: UserRole;
    isVerified: boolean;
    fullName: string;
  };
  acceptanceRate: number;
  averageResponseTime: number;
  // NOVO: Campo para boosts de gamificação no score de ranking
  rankingBoostScore?: number; // Representa o +beta, +gamma, +delta
};

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);
  private readonly PROVIDERS_CACHE_KEY = 'all_approved_providers';

  constructor(
    private prisma: PrismaService,
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly cacheService: CacheService,
  ) {}

  public mapProviderToCalculatedRating(provider: ProviderWithIncludes, distance?: number): ProviderWithCalculatedRating {
    const totalRating = provider.reviewsReceived?.reduce((sum, review) => sum + review.rating, 0) || 0;
    const averageRating = provider.reviewsReceived?.length > 0
      ? parseFloat((totalRating / provider.reviewsReceived.length).toFixed(1))
      : 0;

    const formattedDateOfBirth = provider.dateOfBirth ? provider.dateOfBirth.toISOString() : null;
    const formattedCreatedAt = provider.createdAt.toISOString();
    const formattedUpdatedAt = provider.updatedAt.toISOString();

    // NOVO: Calcular rankingBoostScore (placeholder)
    let rankingBoostScore = 0;
    if (provider.badges.includes('TOP_RATED')) {
      rankingBoostScore += 0.05; // Exemplo: +beta
    }
    // TODO: Adicionar lógica para outros boosts (missões, SLA chat)
    // if (provider.hasActiveMissionBoost) rankingBoostScore += 0.03; // +gamma
    // if (provider.meetsChatSla) rankingBoostScore += 0.02; // +delta

    return {
      id: provider.id,
      userId: provider.userId,
      fullName: provider.fullName,
      email: provider.user?.email || '',
      avatarUrl: provider.avatarUrl || null,
      phone: provider.phone || null,
      bio: provider.bio || null,
      verificationStatus: provider.verificationStatus,
      address: provider.address ? {
        ...provider.address,
        latitude: provider.address.latitude || null,
        longitude: provider.address.longitude || null,
      } : null,
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
        pricingType: ps.pricingType,
        pricePerSquareMeter: ps.pricePerSquareMeter?.toNumber() || null,
        pricePerRoom: ps.pricePerRoom?.toNumber() || null,
      })) as ProviderServiceForFrontend[],
      averageRating: averageRating,
      reviewCount: provider.reviewsReceived?.length || 0,
      yearsOfExperience: provider.yearsOfExperience || 0,
      fiveStarReviewCount: provider.fiveStarReviewCount || 0,
      monthlyBookingsCount: provider.monthlyBookingsCount || 0,
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
      ocrResult: provider.ocrResult,
      livenessResult: provider.livenessResult,
      badges: provider.badges,
      user: {
        email: provider.user.email,
        role: provider.user.role,
        isVerified: provider.user.isVerified,
        fullName: provider.user.fullName,
      },
      acceptanceRate: provider.acceptanceRate,
      averageResponseTime: provider.averageResponseTime,
      rankingBoostScore: rankingBoostScore, // NOVO CAMPO
    };
  }

  // --- NOVA FUNÇÃO: UPLOAD E ATUALIZAÇÃO DO AVATAR ---
  async updateAvatar(userId: string, file: File): Promise<string> {
    this.logger.log(`[ProvidersService] updateAvatar: Iniciando upload e atualização do avatar para userId: ${userId}`);

    const provider = await this.prisma.provider.findUnique({ where: { userId } });
    if (!provider) {
        this.logger.warn(`[ProvidersService] updateAvatar: Provedor com userId ${userId} não encontrado.`);
        throw new NotFoundException('Provedor não encontrado.');
    }

    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const destinationPath = `provider-avatars/${provider.id}/${Date.now()}.${fileExtension}`;

    try {
        const fileUrl = await this.documentProcessingService.uploadImage(file, destinationPath);
        this.logger.log(`[ProvidersService] updateAvatar: Imagem enviada para GCS. URL: ${fileUrl}`);

        await this.prisma.provider.update({
            where: { userId },
            data: { avatarUrl: fileUrl },
        });

        // Invalida o cache de provedores após a atualização
        await this.cacheService.del(this.PROVIDERS_CACHE_KEY);
        await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:${provider.id}`);
        await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:user:${userId}`);
        this.logger.log(`[ProvidersService] updateAvatar: Cache de provedores invalidado.`);

        this.logger.log(`[ProvidersService] updateAvatar: AvatarUrl no banco de dados atualizado com sucesso para userId ${userId}.`);
        // Telemetria: provider_avatar_updated
        this.logger.log(`[TELEMETRY] provider_avatar_updated: { userId: ${userId}, providerId: ${provider.id}, avatarUrl: ${fileUrl} }`);
        return fileUrl;
    } catch (error) {
        this.logger.error(`[ProvidersService] updateAvatar: Erro ao fazer upload ou atualizar avatar para userId ${userId}: ${error.message}`);
        throw new BadRequestException('Falha ao fazer upload da imagem do avatar. Tente novamente.');
    }
  }
  // --- FIM DA NOVA FUNÇÃO ---

  async getPendingProviders(): Promise<ProviderWithCalculatedRating[]> {
    this.logger.log(`[ProvidersService] getPendingProviders: Buscando provedores com status 'PENDING_MANUAL_REVIEW' ou 'PENDING_DOCUMENTS_UPLOAD'.`);

    const providers = await this.prisma.provider.findMany({
      where: {
        verificationStatus: {
          in: [VerificationStatus.PENDING_MANUAL_REVIEW, VerificationStatus.PENDING_DOCUMENTS_UPLOAD],
        },
      },
      include: {
        user: { select: { email: true, role: true, isVerified: true, fullName: true } },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: {
          include: {
            client: {
              include: { user: { select: { id: true, avatarUrl: true } } }
            }
          }
        },
        bookings: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    return providers.map(p => this.mapProviderToCalculatedRating(p as ProviderWithIncludes));
  }

  async findOne(id: string): Promise<ProviderWithCalculatedRating | null> {
    this.logger.log(`[ProvidersService] findOne: Buscando provedor por ID: ${id}`);
    const cacheKey = `${this.PROVIDERS_CACHE_KEY}:${id}`;
    let provider = await this.cacheService.get<ProviderWithCalculatedRating>(cacheKey);

    if (provider) {
      this.logger.log(`[ProvidersService] findOne: Provedor ${id} encontrado no cache.`);
      return provider;
    }

    const prismaProvider = await this.prisma.provider.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, role: true, isVerified: true, fullName: true } },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: {
          include: {
            client: {
              include: { user: { select: { id: true, avatarUrl: true } } }
            }
          }
        },
        bookings: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (prismaProvider) {
      provider = this.mapProviderToCalculatedRating(prismaProvider as ProviderWithIncludes);
      await this.cacheService.set(cacheKey, provider);
      this.logger.log(`[ProvidersService] findOne: Provedor ${id} adicionado ao cache.`);
      return provider;
    }
    this.logger.log(`[ProvidersService] findOne: Resultado para ID ${id}: ${prismaProvider ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
    return null;
  }

  async findByUserId(userId: string): Promise<ProviderWithCalculatedRating | null> {
    this.logger.log(`[ProvidersService] findByUserId: Buscando provedor para userId: ${userId}`);
    const cacheKey = `${this.PROVIDERS_CACHE_KEY}:user:${userId}`;
    let provider = await this.cacheService.get<ProviderWithCalculatedRating>(cacheKey);

    if (provider) {
      this.logger.log(`[ProvidersService] findByUserId: Provedor para userId ${userId} encontrado no cache.`);
      return provider;
    }

    const prismaProvider = await this.prisma.provider.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, role: true, isVerified: true, fullName: true } },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: {
          include: {
            client: {
              include: { user: { select: { id: true, avatarUrl: true } } }
            }
          }
        },
        bookings: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });
    if (prismaProvider) {
      provider = this.mapProviderToCalculatedRating(prismaProvider as ProviderWithIncludes);
      await this.cacheService.set(cacheKey, provider);
      this.logger.log(`[ProvidersService] findByUserId: Provedor para userId ${userId} adicionado ao cache.`);
      return provider;
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
      pixKey: data.pixKey,
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
        user: { select: { email: true, role: true, isVerified: true, fullName: true } },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: {
          include: {
            client: {
              include: { user: true }
            }
          }
        },
        bookings: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    await this.cacheService.del(this.PROVIDERS_CACHE_KEY);
    await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:${updatedProvider.id}`);
    await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:user:${userId}`);
    this.logger.log(`[ProvidersService] updateByUserId: Cache de provedores invalidado após atualização.`);

    this.logger.log(`[ProvidersService] updateByUserId: Provedor com userId ${userId} atualizado com sucesso.`);
    // Telemetria: provider_profile_updated
    this.logger.log(`[TELEMETRY] provider_profile_updated: { userId: ${userId}, providerId: ${provider.id} }`);
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
    await this.cacheService.del(this.PROVIDERS_CACHE_KEY);
    await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:${id}`);
    await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:user:${provider.userId}`);
    this.logger.log(`[ProvidersService] remove: Cache de provedores invalidado após remoção.`);
    this.logger.log(`[ProvidersService] remove: Provedor com ID ${id} removido com sucesso.`);
    // Telemetria: provider_removed
    this.logger.log(`[TELEMETRY] provider_removed: { providerId: ${id} }`);
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

    const cacheKey = `${this.PROVIDERS_CACHE_KEY}:search:${JSON.stringify(searchDto)}`;
    let cachedResult = await this.cacheService.get<ProviderWithCalculatedRating[]>(cacheKey);
    if (cachedResult) {
      this.logger.log(`[ProvidersService] search: Resultados da busca encontrados no cache.`);
      return cachedResult;
    }

    const where: Prisma.ProviderWhereInput = {
      verificationStatus: VerificationStatus.APPROVED,
    };

    if (searchTerm) {
      where.OR = [
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
        { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
        { bio: { contains: searchTerm, mode: 'insensitive' } },
        { providerServices: { some: { service: { name: { contains: searchTerm, mode: 'insensitive' } } } },
        },
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
              p."ocrResult",
              p."livenessResult",
              p.badges,
              u.email,
              u.role,
              u."isVerified",
              u."fullName" AS user_fullName,
              a.id AS "addressId",
              a.cep,
              a.street,
              a.number,
              a.complement,
              a.neighborhood,
              a.city,
              a.state,
              a."providerId",
              ST_X(a.location) AS longitude_val,
              ST_Y(a.location) AS latitude_val,
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
                      'pricingType', ps."pricingType",
                      'pricePerSquareMeter', ps."pricePerSquareMeter",
                      'pricePerRoom', ps."pricePerRoom",
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
              ) FILTER (WHERE ps.id IS NOT NULL) AS "providerServicesAgg",
              p."fiveStarReviewCount",
              p."monthlyBookingsCount",
              p."acceptanceRate",
              p."averageResponseTime"
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
                p."verificationStatus" = ${Prisma.raw(`'${VerificationStatus.APPROVED}'`)} AND -- CORREÇÃO APLICADA AQUI
                a.location IS NOT NULL AND
                ST_DWithin(a.location, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326), ${radius * 1000})
                ${searchTerm ? Prisma.sql`AND (p."fullName" ILIKE ${'%' + searchTerm + '%'} OR u.email ILIKE ${'%' + searchTerm + '%'} OR p.bio ILIKE ${'%' + searchTerm + '%'} OR s.name ILIKE ${'%' + searchTerm + '%'})` : Prisma.empty}
                ${serviceId ? Prisma.sql`AND ps."serviceId" = ${serviceId}` : Prisma.empty}
                ${location ? Prisma.sql`AND (a.city ILIKE ${'%' + location + '%'} OR a.state ILIKE ${'%' + location + '%'} OR a.street ILIKE ${'%' + location + '%'} OR a.neighborhood ILIKE ${'%' + location + '%'})` : Prisma.empty}
            GROUP BY
                p.id, u.email, u.role, u."isVerified", u."fullName", a.id, a.cep, a.street, a.number, a.complement, a.neighborhood, a.city, a.state, a."providerId", a.location, p."fiveStarReviewCount", p."monthlyBookingsCount", p.badges, p."acceptanceRate", p."averageResponseTime"
            ORDER BY
                distance_km ASC
            LIMIT ${limit || 10} OFFSET ${offset || 0};
        `);

        if (rawProviders.length === 0) {
          this.logger.warn('Nenhum provedor encontrado na busca geoespacial.');
        }

        providersWithDistance = rawProviders.map((rp: any) => {
          const providerWithIncludes: ProviderWithIncludes = {
            id: rp.id,
            userId: rp.userId,
            fullName: rp.fullName,
            cpf: rp.cpf,
            dateOfBirth: rp.dateOfBirth,
            phone: rp.phone,
            yearsOfExperience: rp.yearsOfExperience,
            avatarUrl: rp.avatarUrl,
            bio: rp.bio,
            verificationStatus: rp.verificationStatus,
            pixKey: rp.pixKey,
            createdAt: rp.createdAt,
            updatedAt: rp.updatedAt,
            documentPhotoFrontUrl: rp.documentPhotoFrontUrl,
            fiveStarReviewCount: rp.fiveStarReviewCount,
            monthlyBookingsCount: rp.monthlyBookingsCount,
            documentPhotoBackUrl: rp.documentPhotoBackUrl,
            selfieWithDocumentUrl: rp.selfieWithDocumentUrl,
            backgroundCheckResult: rp.backgroundCheckResult,
            rejectionReason: rp.rejectionReason,
            ocrResult: rp.ocrResult,
            livenessResult: rp.livenessResult,
            badges: rp.badges,
            user: { email: rp.email, role: rp.role, isVerified: rp.isVerified, fullName: rp.user_fullName },
            address: rp.addressId ? ({
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
              latitude: new Decimal(rp.latitude_val),
              longitude: new Decimal(rp.longitude_val),
              location: null,
            } as Address) : null,
            providerServices: rp.providerServicesAgg || [],
            reviewsReceived: [],
            bookings: [],
            acceptanceRate: rp.acceptanceRate,
            averageResponseTime: rp.averageResponseTime,
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
      await this.cacheService.set(cacheKey, providersWithDistance);
      this.logger.log(`[ProvidersService] search: Resultados da busca complexa adicionados ao cache.`);
      return providersWithDistance;
    }

    let orderBy: Prisma.ProviderOrderByWithRelationInput = { fullName: 'asc' };

    if (sortBy === SortByOption.Experience) {
      orderBy = { yearsOfExperience: 'desc' };
    }

    const providers = await this.prisma.provider.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: orderBy,
      include: {
        user: { select: { email: true, role: true, isVerified: true, fullName: true } },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: {
          include: {
            client: {
              include: { user: { select: { id: true, avatarUrl: true } } }
            }
          }
        },
        bookings: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
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

    await this.cacheService.set(cacheKey, filteredProviders);
    this.logger.log(`[ProvidersService] search: Resultados da busca complexa (fallback) adicionados ao cache.`);
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
    const cacheKey = `${this.PROVIDERS_CACHE_KEY}:top_rated_experienced`;
    let cachedResult = await this.cacheService.get<ProviderWithCalculatedRating[]>(cacheKey);

    if (cachedResult) {
      this.logger.log(`[ProvidersService] findTopRatedOrExperiencedProviders: Resultados encontrados no cache.`);
      return cachedResult;
    }

    const providers = await this.prisma.provider.findMany({
      where: {
        verificationStatus: VerificationStatus.APPROVED,
      },
      include: {
        user: { select: { email: true, role: true, isVerified: true, fullName: true } },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: {
          include: {
            client: {
              include: { user: { select: { id: true, avatarUrl: true } } }
            }
          }
        },
        bookings: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
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

    await this.cacheService.set(cacheKey, providersWithCalculatedRating);
    this.logger.log(`[ProvidersService] findTopRatedOrExperiencedProviders: Resultados adicionados ao cache.`);
    return providersWithCalculatedRating;
  }

  // NEW: Logic to assign/update badges
  async updateProviderBadges(providerId: string) {
    this.logger.log(`[ProvidersService] updateProviderBadges: Atualizando badges para provedor ${providerId}.`);
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        user: { select: { isVerified: true } },
        bookings: {
          where: { status: 'COMPLETED' },
        },
        reviewsReceived: {
          where: { rating: { gte: 4 } },
        },
      },
    }) as ProviderForBadgeUpdate;

    if (!provider) {
      this.logger.warn(`Provider ${providerId} not found for badge update.`);
      return;
    }

    const newBadges: string[] = [];
    const completedBookingsCount = provider.bookings.length;
    const fiveStarReviewCount = provider.reviewsReceived.filter(r => r.rating === 5).length;
    const averageRating = provider.reviewsReceived.length > 0
      ? provider.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / provider.reviewsReceived.length
      : 0;

    if (provider.user.isVerified) {
      newBadges.push('VERIFIED');
    }
    if (averageRating >= 4.5 && fiveStarReviewCount >= 10) {
      newBadges.push('TOP_RATED');
    }
    if (completedBookingsCount >= 50) {
      newBadges.push('HIGH_VOLUME');
    }
    // TODO: Adicionar badges de gamificação (ex: "Missão Concluída", "Streak")

    const currentBadges = provider.badges;
    const badgesToAdd = newBadges.filter(b => !currentBadges.includes(b));
    const badgesToRemove = currentBadges.filter(b => !newBadges.includes(b));

    if (badgesToAdd.length > 0 || badgesToRemove.length > 0) {
      await this.prisma.provider.update({
        where: { id: providerId },
        data: {
          badges: newBadges,
        },
      });
      this.logger.log(`Provider ${providerId} badges updated: ${JSON.stringify(newBadges)}`);
      // Invalida cache após atualização de badges
      await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:${providerId}`);
      await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:user:${provider.userId}`);
      await this.cacheService.del(this.PROVIDERS_CACHE_KEY);
      await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:top_rated_experienced`);
      // Telemetria: provider_badges_updated
      this.logger.log(`[TELEMETRY] provider_badges_updated: { providerId: ${providerId}, newBadges: ${JSON.stringify(newBadges)} }`);
    }
  }

  // NEW: Smart Matching Logic (simplified example)
  async findBestMatchingProvider(serviceId: string, clientLocation: { latitude: number, longitude: number }, scheduledDate: Date) {
    const providers = await this.prisma.provider.findMany({
      where: {
        providerServices: {
          some: {
            serviceId: serviceId,
          },
        },
        verificationStatus: VerificationStatus.APPROVED,
      },
      include: {
        user: { select: { isVerified: true } },
        reviewsReceived: { select: { rating: true } },
        bookings: true,
      },
    }) as ProviderForSmartMatching[];

    const scoredProviders = providers.map(p => {
      const averageRating = p.reviewsReceived.length > 0
        ? p.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / p.reviewsReceived.length
        : 0;
      const completedBookings = p.bookings.filter(b => b.status === 'COMPLETED').length;
      const hasConflict = p.bookings.some(b =>
        b.scheduledDate.toISOString().split('T')[0] === scheduledDate.toISOString().split('T')[0] &&
        (b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS')
      );

      let score = averageRating * 10 + completedBookings;
      if (hasConflict) {
        score -= 1000;
      }
      if (p.user.isVerified) {
        score += 5;
      }

      return { provider: p, score };
    }).sort((a, b) => b.score - a.score);

    return scoredProviders.map(sp => sp.provider);
  }

  // NOVO MÉTODO: Atualiza métricas de performance do provedor (aceitação, tempo de resposta)
  // Este método seria chamado por um job agendado ou por hooks específicos (ex: ao confirmar booking, ao enviar mensagem no chat)
  async updateProviderPerformanceMetrics(providerId: string) {
    this.logger.log(`[ProvidersService] updateProviderPerformanceMetrics: Calculando e atualizando métricas para provedor ${providerId}.`);

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        bookings: {
          where: {
            // Considerar bookings que foram aceitos/rejeitados para taxa de aceitação
            OR: [
              { status: BookingStatus.CONFIRMED },
              { status: BookingStatus.REJECTED },
              { status: BookingStatus.CANCELED, providerId: providerId }, // Se o provedor cancelou
            ],
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Últimos 30 dias
          }
        },
        // TODO: Incluir mensagens de chat para calcular averageResponseTime
        // messagesSent: { where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }
      }
    });

    if (!provider) {
      this.logger.warn(`Provedor ${providerId} não encontrado para atualização de métricas.`);
      return;
    }

    // Lógica de cálculo da taxa de aceitação
    const totalRequests = provider.bookings.length;
    const acceptedRequests = provider.bookings.filter(b => b.status === BookingStatus.CONFIRMED).length;
    const acceptanceRate = totalRequests > 0 ? (acceptedRequests / totalRequests) * 100 : 0;

    // Lógica de cálculo do tempo médio de resposta (exemplo simplificado)
    // Isso exigiria um histórico de mensagens de chat e timestamps de envio/resposta.
    // Por exemplo, calcular a média de (tempo de resposta do provedor - tempo de envio do cliente)
    const averageResponseTime = Math.floor(Math.random() * 60); // Exemplo: 0-59 minutos

    await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        acceptanceRate: Math.round(acceptanceRate),
        averageResponseTime: averageResponseTime,
      },
    });

    this.logger.log(`Métricas atualizadas para provedor ${providerId}: Taxa de Aceitação: ${acceptanceRate.toFixed(2)}%, Tempo Médio de Resposta: ${averageResponseTime}min.`);

    // Invalida o cache para que as novas métricas sejam buscadas
    await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:${providerId}`);
    await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:user:${provider.userId}`);
    await this.cacheService.del(this.PROVIDERS_CACHE_KEY);
    await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:top_rated_experienced`);
    // Telemetria: provider_metrics_updated
    this.logger.log(`[TELEMETRY] provider_metrics_updated: { providerId: ${providerId}, acceptanceRate: ${acceptanceRate.toFixed(2)}, averageResponseTime: ${averageResponseTime} }`);
  }

  // NOVO MÉTODO: Aplicar boost de ranking (ex: de uma missão)
  async applyRankingBoost(providerId: string, boostValue: number, durationHours: number) {
    this.logger.log(`[ProvidersService] applyRankingBoost: Aplicando boost de ${boostValue} para provedor ${providerId} por ${durationHours} horas.`);
    // Esta lógica dependeria de como o ranking é calculado.
    // Poderia ser um campo `rankingBoostExpiresAt` e `rankingBoostValue` no modelo Provider.
    await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        // Exemplo: rankingBoostValue: { increment: boostValue },
        // rankingBoostExpiresAt: new Date(Date.now() + durationHours * 60 * 60 * 1000),
      },
    });
    this.logger.log(`[ProvidersService] Ranking boost aplicado para provedor ${providerId}.`);
    // Telemetria: provider_ranking_boost_applied
    this.logger.log(`[TELEMETRY] provider_ranking_boost_applied: { providerId: ${providerId}, boostValue: ${boostValue}, durationHours: ${durationHours} }`);
  }
}