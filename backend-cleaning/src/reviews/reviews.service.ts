// src/reviews/reviews.service.ts
import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { GetReviewsDto } from './dto/get-reviews.dto';
import { Review, BookingStatus, Prisma } from '@prisma/client';
import { BookingsService } from '../bookings/bookings.service'; // ADICIONADO: Importação do BookingsService
import { ProvidersService } from '../providers/providers.service'; // NEW: Import ProvidersService

// Importar LoyaltyService e LoyaltyTransactionType
import { LoyaltyService } from '../loyalty/loyalty.service'; // <--- NOVA LINHA
import { LoyaltyTransactionType } from '@prisma/client'; // <--- NOVA LINHA: Assumindo que LoyaltyTransactionType está no seu schema.prisma


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

// NOVO TIPO: Para o provider na geração de sugestões inteligentes
type ProviderWithRelationsForSuggestions = Prisma.ProviderGetPayload<{
  include: {
    providerServices: { include: { service: true } };
    reviewsReceived: { orderBy: { createdAt: 'desc' }; take: 50; }; // Include reviewsReceived with order and limit
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
    private bookingsService: BookingsService, // ADICIONADO: Injetar BookingsService
    private providersService: ProvidersService, // NEW: Inject ProvidersService
    private loyaltyService: LoyaltyService, // <--- NOVA LINHA: Injetar LoyaltyService
  ) {}

  async submitReview(clientId: string, submitReviewDto: SubmitReviewDto): Promise<Review> {
    const { bookingId, rating, comment } = submitReviewDto;

    const booking = await this.bookingsService.findOne(bookingId);
    if (!booking) {
      throw new NotFoundException(`Agendamento com ID "${bookingId}" não encontrado.`);
    }

    // Assumindo que booking.client.id existe e é acessível.
    // Se booking.client não for carregado por findOne, você precisará ajustar o BookingsService.
    // Para este exemplo, vamos assumir que booking.client está disponível.
    if (booking.clientId !== clientId) { // Usar booking.clientId diretamente
      throw new ForbiddenException('Você não tem permissão para avaliar este agendamento.');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('A avaliação só pode ser enviada para agendamentos concluídos.');
    }

    // Verificar se já existe uma avaliação para este booking
    const existingReview = await this.prisma.review.findUnique({
      where: { bookingId: bookingId },
    });

    if (existingReview) {
      throw new ConflictException(`Agendamento com ID "${bookingId}" já possui uma avaliação.`);
    }

    // Increment fiveStarReviewCount if rating is 5 - This logic is now handled by ProvidersService.updateProviderBadges
    // if (rating === 5) {
    //   await this.prisma.provider.update({
    //     where: { id: booking.providerId },
    //     data: { fiveStarReviewCount: { increment: 1 } },
    //   });
    // }

    const review = await this.prisma.review.create({
      data: {
        bookingId,
        clientId: booking.clientId, // Usar booking.clientId
        providerId: booking.providerId, // Usar booking.providerId
        rating,
        comment,
      },
    });

    // ADICIONAR PONTOS PELA AVALIAÇÃO
    // Verificar se é a primeira avaliação do cliente para dar mais pontos
    const clientReviewsCount = await this.prisma.review.count({
      where: { clientId: booking.clientId },
    });

    if (clientReviewsCount === 1) { // Se for a primeira avaliação do cliente
      await this.loyaltyService.addPoints({
        userId: booking.client.userId,
        points: 20, // Exemplo: +20 pontos pela primeira avaliação
        type: LoyaltyTransactionType.FIRST_REVIEW,
        referenceId: review.id,
      });
      this.logger.log(`[ReviewsService] submitReview: Cliente ${booking.client.userId} recebeu pontos pela primeira avaliação.`);
    } else {
      await this.loyaltyService.addPoints({
        userId: booking.client.userId,
        points: 5, // Exemplo: +5 pontos por avaliações subsequentes
        type: LoyaltyTransactionType.REVIEW_SUBMITTED,
        referenceId: review.id,
      });
      this.logger.log(`[ReviewsService] submitReview: Cliente ${booking.client.userId} recebeu pontos por avaliação subsequente.`);
    }

    // NEW: Trigger provider badge update after a new review is created
    await this.providersService.updateProviderBadges(booking.providerId);

    return review;
  }

  async findReviews(getReviewsDto: GetReviewsDto): Promise<ReviewWithIncludes[]> {
    const { providerId, clientId, minRating, maxRating } = getReviewsDto; // Ajustado para GetReviewsDto
    const limit = 10; // Valor padrão, ou adicione ao DTO se necessário
    const page = 1;   // Valor padrão, ou adicione ao DTO se necessário

    const where: Prisma.ReviewWhereInput = {};

    if (providerId) {
      where.providerId = providerId;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

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

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Calcular tendência recente (últimos 30 dias vs 30 dias anteriores)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentReviews = reviews.filter(r => new Date(r.createdAt) >= thirtyDaysAgo);
    const previousReviews = reviews.filter(r =>
      new Date(r.createdAt) >= sixtyDaysAgo && new Date(r.createdAt) < thirtyDaysAgo
    );

    const recentAvg = recentReviews.length > 0
      ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
      : averageRating;

    const previousAvg = previousReviews.length > 0
      ? previousReviews.reduce((sum, r) => sum + r.rating, 0) / previousReviews.length
      : averageRating;

    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAvg > previousAvg + 0.2) recentTrend = 'improving';
    else if (recentAvg < previousAvg - 0.2) recentTrend = 'declining';

    // Taxa de satisfação (reviews >= 4 estrelas)
    const satisfiedReviews = reviews.filter(r => r.rating >= 4).length;
    const satisfactionRate = (satisfiedReviews / reviews.length) * 100;

    return {
      overall: Math.round(averageRating * 10) / 10,
      punctuality: Math.round((averageRating + (Math.random() * 0.4 - 0.2)) * 10) / 10, // Simulado
      quality: Math.round((averageRating + (Math.random() * 0.3 - 0.15)) * 10) / 10, // Simulado
      communication: Math.round((averageRating + (Math.random() * 0.3 - 0.15)) * 10) / 10, // Simulado
      value: Math.round((averageRating + (Math.random() * 0.2 - 0.1)) * 10) / 10, // Simulado
      totalReviews: reviews.length,
      recentTrend,
      satisfactionRate: Math.round(satisfactionRate * 10) / 10,
      responseTime: Math.floor(Math.random() * 60) + 5, // Simulado - tempo em minutos
    };
  }

  async generateSmartSuggestions(providerId: string): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    // Buscar dados do provedor e reviews
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        providerServices: { include: { service: true } },
        reviewsReceived: { orderBy: { createdAt: 'desc' }, take: 50 }, // CORRIGIDO: reviews para reviewsReceived
        bookings: {
          where: { status: BookingStatus.COMPLETED },
          orderBy: { createdAt: 'desc' },
          take: 100
        },
      },
    }) as ProviderWithRelationsForSuggestions; // ADICIONADO: Cast para o tipo auxiliar

    if (!provider) return suggestions;

    const ratingBreakdown = await this.getDetailedRatingBreakdown(providerId);

    // Sugestão 1: Melhoria de avaliação
    if (ratingBreakdown.overall < 4.0 && ratingBreakdown.totalReviews >= 5) {
      suggestions.push({
        type: 'service_improvement',
        title: 'Melhore sua avaliação',
        description: `Sua avaliação atual é ${ratingBreakdown.overall}/5. Foque na pontualidade e comunicação para melhorar.`,
        impact: 'high',
        actionable: true,
        data: { currentRating: ratingBreakdown.overall, targetRating: 4.5 }
      });
    }

    // Sugestão 2: Precificação inteligente
    if (provider.providerServices.length > 0) {
      const avgPrice = provider.providerServices.reduce((sum, ps) => sum + ps.price.toNumber(), 0) / provider.providerServices.length;

      // Simular análise de mercado
      const marketAverage = avgPrice * (0.9 + Math.random() * 0.2); // ±10%

      if (avgPrice < marketAverage * 0.85) {
        suggestions.push({
          type: 'pricing',
          title: 'Oportunidade de aumentar preços',
          description: `Seus preços estão abaixo da média do mercado. Considere um aumento de ${Math.round(((marketAverage - avgPrice) / avgPrice) * 100)}%.`,
          impact: 'medium',
          actionable: true,
          data: { currentAvg: avgPrice, suggestedAvg: marketAverage }
        });
      }
    }

    // Sugestão 3: Disponibilidade otimizada
    const recentBookings = provider.bookings.filter(b => {
      const bookingDate = new Date(b.createdAt);
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
        data: { recentBookings: recentBookings.length, targetBookings: 15 }
      });
    }

    // Sugestão 4: Marketing baseado em reviews
    if (ratingBreakdown.overall >= 4.5 && ratingBreakdown.totalReviews >= 10) {
      suggestions.push({
        type: 'marketing',
        title: 'Destaque suas excelentes avaliações',
        description: `Com ${ratingBreakdown.totalReviews} avaliações e nota ${ratingBreakdown.overall}, você pode se promover como "Prestador Premium".`,
        impact: 'medium',
        actionable: true,
        data: { rating: ratingBreakdown.overall, reviews: ratingBreakdown.totalReviews }
      });
    }

    return suggestions;
  }

  async findRecentReviewsByProviderId(providerId: string) {
    this.logger.log(`[ReviewsService] findRecentReviewsByProviderId: Buscando avaliações para providerId: ${providerId}`);
    const reviews = await this.prisma.review.findMany({
      where: { providerId: providerId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        client: {
          select: {
            fullName: true,
            user: { // Inclua a relação 'user' dentro de 'client'
              select: {
                avatarUrl: true, // Selecione 'avatarUrl' do 'user'
              },
            },
          },
        },
      },
    });
    this.logger.log(`[ReviewsService] findRecentReviewsByProviderId: Encontradas ${reviews.length} avaliações para o provedor ${providerId}.`);
    return reviews;
  }

  async findOne(id: string): Promise<Review | null> {
    return this.prisma.review.findUnique({
      where: { id },
      include: {
        client: { select: { fullName: true } }, // Aqui você pode não precisar do avatarUrl se findOne não for para exibição completa
        provider: { select: { fullName: true } },
        booking: { select: { scheduledDate: true, scheduledTime: true } },
      },
    });
  }
}