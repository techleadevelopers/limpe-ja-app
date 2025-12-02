// src/metrics/repositories/payments.metrics.repo.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MetricsGranularity } from '../dto/customer-metrics.query.dto';
import { PaymentIntentStatus } from '@prisma/client'; // Assumindo que PaymentIntentStatus está no seu schema Prisma

@Injectable()
export class PaymentsMetricsRepository {
  constructor(private prisma: PrismaService) {}

  async getTotalSpent(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<number> {
    const where: any = {
      // CORREÇÃO: Usar client.userId para filtrar pelo ID do usuário do cliente
      booking: {
        client: {
          userId: userId,
        },
      },
      status: PaymentIntentStatus.PAID, // Apenas pagamentos concluídos
    };

    if (from && to) {
      where.createdAt = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const result = await this.prisma.paymentIntent.aggregate({
      _sum: {
        amountCents: true,
      },
      where,
    });

    return result._sum.amountCents || 0;
  }

  async countPaymentIntents(userId: string): Promise<number> {
    return this.prisma.paymentIntent.count({
      where: {
        // CORREÇÃO: Usar client.userId
        booking: {
          client: {
            userId: userId,
          },
        },
      },
    });
  }

  async countPaidPayments(userId: string): Promise<number> {
    return this.prisma.paymentIntent.count({
      where: {
        // CORREÇÃO: Usar client.userId
        booking: {
          client: {
            userId: userId,
          },
        },
        status: PaymentIntentStatus.PAID,
      },
    });
  }

  async getTotalSpentByGranularity(
    userId: string,
    from: string,
    to: string,
    granularity: MetricsGranularity,
  ) {
    // Similar ao BookingsMetricsRepository, a agregação por granularidade precisa de lógica específica
    // para o banco de dados (e.g., DATE_TRUNC no PostgreSQL) ou pós-processamento.
    const result = await this.prisma.paymentIntent.groupBy({
      by: ['createdAt'], // Nota: 'createdAt' aqui é um campo DateTime. Para agrupar por dia/mês/ano, você precisaria de funções de banco de dados ou pós-processamento.
      _sum: {
        amountCents: true,
      },
      where: {
        // CORREÇÃO: Usar client.userId
        booking: {
          client: {
            userId: userId,
          },
        },
        status: PaymentIntentStatus.PAID,
        createdAt: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return result.map((item) => ({
      date: item.createdAt.toISOString().split('T')[0], // Isso assume que createdAt é uma data e você quer a parte da data
      total_spent_centavos: item._sum.amountCents || 0,
    }));
  }
}
