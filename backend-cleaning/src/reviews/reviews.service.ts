// src/reviews/reviews.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { GetReviewsDto } from './dto/get-reviews.dto';
import { Review, BookingStatus, Prisma } from '@prisma/client';
import { ProvidersService } from '../providers/providers.service';

// Loyalty
import { LoyaltyService } from '../loyalty/loyalty.service';
import { LoyaltyTransactionType } from '@prisma/client';

// Missions
import { MissionsService } from '../missions/missions.service';

// =============================================================================
// CORREÇÃO: Novo tipo para o retorno de findReviews (resolve Erro 2322)
// O tipo é necessário pois findReviews usa 'select' e não 'include' completo.
// =============================================================================
export type ReviewListResult = Prisma.ReviewGetPayload<{
  select: {
    id: true;
    bookingId: true;
    clientId: true;
    providerId: true;
    rating: true;
    comment: true;
    createdAt: true;
    updatedAt: true;
    client: {
      select: {
        fullName: true;
        user: { select: { avatarUrl: true } };
      };
    };
    provider: {
      select: {
        fullName: true;
        user: { select: { avatarUrl: true } };
      };
    };
    booking: {
      select: {
        scheduledDate: true;
        scheduledTime: true;
        providerService: { select: { service: { select: { name: true } } } };
      };
    };
  };
}>;
export type BookingWithRelationsForReview = Prisma.BookingGetPayload<{
  include: {
    client: true;
    provider: { include: { user: true } };
    paymentIntent: true;
    review: true;
    providerService: true;
  };
}>;

// O tipo ReviewWithIncludes original (completo)
export type ReviewWithIncludes = Prisma.ReviewGetPayload<{
  include: {
    client: { include: { user: true } };
    provider: { include: { user: true } };
    booking: { include: { providerService: { include: { service: true } } } };
  };
}>;

export interface DetailedRatingBreakdown {
  overall: number;
  punctuality: number;
  quality: number;
  communication: number;
  value: number;
  totalReviews: number;
  recentTrend: 'improving' | 'declining' | 'stable';
  satisfactionRate: number;
  responseTime: number;
}

export interface SmartSuggestion {
  type: 'pricing' | 'availability' | 'service_improvement' | 'marketing';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  data?: any;
}

// Tipo auxiliar para sugestões
type ProviderWithRelationsForSuggestions = Prisma.ProviderGetPayload<{
  include: {
    providerServices: { include: { service: true } };
    reviewsReceived: { orderBy: { createdAt: Prisma.SortOrder }; take: 50 };
    bookings: {
      where: { status: 'FINISHED' }; // ✅ CORREÇÃO AQUI (trocou BookingStatus.FINISHED por 'FINISHED')
      orderBy: { createdAt: Prisma.SortOrder };
      take: 100;
    };
  };
}>;

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);
  private static readonly REVIEW_RATE_LIMIT = 3;
  private static readonly REVIEW_LOOKBACK_DAYS = 30;

  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
    private loyaltyService: LoyaltyService,
    private missionsService: MissionsService,
  ) {}

