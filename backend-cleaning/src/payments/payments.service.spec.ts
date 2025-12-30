import { BookingStatus, PaymentIntentStatus } from '@prisma/client';
import { HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';

describe('PaymentsService confirmPixPayment', () => {
  let paymentsService: PaymentsService;
  let bookingsServiceMock: { systemChangeStatus: jest.Mock };
  let prismaMock: {
    $transaction: jest.Mock;
    paymentIntent: { findFirst: jest.Mock };
    booking: { findUnique: jest.Mock };
  };

  beforeEach(() => {
    const paymentIntentTransactionMock = {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    };

    prismaMock = {
      $transaction: jest.fn(async (callback: any) => callback({ paymentIntent: paymentIntentTransactionMock })),
      paymentIntent: {
        findFirst: jest.fn(),
      },
      booking: {
        findUnique: jest.fn(),
      },
    };

    const configServiceMock = {
      get: jest.fn(() => undefined),
    };
    const couponsServiceMock = {};
    const payoutsServiceMock = {};
    const queuesServiceMock = {};
    const notificationsServiceMock = {
      createNotification: jest.fn().mockResolvedValue(null),
    };
    const connectServiceMock = {
      getAccessToken: jest.fn(async () => 'token'),
    };

    paymentsService = new PaymentsService(
      prismaMock as any,
      configServiceMock as any,
      couponsServiceMock as any,
      payoutsServiceMock as any,
      queuesServiceMock as any,
      notificationsServiceMock as any,
      connectServiceMock as any,
    );

    bookingsServiceMock = {
      systemChangeStatus: jest.fn().mockResolvedValue(null),
    };
    (paymentsService as any).bookingsService = bookingsServiceMock;
  });

  it('confirms the booking via BookingsService when it is not confirmed yet', async () => {
    prismaMock.paymentIntent.findFirst.mockResolvedValue({
      id: 'pi-123',
      bookingId: 'booking-123',
      status: PaymentIntentStatus.PENDING,
    });
    prismaMock.booking.findUnique.mockResolvedValue({
      status: BookingStatus.PENDING,
    });

    await paymentsService.confirmPixPayment('booking_123');

    expect(bookingsServiceMock.systemChangeStatus).toHaveBeenCalledWith(
      'booking-123',
      BookingStatus.CONFIRMED,
    );
  });

  it('does not trigger a status change when the booking is already confirmed', async () => {
    prismaMock.paymentIntent.findFirst.mockResolvedValue({
      id: 'pi-123',
      bookingId: 'booking-123',
      status: PaymentIntentStatus.PAID,
    });
    prismaMock.booking.findUnique.mockResolvedValue({
      status: BookingStatus.CONFIRMED,
    });

    await paymentsService.confirmPixPayment('booking_123');

    expect(bookingsServiceMock.systemChangeStatus).not.toHaveBeenCalled();
  });

  it('throws 503 when Pix integrations are not configured', async () => {
    await expect(
      paymentsService.createPixCharge('client-user', {
        providerId: 'provider-id',
        bookingId: 'booking-123',
        description: 'desc',
      } as any),
    ).rejects.toMatchObject({
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'PSP not configured',
    });
  });
});

describe('PaymentsService handlePixWebhook state machine', () => {
  let paymentsService: PaymentsService;
  let bookingsServiceMock: { systemChangeStatus: jest.Mock };
  let prismaMock: {
    $transaction: jest.Mock;
    paymentIntent: { findFirst: jest.Mock };
    booking: { findUnique: jest.Mock };
  };
  let transactionMock: {
    paymentIntent: { update: jest.Mock };
    ledgerEntry: {
      findFirst: jest.Mock;
      createMany: jest.Mock;
    };
  };

  beforeEach(() => {
    transactionMock = {
      paymentIntent: { update: jest.fn() },
      ledgerEntry: {
        findFirst: jest.fn(async () => null),
        createMany: jest.fn(),
      },
    };

    prismaMock = {
      $transaction: jest.fn(async (callback) => callback(transactionMock)),
      paymentIntent: {
        findFirst: jest.fn(),
      },
      booking: {
        findUnique: jest.fn(),
      },
    };

    const configServiceMock = {
      get: jest.fn(() => undefined),
    };
    const queuesServiceMock = {
      addNotificationJob: jest.fn(),
    };
    const notificationsServiceMock = {
      createNotification: jest.fn().mockResolvedValue(null),
    };
    const connectServiceMock = {
      getAccessToken: jest.fn(async () => 'token'),
    };

    paymentsService = new PaymentsService(
      prismaMock as any,
      configServiceMock as any,
      {} as any,
      {} as any,
      queuesServiceMock as any,
      notificationsServiceMock as any,
      connectServiceMock as any,
    );

    bookingsServiceMock = {
      systemChangeStatus: jest.fn().mockResolvedValue(null),
    };
    (paymentsService as any).bookingsService = bookingsServiceMock;
  });

  it('skips confirmation when state machine prevents the transition', async () => {
    prismaMock.paymentIntent.findFirst.mockResolvedValue({
      id: 'pi-123',
      bookingId: 'booking-123',
      status: PaymentIntentStatus.EXPIRED,
      booking: {
        id: 'booking-123',
        totalPrice: 100,
        provider: { userId: 'provider-user' },
        client: { userId: 'client-user' },
      },
    });

    const rawBody = JSON.stringify({
      reference_id: 'ref-1',
      charges: [{ reference_id: 'ref-1', status: 'PAID', id: 'charge-1' }],
    });

    const result = await paymentsService.handlePixWebhook(rawBody, undefined);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(bookingsServiceMock.systemChangeStatus).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: true,
    });
  });

  it('ignores duplicate PIX webhooks after the intent is confirmed', async () => {
    const webhookPayload = JSON.stringify({
      reference_id: 'ref-dup',
      charges: [{ reference_id: 'ref-dup', status: 'APPROVED', id: 'charge-dup' }],
    });

    prismaMock.paymentIntent.findFirst
      .mockResolvedValueOnce({
        id: 'pi-dup',
        bookingId: 'booking-dup',
        status: PaymentIntentStatus.PENDING,
        booking: {
          id: 'booking-dup',
          totalPrice: 100,
          provider: { userId: 'provider-user' },
          client: { userId: 'client-user' },
        },
      })
      .mockResolvedValueOnce({
        id: 'pi-dup',
        bookingId: 'booking-dup',
        status: PaymentIntentStatus.PAID,
      });

    await paymentsService.handlePixWebhook(webhookPayload, undefined);
    const secondResult = await paymentsService.handlePixWebhook(webhookPayload, undefined);

    expect(prismaMock.paymentIntent.findFirst).toHaveBeenCalledTimes(2);
    expect(secondResult).toMatchObject({
      ok: true,
    });
  });
});
