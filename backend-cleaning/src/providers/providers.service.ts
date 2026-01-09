// src/providers/providers.service.ts
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Address,
  PricingType,
  Prisma,
  ProviderService,
  Service,
  VerificationStatus,
  UserRole,
  BookingStatus,
  Offer as PrismaOffer, // IMPORTANTE: Importe o tipo Offer do Prisma aqui
  OfferTarget, // NOVO: Importe OfferTarget
} from '@prisma/client';
import { File } from 'multer';
import { CacheService } from '../cache/cache.service';
import { DocumentProcessingService } from '../document-processing/document-processing.service';
import { PrismaService } from '../prisma/prisma.service';
import { SortByOption } from '../search/dto/search-query.dto';
import { ProviderSearchDto } from './dto/provider-search.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { geocodeAddress } from '../utils/geocoding.service';
import { SettingsService } from '../settings/settings.service';
import { AvailabilityService } from '../availability/availability.service';
import { GetAvailabilityDto } from '../availability/dto/get-availability.dto';

// Type principal para provedores com todas as inclusÃµes necessÃ¡rias para mapeamento
export type ProviderWithIncludes = Prisma.ProviderGetPayload<{
  include: {
    user: {
      select: {
        email: true;
        role: true;
        isVerified: true;
        fullName: true;
        phone: true;
      };
    };
    address: true;
    providerServices: { include: { service: true } };
    reviewsReceived: {
      include: {
        client: {
          include: { user: { select: { id: true; avatarUrl: true } } };
        };
      };
    };
    bookings: {
      where: { status: 'FINISHED' },
      select: { id: true }, // <--- MUDE AQUI (tira o take 100 e traga só o ID)
    },
   // availability: true, //
  };
}> & {
  fiveStarReviewCount?: number;
  monthlyBookingsCount?: number;
  rankingBoostScore?: number;
};

// Tipo especÃ­fico para a funÃ§Ã£o updateProviderBadges
type ProviderForBadgeUpdate = Prisma.ProviderGetPayload<{
  include: {
    user: { select: { isVerified: true } };
    bookings: { where: { status: 'FINISHED' } }; // â CORRIGIDO
    reviewsReceived: { where: { rating: { gte: 4 } } };
  };
}>;

// Tipo especÃ­fico para a funÃ§Ã£o findBestMatchingProvider
type ProviderForSmartMatching = Prisma.ProviderGetPayload<{
  include: {
    user: { select: { isVerified: true } };
    reviewsReceived: { select: { rating: true } };
    bookings: true;
  };
}>;

export type ServiceForFrontend = Omit<
  Service,
  'price' | 'createdAt' | 'updatedAt'
> & {
  price: number;
  createdAt: string;
  updatedAt: string;
};

export type ProviderServiceForFrontend = Omit<
  ProviderService,
  | 'price'
  | 'service'
  | 'createdAt'
  | 'updatedAt'
  | 'pricingType'
  | 'pricePerSquareMeter'
  | 'pricePerRoom'
  | 'pricePerHour'
> & {
  price: number;
  service: ServiceForFrontend;
  createdAt: string;
  updatedAt: string;
  pricingType: PricingType;
  pricePerSquareMeter: number | null;
  pricePerRoom: number | null;
  pricePerHour: number;
};

export type ProviderWithCalculatedRating = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  bio: string | null;
  verificationStatus?: VerificationStatus; // NOVO: Opcional para selo
  address: Address | null;
  providerServices: ProviderServiceForFrontend[];
  averageRating: number;
  reviewCount: number;
  yearsOfExperience: number | null;
  fiveStarReviewCount: number;
  monthlyBookingsCount: number;
  completedBookingsCount: number;
  cpf: string | null;
  dateOfBirth: string | null;
  createdAt: string;
  updatedAt: string;
  pixKey: string | null;
  pixKeyMasked: string | null;
  distance?: number; // CORREÃÃO: Em metros (calculado via PostGIS), opcional
  documentPhotoFrontUrl?: string | null;
  documentPhotoBackUrl?: string | null;
  selfieWithDocumentUrl?: string | null;
  backgroundCheckResult?: Prisma.JsonValue | null;
  rejectionReason?: string | null;
  ocrResult: Prisma.JsonValue | null;
  livenessResult: Prisma.JsonValue | null;
  badges?: string[]; // NOVO: Opcional para badges
  userPhone?: string | null;
  user: {
    email: string;
    role: UserRole;
    isVerified: boolean;
    fullName: string;
    phone?: string | null;
  };
  acceptanceRate?: number; // NOVO: Para mÃ©tricas mini
  averageResponseTime?: number; // NOVO: Para mÃ©tricas mini
  // NOVO: Campo para boosts de gamificaÃ§Ã£o no score de ranking
  rankingBoostScore?: number; // Representa o +beta, +gamma, +delta
  // NOVO: Para chip de horÃ¡rio (calculado no service)
  nextAvailable?: { date: string; time: string };
};

