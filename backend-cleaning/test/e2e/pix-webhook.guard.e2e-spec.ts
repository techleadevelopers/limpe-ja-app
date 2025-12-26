import { createHmac } from 'crypto';
import request from 'supertest';
import { bootstrapTestApp, TestAppContext } from '../setup';
import { cleanDatabase, seedBaseEntities, createBooking } from '../helpers/seed';
import { BookingStatus, PaymentIntentStatus } from '@prisma/client';

const buildPayload = (bookingId: string, reference: string) => ({
  event: 'charge.paid',
  reference_id: bookingId,
  transaction: {
    id: reference,
    reference_id: bookingId,
    status: 'PAID',
  },
  data: {
    id: reference,
  },
});

const signPayload = (payload: string, secret: string) => {
  const digest = createHmac('sha256', secret).update(payload).digest('hex');
  return `sha256=${digest}`;
};

describe('Pix webhook security guard', () => {
  let ctx: TestAppContext;

  afterEach(async () => {
    if (ctx) {
      await ctx.close();
      ctx = undefined as unknown as TestAppContext;
    }
  });

  it('lets valid webhook through when secret configured', async () => {
    ctx = await bootstrapTestApp();
    await cleanDatabase(ctx.prisma);
    const seed = await seedBaseEntities(ctx.prisma);

    const { booking, paymentIntent } = await createBooking(ctx.prisma, {
      clientId: seed.client.id,
      providerId: seed.provider.id,
      providerServiceId: seed.providerService.id,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentIntentStatus.PENDING,
    });

    const payload = buildPayload(booking.id, paymentIntent.externalRef ?? booking.id);
    const bodyString = JSON.stringify(payload);
    const signature = signPayload(bodyString, process.env.PIX_WEBHOOK_SECRET ?? 'pix-secret');

    const res = await request(ctx.app.getHttpServer())
      .post('/payments/webhook/pix')
      .set('Content-Type', 'application/json')
      .set('x-signature', signature)
      .set('x-event-id', 'pix-test-1')
      .send(bodyString);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);

    const updated = await ctx.prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updated?.status).toBe(BookingStatus.CONFIRMED);
  });

  it('blocks when secret missing and insecure bypass not allowed', async () => {
    ctx = await bootstrapTestApp({
      PIX_WEBHOOK_SECRET: undefined,
      ALLOW_INSECURE_WEBHOOKS: 'false',
    });

    const payload = { event: 'charge.paid' };
    const bodyString = JSON.stringify(payload);

    const res = await request(ctx.app.getHttpServer())
      .post('/payments/webhook/pix')
      .set('Content-Type', 'application/json')
      .set('x-signature', 'sha256=deadbeef')
      .set('x-event-id', 'pix-test-2')
      .send(bodyString);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/PIX webhook secret not configured/);
  });

  it('allows when secret missing and insecure bypass explicitly enabled', async () => {
    ctx = await bootstrapTestApp({
      PIX_WEBHOOK_SECRET: undefined,
      ALLOW_INSECURE_WEBHOOKS: 'true',
    });
    await cleanDatabase(ctx.prisma);
    const seed = await seedBaseEntities(ctx.prisma);

    const { booking, paymentIntent } = await createBooking(ctx.prisma, {
      clientId: seed.client.id,
      providerId: seed.provider.id,
      providerServiceId: seed.providerService.id,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentIntentStatus.PENDING,
    });

    const payload = buildPayload(booking.id, paymentIntent.externalRef ?? booking.id);
    const bodyString = JSON.stringify(payload);

    const res = await request(ctx.app.getHttpServer())
      .post('/payments/webhook/pix')
      .set('Content-Type', 'application/json')
      .set('x-signature', 'sha256=allow-insecure')
      .set('x-event-id', 'pix-test-3')
      .send(bodyString);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);

    const updated = await ctx.prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updated?.status).toBe(BookingStatus.CONFIRMED);
  });
});
