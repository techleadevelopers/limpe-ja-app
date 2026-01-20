import { LedgerEntryType, Prisma } from '@prisma/client';
import { EarningsService } from './earnings.service';

describe('EarningsService getEarnings', () => {
  const recentEntries = [
    {
      id: 'recent-1',
      amount: new Prisma.Decimal(150),
      type: LedgerEntryType.WITHDRAWAL,
      note: 'withdrawal',
      createdAt: new Date('2025-02-01T12:00:00Z'),
    },
  ];

  const earningEntries = [
    {
      id: 'earning-1',
      amount: new Prisma.Decimal(500),
      type: LedgerEntryType.EARNING,
      note: 'earning',
      createdAt: new Date('2025-01-01T12:00:00Z'),
    },
  ];

  const createFindManyMock = () =>
    jest.fn(async ({ where }: { where: any }) => {
      if (where?.type === LedgerEntryType.EARNING) {
        return earningEntries;
      }
      return recentEntries;
    });

  const createAggregateMock = (grossAmount: number, availableAmount: number) =>
    jest.fn(async ({ where }: { where: any }) => {
      if (where.type === LedgerEntryType.HOLD) {
        return {
          _sum: { amount: new Prisma.Decimal(grossAmount) },
        };
      }
      const typeIn = where.type?.in;
      if (Array.isArray(typeIn)) {
        return {
          _sum: { amount: new Prisma.Decimal(availableAmount) },
        };
      }
      return { _sum: { amount: new Prisma.Decimal(0) } };
    });

  const createService = (grossAmount: number, availableAmount: number) => {
    const aggregateMock = createAggregateMock(grossAmount, availableAmount);
    const findManyMock = createFindManyMock();
    const prismaMock = {
      ledgerEntry: {
        aggregate: aggregateMock,
        findMany: findManyMock,
      },
    };
    const providersServiceMock = {
      findByUserId: jest.fn().mockResolvedValue({ id: 'provider-1' }),
    };
    return new EarningsService(
      prismaMock as any,
      providersServiceMock as any,
      {} as any,
    );
  };

  it('calcula valores disponíveis e pendentes corretamente', async () => {
    const earningsService = createService(1000, 800);
    const result = await earningsService.getEarnings('user-123');
    expect(result.availableForWithdrawal).toBeCloseTo(800);
    expect(result.pendingWithdrawals).toBeCloseTo(200);
  });

  it('expõe availableForWithdrawal para o EarningsSummaryCard exibir o saldo disponível', async () => {
    const earningsService = createService(600, 250);
    const result = await earningsService.getEarnings('user-123');
    expect(result.availableForWithdrawal).toBeCloseTo(250);
    expect(result.pendingWithdrawals).toBeCloseTo(350);
  });
});
