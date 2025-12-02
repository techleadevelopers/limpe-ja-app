// src/metrics/repositories/reviews.metrics.repo.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsMetricsRepository {
  constructor(private prisma: PrismaService) {}

  async getAverageRating(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<number> {
    const where: any = { customerId: userId };

    if (from && to) {
      where.createdAt = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const result = await this.prisma.review.aggregate({
      _avg: {
        rating: true,
      },
      where,
    });

    return result._avg.rating || 0;
  }
}
