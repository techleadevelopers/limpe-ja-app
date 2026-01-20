import { Request } from 'express';
import {
  Prisma,
  BookingStatus,
  ProviderService,
  VerificationStatus,
} from '@prisma/client';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { BusinessRuleError } from '../common/errors/business-rule.error';
import { CacheService } from '../cache/cache.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  BookingsService,
  BookingWithDetailsRelations,
  IDEMPOTENCY_TTL_SECONDS,
} from './bookings.service';
import { calculateServiceTotalPrice } from './pricing/price-calculator';
import { BookingQuoteRequestDto } from './dto/quote-request.dto';
import {
  InsurancePlanProposal,
  InsuranceService,
} from '../insurance/insurance.service';
import { InsurancePlanId } from '../insurance/insurance.constants';
import { ProviderWithCalculatedRating } from '../providers/providers.service';

jest.mock('./pricing/price-calculator', () => ({
  calculateServiceTotalPrice: jest.fn(),
}));

const calculateServiceTotalPriceMock =
  calculateServiceTotalPrice as jest.MockedFunction<
    typeof calculateServiceTotalPrice
  >;

const buildCreateBookingDto = (): CreateBookingDto => ({
  providerId: 'provider-id',
  providerServiceId: 'provider-service-id',
  scheduledDate: '2025-12-31',
  scheduledTime: '10:00',
  totalPrice: 120,
  address: {
    cep: '01001000',
    street: 'Rua Teste',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.55052,
    longitude: -46.633308,
  },
});

const createRequest = (idempotencyKey?: string): Request =>
  ({
    headers: idempotencyKey
      ? ({ 'idempotency-key': idempotencyKey } as Record<string, string>)
      : {},
    locale: 'pt-BR',
  }) as unknown as Request;

const createServiceWithMocks = (options?: {
  dynamicPrice?: number;
  providerServiceOverrides?: Partial<ProviderService>;
  providerOverrides?: Partial<
    ProviderWithCalculatedRating & { verificationStatus: VerificationStatus }
  >;
  clientCompletedBookingsCount?: number;
  providerCompletedBookingsCount?: number;
  providerRating?: number;
  insuranceService?: InsuranceService;
}) => {
  const cacheService = {
    get: jest.fn(),
    set: jest.fn(),
  } as unknown as CacheService & {
    get: jest.Mock;
    set: jest.Mock;
  };

  calculateServiceTotalPriceMock.mockResolvedValue({
    calculatedTotalPrice: new Prisma.Decimal(150),
  });

  const createdBooking: BookingWithDetailsRelations = {
    id: 'booking-id',
    clientId: 'client-id',
    providerId: 'provider-id',
    providerServiceId: 'provider-service-id',
    scheduledDate: new Date('2025-12-31'),
    scheduledTime: '10:00',
    scheduledStart: new Date('2025-12-31T10:00:00Z'),
    scheduledEnd: new Date('2025-12-31T11:00:00Z'),
    durationMinutes: 60,
    totalPrice: new Prisma.Decimal(100),
    status: BookingStatus.PENDING_PAYMENT,
    notes: null,
    addressId: 'address-id',
    couponId: null,
    discountAmount: new Prisma.Decimal(0),
    couponUsage: null,
    client: { id: 'client-id', userId: 'client-user' },
    provider: { id: 'provider-id', userId: 'provider-user' },
    expiresAt: new Date(Date.now() + 1000),
    providerService: { id: 'provider-service-id', service: { id: 'service' } },
    review: null,
    address: { id: 'address-id' },
    subscription: null,
    incidents: [],
    guaranteeClaims: [],
    bookingProofs: [],
    expiresAt: new Date('2025-12-31T10:20:00Z'),
    coupon: null,
    paymentIntent: null,
    bookingInsurance: null,
  } as unknown as BookingWithDetailsRelations;

  const bookingCountMock = jest.fn().mockResolvedValue(0);
  const bookingCreateMock = jest.fn().mockResolvedValue(createdBooking);
  const bookingFindFirstMock = jest.fn().mockResolvedValue(null);
  const bookingFindUniqueMock = jest.fn().mockResolvedValue(createdBooking);
  const bookingUpdateMock = jest.fn().mockResolvedValue(createdBooking);
  const addressCreateMock = jest.fn().mockResolvedValue({ id: 'address-id' });

  const transactionClient = {
    booking: {
      count: bookingCountMock,
      create: bookingCreateMock,
    },
    address: {
      create: addressCreateMock,
    },
  };

  const prismaMock = {
    booking: {
      findFirst: bookingFindFirstMock,
      findUnique: bookingFindUniqueMock,
      create: bookingCreateMock,
      count: bookingCountMock,
      update: bookingUpdateMock,
    },
    address: {
      create: addressCreateMock,
    },
    $transaction: jest
      .fn()
      .mockImplementation(async (cb) => cb(transactionClient as any)),
  };

  const redisLockService = {
    acquireLock: jest.fn().mockResolvedValue(true),
    releaseLock: jest.fn().mockResolvedValue(undefined),
  };

  const provider = {
    id: 'provider-id',
    verificationStatus: VerificationStatus.APPROVED,
    averageRating: options?.providerRating ?? 5,
    completedBookingsCount: options?.providerCompletedBookingsCount ?? 0,
    ...options?.providerOverrides,
  };

  const providerService = {
    id: 'provider-service-id',
    durationMinutes: 60,
    serviceId: 'service',
    ...options?.providerServiceOverrides,
  };

  const clientMock = {
    id: 'client-id',
    userId: 'client-user',
    completedBookingsCount: options?.clientCompletedBookingsCount ?? 0,
  };

  const insuranceServiceInstance =
    options?.insuranceService ?? new InsuranceService();

  const schedulerService = {
    scheduleBookingReminders: jest.fn().mockResolvedValue(undefined),
    cancelPendingSchedules: jest.fn().mockResolvedValue(undefined),
    notifyJobStarted: jest.fn().mockResolvedValue(undefined),
    notifyJobEnded: jest.fn().mockResolvedValue(undefined),
  } as any;

  const clientsServiceMock = {
    findClientByUserId: jest.fn().mockResolvedValue(clientMock),
  } as any;

  const providersServiceMock = {
    findOne: jest.fn().mockResolvedValue(provider),
    findByUserId: jest.fn().mockResolvedValue(provider),
  } as any;

  const service = new BookingsService(
    prismaMock as any,
    clientsServiceMock,
    providersServiceMock,
    { findOne: jest.fn().mockResolvedValue(providerService) } as any,
    {} as any,
    {} as any,
    {
      calculatePrice: jest
        .fn()
        .mockResolvedValue({ finalPrice: options?.dynamicPrice ?? 120 }),
    } as any,
    { applyCoupon: jest.fn().mockResolvedValue({ coupon: null }) } as any,
    insuranceServiceInstance,
    {} as any,
    {} as any,
    { trackEvent: jest.fn().mockResolvedValue(undefined) } as any,
    {} as any,
    { translate: jest.fn().mockResolvedValue('translated') } as any,
    redisLockService as any,
    cacheService,
    schedulerService,
  );

  return {
    service,
    cacheService,
    prismaMock,
    createdBooking,
    redisLockService,
    clientsServiceMock,
    providersServiceMock,
  };
};

