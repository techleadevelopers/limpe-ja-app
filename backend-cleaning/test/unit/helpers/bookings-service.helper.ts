import {
  BookingStatus,
  ProviderService,
  Prisma,
  VerificationStatus,
} from '@prisma/client';
import { Request } from 'express';
import {
  BookingsService,
  BookingWithDetailsRelations,
  IDEMPOTENCY_TTL_SECONDS,
} from '../../../src/bookings/bookings.service';
import { calculateServiceTotalPrice } from '../../../src/bookings/pricing/price-calculator';
import {
  InsurancePlanProposal,
  InsuranceService,
} from '../../../src/insurance/insurance.service';
import { InsurancePlanId } from '../../../src/insurance/insurance.constants';
import { ProviderWithCalculatedRating } from '../../../src/providers/providers.service';
import { SchedulerService } from '../../../src/scheduler/scheduler.service';

jest.mock('../../../src/bookings/pricing/price-calculator', () => ({
  calculateServiceTotalPrice: jest.fn(),
}));

const calculateServiceTotalPriceMock =
  calculateServiceTotalPrice as jest.MockedFunction<
    typeof calculateServiceTotalPrice
  >;

export { calculateServiceTotalPriceMock };

export const buildCreateBookingDto = (): Parameters<
  BookingsService['create']
>[1] => ({
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
    city: 'Sao Paulo',
    state: 'SP',
    latitude: -23.55052,
    longitude: -46.633308,
  },
});

export const createRequest = (idempotencyKey?: string): Request =>
  ({
    headers: idempotencyKey
      ? ({ 'idempotency-key': idempotencyKey } as Record<string, string>)
      : {},
    locale: 'pt-BR',
  } as unknown as Request);

interface CreateServiceOptions {
  dynamicPrice?: number;
  providerServiceOverrides?: Partial<ProviderService>;
  providerOverrides?: Partial<
    ProviderWithCalculatedRating & { verificationStatus: VerificationStatus }
  >;
  clientCompletedBookingsCount?: number;
  providerCompletedBookingsCount?: number;
  providerRating?: number;
  insuranceService?: InsuranceService;
  schedulerService?: SchedulerService;
}

export const createServiceWithMocks = (options?: CreateServiceOptions) => {
  const cacheService = {
    get: jest.fn(),
    set: jest.fn(),
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
  } as unknown as BookingWithDetailsRelations;

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

  const clientMock = {
    id: 'client-id',
    userId: 'client-user',
    completedBookingsCount: options?.clientCompletedBookingsCount ?? 0,
  };

  const insuranceServiceInstance =
    options?.insuranceService ?? new InsuranceService();

  const schedulerService =
    options?.schedulerService ??
    ({
      scheduleBookingReminders: jest.fn().mockResolvedValue(undefined),
      cancelPendingSchedules: jest.fn().mockResolvedValue(undefined),
      notifyJobStarted: jest.fn().mockResolvedValue(undefined),
      notifyJobEnded: jest.fn().mockResolvedValue(undefined),
    } as any);

  const providerService: ProviderService = {
    id: 'provider-service-id',
    durationMinutes: 60,
    serviceId: 'service',
    pricingType: 'FIXED_PRICE',
    price: new Prisma.Decimal(100),
    pricePerHour: new Prisma.Decimal(200),
    ...options?.providerServiceOverrides,
  } as any;

  const provider = {
    id: 'provider-id',
    verificationStatus: VerificationStatus.APPROVED,
    averageRating: options?.providerRating ?? 5,
    completedBookingsCount: options?.providerCompletedBookingsCount ?? 0,
    ...options?.providerOverrides,
  };

  const service = new BookingsService(
    prismaMock as any,
    {
      findClientByUserId: jest.fn().mockResolvedValue(clientMock),
    } as any,
    { findOne: jest.fn().mockResolvedValue(provider) } as any,
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
    cacheService as any,
    schedulerService as any,
  );

  return {
    service,
    cacheService,
    prismaMock,
    createdBooking,
    redisLockService,
    schedulerService,
  };
};
