import { Request } from 'express';
import { Prisma, BookingStatus } from '@prisma/client';
import { CacheService } from '../cache/cache.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  BookingsService,
  BookingWithDetailsRelations,
  IDEMPOTENCY_TTL_SECONDS,
} from './bookings.service';
import { calculateServiceTotalPrice } from './pricing/price-calculator';

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
  } as unknown as Request);

const createServiceWithMocks = () => {
  const cacheService = {
    get: jest.fn(),
    set: jest.fn(),
  } as unknown as CacheService;

  calculateServiceTotalPriceMock.mockResolvedValue({
    calculatedTotalPrice: new Prisma.Decimal(150),
  });

  const createdBooking: BookingWithDetailsRelations =
    ({
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
      status: BookingStatus.PENDING,
      notes: null,
      addressId: 'address-id',
      couponId: null,
      discountAmount: new Prisma.Decimal(0),
      couponUsage: null,
      client: { id: 'client-id', userId: 'client-user' },
      provider: { id: 'provider-id', userId: 'provider-user' },
      providerService: { id: 'provider-service-id', service: { id: 'service' } },
      review: null,
      address: { id: 'address-id' },
      subscription: null,
      incidents: [],
      guaranteeClaims: [],
      coupon: null,
      paymentIntent: null,
    } as unknown as BookingWithDetailsRelations);

  const prismaMock = {
    booking: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(createdBooking),
    },
    address: {
      create: jest.fn().mockResolvedValue({ id: 'address-id' }),
    },
  };

  const redisLockService = {
    acquireLock: jest.fn().mockResolvedValue(true),
    releaseLock: jest.fn().mockResolvedValue(undefined),
  };

  const service = new BookingsService(
    prismaMock as any,
    { findClientByUserId: jest.fn().mockResolvedValue({ id: 'client-id', userId: 'client-user' }) } as any,
    { findOne: jest.fn().mockResolvedValue({ id: 'provider-id' }) } as any,
    { findOne: jest.fn().mockResolvedValue({ id: 'provider-service-id', durationMinutes: 60, serviceId: 'service' }) } as any,
    {} as any,
    {} as any,
    { calculatePrice: jest.fn().mockResolvedValue({ finalPrice: 120 }) } as any,
    { applyCoupon: jest.fn().mockResolvedValue({ coupon: null }) } as any,
    {} as any,
    {} as any,
    { trackEvent: jest.fn().mockResolvedValue(undefined) } as any,
    {} as any,
    { translate: jest.fn().mockResolvedValue('translated') } as any,
    redisLockService as any,
    cacheService,
  );

  return {
    service,
    cacheService,
    prismaMock,
    createdBooking,
    redisLockService,
  };
};

describe('BookingsService (idempotency cache)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns cached booking when idempotency key hits', async () => {
    const { service, cacheService, prismaMock } = createServiceWithMocks();
    const cachedBooking = { id: 'cached-booking' } as BookingWithDetailsRelations;
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
    const { service, cacheService, prismaMock, createdBooking, redisLockService } =
      createServiceWithMocks();

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

    await service.create('client-user', buildCreateBookingDto(), createRequest());

    expect(cacheService.get).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
    expect(prismaMock.booking.create).toHaveBeenCalled();
  });
});
