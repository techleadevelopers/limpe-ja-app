import { BadRequestException } from '@nestjs/common';
import { ClaimStatus } from '@prisma/client';
import { IncidentsService } from './incidents.service';

describe('IncidentsService', () => {
  let service: IncidentsService;
  let prismaMock: any;

  const buildBooking = (overrides: Record<string, any> = {}) => ({
    id: 'booking-1',
    client: { userId: 'client-user' },
    provider: { userId: 'provider-user' },
    completedAt: new Date(Date.now() - 60 * 60 * 1000),
    bookingInsurance: {
      planId: 'TOTAL',
      deductibleCents: 50000,
      coverageCents: 1000000,
      proofRequired: true,
    },
    bookingProofs: [{ type: 'CHECKOUT', videoUrl: 'https://video.mp4' }],
    ...overrides,
  });

  beforeEach(() => {
    prismaMock = {
      booking: {
        findUnique: jest.fn(),
      },
      insuranceClaim: {
        create: jest.fn(),
      },
    };

    service = new IncidentsService(prismaMock);
  });

  it('enforces the 24h window after booking completion', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(
      buildBooking({
        completedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      }),
    );

    await expect(
      service.createClaim('client-user', {
        bookingId: 'booking-1',
        description: 'Lixo perdido',
        amountCents: 60000,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('marks the claim rejected when the amount is below the deductible', async () => {
    const mockBooking = buildBooking();
    prismaMock.booking.findUnique.mockResolvedValue(mockBooking);
    prismaMock.insuranceClaim.create.mockResolvedValue({
      id: 'claim-1',
    });

    await service.createClaim('client-user', {
      bookingId: 'booking-1',
      description: 'Pequeno dano',
      amountCents: 20000,
    });

    expect(prismaMock.insuranceClaim.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ClaimStatus.REJECTED,
          rejectionReason: expect.any(String),
          amountCents: 20000,
        }),
      }),
    );
  });
});
