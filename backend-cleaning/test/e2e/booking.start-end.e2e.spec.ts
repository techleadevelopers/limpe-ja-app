import { createHmac } from 'crypto';
import {
  BookingStatus,
  LedgerEntryType,
  MissionStatus,
  PaymentIntentStatus,
  Prisma,
} from '@prisma/client';
import { COMMISSION_RATE } from '../../src/common/constants/pricing';
import { TestAppContext, bootstrapTestApp } from '../setup';
import { cleanDatabase, seedBaseEntities, createBooking, createAdditionalProvider } from '../helpers/seed';
import { buildAuthToken, authHeader } from '../helpers/auth';
import { PaymentsService } from '../../src/payments/payments.service';

const createSignature = (secret: string, payload: Record<string, any>) =>
  createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

describe('Booking start/end + ledger + missions', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  let baseSeed: Awaited<ReturnType<typeof seedBaseEntities>>;

  beforeEach(async () => {
    await cleanDatabase(ctx.prisma);
    baseSeed = await seedBaseEntities(ctx.prisma);
  });

  const clientToken = () => buildAuthToken(ctx.jwtService, baseSeed.clientUser);
  const providerToken = () => buildAuthToken(ctx.jwtService, baseSeed.providerUser);

  const expectForbiddenStart = async (bookingId: string, token: string) => {
    await ctx.request
      .post(`/bookings/${bookingId}/start`)
      .set(authHeader(token))
      .expect(403);
  };

  it('prevents a client from starting a service', async () => {
    const { booking } = await createBooking(ctx.prisma, {
      clientId: baseSeed.client.id,
      providerId: baseSeed.provider.id,
      providerServiceId: baseSeed.providerService.id,
      status: BookingStatus.ARRIVED,
    });
    await expectForbiddenStart(booking.id, clientToken());
  });

  it('rejects other providers from starting or finishing the booking', async () => {
    const guestProvider = await createAdditionalProvider(ctx.prisma);
    const guestToken = buildAuthToken(ctx.jwtService, guestProvider.user);
    const { booking } = await createBooking(ctx.prisma, {
      clientId: baseSeed.client.id,
      providerId: baseSeed.provider.id,
      providerServiceId: baseSeed.providerService.id,
      status: BookingStatus.ARRIVED,
    });

    const startResponse = await ctx.request
      .post(`/bookings/${booking.id}/start`)
      .set(authHeader(guestToken))
      .expect(403);
    expect(startResponse.body.message).toMatch(/Somente o prestador/i);

    await ctx.prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.STARTED,
        startedAt: new Date(),
      },
    });

    const completeResponse = await ctx.request
      .post(`/bookings/${booking.id}/complete`)
      .set(authHeader(guestToken))
      .expect(403);
    expect(completeResponse.body.message).toMatch(/Somente o prestador pode concluir/i);
  });

  it('records audit info when provider starts and finishes a booking', async () => {
    const { booking } = await createBooking(ctx.prisma, {
      clientId: baseSeed.client.id,
      providerId: baseSeed.provider.id,
      providerServiceId: baseSeed.providerService.id,
      status: BookingStatus.ARRIVED,
    });
    const providerTok = providerToken();

    await ctx.request
      .post(`/bookings/${booking.id}/start`)
      .set(authHeader(providerTok))
      .expect(200);

    const afterStart = await ctx.prisma.booking.findUnique({
      where: { id: booking.id },
      select: { startedByUserId: true, startedAt: true },
    });
    expect(afterStart?.startedByUserId).toBe(baseSeed.providerUser.id);
    expect(afterStart?.startedAt).toBeTruthy();

    const pastStart = new Date(Date.now() - 90 * 60 * 1000);
    await ctx.prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.STARTED,
        startedAt: pastStart,
        scheduledStart: pastStart,
        scheduledEnd: new Date(pastStart.getTime() + 60 * 60000),
      },
    });

    await ctx.request
      .post(`/bookings/${booking.id}/complete`)
      .set(authHeader(providerTok))
      .expect(200);

    const finished = await ctx.prisma.booking.findUnique({
      where: { id: booking.id },
      select: { completedAt: true, completedByUserId: true, status: true },
    });
    expect(finished?.status).toBe(BookingStatus.FINISHED);
    expect(finished?.completedByUserId).toBe(baseSeed.providerUser.id);
    expect(finished?.completedAt).toBeTruthy();
  });

  it('rejects start when booking is not ARRIVED and respects the window for ending', async () => {
    const { booking } = await createBooking(ctx.prisma, {
      clientId: baseSeed.client.id,
      providerId: baseSeed.provider.id,
      providerServiceId: baseSeed.providerService.id,
      status: BookingStatus.CONFIRMED,
    });
    const badStart = await ctx.request
      .post(`/bookings/${booking.id}/start`)
      .set(authHeader(providerToken()))
      .expect(400);
    expect(badStart.body.message).toMatch(/ARRIVED/);

    const soonBooking = await createBooking(ctx.prisma, {
      clientId: baseSeed.client.id,
      providerId: baseSeed.provider.id,
      providerServiceId: baseSeed.providerService.id,
      status: BookingStatus.STARTED,
      scheduledStart: new Date(),
    });

    const tooSoon = await ctx.request
      .post(`/bookings/${soonBooking.booking.id}/complete`)
      .set(authHeader(providerToken()))
      .expect(400);
    expect(tooSoon.body.message).toMatch(/Ainda não atingiu o horário final/i);
    const pastTip = new Date(Date.now() - 90 * 60 * 1000);
    await ctx.prisma.booking.update({
      where: { id: soonBooking.booking.id },
      data: {
        startedAt: pastTip,
        scheduledStart: pastTip,
        scheduledEnd: new Date(pastTip.getTime() + 60 * 60000),
        status: BookingStatus.STARTED,
      },
    });

    await ctx.request
      .post(`/bookings/${soonBooking.booking.id}/complete`)
      .set(authHeader(providerToken()))
      .expect(200);
  });

  it('calculates scheduledEndTime from scheduledStart plus duration', async () => {
    const now = new Date();
    const scheduledDate = new Date(now);
    scheduledDate.setDate(now.getDate() + 2);
    const dateString = scheduledDate.toISOString().split('T')[0];
    const requestedDuration = 90;

    const response = await ctx.request
      .post('/bookings')
      .set(authHeader(clientToken()))
      .send({
        providerId: baseSeed.provider.id,
        providerServiceId: baseSeed.providerService.id,
        scheduledDate: dateString,
        scheduledTime: '10:30',
        totalPrice: 180,
        requestedDurationMinutes: requestedDuration,
        address: {
          cep: '01310000',
          street: 'Rua Teste',
          number: '321',
          neighborhood: 'Cerqueira César',
          city: 'São Paulo',
          state: 'SP',
          complement: 'Sala 5',
          latitude: -23.559,
          longitude: -46.658,
        },
      })
      .expect(201);

    const scheduledStart =
      new Date(response.body.scheduledStart ?? response.body.scheduledDateTime);
    const scheduledEnd = new Date(response.body.scheduledEndTime);
    const resolvedDuration =
      response.body.durationMinutes ?? response.body.serviceDurationMinutes ?? requestedDuration;
    expect(Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / 60000)).toBe(
      resolvedDuration,
    );
  });

  it('records ledger entries only once even when complete is retried concurrently', async () => {
    const { booking } = await createBooking(ctx.prisma, {
      clientId: baseSeed.client.id,
      providerId: baseSeed.provider.id,
      providerServiceId: baseSeed.providerService.id,
      status: BookingStatus.STARTED,
      scheduledStart: new Date(Date.now() - 120 * 60 * 1000),
    });
    const token = providerToken();

    const completeCall = () =>
      ctx.request
        .post(`/bookings/${booking.id}/complete`)
        .set(authHeader(token));

    await Promise.allSettled([completeCall(), completeCall()]);

    const earnings = await ctx.prisma.ledgerEntry.findMany({
      where: { bookingId: booking.id, type: LedgerEntryType.EARNING },
    });
    const holds = await ctx.prisma.ledgerEntry.findMany({
      where: { bookingId: booking.id, type: LedgerEntryType.HOLD },
    });
    expect(earnings).toHaveLength(1);
    expect(holds).toHaveLength(1);

    const finishedBooking = await ctx.prisma.booking.findUnique({
      where: { id: booking.id },
      select: { totalPrice: true },
    });
    if (!finishedBooking) throw new Error('Booking not found');
    const expectedNet = new Prisma.Decimal(finishedBooking.totalPrice.toString())
      .mul(new Prisma.Decimal(1 - COMMISSION_RATE));
    expect(earnings[0].amount.toString()).toBe(expectedNet.toString());
  });

  it('triggers mission events/progress when booking is finished', async () => {
    const { booking } = await createBooking(ctx.prisma, {
      clientId: baseSeed.client.id,
      providerId: baseSeed.provider.id,
      providerServiceId: baseSeed.providerService.id,
      status: BookingStatus.STARTED,
      scheduledStart: new Date(Date.now() - 120 * 60 * 1000),
    });
    await ctx.request
      .post(`/bookings/${booking.id}/complete`)
      .set(authHeader(providerToken()))
      .expect(200);

    const missionEvents = await ctx.prisma.missionEvent.findMany({
      where: {
        userId: baseSeed.clientUser.id,
        name: 'booking.completed',
      },
    });
    expect(missionEvents.length).toBeGreaterThan(0);

    const progress = await ctx.prisma.missionProgress.findUnique({
      where: {
        userId_missionId: {
          userId: baseSeed.clientUser.id,
          missionId: baseSeed.mission.id,
        },
      },
    });
    expect(progress?.status).toBe(MissionStatus.COMPLETED);
    expect(progress?.currentValue).toBeGreaterThanOrEqual(1);
  });
});

