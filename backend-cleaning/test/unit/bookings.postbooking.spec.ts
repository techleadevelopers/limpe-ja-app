import {
  BookingStatus,
  PayoutStatus,
  Prisma,
  VerificationStatus,
  LoyaltyTransactionType,
} from '@prisma/client';
import { ReviewsService } from '../../src/reviews/reviews.service';
import { PayoutsService } from '../../src/payouts/payouts.service';

describe('Bookings post-booking flows', () => {
  it('creates a review after a finished booking', async () => {
    const transactionalBooking = {
      id: 'booking-id',
      clientId: 'client-id',
      providerId: 'provider-id',
      status: BookingStatus.FINISHED,
      client: { userId: 'client-user' },
      provider: {
        userId: 'provider-user',
        user: { fullName: 'Provider', avatarUrl: 'avatar' },
      },
      scheduledDate: new Date('2025-12-31'),
      scheduledTime: '10:00',
      startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 30 * 60 * 1000),
      durationMinutes: 60,
      paymentIntent: { status: 'PAID' },
      isReviewed: false,
      review: null,
      providerService: { durationMinutes: 60 },
    };

    const reviewRecord = { id: 'review-id' };

    const tx = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(transactionalBooking),
        update: jest.fn().mockResolvedValue({}),
      },
      review: { create: jest.fn().mockResolvedValue(reviewRecord) },
    };
    const prismaMock = {
      $transaction: jest.fn().mockImplementation((cb) => cb(tx)),
      client: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ userId: 'client-user', reviewsMade: [] }),
      },
    };

    const providersService = { updateProviderBadges: jest.fn().mockResolvedValue(undefined) };
    const loyaltyService = { addPoints: jest.fn().mockResolvedValue(undefined) };
    const missionsService = { trackEvent: jest.fn().mockResolvedValue(undefined) };

    const reviewsService = new ReviewsService(
      prismaMock as any,
      providersService as any,
      loyaltyService as any,
      missionsService as any,
    );

    const submitReviewDto = {
      bookingId: 'booking-id',
      rating: 5,
      comment: 'Excellent service',
    };
    const result = await reviewsService.submitReview('client-user', submitReviewDto as any);

    expect(result).toEqual(reviewRecord);
    expect(tx.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bookingId: 'booking-id',
          rating: 5,
          comment: 'Excellent service',
        }),
      }),
    );
    expect(tx.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-id' },
        data: { isReviewed: true },
      }),
    );

    expect(loyaltyService.addPoints).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'client-user',
        points: 5,
        type: LoyaltyTransactionType.REVIEW_SUBMITTED,
        referenceId: 'review-id',
      }),
    );
    expect(missionsService.trackEvent).toHaveBeenCalledWith('client-user', 'review.created', {
      bookingId: 'booking-id',
      providerId: 'provider-id',
      rating: 5,
    });
    expect(providersService.updateProviderBadges).toHaveBeenCalledWith('provider-id');
  });

  it('creates a withdrawal when provider is approved', async () => {
    const providerRecord = {
      userId: 'provider-user',
      verificationStatus: VerificationStatus.APPROVED,
      pixKey: 'pix-key',
      pixKeyType: 'EMAIL',
    };

    const tx = {
      provider: {
        findFirst: jest.fn().mockResolvedValue(providerRecord),
      },
    payout: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'payout-1',
        userId: 'provider-user',
        amount: new Prisma.Decimal(150),
        status: PayoutStatus.PENDING,
      }),
      aggregate: jest
        .fn()
        .mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(0) },
          _count: 0,
        }),
    },
      ledgerEntry: {
        aggregate: jest
          .fn()
          .mockResolvedValue({ _sum: { amount: new Prisma.Decimal(1000) } }),
        create: jest.fn().mockResolvedValue(undefined),
      },
    };

    const prismaMock = {
      $transaction: jest.fn().mockImplementation((cb) => cb(tx)),
    };

    const queues = {
      addJob: jest.fn().mockResolvedValue(undefined),
      addNotificationJob: jest.fn().mockResolvedValue(undefined),
    };
    const redisLock = {
      acquireLock: jest.fn().mockResolvedValue(true),
      releaseLock: jest.fn().mockResolvedValue(undefined),
    };
    const configService = {
      get: jest.fn().mockImplementation((_key, defaultValue) => defaultValue ?? ''),
    };

    const payoutsService = new PayoutsService(
      prismaMock as any,
      queues as any,
      redisLock as any,
      configService as any,
      {} as any,
      {} as any,
    );

    const dto = { amount: '120', pixKey: 'pix-key', pixKeyType: 'EMAIL' };
    const result = await payoutsService.requestWithdrawal('provider-user', dto as any, 'idem-123');

    expect(result.status).toBe(PayoutStatus.PENDING);
    expect(tx.payout.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'provider-user',
          idempotencyKey: 'idem-123',
        }),
      }),
    );
    expect(tx.ledgerEntry.create).toHaveBeenCalled();
    expect(queues.addJob).toHaveBeenCalledWith(
      'payouts',
      'process-payout',
      expect.objectContaining({ payoutId: 'payout-1' }),
      expect.objectContaining({ attempts: 5 }),
    );
    expect(queues.addNotificationJob).toHaveBeenCalledWith(
      'send-notification',
      expect.objectContaining({
        userId: 'provider-user',
        type: 'WITHDRAWAL_REQUESTED',
      }),
    );
    expect(redisLock.releaseLock).toHaveBeenCalled();
  });
});
