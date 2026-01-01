import { TestAppContext, bootstrapTestApp } from '../setup';
import {
  cleanDatabase,
  seedBaseEntities,
} from '../helpers/seed';
import { buildAuthToken, authHeader } from '../helpers/auth';

describe('Booking weekly frequency guard (e2e)', () => {
  let ctx: TestAppContext;
  let baseSeed: Awaited<ReturnType<typeof seedBaseEntities>>;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await cleanDatabase(ctx.prisma);
    baseSeed = await seedBaseEntities(ctx.prisma);
  });

  const clientToken = () => buildAuthToken(ctx.jwtService, baseSeed.clientUser);

  it('permits at most two bookings per client/provider per week even under concurrent creation', async () => {
    const payload = {
      providerId: baseSeed.provider.id,
      providerServiceId: baseSeed.providerService.id,
      scheduledDate: '2025-09-01',
      scheduledTime: '10:00',
      totalPrice: 180,
      address: {
        cep: '01310000',
        street: 'Rua Teste',
        number: '321',
        neighborhood: 'Cerqueira César',
        city: 'SALo Paulo',
        state: 'SP',
        complement: 'Apto 55',
        latitude: -23.559,
        longitude: -46.658,
      },
    };

    const requests = Array.from({ length: 3 }, () =>
      ctx.request
        .post('/bookings')
        .set(authHeader(clientToken()))
        .send(payload),
    );

    const responses = await Promise.all(requests);
    const successes = responses.filter((res) => res.status === 201);
    const failures = responses.filter((res) => res.status !== 201);

    expect(successes).toHaveLength(2);
    expect(failures.length).toBeGreaterThanOrEqual(1);

    const persistedCount = await ctx.prisma.booking.count({
      where: {
        clientId: baseSeed.client.id,
        providerId: baseSeed.provider.id,
        scheduledDate: new Date('2025-09-01'),
      },
    });
    expect(persistedCount).toBe(2);
  });
});
