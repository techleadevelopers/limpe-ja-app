import { PaymentIntentStatus } from '@prisma/client';
import { PaymentIntentLocker } from './payment-intent-locker';

describe('PaymentsService claimPaymentIntent', () => {
  it('reuses the same intent when two claims run concurrently', async () => {
    const records: Record<string, any> = {};
    const paymentIntentOps = {
      findUnique: jest.fn(async ({ where }: { where: { bookingId: string } }) => {
        return records[where.bookingId] ?? null;
      }),
      create: jest.fn(async ({ data }: { data: any }) => {
        const id = `intent-${Date.now()}-${Math.random()}`;
        const record = { ...data, id };
        records[data.bookingId] = record;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return record;
      }),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: any }) => {
        const record = Object.values(records).find((entry: any) => entry.id === where.id);
        if (!record) {
          throw new Error('not found');
        }
        Object.assign(record, data);
        return record;
      }),
    };

    const prismaMock = {
      paymentIntent: paymentIntentOps,
      $transaction: jest.fn(async (cb: any) => {
        return cb({ paymentIntent: paymentIntentOps });
      }),
    } as unknown;

    const locker = new PaymentIntentLocker(prismaMock as any);

    const referenceId = 'booking-test';
    const amountCents = 5000;
    const bookingId = 'booking-test-id';
    const idempotencyKey = 'pix-test';

    const first = await locker.claimPaymentIntent(
      bookingId,
      amountCents,
      referenceId,
      idempotencyKey,
    );
    const second = await locker.claimPaymentIntent(
      bookingId,
      amountCents,
      referenceId,
      idempotencyKey,
    );

    expect(first.shouldCreate).toBe(true);
    expect(second.shouldCreate).toBe(false);
    expect(first.intent.id).toBe(second.intent.id);
    expect(paymentIntentOps.create).toHaveBeenCalledTimes(1);
  });
});