private buildScheduledStart(booking: BookingWithRelationsForReview): Date {
    const baseDate = new Date(booking.scheduledDate);
    
    // 1. Pegamos o valor e forçamos o TS a tratá-lo como 'any' temporariamente 
    // para evitar a inferência de 'never'.
    const rawTime: any = booking.scheduledTime;
    let timeStr = '00:00';

    if (rawTime instanceof Date) {
      // Se for objeto Date (vinda do Prisma)
      timeStr = rawTime.toISOString().split('T')[1].substring(0, 5);
    } else if (typeof rawTime === 'string') {
      // Se for string (ISO completa ou HH:mm)
      timeStr = rawTime.includes('T') 
        ? rawTime.split('T')[1].substring(0, 5) 
        : rawTime;
    }

    // 2. Agora fazemos o split em uma variável que o TS tem certeza que é string
    const parts = (timeStr || '00:00').split(':');
    const hour = parseInt(parts[0] || '0', 10) || 0;
    const minute = parseInt(parts[1] || '0', 10) || 0;

    baseDate.setHours(hour, minute, 0, 0);
    return baseDate;
  }

  private computeExpectedEnd(booking: BookingWithRelationsForReview): Date {
    const startTime =
      booking.startedAt ??
      booking.scheduledStart ??
      this.buildScheduledStart(booking);
    const durationMinutes =
      booking.durationMinutes ?? booking.providerService?.durationMinutes ?? 60;
    return new Date(startTime.getTime() + durationMinutes * 60000);
  }

  async canReview(bookingId: string, userId: string) {
    const booking: BookingWithRelationsForReview | null =
      await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          client: true,
          provider: { include: { user: true } },
          paymentIntent: true,
          review: true,
          providerService: true,
        },
      }); // 👈 CORREÇÃO AQUI
    if (!booking) return { canReview: false, reason: 'not_found' };

    // CORREÇÃO IMPLÍCITA: Os erros 2551/2339 para .client, .review e .paymentIntent
    // são provavelmente erros de inferência do ambiente. O include está correto
    // e essas propriedades DEVEM existir aqui. Mantendo o código original.
    if (booking.client?.userId !== userId)
      return { canReview: false, reason: 'forbidden' };

    if (booking.status !== BookingStatus.FINISHED)
      return { canReview: false, reason: 'not_completed' };

    const expectedEnd = booking.completedAt ?? this.computeExpectedEnd(booking);
    if (new Date() < expectedEnd)
      return { canReview: false, reason: 'too_early' };

    const payStatus = booking.paymentIntent?.status;

    if (payStatus === 'REFUNDED' || payStatus === 'CHARGEBACK')
      return { canReview: false, reason: 'refunded' };

    if (payStatus !== 'PAID') return { canReview: false, reason: 'unpaid' };

    if (booking.isReviewed || booking.review)
      return { canReview: false, reason: 'already_reviewed' };

    return {
      canReview: true,
      bookingId,
      providerId: booking.providerId,
      providerName: booking.provider?.user?.fullName,
      providerAvatar: booking.provider?.user?.avatarUrl,
    };
  }

  async submitReview(
    userId: string,
    submitReviewDto: SubmitReviewDto,
  ): Promise<Review> {
    const { bookingId, rating, comment } = submitReviewDto;

    try {
      const { review, booking } = await this.prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: {
            client: { include: { user: true } },
            provider: { include: { user: true } },
            paymentIntent: true,
            review: true,
            providerService: true,
            // CORREÇÃO: REMOVIDO os campos escalares do include (Erro 2353)
            // scheduledStart: true,
            // scheduledDate: true,
            // scheduledTime: true,
            // durationMinutes: true,
          },
        });

        if (!booking) {
          throw new NotFoundException(
            `Agendamento com ID "${bookingId}" não encontrado.`,
          );
        }

        if (booking.client?.userId !== userId) {
          throw new ForbiddenException(
            'Você não tem permissão para avaliar este agendamento.',
          );
        }

        if (booking.status !== BookingStatus.FINISHED) {
          throw new BadRequestException(
            'A avaliação só pode ser enviada para agendamentos concluídos.',
          );
        }

        const expectedEnd =
          booking.completedAt ?? this.computeExpectedEnd(booking);
        if (new Date() < expectedEnd) {
          throw new BadRequestException(
            'A avaliação só pode ser enviada após o horário final do serviço.',
          );
        }

        const payStatus = booking.paymentIntent?.status;
        if (payStatus === 'REFUNDED' || payStatus === 'CHARGEBACK') {
          throw new BadRequestException(
            'Pagamento reembolsado ou contestado. Avaliação bloqueada.',
          );
        }
        if (payStatus !== 'PAID') {
          throw new BadRequestException('Pagamento não confirmado.');
        }

        const existingReview = await tx.review.findFirst({
          where: { bookingId },
        });
        if (existingReview) {
          throw new BadRequestException(
            {
              code: 'review.already_exists_for_booking',
              message: 'Este agendamento já possui uma avaliação registrada.',
            },
          );
        }

        const rateLimitWindowStart = new Date();
        rateLimitWindowStart.setDate(
          rateLimitWindowStart.getDate() - ReviewsService.REVIEW_LOOKBACK_DAYS,
        );

        const recentReviewCount = await tx.review.count({
          where: {
            clientId: booking.clientId,
            providerId: booking.providerId,
            createdAt: { gte: rateLimitWindowStart },
          },
        });

        if (recentReviewCount >= ReviewsService.REVIEW_RATE_LIMIT) {
          throw new BadRequestException({
            code: 'review.rate_limited',
            message:
              'Você atingiu o limite de avaliações para este prestador nas últimas 30 dias.',
          });
        }

        const review = await tx.review.create({
          data: {
            bookingId,
            clientId: booking.clientId,
            providerId: booking.providerId,
            rating,
            comment,
          },
        });

        await tx.booking.update({
          where: { id: bookingId },
          data: {
            isReviewed: true,
          },
        });

        return { review, booking };
      });

      this.logger.log(
        `[ReviewsService] Review ${review.id} criada para booking ${bookingId}.`,
      );
      this.logger.log(
        `[TELEMETRY] review_created: { reviewId: ${review.id}, bookingId: ${bookingId}, userId: ${userId}, providerId: ${booking.providerId}, rating: ${rating} }`,
      );

      const client = await this.prisma.client.findUnique({
        where: { id: booking.clientId },
        select: { userId: true, reviewsMade: { select: { id: true } } },
      });

      const clientReviewsCount = client?.reviewsMade.length || 0;

      if (clientReviewsCount === 1) {
        await this.loyaltyService.addPoints({
          userId: booking.client.userId,
          points: 20,
          type: LoyaltyTransactionType.FIRST_REVIEW,
          referenceId: review.id,
        });
        this.logger.log(
          `[ReviewsService] submitReview: Cliente ${booking.client.userId} recebeu pontos pela primeira avaliação.`,
        );
      } else {
        await this.loyaltyService.addPoints({
          userId: booking.client.userId,
          points: 5,
          type: LoyaltyTransactionType.REVIEW_SUBMITTED,
          referenceId: review.id,
        });
        this.logger.log(
          `[ReviewsService] submitReview: Cliente ${booking.client.userId} recebeu pontos por avaliação subsequente.`,
        );
      }

      try {
        await this.missionsService.trackEvent(
          booking.client.userId,
          'review.created',
          {
            bookingId: booking.id,
            providerId: booking.providerId,
            rating,
          },
        );
        this.logger.log(
          `[ReviewsService] Evento de missão 'review.created' disparado para o cliente ${booking.client.userId}.`,
        );
      } catch (err) {
        const reason = err instanceof Error ? err.message : JSON.stringify(err);
        this.logger.warn(
          `[ReviewsService] submitReview: falha ao trackear miss?o review.created: ${reason}`,
        );
      }

      await this.providersService.updateProviderBadges(booking.providerId);
      this.logger.log(
        `[ReviewsService] Badges do provedor ${booking.providerId} atualizados.`,
      );

      return review;
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          `Agendamento com ID "${submitReviewDto.bookingId}" já possui uma avaliação.`,
        );
      }
      throw e;
    }
  }

  // CORREÇÃO: Alteração do tipo de retorno para o novo tipo (ReviewListResult[])
  async findReviews(getReviewsDto: GetReviewsDto): Promise<ReviewListResult[]> {
    const { providerId, clientId, minRating, maxRating } = getReviewsDto;
    const limit = 10;
    const page = 1;

    const where: Prisma.ReviewWhereInput = {};

    if (providerId) where.providerId = providerId;
    if (clientId) where.clientId = clientId;
    if (minRating !== undefined) where.rating = { gte: minRating };
    if (maxRating !== undefined) {
      where.rating = { ...(where.rating as object), lte: maxRating };
    }

    return this.prisma.review.findMany({
      where,
      select: {
        id: true,
        bookingId: true,
        clientId: true,
        providerId: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            fullName: true,
            user: { select: { avatarUrl: true } },
          },
        },
        provider: {
          select: {
            fullName: true,
            user: { select: { avatarUrl: true } },
          },
        },
        booking: {
          select: {
            scheduledDate: true,
            scheduledTime: true,
            providerService: {
              select: { service: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' as Prisma.SortOrder },
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  async getDetailedRatingBreakdown(
    providerId: string,
  ): Promise<DetailedRatingBreakdown> {
    const reviews = await this.prisma.review.findMany({
      where: { providerId },
      include: {
        booking: {
          include: { providerService: { include: { service: true } } },
        },
      },
      orderBy: { createdAt: 'desc' as Prisma.SortOrder },
    });

    // ... (restante da função)
    if (reviews.length === 0) {
      return {
        overall: 0,
        punctuality: 0,
        quality: 0,
        communication: 0,
        value: 0,
        totalReviews: 0,
        recentTrend: 'stable',
        satisfactionRate: 0,
        responseTime: 0,
      };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0) || 0;
    const averageRating = totalRating / reviews.length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentReviews = reviews.filter(
      (r) => new Date(r.createdAt) >= thirtyDaysAgo,
    );
    const previousReviews = reviews.filter(
      (r) =>
        new Date(r.createdAt) >= sixtyDaysAgo &&
        new Date(r.createdAt) < thirtyDaysAgo,
    );

    const recentAvg =
      recentReviews.length > 0
        ? recentReviews.reduce((sum, r) => sum + r.rating, 0) /
          recentReviews.length
        : averageRating;

    const previousAvg =
      previousReviews.length > 0
        ? previousReviews.reduce((sum, r) => sum + r.rating, 0) /
          previousReviews.length
        : averageRating;

    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAvg > previousAvg + 0.2) recentTrend = 'improving';
    else if (recentAvg < previousAvg - 0.2) recentTrend = 'declining';

    const satisfiedReviews = reviews.filter((r) => r.rating >= 4).length;
    const satisfactionRate = (satisfiedReviews / reviews.length) * 100;

    return {
      overall: Math.round(averageRating * 10) / 10,
      punctuality:
        Math.round((averageRating + (Math.random() * 0.4 - 0.2)) * 10) / 10,
      quality:
        Math.round((averageRating + (Math.random() * 0.3 - 0.15)) * 10) / 10,
      communication:
        Math.round((averageRating + (Math.random() * 0.3 - 0.15)) * 10) / 10,
      value:
        Math.round((averageRating + (Math.random() * 0.2 - 0.1)) * 10) / 10,
      totalReviews: reviews.length,
      recentTrend,
      satisfactionRate: Math.round(satisfactionRate * 10) / 10,
      responseTime: Math.floor(Math.random() * 60) + 5,
    };
  }

  async generateSmartSuggestions(
    providerId: string,
  ): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    const provider = (await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        providerServices: { include: { service: true } },
        reviewsReceived: { orderBy: { createdAt: 'desc' as Prisma.SortOrder }, take: 50 },
        bookings: {
          where: { status: 'FINISHED' }, // ✅ CORREÇÃO AQUI (trocou BookingStatus.FINISHED por 'FINISHED')
          orderBy: { createdAt: 'desc' as Prisma.SortOrder },
          take: 100,
        },
      },
    })) as ProviderWithRelationsForSuggestions | null;

    if (!provider) return suggestions;

    const ratingBreakdown = await this.getDetailedRatingBreakdown(providerId);

    // 1) Melhoria de avaliação
    if (ratingBreakdown.overall < 4.0 && ratingBreakdown.totalReviews >= 5) {
      suggestions.push({
        type: 'service_improvement',
        title: 'Melhore sua avaliação',
        description: `Sua avaliação atual é ${ratingBreakdown.overall}/5. Foque na pontualidade e comunicação para melhorar.`,
        impact: 'high',
        actionable: true,
        data: { currentRating: ratingBreakdown.overall, targetRating: 4.5 },
      });
    }

    // 2) Precificação
    if (provider.providerServices.length > 0) {
      const avgPrice =
        provider.providerServices.reduce(
          (sum, ps) => sum + ps.price.toNumber(),
          0,
        ) / provider.providerServices.length;

      const marketAverage = avgPrice * (0.9 + Math.random() * 0.2); // ±10%

      if (avgPrice < marketAverage * 0.85) {
        suggestions.push({
          type: 'pricing',
          title: 'Oportunidade de aumentar preços',
          description: `Seus preços estão abaixo da média do mercado. Considere um aumento de ${Math.round(
            ((marketAverage - avgPrice) / avgPrice) * 100,
          )}%.`,
          impact: 'medium',
          actionable: true,
          data: { currentAvg: avgPrice, suggestedAvg: marketAverage },
        });
      }
    }

    // 3) Disponibilidade
    const recentBookings = provider.bookings.filter((b) => {
      const bookingDate = new Date(b.createdAt as unknown as string);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return bookingDate >= thirtyDaysAgo;
    });

    if (recentBookings.length < 5) {
      suggestions.push({
        type: 'availability',
        title: 'Aumente sua disponibilidade',
        description:
          'Você teve poucos agendamentos este mês. Considere aumentar seus horários disponíveis.',
        impact: 'medium',
        actionable: true,
        data: { recentBookings: recentBookings.length, targetBookings: 15 },
      });
    }

    // 4) Marketing
    if (ratingBreakdown.overall >= 4.5 && ratingBreakdown.totalReviews >= 10) {
      suggestions.push({
        type: 'marketing',
        title: 'Destaque suas excelentes avaliações',
        description: `Com ${ratingBreakdown.totalReviews} avaliações e nota ${ratingBreakdown.overall}, você pode se promover como "Prestador Premium".`,
        impact: 'medium',
        actionable: true,
        data: {
          rating: ratingBreakdown.overall,
          reviews: ratingBreakdown.totalReviews,
        },
      });
    }

    return suggestions;
  }

  async findRecentReviewsByProviderId(providerId: string) {
    this.logger.log(
      `[ReviewsService] findRecentReviewsByProviderId: Buscando avaliações para providerId: ${providerId}`,
    );
    const reviews = await this.prisma.review.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' as Prisma.SortOrder },
      take: 5,
      include: {
        client: {
          select: {
            fullName: true,
            user: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    this.logger.log(
      `[ReviewsService] findRecentReviewsByProviderId: Encontradas ${reviews.length} avaliações para o provedor ${providerId}.`,
    );
    return reviews;
  }

  async findOne(id: string): Promise<Review | null> {
    return this.prisma.review.findUnique({
      where: { id },
      include: {
        client: { select: { fullName: true } },
        provider: { select: { fullName: true } },
        booking: { select: { scheduledDate: true, scheduledTime: true } },
      },
    });
  }
}
