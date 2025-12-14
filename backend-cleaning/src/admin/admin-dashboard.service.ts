import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, UserRole, VerificationStatus } from '@prisma/client';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics() {
    const [
      activeUsers,
      approvedProviders,
      completedBookings,
      pendingVerifications,
      revenueSum,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { role: UserRole.CLIENT, isVerified: true },
      }),
      this.prisma.provider.count({
        where: { verificationStatus: VerificationStatus.APPROVED },
      }),
      this.prisma.booking.count({ where: { status: BookingStatus.FINISHED } }),
      this.prisma.provider.count({
        where: {
          verificationStatus: {
            in: [
              VerificationStatus.PENDING_DOCUMENTS_UPLOAD,
              VerificationStatus.PENDING_MANUAL_REVIEW,
              VerificationStatus.PENDING_INITIAL_REVIEW,
              VerificationStatus.PENDING_BACKGROUND_CHECK,
            ],
          },
        },
      }),
      this.prisma.booking.aggregate({
        where: { status: BookingStatus.FINISHED },
        _sum: { totalPrice: true },
      }),
    ]);

    const totalRevenue = revenueSum._sum.totalPrice
      ? Number(revenueSum._sum.totalPrice)
      : 0;

    return {
      activeUsers,
      approvedProviders,
      servicesBooked: completedBookings,
      totalRevenue,
      pendingVerifications,
    };
  }

  async getRevenueTrend(months: number = 12) {
    const clampedMonths = Math.max(1, Math.min(months, 24));
    const now = new Date();
    const startMonth = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - (clampedMonths - 1),
        1,
      ),
    );

    const completedBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.FINISHED,
        createdAt: { gte: startMonth },
      },
      select: { totalPrice: true, createdAt: true },
    });

    const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
    const buckets = new Map<string, { month: string; revenue: number }>();

    for (let i = 0; i < clampedMonths; i += 1) {
      const bucketDate = new Date(
        Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() + i, 1),
      );
      const key = `${bucketDate.getUTCFullYear()}-${bucketDate.getUTCMonth()}`;
      buckets.set(key, { month: formatter.format(bucketDate), revenue: 0 });
    }

    completedBookings.forEach((booking) => {
      const createdAt =
        booking.createdAt instanceof Date
          ? booking.createdAt
          : new Date(booking.createdAt);
      const key = `${createdAt.getUTCFullYear()}-${createdAt.getUTCMonth()}`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.revenue += Number(booking.totalPrice ?? 0);
      }
    });

    return Array.from(buckets.values());
  }
}