const buildInsurancePlan = (
  overrides?: Partial<InsurancePlanProposal>,
): InsurancePlanProposal => ({
  id: InsurancePlanId.PREMIUM,
  name: 'Premium',
  basePriceCents: 5990,
  coverageCents: 350000,
  deductibleCents: 30000,
  proofRequired: false,
  finalPriceCents: 5990,
  eligible: true,
  reasons: [],
  riskMultiplierBps: 1000,
  ...overrides,
});

describe('BookingsService (idempotency cache)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when provider is not approved', async () => {
    const { service, prismaMock } = createServiceWithMocks({
      providerOverrides: {
        verificationStatus: VerificationStatus.PENDING_MANUAL_REVIEW,
      },
    });

    await expect(
      service.create('client-user', buildCreateBookingDto(), createRequest()),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prismaMock.address.create).not.toHaveBeenCalled();
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
  });

  it('returns cached booking when idempotency key hits', async () => {
    const { service, cacheService, prismaMock } = createServiceWithMocks();
    const cachedBooking = {
      id: 'cached-booking',
    } as BookingWithDetailsRelations;
    cacheService.get.mockResolvedValueOnce(cachedBooking);

    const booking = await service.create(
      'client-user',
      buildCreateBookingDto(),
      createRequest('idem-key'),
    );

    expect(booking).toBe(cachedBooking);
    expect(cacheService.set).not.toHaveBeenCalled();
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
  });

  it('creates and caches booking when idempotency key misses', async () => {
    const {
      service,
      cacheService,
      prismaMock,
      createdBooking,
      redisLockService,
    } = createServiceWithMocks();

    const booking = await service.create(
      'client-user',
      buildCreateBookingDto(),
      createRequest('new-key'),
    );

    expect(booking).toBe(createdBooking);
    expect(prismaMock.booking.create).toHaveBeenCalled();
    expect(cacheService.set).toHaveBeenCalledWith(
      `idempo:bookings:create:new-key`,
      createdBooking,
      IDEMPOTENCY_TTL_SECONDS,
    );
    expect(redisLockService.acquireLock).toHaveBeenCalled();
  });

  it('skips cache when no idempotency key is provided', async () => {
    const { service, cacheService, prismaMock } = createServiceWithMocks();

    await service.create(
      'client-user',
      buildCreateBookingDto(),
      createRequest(),
    );

    expect(cacheService.get).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
    expect(prismaMock.booking.create).toHaveBeenCalled();
  });
});

