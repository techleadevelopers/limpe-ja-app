// src/reviews/reviews.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { GetReviewsDto } from './dto/get-reviews.dto';
import { Review, BookingStatus } from '@prisma/client';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private prisma: PrismaService,
    private bookingsService: BookingsService,
  ) {}

  async submitReview(clientId: string, submitReviewDto: SubmitReviewDto): Promise<Review> {
    const { bookingId, rating, comment } = submitReviewDto;

    const booking = await this.bookingsService.findOne(bookingId);
    if (!booking) {
      throw new NotFoundException(`Agendamento com ID "${bookingId}" não encontrado.`);
    }

    if (booking.client.id !== clientId) {
      throw new ForbiddenException('Você não tem permissão para avaliar este agendamento.');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('A avaliação só pode ser enviada para agendamentos concluídos.');
    }

    if (booking.review) {
      throw new ConflictException(`Agendamento com ID "${bookingId}" já possui uma avaliação.`);
    }

    return this.prisma.review.create({
      data: {
        bookingId,
        clientId: booking.client.id,
        providerId: booking.provider.id,
        rating,
        comment,
      },
    });
  }

  async findReviews(getReviewsDto: GetReviewsDto) {
    const { providerId, clientId, minRating, maxRating } = getReviewsDto;
    const where: any = {};

    if (providerId) {
      where.providerId = providerId;
    }
    if (clientId) {
      where.clientId = clientId;
    }
    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {};
      if (minRating !== undefined) {
        where.rating.gte = minRating;
      }
      if (maxRating !== undefined) {
        where.rating.lte = maxRating;
      }
    }

    const reviews = await this.prisma.review.findMany({
      where,
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
        provider: { select: { fullName: true } },
        booking: { select: { scheduledDate: true, scheduledTime: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reviews;
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