describe('PIX webhook security', () => {
  let webhookCtx: TestAppContext | null = null;

  afterEach(async () => {
    if (webhookCtx) {
      await webhookCtx.close();
      webhookCtx = null;
    }
  });

  it('rejects webhook when PIX_WEBHOOK_SECRET is not configured', async () => {
    webhookCtx = await bootstrapTestApp({ PIX_WEBHOOK_SECRET: '' });
    const paymentsService = webhookCtx.app.get(PaymentsService);
    await expect(
      paymentsService.handlePaymentWebhook('', {
        event: 'charge.paid',
        transaction: { id: 'unused' },
      }),
    ).rejects.toThrow(/webhook inv/i);
  });

  it('rejects invalid HMAC signatures', async () => {
    webhookCtx = await bootstrapTestApp({ PIX_WEBHOOK_SECRET: 'secret-for-test' });
    const paymentsService = webhookCtx.app.get(PaymentsService);
    const payload = { event: 'charge.paid', transaction: { id: 'abc' } };
    const signature = createSignature('wrong-secret', payload);
    await expect(
      paymentsService.handlePaymentWebhook(signature, payload),
    ).rejects.toThrow(/webhook inv/i);
  });

  it('confirms booking when HMAC is valid', async () => {
    webhookCtx = await bootstrapTestApp();
    await cleanDatabase(webhookCtx.prisma);
    const seeded = await seedBaseEntities(webhookCtx.prisma);
    const { booking, paymentIntent } = await createBooking(webhookCtx.prisma, {
      clientId: seeded.client.id,
      providerId: seeded.provider.id,
      providerServiceId: seeded.providerService.id,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentIntentStatus.PENDING,
    });

    const secret = process.env.PIX_WEBHOOK_SECRET ?? 'pix-secret';
    const payload = {
      event: 'charge.paid',
      reference_id: booking.id,
      transaction: {
        id: paymentIntent.externalRef,
        reference_id: booking.id,
        status: 'PAID',
      },
      data: {
        id: paymentIntent.externalRef,
      },
    };
    const signature = createSignature(secret, payload);
    const paymentsService = webhookCtx.app.get(PaymentsService);

    await expect(
      paymentsService.handlePaymentWebhook(signature, payload),
    ).resolves.toEqual({ message: 'Webhook processado com sucesso' });

    const updatedBooking = await webhookCtx.prisma.booking.findUnique({
      where: { id: booking.id },
    });
    expect(updatedBooking?.status).toBe(BookingStatus.CONFIRMED);
  });
});
