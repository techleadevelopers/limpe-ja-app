// src/reviews/reviews.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { GetReviewsDto } from './dto/get-reviews.dto';
import { Review, BookingStatus, Prisma } from '@prisma/client';
import { BookingsService } from '../bookings/bookings.service';
import { ProvidersService } from '../providers/providers.service';

// Loyalty
import { LoyaltyService } from '../loyalty/loyalty.service';
import { LoyaltyTransactionType } from '@prisma/client';

// Missions
import { MissionsService } from '../missions/missions.service';

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
    reviewsReceived: { orderBy: { createdAt: 'desc' }; take: 50 };
    bookings: {
      where: { status: 'COMPLETED' };
      orderBy: { createdAt: 'desc' };
      take: 100;
    };
  };
}>;

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private prisma: PrismaService,
    private bookingsService: BookingsService,
    private providersService: ProvidersService,
    private loyaltyService: LoyaltyService,
    private missionsService: MissionsService,
  ) {}

  async submitReview(clientId: string, submitReviewDto: SubmitReviewDto): Promise<Review> {
    const { bookingId, rating, comment } = submitReviewDto;

    const booking = await this.bookingsService.findOne(bookingId); // findOne já inclui client e provider
    if (!booking) {
      throw new NotFoundException(`Agendamento com ID "${bookingId}" não encontrado.`);
    }

    // Garantir que a review é do cliente certo
    if (booking.clientId !== clientId) {
      throw new ForbiddenException('Você não tem permissão para avaliar este agendamento.');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('A avaliação só pode ser enviada para agendamentos concluídos.');
    }

    // Impedir review duplicada
    const existingReview = await this.prisma.review.findUnique({
      where: { bookingId },
    });
    if (existingReview) {
      throw new ConflictException(`Agendamento com ID "${bookingId}" já possui uma avaliação.`);
    }

    // Criar review
    const review = await this.prisma.review.create({
      data: {
        bookingId,
        clientId: booking.clientId,
        providerId: booking.providerId,
        rating,
        comment,
      },
    });

    this.logger.log(`[ReviewsService] Review ${review.id} criada para booking ${bookingId}.`);
    // Telemetria: review_created
    this.logger.log(`[TELEMETRY] review_created: { reviewId: ${review.id}, bookingId: ${bookingId}, clientId: ${clientId}, providerId: ${booking.providerId}, rating: ${rating} }`);


    // Fidelidade (pontos)
    // Usar o completedBookingsCount do Client para verificar se é a primeira review
    const client = await this.prisma.client.findUnique({
      where: { id: booking.clientId },
      select: { userId: true, reviewsMade: { select: { id: true } } } // Incluir reviewsMade para contar
    });

    const clientReviewsCount = client?.reviewsMade.length || 0;

    if (clientReviewsCount === 1) { // Se esta é a primeira review do cliente
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

    // >>> MISSIONS: Track event "review.created" para o cliente
    try {
      await this.missionsService.trackEvent(booking.client.userId, 'review.created', {
        bookingId: booking.id,
        providerId: booking.providerId,
        rating,
      });
      this.logger.log(`[ReviewsService] Evento de missão 'review.created' disparado para o cliente ${booking.client.userId}.`);
    } catch (e) {
      this.logger.warn(`[ReviewsService] submitReview: falha ao trackear missão review.created: ${e?.message || e}`);
    }

    // Atualizar badges do provedor (mantido)
    await this.providersService.updateProviderBadges(booking.providerId);
    this.logger.log(`[ReviewsService] Badges do provedor ${booking.providerId} atualizados.`);

    return review;
  }

  async findReviews(getReviewsDto: GetReviewsDto): Promise<ReviewWithIncludes[]> {
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
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        booking: { include: { providerService: { include: { service: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  async getDetailedRatingBreakdown(providerId: string): Promise<DetailedRatingBreakdown> {
    const reviews = await this.prisma.review.findMany({
      where: { providerId },
      include: {
        booking: { include: { providerService: { include: { service: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

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

    const recentReviews = reviews.filter(r => new Date(r.createdAt) >= thirtyDaysAgo);
    const previousReviews = reviews.filter(
      r => new Date(r.createdAt) >= sixtyDaysAgo && new Date(r.createdAt) < thirtyDaysAgo,
    );

    const recentAvg =
      recentReviews.length > 0
        ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
        : averageRating;

    const previousAvg =
      previousReviews.length > 0
        ? previousReviews.reduce((sum, r) => sum + r.rating, 0) / previousReviews.length
        : averageRating;

    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAvg > previousAvg + 0.2) recentTrend = 'improving';
    else if (recentAvg < previousAvg - 0.2) recentTrend = 'declining';

    const satisfiedReviews = reviews.filter(r => r.rating >= 4).length;
    const satisfactionRate = (satisfiedReviews / reviews.length) * 100;

    return {
      overall: Math.round(averageRating * 10) / 10,
      punctuality: Math.round((averageRating + (Math.random() * 0.4 - 0.2)) * 10) / 10,
      quality: Math.round((averageRating + (Math.random() * 0.3 - 0.15)) * 10) / 10,
      communication: Math.round((averageRating + (Math.random() * 0.3 - 0.15)) * 10) / 10,
      value: Math.round((averageRating + (Math.random() * 0.2 - 0.1)) * 10) / 10,
      totalReviews: reviews.length,
      recentTrend,
      satisfactionRate: Math.round(satisfactionRate * 10) / 10,
      responseTime: Math.floor(Math.random() * 60) + 5,
    };
  }

  async generateSmartSuggestions(providerId: string): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    const provider = (await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        providerServices: { include: { service: true } },
        reviewsReceived: { orderBy: { createdAt: 'desc' }, take: 50 },
        bookings: {
          where: { status: BookingStatus.COMPLETED },
          orderBy: { createdAt: 'desc' },
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
        provider.providerServices.reduce((sum, ps) => sum + ps.price.toNumber(), 0) /
        provider.providerServices.length;

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
    const recentBookings = provider.bookings.filter(b => {
      const bookingDate = new Date(b.createdAt as unknown as string);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return bookingDate >= thirtyDaysAgo;
    });

    if (recentBookings.length < 5) {
      suggestions.push({
        type: 'availability',
        title: 'Aumente sua disponibilidade',
        description: 'Você teve poucos agendamentos este mês. Considere aumentar seus horários disponíveis.',
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
        data: { rating: ratingBreakdown.overall, reviews: ratingBreakdown.totalReviews },
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
      orderBy: { createdAt: 'desc' },
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