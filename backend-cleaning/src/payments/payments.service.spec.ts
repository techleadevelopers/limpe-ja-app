import { BookingStatus, PaymentIntentStatus } from '@prisma/client';
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
});
