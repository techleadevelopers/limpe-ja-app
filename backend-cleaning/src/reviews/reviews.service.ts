// src/reviews/reviews.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { GetReviewsDto } from './dto/get-reviews.dto';
import { Review, BookingStatus } from '@prisma/client';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private bookingsService: BookingsService,
  ) {}

  async submitReview(clientId: string, submitReviewDto: SubmitReviewDto): Promise<Review> {
    const { bookingId, rating, comment } = submitReviewDto;

    // 1. Verificar se o agendamento existe e carregar as relações client e provider
    const booking = await this.bookingsService.findOne(bookingId);
    if (!booking) {
      throw new NotFoundException(`Agendamento com ID "${bookingId}" não encontrado.`);
    }

    // 2. Verificar se o cliente que está enviando a avaliação é o cliente do agendamento
    // Agora booking.client existe e tem a propriedade id
    if (booking.client.id !== clientId) { // <-- AGORA ESTÁ CORRETO
      throw new ForbiddenException('Você não tem permissão para avaliar este agendamento.');
    }

    // 3. Verificar se o agendamento está no status 'COMPLETED'
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('A avaliação só pode ser enviada para agendamentos concluídos.');
    }

    // 4. Verificar se o agendamento já possui uma avaliação
    // booking.review agora será populado se houver uma review
    if (booking.review) { // <-- AGORA ESTÁ CORRETO
      throw new ConflictException(`Agendamento com ID "${bookingId}" já possui uma avaliação.`);
    }

    // 5. Criar a avaliação
    return this.prisma.review.create({
      data: {
        bookingId,
        clientId: booking.client.id, // <-- AGORA ESTÁ CORRETO
        providerId: booking.provider.id, // <-- AGORA ESTÁ CORRETO
        rating,
        comment,
      },
    });
  }

  async findReviews(getReviewsDto: GetReviewsDto): Promise<Review[]> {
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

    return this.prisma.review.findMany({
      where,
      include: {
        client: { select: { fullName: true } },
        provider: { select: { fullName: true } },
        booking: { select: { scheduledDate: true, scheduledTime: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
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