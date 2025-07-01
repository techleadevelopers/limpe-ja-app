import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// Importa BookingStatus, Prisma e TransactionType do schema ATUAL (com PAYMENT, WITHDRAWAL, COMMISSION)
import { BookingStatus, Prisma, TransactionType } from '@prisma/client';
import { ProvidersService } from '../providers/providers.service'; // Para obter dados do provedor
import { EarningsResponseDto, WithdrawalRequestDto, WithdrawalResponseDto } from './dto/earnings.dto';

@Injectable()
export class EarningsService {
  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
  ) {}

  async getEarnings(userId: string): Promise<EarningsResponseDto> {
    const provider = await this.providersService.findByUserId(userId);
    if (!provider) {
      throw new NotFoundException('Provedor não encontrado.');
    }

    // Calcular totalEarnings e availableForWithdrawal diretamente das transações
    // do provedor, já que não há um modelo 'Wallet' separado.
    const completedBookings = await this.prisma.booking.findMany({
      where: {
        providerId: provider.id,
        status: BookingStatus.COMPLETED, // Apenas agendamentos concluídos geram ganhos
      },
      select: {
        totalPrice: true,
      },
    });

    const totalEarnings = completedBookings.reduce((sum, booking) =>
      sum + booking.totalPrice.toNumber(), 0);

    // Buscar transações de saque pendentes
    const pendingWithdrawalsTransactions = await this.prisma.transaction.findMany({
      where: {
        providerId: provider.id,
        type: TransactionType.WITHDRAWAL,
        status: 'PENDING', // Assumindo que 'status' é string no seu Transaction anterior
      },
      select: {
        amount: true,
      },
    });

    const pendingWithdrawals = pendingWithdrawalsTransactions.reduce((sum, trans) =>
      sum + trans.amount.toNumber(), 0);

    // Calcular availableForWithdrawal: Total de ganhos - total de saques (concluídos e pendentes)
    const allWithdrawals = await this.prisma.transaction.findMany({
      where: {
        providerId: provider.id,
        type: TransactionType.WITHDRAWAL,
      },
      select: {
        amount: true,
      },
    });

    const totalWithdrawn = allWithdrawals.reduce((sum, trans) =>
      sum + trans.amount.toNumber(), 0);

    const availableForWithdrawal = totalEarnings - totalWithdrawn;
    // Garante que o valor disponível não seja negativo
    const actualAvailableForWithdrawal = Math.max(0, availableForWithdrawal);


    // Buscando transações recentes associadas a este provedor
    // No schema anterior, Transaction tem 'providerId' e não 'senderId'/'receiverId'
    const recentTransactions = await this.prisma.transaction.findMany({
      where: {
        providerId: provider.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Por exemplo, as 10 transações mais recentes
    });

    // Calcular earningsBreakdown (exemplo simplificado: por mês)
    const earningsBreakdown: { [period: string]: number } = {};
    const now = new Date(); // Definido 'now' aqui
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const monthlyEarningsTransactions = await this.prisma.transaction.findMany({
      where: {
        providerId: provider.id,
        type: TransactionType.PAYMENT, // Provedor recebe PAYMENT
        createdAt: { gte: twelveMonthsAgo },
      },
      orderBy: { createdAt: 'asc' }
    });

    monthlyEarningsTransactions.forEach(trans => {
      const monthYear = trans.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
      earningsBreakdown[monthYear] = (earningsBreakdown[monthYear] || 0) + trans.amount.toNumber();
    });

    return {
      totalEarnings,
      availableForWithdrawal: actualAvailableForWithdrawal,
      pendingWithdrawals,
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        amount: t.amount.toNumber(),
        type: t.type as 'PAYMENT' | 'WITHDRAWAL' | 'COMMISSION', // Cast para os tipos do DTO
        description: t.description || 'N/A',
        date: t.createdAt,
      })),
      earningsBreakdown,
    };
  }

  async requestWithdrawal(userId: string, withdrawalDto: WithdrawalRequestDto): Promise<WithdrawalResponseDto> {
    const provider = await this.providersService.findByUserId(userId);
    if (!provider) {
      throw new NotFoundException('Provedor não encontrado.');
    }

    // Utiliza uma transação Prisma para garantir a atomicidade da operação.
    // Isso é crucial para a robustez financeira.
    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        // Recalcular o saldo disponível para saque dentro da transação para garantir que seja o mais atualizado.
        const completedBookings = await prisma.booking.findMany({
          where: {
            providerId: provider.id,
            status: BookingStatus.COMPLETED,
          },
          select: {
            totalPrice: true,
          },
        });
        const totalEarnings = completedBookings.reduce((sum, booking) =>
          sum + booking.totalPrice.toNumber(), 0);

        const allWithdrawals = await prisma.transaction.findMany({
          where: {
            providerId: provider.id,
            type: TransactionType.WITHDRAWAL,
            // Inclua transações com status 'REQUESTED' ou 'PENDING' na soma de 'totalWithdrawn'
            // para evitar que o provedor solicite saques de valores que já estão em processo de retirada.
            // Exemplo: status: { in: ['REQUESTED', 'PENDING', 'COMPLETED'] }
          },
          select: {
            amount: true,
          },
        });
        const totalWithdrawn = allWithdrawals.reduce((sum, trans) =>
          sum + trans.amount.toNumber(), 0);

        const availableBalance = totalEarnings - totalWithdrawn;

        if (availableBalance < withdrawalDto.amount) {
          throw new BadRequestException('Saldo insuficiente para saque.');
        }

        if (withdrawalDto.amount <= 0) {
          throw new BadRequestException('O valor do saque deve ser maior que zero.');
        }

        // Criar a transação de saque.
        const withdrawalTransaction = await prisma.transaction.create({
          data: {
            providerId: provider.id,
            amount: new Prisma.Decimal(withdrawalDto.amount),
            type: TransactionType.WITHDRAWAL,
            description: `Solicitação de saque para ${withdrawalDto.withdrawalAccountInfo || 'conta padrão'}`,
            status: 'PENDING', // Status inicial para saque, aguardando processamento administrativo
          },
        });

        return { success: true, message: 'Solicitação de saque enviada com sucesso!', transactionId: withdrawalTransaction.id };
      });
      return result;
    } catch (error) {
      console.error('Erro ao criar transação de saque:', error);
      // Re-lança o erro original se for um BadRequestException
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Não foi possível processar a solicitação de saque.');
    }
  }
}