describe('BookingsService weekly frequency guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows at most two bookings per week then blocks the third', async () => {
    const { service, prismaMock } = createServiceWithMocks();
    const bookingCount = prismaMock.booking.count;
    bookingCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);

    await service.create(
      'client-user',
      buildCreateBookingDto(),
      createRequest(),
    );
    await service.create(
      'client-user',
      buildCreateBookingDto(),
      createRequest(),
    );
    await expect(
      service.create('client-user', buildCreateBookingDto(), createRequest()),
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it('resets the weekly tally when crossing Sunday to Monday', async () => {
    const { service, prismaMock } = createServiceWithMocks();
    const bookingCount = prismaMock.booking.count;
    bookingCount.mockResolvedValue(0);

    const sundayDto = buildCreateBookingDto();
    sundayDto.scheduledDate = '2025-08-03'; // Sunday
    const mondayDto = buildCreateBookingDto();
    mondayDto.scheduledDate = '2025-08-04'; // Monday

    await service.create('client-user', sundayDto, createRequest());
    await service.create('client-user', mondayDto, createRequest());

    const [firstCall, secondCall] = bookingCount.mock.calls;
    const firstStart = firstCall[0].where.scheduledStart.gte;
    const secondStart = secondCall[0].where.scheduledStart.gte;
    expect(firstStart.getUTCDay()).toBe(1);
    expect(secondStart.getUTCDay()).toBe(1);
    expect(
      (secondStart.getTime() - firstStart.getTime()) / (24 * 60 * 60 * 1000),
    ).toBe(7);
  });

  it('only counts confirmed, started and finished statuses', async () => {
    const { service, prismaMock } = createServiceWithMocks();
    const bookingCount = prismaMock.booking.count;
    bookingCount.mockResolvedValue(0);

    await service.create(
      'client-user',
      buildCreateBookingDto(),
      createRequest(),
    );

    const statuses = bookingCount.mock.calls[0][0].where.status.in;
    expect(statuses).toEqual([
      BookingStatus.CONFIRMED,
      BookingStatus.STARTED,
      BookingStatus.FINISHED,
    ]);
  });

  it('blocks confirming a third booking in the same week', async () => {
    const { service, prismaMock, providersServiceMock } =
      createServiceWithMocks();
    const booking = {
      id: 'booking-id',
      clientId: 'client-id',
      providerId: 'provider-id',
      scheduledDate: new Date('2025-08-03'),
      scheduledTime: '10:00',
      status: BookingStatus.PENDING_PAYMENT,
      client: { userId: 'client-user' },
      provider: { id: 'provider-id', userId: 'provider-user' },
    } as unknown as BookingWithDetailsRelations;

    prismaMock.booking.findUnique.mockResolvedValueOnce(booking);
    prismaMock.booking.count.mockResolvedValue(2);
    providersServiceMock.findByUserId = jest.fn().mockResolvedValue({
      id: 'provider-id',
    });

    const request = {
      user: { role: UserRole.PROVIDER, userId: 'provider-user' },
      locale: 'pt-BR',
    } as Request;

    await expect(
      service.updateStatus(
        'booking-id',
        BookingStatus.CONFIRMED,
        UserRole.PROVIDER,
        request,
      ),
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });
});

describe('BookingsService quote & mismatch detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a quote response with the computed final price', async () => {
    const { service } = createServiceWithMocks({ dynamicPrice: 180 });
    const quoteRequest: BookingQuoteRequestDto = {
      providerId: 'provider-id',
      providerServiceId: 'provider-service-id',
      scheduledDate: '2025-12-31',
      scheduledTime: '10:00',
      address: {
        latitude: -23.55,
        longitude: -46.63,
        city: 'SAO PAULO',
        state: 'SP',
        cep: '01001000',
      },
    };

    const response = await service.quotePrice(
      'client-user',
      quoteRequest,
      createRequest(),
    );

    expect(response.finalPrice).toBe(180);
    expect(response.subtotal).toBe(180);
    expect(response.quoteHash).toBeTruthy();
    expect(response.breakdown[0].amount).toBe(180);
  });

  it('throws PRICE_MISMATCH when the quote hash diverges', async () => {
    const { service } = createServiceWithMocks();
    const dto = buildCreateBookingDto();
    dto.quoteIdHash = 'invalid-hash';

    await expect(
      service.create('client-user', dto, createRequest()),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects booking creation when quote has expired', async () => {
    const { service } = createServiceWithMocks();
    const dto = buildCreateBookingDto();
    dto.quoteExpiresAt = new Date(Date.now() - 60_000).toISOString();

    await expect(
      service.create('client-user', dto, createRequest()),
    ).rejects.toMatchObject({
      message: expect.stringContaining('QUOTE_EXPIRED'),
    });
  });

  it('stores quote responses in redis cache per request key', async () => {
    const { service, cacheService } = createServiceWithMocks();
    const quoteRequest: BookingQuoteRequestDto = {
      providerId: 'provider-id',
      providerServiceId: 'provider-service-id',
      scheduledDate: '2025-12-31',
      scheduledTime: '10:00',
      address: {
        latitude: -23.55,
        longitude: -46.63,
        city: 'SAO PAULO',
        state: 'SP',
        cep: '01001000',
      },
    };

    cacheService.get.mockResolvedValue(undefined);
    const firstResponse = await service.quotePrice(
      'client-user',
      quoteRequest,
      createRequest(),
    );
    expect(cacheService.set).toHaveBeenCalledWith(
      expect.stringMatching(/^quote:[0-9a-f]{64}$/),
      firstResponse,
      60,
    );
    expect(calculateServiceTotalPriceMock).toHaveBeenCalledTimes(1);

    cacheService.get.mockResolvedValueOnce(firstResponse);
    const cachedResponse = await service.quotePrice(
      'client-user',
      quoteRequest,
      createRequest(),
    );
    expect(cachedResponse).toBe(firstResponse);
    expect(calculateServiceTotalPriceMock).toHaveBeenCalledTimes(1);
  });

  it('returns the same quoteHash for identical request payloads', async () => {
    const { service, cacheService } = createServiceWithMocks();
    const quoteRequest: BookingQuoteRequestDto = {
      providerId: 'provider-id',
      providerServiceId: 'provider-service-id',
      scheduledDate: '2025-12-31',
      scheduledTime: '10:00',
      address: {
        latitude: -23.55,
        longitude: -46.63,
        city: 'SAO PAULO',
        state: 'SP',
        cep: '01001000',
      },
    };

    cacheService.get.mockResolvedValue(undefined);
    const firstResponse = await service.quotePrice(
      'client-user',
      quoteRequest,
      createRequest(),
    );
    cacheService.get.mockResolvedValue(undefined);
    const secondResponse = await service.quotePrice(
      'client-user',
      quoteRequest,
      createRequest(),
    );
    expect(secondResponse.quoteHash).toBe(firstResponse.quoteHash);
  });
});

