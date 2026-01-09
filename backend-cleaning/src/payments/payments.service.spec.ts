import {
  BookingStatus,
  PaymentIntentStatus,
  Prisma,
} from '@prisma/client';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

describe('PaymentsService finalizePixPayment', () => {
  let paymentsService: PaymentsService;
  let bookingsServiceMock: { systemChangeStatus: jest.Mock };
  let prismaMock: {
    $transaction: jest.Mock;
    paymentIntent: { findFirst: jest.Mock };
  };

  beforeEach(() => {
    const transactionMock = {
      paymentIntent: { update: jest.fn() },
      ledgerEntry: {
        findFirst: jest.fn(async () => null),
        createMany: jest.fn(),
      },
    };

    prismaMock = {
      $transaction: jest.fn(async (callback: any) => callback(transactionMock)),
      paymentIntent: { findFirst: jest.fn() },
      booking: { update: jest.fn() },
    };

    const configServiceMock = { get: jest.fn(() => undefined) };
    paymentsService = new PaymentsService(
      prismaMock as any,
      configServiceMock as any,
      {} as any,
      {} as any,
      {} as any,
      {
        createNotification: jest.fn().mockResolvedValue(null),
      } as any,
      { getAccessToken: jest.fn(async () => 'token') } as any,
    );

    bookingsServiceMock = {
      systemChangeStatus: jest.fn().mockResolvedValue(null),
    };
    (paymentsService as any).bookingsService = bookingsServiceMock;
  });

  it('creates ledger entries and confirms the booking on successful finalize', async () => {
    prismaMock.paymentIntent.findFirst.mockResolvedValue({
      id: 'pi-1',
      bookingId: 'booking-1',
      status: PaymentIntentStatus.PENDING,
      booking: {
        id: 'booking-1',
        totalPrice: new Prisma.Decimal(200),
        provider: { userId: 'provider-1' },
        client: { userId: 'client-1' },
        status: BookingStatus.PENDING_PAYMENT,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const result = await (paymentsService as any).finalizePixPayment({
      referenceId: 'booking-1',
      eventReference: 'event-1',
    });

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(bookingsServiceMock.systemChangeStatus).toHaveBeenCalledWith(
      'booking-1',
      BookingStatus.CONFIRMED,
    );
    expect(result).toMatchObject({
      success: true,
      didUpdate: true,
      bookingId: 'booking-1',
      paymentIntentId: 'pi-1',
    });
    expect((prismaMock.$transaction as jest.Mock).mock.calls[0][0]).toBeTruthy();
    expect(prismaMock.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: { expiresAt: null },
    });
  });

  it('rejects payment when booking expired before confirmation', async () => {
    prismaMock.paymentIntent.findFirst.mockResolvedValue({
      id: 'pi-expired',
      bookingId: 'booking-expired',
      status: PaymentIntentStatus.PENDING,
      booking: {
        id: 'booking-expired',
        totalPrice: new Prisma.Decimal(120),
        provider: { userId: 'provider-1' },
        client: { userId: 'client-1' },
        status: BookingStatus.PENDING_PAYMENT,
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    await expect(
      (paymentsService as any).finalizePixPayment({
        referenceId: 'booking-expired',
        eventReference: 'event-expired',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-expired' },
      data: { status: BookingStatus.EXPIRED },
    });
  });

  it('is idempotent when payment intent is already PAID', async () => {
    prismaMock.paymentIntent.findFirst.mockResolvedValue({
      id: 'pi-2',
      bookingId: 'booking-2',
      status: PaymentIntentStatus.PAID,
      booking: { id: 'booking-2', totalPrice: new Prisma.Decimal(100), provider: { userId: 'provider-2' }, client: { userId: 'client-2' }, status: BookingStatus.CONFIRMED },
    });

    const result = await (paymentsService as any).finalizePixPayment({
      referenceId: 'booking-2',
      eventReference: 'event-2',
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(result.didUpdate).toBe(false);
    expect(bookingsServiceMock.systemChangeStatus).not.toHaveBeenCalled();
  });

  it('throws InternalServerErrorException when the transaction fails', async () => {
    prismaMock.$transaction.mockRejectedValue(new Error('boom'));
    prismaMock.paymentIntent.findFirst.mockResolvedValue({
      id: 'pi-3',
      bookingId: 'booking-3',
      status: PaymentIntentStatus.PENDING,
      booking: {
        id: 'booking-3',
        totalPrice: new Prisma.Decimal(120),
        provider: { userId: 'provider-3' },
        client: { userId: 'client-3' },
        status: BookingStatus.PENDING,
      },
    });

    await expect(
      (paymentsService as any).finalizePixPayment({
        referenceId: 'booking-3',
        eventReference: 'event-3',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});

describe('PaymentsService handlePixWebhook', () => {
  let paymentsService: PaymentsService;

  beforeEach(() => {
    const configServiceMock = { get: jest.fn(() => undefined) };
    paymentsService = new PaymentsService(
      {
        $transaction: jest.fn(),
        paymentIntent: { findFirst: jest.fn() },
      } as any,
      configServiceMock as any,
      {} as any,
      {} as any,
      {} as any,
      { createNotification: jest.fn().mockResolvedValue(null) } as any,
      { getAccessToken: jest.fn(async () => 'token') } as any,
    );
  });

  it('acknowledges non-final statuses without calling finalize', async () => {
    const finalizeSpy = jest.spyOn(paymentsService as any, 'finalizePixPayment');
    const payload = JSON.stringify({
      reference_id: 'ref',
      charges: [{ status: 'PENDING' }],
    });

    const result = await paymentsService.handlePixWebhook(payload, undefined);

    expect(finalizeSpy).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: true, didUpdate: false, paymentIntentId: null });
  });

  it('propagates errors when finalize fails', async () => {
    jest
      .spyOn(paymentsService as any, 'finalizePixPayment')
      .mockRejectedValue(new InternalServerErrorException('boom'));
    const payload = JSON.stringify({
      reference_id: 'ref',
      charges: [{ status: 'PAID', reference_id: 'ref' }],
    });

    await expect(
      paymentsService.handlePixWebhook(payload, undefined),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