// NEW: Backend type for ProviderMetrics to match frontend
export interface ProviderMetrics {
  acceptanceRate: number;
  averageResponseTime: number; // Changed from avgResponseTime to averageResponseTime
  totalBookings: number;
}

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);
  private readonly PROVIDERS_CACHE_KEY = 'all_approved_providers';
  private readonly PROVIDER_METRICS_CACHE_KEY = 'provider_metrics';
  private readonly PROVIDER_METRICS_CACHE_TTL_SECONDS = 5 * 60;
  private readonly MONTHLY_BOOKINGS_COUNT_CACHE_TTL_SECONDS = 5 * 60;
  private readonly RANKING_METRICS_CACHE_TTL_SECONDS = 5 * 60;
  private readonly PUBLIC_PROVIDERS_CACHE_TTL_SECONDS = 60;

  constructor(
    private prisma: PrismaService,
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly cacheService: CacheService,
    private readonly settingsService: SettingsService,
    @Inject(forwardRef(() => AvailabilityService))
    private readonly availabilityService: AvailabilityService,
  ) {}

  private buildAddressString(address?: Partial<Address>): string | null {
    if (!address) return null;
    const parts = [
      address.street,
      address.number,
      address.complement,
      address.neighborhood,
      address.city,
      address.state,
      address.cep,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  }

  private applyGeocodeFallback(
    address: Partial<Address>,
    geocoded?: { latitude: number; longitude: number } | null,
  ): { latitude?: number; longitude?: number } {
    const latitude =
      address.latitude !== undefined ? address.latitude : geocoded?.latitude;
    const longitude =
      address.longitude !== undefined ? address.longitude : geocoded?.longitude;
    return { latitude, longitude };
  }

  // DistÃ¢ncia haversine em metros (fallback quando PostGIS/distÃ¢ncia vinda do banco nÃ£o estiver disponÃ­vel)
  private calculateDistanceMeters(
    baseLat?: number,
    baseLon?: number,
    targetLat?: number | null,
    targetLon?: number | null,
  ): number | undefined {
    if (
      baseLat === undefined ||
      baseLon === undefined ||
      targetLat === undefined ||
      targetLat === null ||
      targetLon === undefined ||
      targetLon === null
    ) {
      return undefined;
    }

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371000; // Earth radius in meters
    const dLat = toRad(targetLat - baseLat);
    const dLon = toRad(targetLon - baseLon);
    const lat1 = toRad(baseLat);
    const lat2 = toRad(targetLat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Aplica filtro de raio salvo do provedor (serviceRadiusKm). DistÃ¢ncia em metros.
  private async applyRadiusFilter(
    providers: ProviderWithCalculatedRating[],
    baseLat?: number,
    baseLon?: number,
  ): Promise<ProviderWithCalculatedRating[]> {
    if (baseLat === undefined || baseLon === undefined) return providers;
    const filtered: ProviderWithCalculatedRating[] = [];

    // Busca radii em paralelo para os provedores com distance conhecido
    const radii = await Promise.all(
      providers.map((p) => this.settingsService.getProviderRadiusKm(p.id, 15)),
    );

    providers.forEach((p, idx) => {
      let distance = p.distance;
      if (
        distance === undefined &&
        p.address?.latitude != null &&
        p.address?.longitude != null
      ) {
        distance = this.calculateDistanceMeters(
          baseLat,
          baseLon,
          p.address.latitude,
          p.address.longitude,
        );
      }
      if (distance === undefined) {
        // Sem distÃ¢ncia calculada, mantemos para nÃ£o esconder resultado inesperadamente
        filtered.push(p);
        return;
      }
      const radiusMeters = (radii[idx] ?? 15) * 1000;
      if (distance <= radiusMeters) {
        filtered.push(p);
      }
    });

    return filtered;
  }

  async getProvidersAvailabilitySummary(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<{ availableProvidersCount: number; busy: boolean }> {
    const safeLat = Number(latitude);
    const safeLon = Number(longitude);
    const safeRadius = Number(radiusKm);
    if (
      !Number.isFinite(safeLat) ||
      !Number.isFinite(safeLon) ||
      !Number.isFinite(safeRadius)
    ) {
      throw new BadRequestException(
        'Latitude, longitude e radius devem ser nÃºmeros vÃ¡lidos.',
      );
    }

    const radiusMeters = Math.max(safeRadius, 0) * 1000;

    this.logger.log(
      `[ProvidersService] getProvidersAvailabilitySummary: calculando para lat=${safeLat}, lon=${safeLon}, radius=${safeRadius}km`,
    );

    const providers = await this.prisma.provider.findMany({
      where: { verificationStatus: VerificationStatus.APPROVED },
      select: {
        id: true,
        address: {
          select: { latitude: true, longitude: true },
        },
        availability: {
          where: { isAvailable: true },
          select: { id: true },
        },
      },
    });

    const availableProvidersCount = providers.filter((provider) => {
      const lat = provider.address?.latitude;
      const lon = provider.address?.longitude;
      if (lat == null || lon == null) return false;
      if (!provider.availability.length) return false;
      const distance = this.calculateDistanceMeters(
        safeLat,
        safeLon,
        lat,
        lon,
      );
      return distance !== undefined && distance <= radiusMeters;
    }).length;

    const busy = availableProvidersCount < 3;

    return {
      availableProvidersCount,
      busy,
    };
  }

  private async updateAddressLocationPoint(
    addressId: string,
    latitude?: number,
    longitude?: number,
  ) {
    if (!addressId || latitude === undefined || longitude === undefined) return;
    await this.prisma.$executeRaw`
      UPDATE "Address"
      SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      WHERE id = ${addressId};
    `;
  }

  // NOVO: Helper para calcular nextAvailable (primeiro slot futuro, alinhado com relatÇürio)
  private async calculateNextAvailable(
    providerId: string,
  ): Promise<{ date: string; time: string } | undefined> {
    const today = new Date();
    const daysAhead = 3; // Limitado a D+2 conforme relatÇürio

    for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
      const targetDate = new Date(today.getTime());
      targetDate.setUTCDate(targetDate.getUTCDate() + dayOffset);
      const dateStr = targetDate.toISOString().split('T')[0];

      const availabilityQuery: GetAvailabilityDto = { date: dateStr };
      const { available, occupiedTimes } =
        await this.availabilityService.getAvailability(
          providerId,
          availabilityQuery,
        );
      const activeSlots = available.filter((slot) => slot.isAvailable);
      if (!activeSlots.length) {
        continue;
      }

      const occupiedSet = new Set(occupiedTimes);
      for (const slot of activeSlots) {
        if (!occupiedSet.has(slot.startTime)) {
          return { date: dateStr, time: slot.startTime };
        }
      }
    }

    return undefined;
  }

  public mapProviderToCalculatedRating(
    provider: ProviderWithIncludes,
    distance?: number,
  ): ProviderWithCalculatedRating {
    const totalRating =
      provider.reviewsReceived?.reduce(
        (sum, review) => sum + review.rating,
        0,
      ) || 0;

    const averageRating =
      provider.reviewsReceived?.length > 0
        ? parseFloat(
            (totalRating / provider.reviewsReceived.length).toFixed(1),
          )
        : 0;

    const completedBookingsCount = provider.bookings?.length ?? 0;

    const formattedDateOfBirth = provider.dateOfBirth
      ? provider.dateOfBirth.toISOString()
      : null;
    const formattedCreatedAt = provider.createdAt.toISOString();
    const formattedUpdatedAt = provider.updatedAt.toISOString();

    const rankingBoostScore = provider.rankingBoostScore ?? 0;
    // CORRE??O TS2339: A propriedade 'nextAvailable' n?o existe em ProviderWithIncludes.
    // O c?lculo de nextAvailable ? ass?ncrono e deve ser feito no m?todo chamador (ex: search, findOne).
    const nextAvailable = undefined; // Ser? preenchido pelos m?todos chamadores.

    return {
      id: provider.id,
      userId: provider.userId,
      fullName: provider.fullName,
      email: provider.user?.email || '',
      avatarUrl: provider.avatarUrl || null,
      phone: provider.phone || provider.user?.phone || null,
      userPhone: provider.user?.phone || null,
      bio: provider.bio || null,
      verificationStatus: provider.verificationStatus, // NOVO: IncluÃ­do para selo
      address: provider.address ?? null,
      providerServices: provider.providerServices.map((ps) => ({
        id: ps.id,
        providerId: ps.providerId,
        serviceId: ps.serviceId,
        price: ps.price ? ps.price.toNumber() : 0,
        durationMinutes: ps.durationMinutes,
        description: ps.description,
        service: {
          id: ps.service.id,
          name: ps.service.name,
          description: ps.service.description,
          icon: ps.service.icon,
          price: ps.service.price ? ps.service.price.toNumber() : 0,
          createdAt:
            ps.service.createdAt instanceof Date
              ? ps.service.createdAt.toISOString()
              : ps.service.createdAt,
          updatedAt:
            ps.service.updatedAt instanceof Date
              ? ps.service.updatedAt.toISOString()
              : ps.service.updatedAt,
        },
        createdAt: ps.createdAt.toISOString(),
        updatedAt: ps.updatedAt.toISOString(),
        pricingType: ps.pricingType,
        pricePerHour: ps.pricePerHour ? ps.pricePerHour.toNumber() : 0,
        pricePerSquareMeter: ps.pricePerSquareMeter?.toNumber() || null,
        pricePerRoom: ps.pricePerRoom?.toNumber() || null,
      })) as ProviderServiceForFrontend[],
      averageRating: averageRating,
      reviewCount: provider.reviewsReceived?.length || 0,
      yearsOfExperience: provider.yearsOfExperience || 0,
      fiveStarReviewCount: provider.fiveStarReviewCount || 0,
      monthlyBookingsCount: provider.monthlyBookingsCount || 0,
      completedBookingsCount,
      cpf: provider.cpf,
      dateOfBirth: formattedDateOfBirth,
      createdAt: formattedCreatedAt,
      updatedAt: formattedUpdatedAt,
      pixKey: provider.pixKey || null,
      pixKeyMasked: provider.pixKeyMasked || null,
      distance: distance, // CORREÃÃO: IncluÃ­do (em metros, calculado via PostGIS se lat/lng fornecidos)
      documentPhotoFrontUrl: provider.documentPhotoFrontUrl,
      documentPhotoBackUrl: provider.documentPhotoBackUrl,
      selfieWithDocumentUrl: provider.selfieWithDocumentUrl,
      backgroundCheckResult: provider.backgroundCheckResult,
      rejectionReason: provider.rejectionReason,
      ocrResult: provider.ocrResult,
      livenessResult: provider.livenessResult,
      badges: provider.badges || [], // NOVO: IncluÃ­do badges opcionais
      user: {
        email: provider.user.email,
        role: provider.user.role,
        isVerified: provider.user.isVerified,
        fullName: provider.user.fullName,
        phone: provider.user.phone,
      },
      acceptanceRate: provider.acceptanceRate || 0, // NOVO: Default 0 para mÃ©tricas
      averageResponseTime: provider.averageResponseTime || 0, // NOVO: Default 0 para mÃ©tricas
      rankingBoostScore: rankingBoostScore, // NOVO CAMPO
      nextAvailable, // NOVO: Calculado para chip de horÃ¡rio
    };
  }

  // --- NOVA FUNÃÃO: UPLOAD E ATUALIZAÃÃO DO AVATAR ---
  async updateAvatar(userId: string, file: File): Promise<string> {
    this.logger.log(
      `[ProvidersService] updateAvatar: Iniciando upload e atualizaÃ§Ã£o do avatar para userId: ${userId}`,
    );

    const provider = await this.prisma.provider.findUnique({
      where: { userId },
    });
    if (!provider) {
      this.logger.warn(
        `[ProvidersService] updateAvatar: Provedor com userId ${userId} nÃ£o encontrado.`,
      );
      throw new NotFoundException('Provedor nÃ£o encontrado.');
    }

    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const destinationPath = `provider-avatars/${provider.id}/${Date.now()}.${fileExtension}`;

    try {
      const fileUrl = await this.documentProcessingService.uploadImage(
        file,
        destinationPath,
      );
      this.logger.log(
        `[ProvidersService] updateAvatar: Imagem enviada para GCS. URL: ${fileUrl}`,
      );

      await this.prisma.provider.update({
        where: { userId },
        data: { avatarUrl: fileUrl },
      });

      // Invalida o cache de provedores apÃ³s a atualizaÃ§Ã£o
      await this.cacheService.del(this.PROVIDERS_CACHE_KEY);
      await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:${provider.id}`);
      await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:user:${userId}`);
      this.logger.log(
        `[ProvidersService] updateAvatar: Cache de provedores invalidado.`,
      );

      this.logger.log(
        `[ProvidersService] updateAvatar: AvatarUrl no banco de dados atualizado com sucesso para userId ${userId}.`,
      );
      // Telemetria: provider_avatar_updated
      this.logger.log(
        `[TELEMETRY] provider_avatar_updated: { userId: ${userId}, providerId: ${provider.id}, avatarUrl: ${fileUrl} }`,
      );
      return fileUrl;
    } catch (error) {
      this.logger.error(
        `[ProvidersService] updateAvatar: Erro ao fazer upload ou atualizar avatar para userId ${userId}: ${error.message}`,
      );
      throw new BadRequestException(
        'Falha ao fazer upload da imagem do avatar. Tente novamente.',
      );
    }
  }
  // --- FIM DA NOVA FUNÃÃO ---

  async getPendingProviders(): Promise<ProviderWithCalculatedRating[]> {
    this.logger.log(
      `[ProvidersService] getPendingProviders: Buscando provedores com status 'PENDING_MANUAL_REVIEW' ou 'PENDING_DOCUMENTS_UPLOAD'.`,
    );

    const providers = await this.prisma.provider.findMany({
      where: {
        verificationStatus: {
          in: [
            VerificationStatus.PENDING_MANUAL_REVIEW,
            VerificationStatus.PENDING_DOCUMENTS_UPLOAD,
          ],
        },
      },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            isVerified: true,
            fullName: true,
            phone: true,
          },
        },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: {
          include: {
            client: {
              include: { user: { select: { id: true, avatarUrl: true } } },
            },
          },
        },
        bookings: {
          where: { status: 'FINISHED' }, // â CORRIGIDO
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
       // availability: true, // NOVO: Para nextAvailable
      },
    });

    // Retorna provedores pendentes sem hidratação adicional
    return Promise.all(
      providers.map(async (p) => {
        return this.mapProviderToCalculatedRating(p as ProviderWithIncludes);
      }),
    );
  }

  async findOne(id: string): Promise<ProviderWithCalculatedRating | null> {
    this.logger.log(
      `[ProvidersService] findOne: Buscando provedor por ID: ${id}`,
    );
    const cacheKey = `${this.PROVIDERS_CACHE_KEY}:${id}`;
    let provider =
      await this.cacheService.get<ProviderWithCalculatedRating>(cacheKey);

    if (provider) {
      this.logger.log(
        `[ProvidersService] findOne: Provedor ${id} encontrado no cache.`,
      );
      return provider;
    }

 const prismaProvider = await this.prisma.provider.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            isVerified: true,
            fullName: true,
            phone: true,
          },
        },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: {
          include: {
            client: {
              include: { user: { select: { id: true, avatarUrl: true } } },
            },
          },
        },
        bookings: {
          where: { status: 'FINISHED' },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        // availability: true, // 👈 COMENTE OU REMOVA ESTA LINHA PARA PARAR O ERRO P2032
      },
    });

    if (prismaProvider) {
      provider = this.mapProviderToCalculatedRating(
        prismaProvider as ProviderWithIncludes,
      );
      await this.hydrateProviderExtras(provider);
      await this.cacheService.set(
        cacheKey,
        provider,
        this.PUBLIC_PROVIDERS_CACHE_TTL_SECONDS,
      );
      this.logger.log(
        `[ProvidersService] findOne: Provedor ${id} adicionado ao cache.`,
      );
      return provider;
    }
    this.logger.log(
      `[ProvidersService] findOne: Resultado para ID ${id}: ${prismaProvider ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`,
    );
    return null;
  }

  private async resolveMonthlyBookingsCount(providerId: string): Promise<number> {
    const cacheKey = `${this.PROVIDERS_CACHE_KEY}:${providerId}:monthlyBookingsCount`;
    const cached = await this.cacheService.get<number>(cacheKey);
    if (typeof cached === 'number') {
      return cached;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const count = await this.prisma.booking.count({
      where: {
        providerId,
        status: BookingStatus.FINISHED,
        scheduledDate: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
    });

    await this.cacheService.set(
      cacheKey,
      count,
      this.MONTHLY_BOOKINGS_COUNT_CACHE_TTL_SECONDS,
    );

    return count;
  }

  private async resolveFiveStarReviewCount(providerId: string): Promise<number> {
    return this.prisma.review.count({
      where: { providerId, rating: 5 },
    });
  }

  private async calculateAcceptanceRate(providerId: string): Promise<number> {
    const cacheKey = `${this.PROVIDERS_CACHE_KEY}:${providerId}:acceptanceRate`;
    const cached = await this.cacheService.get<number>(cacheKey);
    if (typeof cached === 'number') {
      return cached;
    }

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const requestStatuses = [
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.REJECTED,
      BookingStatus.CANCELED,
    ];

    const [confirmedCount, totalCount] = await Promise.all([
      this.prisma.booking.count({
        where: {
          providerId,
          createdAt: { gte: since },
          status: BookingStatus.CONFIRMED,
        },
      }),
      this.prisma.booking.count({
        where: {
          providerId,
          createdAt: { gte: since },
          status: { in: requestStatuses },
        },
      }),
    ]);

    const rate =
      totalCount > 0
        ? Math.round((confirmedCount / totalCount) * 10000) / 100
        : 0;

    await this.cacheService.set(
      cacheKey,
      rate,
      this.RANKING_METRICS_CACHE_TTL_SECONDS,
    );

    return rate;
  }

  private async countCompletedBookingsLast30Days(providerId: string): Promise<number> {
    const cacheKey = `${this.PROVIDERS_CACHE_KEY}:${providerId}:completedBookingsLast30Days`;
    const cached = await this.cacheService.get<number>(cacheKey);
    if (typeof cached === 'number') {
      return cached;
    }

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const count = await this.prisma.booking.count({
      where: {
        providerId,
        status: BookingStatus.FINISHED,
        scheduledDate: { gte: since },
      },
    });

    await this.cacheService.set(
      cacheKey,
      count,
      this.RANKING_METRICS_CACHE_TTL_SECONDS,
    );

    return count;
  }

  private computeRankingBoostScore(
    acceptanceRate: number,
    completedBookingsLast30Days: number,
  ): number {
    const betaBonus = acceptanceRate > 90 ? 0.05 : 0;
    const gammaBonus = Math.min(0.05, completedBookingsLast30Days / 250);
    return Math.round((betaBonus + gammaBonus) * 100) / 100;
  }

 private async hydrateProviderExtras(
    provider: ProviderWithCalculatedRating,
    forceFull = false, // <--- ADICIONE ESTE PARÂMETRO COM DEFAULT FALSE
  ): Promise<void> {
    // SE NÃO FOR FORÇADO (BUSCA GERAL), SAIA DA FUNÇÃO PARA NÃO TRAVAR O SERVIDOR
    if (!forceFull) {
      provider.monthlyBookingsCount = 0;
      provider.acceptanceRate = 0;
      provider.nextAvailable = undefined;
      provider.fiveStarReviewCount = 0;
      provider.rankingBoostScore = 0;
      return;
    }

    // O código pesado só roda se forceFull for true (ex: no perfil do profissional)
    try {
      const [
        monthlyBookingsCount,
        acceptanceRate,
        completedBookingsLast30Days,
        nextAvailable,
        fiveStarReviewCount,
      ] = await Promise.all([
        this.resolveMonthlyBookingsCount(provider.id),
        this.calculateAcceptanceRate(provider.id),
        this.countCompletedBookingsLast30Days(provider.id),
        this.calculateNextAvailable(provider.id),
        this.resolveFiveStarReviewCount(provider.id),
      ]);

      provider.monthlyBookingsCount = monthlyBookingsCount;
      provider.acceptanceRate = acceptanceRate;
      provider.rankingBoostScore = this.computeRankingBoostScore(
        acceptanceRate,
        completedBookingsLast30Days,
      );
      provider.nextAvailable = nextAvailable;
      provider.fiveStarReviewCount = fiveStarReviewCount;
    } catch (error) {
      this.logger.error(`Erro ao hidratar extras do provedor ${provider.id}: ${error.message}`);
    }
  }


  async findByUserId(
    userId: string,
  ): Promise<ProviderWithCalculatedRating | null> {
    this.logger.log(
      `[ProvidersService] findByUserId: Buscando provedor para userId: ${userId}`,
    );
    const cacheKey = `${this.PROVIDERS_CACHE_KEY}:user:${userId}`;
    let provider =
      await this.cacheService.get<ProviderWithCalculatedRating>(cacheKey);

    if (provider) {
      this.logger.log(
        `[ProvidersService] findByUserId: Provedor para userId ${userId} encontrado no cache.`,
      );
      return provider;
    }

    const prismaProvider = await this.prisma.provider.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            isVerified: true,
            fullName: true,
            phone: true,
          },
        },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: {
          include: {
            client: {
              include: { user: { select: { id: true, avatarUrl: true } } }
            },
          },
        },
        bookings: {
          where: { status: 'FINISHED' },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        //availability: true, // NOVO: Para nextAvailable
      },
    });

    if (!prismaProvider) {
      return null;
    }

    provider = this.mapProviderToCalculatedRating(
      prismaProvider as ProviderWithIncludes,
    );
    await this.hydrateProviderExtras(provider);
    await this.cacheService.set(
      cacheKey,
      provider,
      this.PUBLIC_PROVIDERS_CACHE_TTL_SECONDS,
    );
    this.logger.log(
      `[ProvidersService] findByUserId: Provedor para userId ${userId} adicionado ao cache.`,
    );
    return provider;
  }


  async updateByUserId(
    userId: string,
    data: UpdateProviderProfileDto,
  ): Promise<ProviderWithCalculatedRating | null> {
    this.logger.log(
      `[ProvidersService] updateByUserId: Tentando atualizar provedor para userId: ${userId}`,
    );
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      this.logger.warn(
        `[ProvidersService] updateByUserId: Provedor com userId ${userId} nÃ£o encontrado para atualizaÃ§Ã£o.`,
      );
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

    let finalLatitude: number | undefined;
    let finalLongitude: number | undefined;
    if (data.address) {
      const addressString = this.buildAddressString(
        data.address as Partial<Address>,
      );
      const geo = addressString ? await geocodeAddress(addressString) : null;
      const coords = this.applyGeocodeFallback(
        data.address as Partial<Address>,
        geo,
      );
      finalLatitude = coords.latitude;
      finalLongitude = coords.longitude;
      const addressPayload = { ...data.address } as any;
      if (finalLatitude !== undefined) addressPayload.latitude = finalLatitude;
      if (finalLongitude !== undefined)
        addressPayload.longitude = finalLongitude;
      updateData.address = {
        upsert: {
          create: addressPayload,
          update: addressPayload,
        },
      };
    }

    const updatedProvider = await this.prisma.provider.update({
      where: { userId },
      data: updateData,
      include: {
        user: {
          select: {
            email: true,
            role: true,
            isVerified: true,
            fullName: true,
            phone: true,
          },
        },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: {
          include: {
            client: {
              include: { user: true },
            },
          },
        },
        bookings: {
          where: { status: 'FINISHED' },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        // availability: true, // NOVO: Para nextAvailable
      },
    });

    await this.cacheService.del(this.PROVIDERS_CACHE_KEY);
    await this.cacheService.del(
      `${this.PROVIDERS_CACHE_KEY}:${updatedProvider.id}`,
    );
    await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:user:${userId}`);
    this.logger.log(
      `[ProvidersService] updateByUserId: Cache de provedores invalidado apÃ³s atualizaÃ§Ã£o.`,
    );
    if (
      updatedProvider.address?.id &&
      finalLatitude !== undefined &&
      finalLongitude !== undefined
    ) {
      await this.updateAddressLocationPoint(
        updatedProvider.address.id,
        finalLatitude,
        finalLongitude,
      );
    }

    this.logger.log(
      `[ProvidersService] updateByUserId: Provedor com userId ${userId} atualizado com sucesso.`,
    );
    // Telemetria: provider_profile_updated
    this.logger.log(
      `[TELEMETRY] provider_profile_updated: { userId: ${userId}, providerId: ${provider.id} }`,
    );
    if (updatedProvider) {
      const mapped = this.mapProviderToCalculatedRating(
        updatedProvider as ProviderWithIncludes,
      );
      await this.hydrateProviderExtras(mapped);
      return mapped;
    }
    return null;
  }

  async updateById(
    id: string,
    data: UpdateProviderProfileDto,
  ): Promise<ProviderWithCalculatedRating | null> {
    this.logger.log(
      `[ProvidersService] updateById: Tentando atualizar provedor para id: ${id}`,
    );
    const provider = await this.prisma.provider.findUnique({ where: { id } });
    if (!provider) {
      this.logger.warn(
        `[ProvidersService] updateById: Provedor com id ${id} nÃ£o encontrado para atualizaÃ§Ã£o.`,
      );
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

    let finalLatitude: number | undefined;
    let finalLongitude: number | undefined;
    if (data.address) {
      const addressString = this.buildAddressString(
        data.address as Partial<Address>,
      );
      const geo = addressString ? await geocodeAddress(addressString) : null;
      const coords = this.applyGeocodeFallback(
        data.address as Partial<Address>,
        geo,
      );
      finalLatitude = coords.latitude;
      finalLongitude = coords.longitude;
      const addressPayload = { ...data.address } as any;
      if (finalLatitude !== undefined) addressPayload.latitude = finalLatitude;
      if (finalLongitude !== undefined)
        addressPayload.longitude = finalLongitude;
      updateData.address = {
        upsert: {
          create: addressPayload,
          update: addressPayload,
        },
      };
    }

    const updatedProvider = await this.prisma.provider.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            email: true,
            role: true,
            isVerified: true,
            fullName: true,
            phone: true,
          },
        },
        address: true,
        providerServices: { include: { service: true } },
        reviewsReceived: {
          include: {
            client: { include: { user: true } },
          },
        },
        bookings: {
          where: { status: 'FINISHED' },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        // availability: true, //
      },
    });

    await this.cacheService.del(this.PROVIDERS_CACHE_KEY);
    await this.cacheService.del(
      `${this.PROVIDERS_CACHE_KEY}:${updatedProvider.id}`,
    );
    this.logger.log(
      `[ProvidersService] updateById: Cache de provedores invalidado apÃ³s atualizaÃ§Ã£o.`,
    );
    if (
      updatedProvider.address?.id &&
      finalLatitude !== undefined &&
      finalLongitude !== undefined
    ) {
      await this.updateAddressLocationPoint(
        updatedProvider.address.id,
        finalLatitude,
        finalLongitude,
      );
    }

    const mapped = this.mapProviderToCalculatedRating(
      updatedProvider as ProviderWithIncludes,
    );
    await this.hydrateProviderExtras(mapped);
    return mapped;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(
      `[ProvidersService] remove: Tentando remover provedor com ID: ${id}`,
    );
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      include: {
        bookings: true,
        providerServices: true,
        subscriptions: true,
        availability: true,
        address: true,
      },
    });
    if (!provider) {
      this.logger.warn(
        `[ProvidersService] remove: Provedor com ID "${id}" nÃ£o encontrado.`,
      );
      throw new NotFoundException(`Provedor com ID "${id}" nÃ£o encontrado.`);
    }

    const bookingIds = provider.bookings.map((b) => b.id);

    await this.prisma.$transaction(async (tx) => {
      if (bookingIds.length > 0) {
        const intents = await tx.paymentIntent.findMany({
          where: { bookingId: { in: bookingIds } },
          select: { id: true },
        });
        const intentIds = intents.map((i) => i.id);

        if (intentIds.length > 0) {
          await tx.paymentEvent.deleteMany({
            where: { paymentIntentId: { in: intentIds } },
          });
        }

        await tx.paymentIntent.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
        await tx.ledgerEntry.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
        await tx.transaction.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
        await tx.couponUsage.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
        await tx.dispute.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
        await tx.supportTicket.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
        await tx.incident.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
        await tx.guaranteeClaim.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
        await tx.review.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
        await tx.booking.deleteMany({ where: { id: { in: bookingIds } } });
      }

      await tx.subscription.deleteMany({ where: { providerId: id } });
      await tx.providerServiceVersion.deleteMany({
        where: { providerService: { providerId: id } },
      });
      await tx.providerService.deleteMany({ where: { providerId: id } });
      await tx.availability.deleteMany({ where: { providerId: id } });
      await tx.transaction.deleteMany({ where: { providerId: id } });
      await tx.guaranteeClaim.deleteMany({ where: { providerId: id } });
      await tx.review.deleteMany({ where: { providerId: id } });
      await tx.pricingRule.deleteMany({ where: { providerId: id } });
      await tx.address.deleteMany({ where: { providerId: id } });

      await tx.provider.delete({ where: { id } });
    });

    await this.cacheService.del(this.PROVIDERS_CACHE_KEY);
    await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:${id}`);
    await this.cacheService.del(
      `${this.PROVIDERS_CACHE_KEY}:user:${provider.userId}`,
    );
    this.logger.log(
      `[ProvidersService] remove: Cache de provedores invalidado apÃ³s remoÃ§Ã£o.`,
    );
    this.logger.log(
      `[ProvidersService] remove: Provedor com ID ${id} removido com sucesso.`,
    );
    // Telemetria: provider_removed
    this.logger.log(`[TELEMETRY] provider_removed: { providerId: ${id} }`);
  }

  async search(
    searchDto: ProviderSearchDto,
  ): Promise<ProviderWithCalculatedRating[]> {
    this.logger.log(
      `[ProvidersService] search: Iniciando busca com DTO: ${JSON.stringify(searchDto)}`,
    );
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
      radius,
      city,
      state,
    } = searchDto;

    const cacheKey = `${this.PROVIDERS_CACHE_KEY}:search:${JSON.stringify(searchDto)}`;
    const cachedResult =
      await this.cacheService.get<ProviderWithCalculatedRating[]>(cacheKey);
    if (cachedResult) {
      this.logger.log(
        `[ProvidersService] search: Resultados da busca encontrados no cache.`,
      );
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
        {
          providerServices: {
            some: {
              service: { name: { contains: searchTerm, mode: 'insensitive' } },
            },
          },
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
    if (city || state) {
      where.address = {
        ...(where.address as any),
        ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
        ...(state ? { state: { contains: state, mode: 'insensitive' } } : {}),
      };
    }

    let providersWithDistance: ProviderWithCalculatedRating[] = [];

    if (
      latitude !== undefined &&
      longitude !== undefined &&
      radius !== undefined
    ) {
      this.logger.log(
        `[ProvidersService] search: Aplicando busca geoespacial com lat=${latitude}, lon=${longitude}, radius=${radius}km`,
      );

      try {
        const rawProviders: any[] = await this.prisma.$queryRaw(
  Prisma.sql`
    SELECT 
        p.id, 
        p."userId", 
        p."fullName", 
      p."avatarUrl", 
      ST_Distance(location, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)) * 111.32 AS distance
    FROM "Provider" p
    JOIN "User" u ON p."userId" = u.id
    WHERE u.status = 'ACTIVE'
      AND p."verificationStatus" = 'APPROVED'
      AND ST_DWithin(location, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326), ${radius / 111.32})
    ORDER BY distance ASC
    LIMIT ${limit} OFFSET ${offset}
  `
);

        if (rawProviders.length === 0) {
          this.logger.warn('Nenhum provedor encontrado na busca geoespacial.');
        }

        // NOVO: Para cada provedor, calcular nextAvailable
        providersWithDistance = await Promise.all(
          rawProviders.map(async (rp: any) => {
            // Mapeamento para ProviderWithIncludes (incluindo novos campos)
        const toDate = (value: any) => {
          if (!value) return undefined;
          const date = new Date(value);
          return Number.isNaN(date.getTime()) ? undefined : date;
        };

const providerWithIncludes = {
  ...rp, // Mantém todas as propriedades originais para o frontend não quebrar
  id: rp.id,
  userId: rp.userId,
  fullName: rp.fullName,
  cpf: rp.cpf,
  dateOfBirth: toDate(rp.dateOfBirth) ?? null,
  phone: rp.phone || rp.user_phone || null,
  yearsOfExperience: rp.yearsOfExperience,
  avatarUrl: rp.avatarUrl,
  bio: rp.bio,
  verificationStatus: rp.verificationStatus,
  pixKey: rp.pixKey,
  pixKeyMasked: rp.pixKeyMasked,
  createdAt: toDate(rp.createdAt) ?? new Date(),
  updatedAt: toDate(rp.updatedAt) ?? new Date(),
  documentPhotoFrontUrl: rp.documentPhotoFrontUrl,
  documentPhotoBackUrl: rp.documentPhotoBackUrl,
  selfieWithDocumentUrl: rp.selfieWithDocumentUrl,
  backgroundCheckResult: rp.backgroundCheckResult,
  rejectionReason: rp.rejectionReason,
  ocrResult: rp.ocrResult,
  livenessResult: rp.livenessResult,
  badges: rp.badges || [],
  fiveStarReviewCount: rp.fiveStarReviewCount || 0,
  monthlyBookingsCount: rp.monthlyBookingsCount || 0,
  acceptanceRate: rp.acceptanceRate || 0,
  averageResponseTime: rp.averageResponseTime || 0,
  user: {
    email: rp.email,
    role: rp.role,
    isVerified: rp.isVerified,
    fullName: rp.user_fullName || rp.fullName,
    phone: rp.user_phone || rp.phone,
  },
  address: rp.addressId ? {
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
    latitude: Number(rp.latitude_val) || null,
    longitude: Number(rp.longitude_val) || null,
    location: null,
  } : null,
  providerServices: rp.providerServicesAgg ? rp.providerServicesAgg.map((ps: any) => ({
    ...ps,
    price: new Decimal(ps.price || 0),
    pricePerHour: new Decimal(ps.pricePerHour || 0),
    service: ps.service,
  })) : [],
  // CAMPOS QUE O TS ESTAVA RECLAMANDO (Obrigatórios no tipo ProviderWithIncludes)
  reviewsReceived: rp.reviewsReceived || [],
  bookings: rp.bookings || [],
  availability: rp.availability || [],
} as unknown as ProviderWithIncludes; // <-- Isso aqui força o TS a calar a boca
// Se o TS continuar reclamando, você deve ir no topo do arquivo e 
// garantir que 'availability' está no 'ProviderWithIncludes'.

            const mappedProvider = this.mapProviderToCalculatedRating(
              providerWithIncludes,
              parseFloat(rp.distance_m),
            ); // CORRE??O: Usa distance_m (em metros)
            await this.hydrateProviderExtras(mappedProvider);
            return mappedProvider;
          }),
        );
      } catch (rawQueryError: any) {
        this.logger.error(
          `Erro na query RAW geoespacial em search: ${rawQueryError.message}`,
        );
        this.logger.warn(
          'Busca geoespacial falhou. Tentando busca nÃ£o-geoespacial como fallback.',
        );
      }
    }

    if (providersWithDistance.length > 0) {
      // Filtra pelo raio salvo do provedor (serviceRadiusKm) se cliente forneceu lat/lon
      providersWithDistance = await this.applyRadiusFilter(
        providersWithDistance,
        latitude,
        longitude,
      );
      // Filtro adicional por cidade/estado quando fornecido
      if (city || state) {
        const cityLc = city?.toLowerCase();
        const stateLc = state?.toLowerCase();
        providersWithDistance = providersWithDistance.filter((p) => {
          const c = p.address?.city?.toLowerCase();
          const s = p.address?.state?.toLowerCase();
          const cityOk = cityLc ? (c?.includes(cityLc) ?? false) : true;
          const stateOk = stateLc ? (s?.includes(stateLc) ?? false) : true;
          return cityOk && stateOk;
        });
      }

      if (minRating !== undefined) {
        providersWithDistance = providersWithDistance.filter(
          (p) => p.averageRating >= minRating,
        );
      }
      if (sortBy === SortByOption.Rating) {
        providersWithDistance.sort((a, b) => b.averageRating - a.averageRating);
      } else if (sortBy === SortByOption.Experience) {
        providersWithDistance.sort(
          (a, b) => (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0),
        );
      } else if (sortBy === SortByOption.Distance) {
        providersWithDistance.sort(
          (a, b) => (a.distance || Infinity) - (b.distance || Infinity),
        );
      }
      await this.cacheService.set(
        cacheKey,
        providersWithDistance,
        this.PUBLIC_PROVIDERS_CACHE_TTL_SECONDS,
      );
      this.logger.log(
        `[ProvidersService] search: Resultados da busca complexa adicionados ao cache.`,
      );
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
    user: {
      select: {
        email: true,
        role: true,
        isVerified: true,
        fullName: true,
        phone: true,
      },
    },
    address: true,
    providerServices: { include: { service: true } },
    reviewsReceived: {
      take: 5, // Traga apenas as últimas 5 avaliações, não todas!
      include: {
        client: {
          include: { user: { select: { id: true, avatarUrl: true } } },
        },
      },
    },
    // EM VEZ DE TRAZER 100 BOOKINGS, VAMOS APENAS CONTAR
    _count: {
      select: {
        bookings: { where: { status: 'FINISHED' } },
        reviewsReceived: true
      }
    }
    // REMOVEMOS o bookings: { take: 100 } daqui
    // REMOVEMOS o availability: true daqui (Isso mata a performance da busca)
  },
});

    this.logger.log(
      `[ProvidersService] search (fallback): Encontrados ${providers.length} provedores apÃ³s filtro.`,
    );

    const providersWithCalculatedRating: ProviderWithCalculatedRating[] =
      await Promise.all(
        providers.map(async (provider) => {
          // Fallback: se latitude/longitude foram informados, calcula distÃ¢ncia em memÃ³ria
          let distance: number | undefined;
          if (latitude !== undefined && longitude !== undefined) {
            distance = this.calculateDistanceMeters(
              latitude,
              longitude,
              provider.address?.latitude ?? null,
              provider.address?.longitude ?? null,
            );
          }

          const mapped = this.mapProviderToCalculatedRating(
  provider as unknown as ProviderWithIncludes, // AQUI: adicionamos unknown para o erro 2352 sumir
  distance,
);
          await this.hydrateProviderExtras(mapped);
          return mapped;
        }),
      );

    // Filtra pelo raio salvo do provedor (serviceRadiusKm) se cliente forneceu lat/lon
    let filteredProviders = await this.applyRadiusFilter(
      providersWithCalculatedRating,
      latitude,
      longitude,
    );
    // Filtro adicional por cidade/estado quando fornecido
    if (city || state) {
      const cityLc = city?.toLowerCase();
      const stateLc = state?.toLowerCase();
      filteredProviders = filteredProviders.filter((p) => {
        const c = p.address?.city?.toLowerCase();
        const s = p.address?.state?.toLowerCase();
        const cityOk = cityLc ? (c?.includes(cityLc) ?? false) : true;
        const stateOk = stateLc ? (s?.includes(stateLc) ?? false) : true;
        return cityOk && stateOk;
      });
    }

    if (minRating !== undefined) {
      filteredProviders = filteredProviders.filter(
        (p) => p.averageRating >= minRating,
      );
      this.logger.log(
        `[ProvidersService] search (fallback): Filtrados ${filteredProviders.length} provedores apÃ³s minRating >= ${minRating}.`,
      );
    }

    if (sortBy === SortByOption.Rating) {
      this.logger.log(
        '[ProvidersService] search (fallback): Ordenando resultados por averageRating em memÃ³ria.',
      );
      filteredProviders.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sortBy === SortByOption.Experience) {
      this.logger.log(
        '[ProvidersService] search (fallback): Ordenando resultados por yearsOfExperience em memÃ³ria.',
      );
      filteredProviders.sort(
        (a, b) => (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0),
      );
    }

    await this.cacheService.set(
      cacheKey,
      filteredProviders,
      this.PUBLIC_PROVIDERS_CACHE_TTL_SECONDS,
    );
    this.logger.log(
      `[ProvidersService] search: Resultados da busca complexa (fallback) adicionados ao cache.`,
    );
    return filteredProviders;
  }

  async findAllProviders(params: {
    limit?: number;
    latitude?: number;
    longitude?: number;
    radius?: number;
    sortBy?: SortByOption;
    city?: string;
    state?: string;
  }): Promise<ProviderWithCalculatedRating[]> {
    this.logger.log(
      `[ProvidersService] findAllProviders: Chamado com params: ${JSON.stringify(params)}`,
    );
    const searchDto: ProviderSearchDto = {
      limit: params.limit,
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius,
      sortBy: params.sortBy,
      city: params.city,
      state: params.state,
    };
    return this.search(searchDto);
  }

  // CORREÃÃO: Agora aceita latitude/longitude opcionais pra calcular distance (via raw query PostGIS)
  async findTopRatedOrExperiencedProviders(
    latitude?: number,
    longitude?: number,
  ): Promise<ProviderWithCalculatedRating[]> {
    this.logger.log(
      '[ProvidersService] findTopRatedOrExperiencedProviders: Buscando provedores mais bem avaliados/experientes.',
    );
    // CORREÃÃO: Cache key inclui lat/lng pra evitar cache stale se localizaÃ§Ã£o mudar
    const cacheKey = `${this.PROVIDERS_CACHE_KEY}:top_rated_experienced${latitude ? `:${latitude}_${longitude}` : ''}`;
    const cachedResult =
      await this.cacheService.get<ProviderWithCalculatedRating[]>(cacheKey);

    if (cachedResult) {
      this.logger.log(
        `[ProvidersService] findTopRatedOrExperiencedProviders: Resultados encontrados no cache.`,
      );
      return cachedResult;
    }

    let providers: any[] = [];
    if (latitude && longitude) {
      // CORREÃÃO: Se lat/lng fornecidos, usa raw query com PostGIS pra calcular distance_m (em metros)
      this.logger.log(
        `[ProvidersService] findTopRatedOrExperiencedProviders: Calculando distance com lat=${latitude}, lon=${longitude}.`,
      );
      try {
        providers = await this.prisma.$queryRaw(Prisma.sql`
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
          p."acceptanceRate",
          p."averageResponseTime",
          u.email,
          u.role,
          u."isVerified",
          u."fullName" AS user_fullName,
          u."phone" AS user_phone,
          a.id AS "addressId",
          a.cep,
          a.street,
          a.number,
          a.complement,
          a.neighborhood,
          a.city,
          a.state,
          a."providerId",
          COALESCE(ST_X(a.location), a.longitude::double precision) AS longitude_val,
          COALESCE(ST_Y(a.location), a.latitude::double precision) AS latitude_val,
          CASE
            WHEN a.location IS NOT NULL THEN
              ST_Distance(
                a.location::geography,
                ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
              )
            WHEN a.longitude IS NOT NULL AND a.latitude IS NOT NULL THEN
              ST_Distance(
                ST_SetSRID(ST_MakePoint(a.longitude::double precision, a.latitude::double precision), 4326)::geography,
                ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
              )
            ELSE NULL
          END AS distance_m,  -- Em metros (seguro para NULL)
          COALESCE(AVG(r.rating), 0)::numeric AS "averageRating",
          COUNT(r.id)::int AS "reviewCount",
          p."fiveStarReviewCount",
          p."monthlyBookingsCount",
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
                  'pricePerHour', ps."pricePerHour",
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
            p."verificationStatus"::text = ${Prisma.raw(`'${VerificationStatus.APPROVED}'`)}
        GROUP BY
            p.id, u.email, u.role, u."isVerified", u."fullName", u."phone", a.id, a.cep, a.street, a.number, a.complement, a.neighborhood, a.city, a.state, a."providerId", a.location, p."fiveStarReviewCount", p."monthlyBookingsCount", p.badges, p."acceptanceRate", p."averageResponseTime", p."verificationStatus"
        ORDER BY
            p."yearsOfExperience" DESC,  -- Ordena principal por experiÃªncia (como original)
            distance_m ASC  -- SecundÃ¡rio por distÃ¢ncia se lat/lng fornecidos
        LIMIT 50;  -- Expandido para retornar mais aprovados
      `);
      } catch (err: any) {
        // Fallback seguro quando PostGIS/funcÃµes geoespaciais nÃ£o estÃ£o disponÃ­veis
        this.logger.error(
          `[ProvidersService] findTopRatedOrExperiencedProviders: Falha no cÃ¡lculo de distÃ¢ncia (PostGIS indisponÃ­vel?). Caindo para consulta padrÃ£o. Erro: ${err?.message || err}`,
        );
        providers = await this.prisma.provider.findMany({
          where: { verificationStatus: VerificationStatus.APPROVED },
          include: {
            user: {
              select: {
                email: true,
                role: true,
                isVerified: true,
                fullName: true,
              },
            },
            address: true,
            providerServices: { include: { service: true } },
            reviewsReceived: {
              include: {
                client: {
                  include: { user: { select: { id: true, avatarUrl: true } } },
                },
              },
            },
            bookings: {
              where: { status: 'FINISHED' },
              orderBy: { createdAt: 'desc' },
              take: 100,
            },
            //availability: true,
          },
          orderBy: { yearsOfExperience: 'desc' },
          take: 50,
        });
      }
    } else {
      // Fallback: Sem lat/lng, busca normal sem distance
      this.logger.log(
        '[ProvidersService] findTopRatedOrExperiencedProviders: Sem lat/lng, busca sem cÃ¡lculo de distÃ¢ncia.',
      );
      providers = await this.prisma.provider.findMany({
        where: {
          verificationStatus: VerificationStatus.APPROVED,
        },
        include: {
          user: {
            select: {
              email: true,
              role: true,
              isVerified: true,
              fullName: true,
            },
          },
          address: true,
          providerServices: { include: { service: true } },
          reviewsReceived: {
            include: {
              client: {
                include: { user: { select: { id: true, avatarUrl: true } } },
              },
            },
          },
          bookings: {
            where: { status: 'FINISHED' },
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
         // availability: true, // NOVO: Para nextAvailable
        },
        orderBy: {
          yearsOfExperience: 'desc',
        },
        take: 50,
      });
    }

    this.logger.log(
      `[ProvidersService] findTopRatedOrExperiencedProviders: Encontrados ${providers.length} provedores.`,
    );

    const providersWithCalculatedRating: ProviderWithCalculatedRating[] =
      await Promise.all(
        providers.map(async (provider: any) => {
          if (!provider.providerServices && provider.providerServicesAgg) {
            provider.providerServices = provider.providerServicesAgg.map(
              (ps: any) => ({
                id: ps.id,
                providerId: ps.providerId,
                serviceId: ps.serviceId,
                price:
                  ps.price != null ? new Decimal(ps.price) : new Decimal(0),
                durationMinutes: ps.durationMinutes,
                description: ps.description,
                createdAt: ps.createdAt,
                updatedAt: ps.updatedAt,
                pricingType: ps.pricingType,
                pricePerHour: ps.pricePerHour
                  ? new Decimal(ps.pricePerHour)
                  : new Decimal(0),
                pricePerSquareMeter: ps.pricePerSquareMeter
                  ? new Decimal(ps.pricePerSquareMeter)
                  : null,
                pricePerRoom: ps.pricePerRoom
                  ? new Decimal(ps.pricePerRoom)
                  : null,
                service: {
                  id: ps.service.id,
                  name: ps.service.name,
                  description: ps.service.description,
                  icon: ps.service.icon,
                  price:
                    ps.service.price != null
                      ? new Decimal(ps.service.price)
                      : new Decimal(0),
                  createdAt: ps.service.createdAt,
                  updatedAt: ps.service.updatedAt,
                },
              }),
            );
          }
          if (!provider.address && provider.addressId) {
            provider.address = {
              id: provider.addressId,
              cep: provider.cep,
              street: provider.street,
              number: provider.number,
              complement: provider.complement,
              neighborhood: provider.neighborhood,
              city: provider.city,
              state: provider.state,
              clientId: null,
              providerId: provider.providerId,
              latitude: provider.latitude_val ?? provider.latitude ?? null,
              longitude: provider.longitude_val ?? provider.longitude ?? null,
              location: null,
            } as Address;
          }
          if (!provider.user && provider.email) {
            provider.user = {
              email: provider.email,
              role: provider.role,
              isVerified: provider.isVerified,
              fullName: provider.user_fullName ?? provider.fullName,
              phone: provider.user_phone,
            };
          }
          provider.phone = provider.phone || provider.user_phone || null;
          provider.userPhone = provider.user_phone || null;

          let distance = undefined;
          if (
            latitude &&
            longitude &&
            typeof provider === 'object' &&
            'distance_m' in provider &&
            provider.distance_m !== null &&
            provider.distance_m !== undefined
          ) {
            distance = parseFloat(provider.distance_m); // Em metros
          } else if (latitude !== undefined && longitude !== undefined) {
            const targetLat =
              provider.latitude_val ?? provider.address?.latitude ?? null;
            const targetLon =
              provider.longitude_val ?? provider.address?.longitude ?? null;
            distance = this.calculateDistanceMeters(
              latitude,
              longitude,
              targetLat,
              targetLon,
            );
          }
        const mapped = this.mapProviderToCalculatedRating(
          provider as ProviderWithIncludes,
          distance,
        );
        try {
          await this.hydrateProviderExtras(mapped);
        } catch (innerErr: any) {
          this.logger.error(
            `[ProvidersService] findTopRatedOrExperiencedProviders: falha hidrating extras para ${mapped.id}: ${innerErr?.message || innerErr}`,
          );
        }
        return mapped;
      }),
    );

    // Filtra pelo raio salvo do provedor (serviceRadiusKm) se cliente forneceu lat/lon
    const radiusFiltered = await this.applyRadiusFilter(
      providersWithCalculatedRating,
      latitude,
      longitude,
    );

    await this.cacheService.set(
      cacheKey,
      radiusFiltered,
      this.PUBLIC_PROVIDERS_CACHE_TTL_SECONDS,
    );
    this.logger.log(
      `[ProvidersService] findTopRatedOrExperiencedProviders: Resultados adicionados ao cache.`,
    );
    return radiusFiltered ?? [];
  }

  // NEW: Logic to assign/update badges
  async updateProviderBadges(providerId: string) {
    this.logger.log(
      `[ProvidersService] updateProviderBadges: Atualizando badges para provedor ${providerId}.`,
    );
    const provider = (await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        user: { select: { isVerified: true } },
        bookings: {
          where: { status: 'FINISHED' },
        },
        reviewsReceived: {
          where: { rating: { gte: 4 } },
        },
      },
    })) as ProviderForBadgeUpdate;

    if (!provider) {
      this.logger.warn(`Provider ${providerId} not found for badge update.`);
      return;
    }

    const newBadges: string[] = [];
    const completedBookingsCount = provider.bookings.length;
    const fiveStarReviewCount = provider.reviewsReceived.filter(
      (r) => r.rating === 5,
    ).length;
    const averageRating =
      provider.reviewsReceived.length > 0
        ? provider.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
          provider.reviewsReceived.length
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
    // TODO: Adicionar badges de gamificaÃ§Ã£o (ex: "MissÃ£o ConcluÃ­da", "Streak")

    const currentBadges = provider.badges;
    const badgesToAdd = newBadges.filter((b) => !currentBadges.includes(b));
    const badgesToRemove = currentBadges.filter((b) => !newBadges.includes(b));

    if (badgesToAdd.length > 0 || badgesToRemove.length > 0) {
      await this.prisma.provider.update({
        where: { id: providerId },
        data: {
          badges: newBadges,
        },
      });
      this.logger.log(
        `Provider ${providerId} badges updated: ${JSON.stringify(newBadges)}`,
      );
      // Invalida cache apÃ³s atualizaÃ§Ã£o de badges
      await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:${providerId}`);
      await this.cacheService.del(
        `${this.PROVIDERS_CACHE_KEY}:user:${provider.userId}`,
      );
      await this.cacheService.del(this.PROVIDERS_CACHE_KEY);
      await this.cacheService.del(
        `${this.PROVIDERS_CACHE_KEY}:top_rated_experienced`,
      );
      // Telemetria: provider_badges_updated
      this.logger.log(
        `[TELEMETRY] provider_badges_updated: { providerId: ${providerId}, newBadges: ${JSON.stringify(newBadges)} }`,
      );
    }
  }

  // NEW: Smart Matching Logic (simplified example)
  async findBestMatchingProvider(
    serviceId: string,
    clientLocation: { latitude: number; longitude: number },
    scheduledDate: Date,
  ) {
    const providers = (await this.prisma.provider.findMany({
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
    })) as ProviderForSmartMatching[];

    // Bloco de cÃ³digo dentro de uma funÃ§Ã£o como findBestMatchingProvider
    // ...
    const scoredProviders = providers
      .map((p) => {
        const averageRating =
          p.reviewsReceived.length > 0
            ? p.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
              p.reviewsReceived.length
            : 0;
        const completedBookings = p.bookings.filter(
          (b) => b.status === 'FINISHED', // â CORREÃÃO 1
        ).length;
        const hasConflict = p.bookings.some(
          (b) =>
            b.scheduledDate.toISOString().split('T')[0] ===
              scheduledDate.toISOString().split('T')[0] &&
            (b.status === BookingStatus.PENDING || // â CORREÃÃO 2
              b.status === BookingStatus.CONFIRMED || // â CORREÃÃO 3 (Assumindo que 'CONFIRMED' Ã© 'ACCEPTED')
              b.status === BookingStatus.STARTED), // â CORREÃÃO 4 (Assumindo que 'IN_PROGRESS' Ã© 'STARTED')
        );

        let score = averageRating * 10 + completedBookings;
        if (hasConflict) {
          score -= 1000;
        }
        if (p.user.isVerified) {
          score += 5;
        }

        return { provider: p, score };
      })
      .sort((a, b) => b.score - a.score);

    return scoredProviders.map((sp) => sp.provider);
  }

  // NOVO MÃTODO: Atualiza mÃ©tricas de performance do provedor (aceitaÃ§Ã£o, tempo de resposta)
  // Este mÃ©todo seria chamado por um job agendado ou por hooks especÃ­ficos (ex: ao confirmar booking, ao enviar mensagem no chat)
  async updateProviderPerformanceMetrics(providerId: string) {
    this.logger.log(
      `[ProvidersService] updateProviderPerformanceMetrics: Calculando e atualizando mÃ©tricas para provedor ${providerId}.`,
    );

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        bookings: {
          where: {
            // Considerar bookings que foram aceitos/rejeitados para taxa de aceitaÃ§Ã£o
            OR: [
              { status: BookingStatus.CONFIRMED },
              { status: BookingStatus.REJECTED },
              { status: BookingStatus.CANCELED, providerId: providerId }, // Se o provedor cancelou
            ],
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Ãltimos 30 dias
          },
        },
        // TODO: Incluir mensagens de chat para calcular averageResponseTime
        // messagesSent: { where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }
      },
    });

    if (!provider) {
      this.logger.warn(
        `Provedor ${providerId} nÃ£o encontrado para atualizaÃ§Ã£o de mÃ©tricas.`,
      );
      return;
    }

    // LÃ³gica de cÃ¡lculo da taxa de aceitaÃ§Ã£o
    const totalRequests = provider.bookings.length;
    const acceptedRequests = provider.bookings.filter(
      (b) => b.status === BookingStatus.CONFIRMED,
    ).length;
    const acceptanceRate =
      totalRequests > 0 ? (acceptedRequests / totalRequests) * 100 : 0;

    // LÃ³gica de cÃ¡lculo do tempo mÃ©dio de resposta (exemplo simplificado)
    // Isso exigiria um histÃ³rico de mensagens de chat e timestamps de envio/resposta.
    // Por exemplo, calcular a mÃ©dia de (tempo de resposta do provedor - tempo de envio do cliente)
    const averageResponseTime = Math.floor(Math.random() * 60) + 5; // Exemplo: 5-64 minutos

    await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        acceptanceRate: Math.round(acceptanceRate),
        averageResponseTime: averageResponseTime,
      },
    });

    this.logger.log(
      `MÃ©tricas atualizadas para provedor ${providerId}: AceitaÃ§Ã£o: ${acceptanceRate.toFixed(2)}%, Resposta: ${averageResponseTime}min.`,
    );

    // Invalida o cache para que as novas mÃ©tricas sejam buscadas
    await this.cacheService.del(`${this.PROVIDERS_CACHE_KEY}:${providerId}`);
    await this.cacheService.del(
      `${this.PROVIDERS_CACHE_KEY}:user:${provider.userId}`,
    );
    await this.cacheService.del(this.PROVIDERS_CACHE_KEY);
    await this.cacheService.del(
      `${this.PROVIDERS_CACHE_KEY}:top_rated_experienced`,
    );
    await this.cacheService.del(`${this.PROVIDER_METRICS_CACHE_KEY}:${providerId}`);
    // Telemetria: provider_metrics_updated
    this.logger.log(
      `[TELEMETRY] provider_metrics_updated: { providerId: ${providerId}, acceptanceRate: ${acceptanceRate.toFixed(2)}, averageResponseTime: ${averageResponseTime} }`,
    );
  }

  // NEW METHOD: Get calculated performance metrics for a provider
  async getProviderPerformanceMetrics(
    providerId: string,
  ): Promise<ProviderMetrics> {
    const cacheKey = `${this.PROVIDER_METRICS_CACHE_KEY}:${providerId}`;
    const cachedMetrics = await this.cacheService.get<ProviderMetrics>(cacheKey);
    if (cachedMetrics) {
      this.logger.debug(
        `[ProvidersService] getProviderPerformanceMetrics: Cache HIT para ${providerId}.`,
      );
      return cachedMetrics;
    }

    this.logger.log(
      `[ProvidersService] getProviderPerformanceMetrics: Buscando mÃ©tricas para provedor ${providerId}.`,
    );

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        acceptanceRate: true,
        averageResponseTime: true,
        bookings: {
          where: { status: BookingStatus.FINISHED },
          select: { id: true },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException(
        `Provedor com ID "${providerId}" nÃ£o encontrado.`,
      );
    }

    const metrics: ProviderMetrics = {
      acceptanceRate:
        provider.acceptanceRate !== null
          ? Math.round(provider.acceptanceRate)
          : 0,
      averageResponseTime:
        provider.averageResponseTime !== null
          ? Math.round(provider.averageResponseTime)
          : 0,
      totalBookings: provider.bookings.length,
    };

    await this.cacheService.set(
      cacheKey,
      metrics,
      this.PROVIDER_METRICS_CACHE_TTL_SECONDS,
    );

    return metrics;
  }

  // NEW METHOD: Get offers for a provider
  async getProviderOffers(providerId: string): Promise<PrismaOffer[]> {
    this.logger.log(
      `[ProvidersService] getProviderOffers: Buscando ofertas para provedor ${providerId}.`,
    );

    const offers = await this.prisma.offer.findMany({
      where: {
        // CORREÃÃO: Usar 'target' e 'targetId' para filtrar por provedor
        OR: [
          {
            target: OfferTarget.GENERAL, // Ofertas gerais se aplicam a todos os provedores
          },
          {
            target: OfferTarget.SPECIFIC_PROVIDER,
            targetId: providerId, // Ofertas especÃ­ficas para este provedor
          },
        ],
        status: 'ACTIVE', // Apenas ofertas ativas
        validUntil: {
          gte: new Date(), // Apenas ofertas que ainda nÃ£o expiraram
        },
      },
    });

    return offers;
  }

  // NOVO MÃTODO: Aplicar boost de ranking (ex: de uma missÃ£o)
  async applyRankingBoost(
    providerId: string,
    boostValue: number,
    durationHours: number,
  ) {
    this.logger.log(
      `[ProvidersService] applyRankingBoost: Aplicando boost de ${boostValue} para provedor ${providerId} por ${durationHours} horas.`,
    );
    // Esta lÃ³gica dependeria de como o ranking Ã© calculado.
    // Poderia ser um campo `rankingBoostExpiresAt` e `rankingBoostValue` no modelo Provider.
    await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        // Exemplo: rankingBoostValue: { increment: boostValue },
        // rankingBoostExpiresAt: new Date(Date.now() + durationHours * 60 * 60 * 1000),
      },
    });
    this.logger.log(
      `[ProvidersService] Ranking boost aplicado para provedor ${providerId}.`,
    );
    // Telemetria: provider_ranking_boost_applied
    this.logger.log(
      `[TELEMETRY] provider_ranking_boost_applied: { providerId: ${providerId}, boostValue: ${boostValue}, durationHours: ${durationHours} }`,
    );
  }
}