describe('BookingsService (insurance persistence)', () => {
  it('persists booking insurance snapshot when plan is eligible', async () => {
    const plan = buildInsurancePlan();
    const insuranceService = {
      getPlans: jest.fn().mockReturnValue([plan]),
    } as unknown as InsuranceService;

    const { service, prismaMock } = createServiceWithMocks({
      insuranceService,
    });

    const dto = buildCreateBookingDto();
    dto.insurancePlanId = plan.id;

    await expect(
      service.create('client-user', dto, createRequest()),
    ).resolves.toBeDefined();

    const bookingCreateCall = prismaMock.booking.create.mock.calls[0][0];
    expect(bookingCreateCall.data.bookingInsurance?.create).toEqual({
      planId: plan.id,
      priceCents: plan.finalPriceCents,
      coverageCents: plan.coverageCents,
      deductibleCents: plan.deductibleCents,
      riskMultiplierBps: plan.riskMultiplierBps,
      proofRequired: plan.proofRequired,
    });
  });

  it('rejects booking creation when requested insurance plan is not eligible', async () => {
    const plan = buildInsurancePlan({ eligible: false });
    const insuranceService = {
      getPlans: jest.fn().mockReturnValue([plan]),
    } as unknown as InsuranceService;

    const { service, prismaMock } = createServiceWithMocks({
      insuranceService,
    });

    const dto = buildCreateBookingDto();
    dto.insurancePlanId = plan.id;

    await expect(
      service.create('client-user', dto, createRequest()),
    ).rejects.toThrow('insurance-plan-not-eligible');

    expect(prismaMock.booking.create).not.toHaveBeenCalled();
  });
});
