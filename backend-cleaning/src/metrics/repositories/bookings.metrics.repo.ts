// src/metrics/repositories/bookings.metrics.repo.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MetricsGranularity } from '../dto/customer-metrics.query.dto';
import { BookingStatus } from '@prisma/client'; // Assumindo que BookingStatus está no seu schema Prisma

@Injectable()
export class BookingsMetricsRepository {
  constructor(private prisma: PrismaService) {}

  async countBookings(
    userId: string,
    from?: string,
    to?: string,
    status?: BookingStatus,
    hasPaymentIntent?: boolean, // Para o funil
  ): Promise<number> {
    // CORREÇÃO: Alterado customerId para client: { userId: userId }
    const where: any = { client: { userId: userId } };

    if (from && to) {
      where.createdAt = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }
    if (status) {
      where.status = status;
    }
    if (hasPaymentIntent !== undefined) {
      // Isso é um proxy. Idealmente, você teria um campo ou um evento para 'start_checkout'
      where.paymentIntent = hasPaymentIntent ? { isNot: null } : null; // Usar 'isNot' para verificar se a relação existe
    }

    return this.prisma.booking.count({ where });
  }

  async getBookingCountsByGranularity(
    userId: string,
    from: string,
    to: string,
    granularity: MetricsGranularity,
  ) {
    // Exemplo de agregação por dia. Outras granularidades exigiriam ajustes na query.
    // O Prisma não tem funções de data nativas para agrupar por semana/mês diretamente em todos os bancos.
    // Para PostgreSQL, você usaria DATE_TRUNC.
    // Este é um exemplo simplificado que pode precisar de mais lógica para diferentes DBs.

    const result = await this.prisma.booking.groupBy({
      by: ['createdAt'], // Isso agrupará por data completa, não apenas dia/mês/ano
      _count: {
        id: true,
      },
      where: {
        // CORREÇÃO: Alterado customerId para client: { userId: userId }
        client: {
          userId: userId,
        },
        createdAt: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Você precisaria de lógica de pós-processamento para agrupar corretamente por dia/semana/mês
    // e preencher lacunas de datas.
    return result.map((item) => ({
      date: item.createdAt.toISOString().split('T')[0], // Apenas a parte da data
      count: item._count.id,
    }));
  }
}
