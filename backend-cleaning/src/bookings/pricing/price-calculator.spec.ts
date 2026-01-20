import { BadRequestException } from '@nestjs/common';
import { ProviderService, Prisma } from '@prisma/client';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { calculateServiceTotalPrice } from './price-calculator';

const baseAddress = {
  cep: '00000000',
  street: 'Rua Teste',
  number: '123',
  complement: '',
  neighborhood: 'Centro',
  city: 'Sao Paulo',
  state: 'SP',
  latitude: 0,
  longitude: 0,
};

const buildDto = (override?: Partial<CreateBookingDto>): CreateBookingDto =>
  ({
    providerId: 'provider-1',
    providerServiceId: 'service-1',
    scheduledDate: '2026-01-01',
    scheduledTime: '10:00',
    totalPrice: 1,
    address: baseAddress as any,
    ...override,
  }) as CreateBookingDto;

describe('calculateServiceTotalPrice', () => {
  it('throws when pricePerHour is missing', async () => {
    const providerService = {
      id: 'ps1',
      providerId: 'provider-1',
      serviceId: 'service-1',
      description: 'fallback',
      pricePerHour: new Prisma.Decimal(0),
      durationMinutes: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as ProviderService;

    await expect(
      calculateServiceTotalPrice({
        providerService,
        createBookingDto: buildDto(),
        locale: 'pt-BR',
        translate: async () => 'error',
      }),
    ).rejects.toMatchObject({
      response: { code: 'hourly_price_missing' },
    });
  });

  it('throws duration_required when no duration can be inferred', async () => {
    const providerService = {
      id: 'ps-duration',
      providerId: 'provider-1',
      serviceId: 'service-duration',
      description: 'No duration service',
      pricePerHour: new Prisma.Decimal(120),
      durationMinutes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as ProviderService;

    await expect(
      calculateServiceTotalPrice({
        providerService,
        createBookingDto: buildDto({ requestedDurationMinutes: undefined }),
        locale: 'pt-BR',
        translate: async () => 'duration error',
      }),
    ).rejects.toMatchObject({
      response: { code: 'duration_required' },
    });
  });

  it('throws negative_price when calculated total becomes negative', async () => {
    const providerService = {
      id: 'ps-neg',
      providerId: 'provider-1',
      serviceId: 'service-neg',
      description: 'Negative price',
      pricePerHour: new Prisma.Decimal(-50),
      durationMinutes: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as ProviderService;

    await expect(
      calculateServiceTotalPrice({
        providerService,
        createBookingDto: buildDto({ requestedDurationMinutes: 60 }),
        locale: 'pt-BR',
        translate: async () => 'negative',
      }),
    ).rejects.toMatchObject({
      response: { code: 'negative_price' },
    });
  });

  it('enforces minimum 4h even when requested duration is 1h', async () => {
    const providerService = {
      id: 'ps2',
      providerId: 'provider-1',
      serviceId: 'service-2',
      description: 'Hourly service',
      pricePerHour: new Prisma.Decimal(120),
      durationMinutes: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as ProviderService;

    const result = await calculateServiceTotalPrice({
      providerService,
      createBookingDto: buildDto({ requestedDurationMinutes: 60 }),
      locale: 'pt-BR',
      translate: async () => 'error',
    });

    expect(result.normalizedRequestedDurationMinutes).toBe(240);
    expect(result.calculatedTotalPrice.toNumber()).toBeCloseTo(480);
  });

  it('uses provider default duration when request not provided', async () => {
    const providerService = {
      id: 'ps3',
      providerId: 'provider-1',
      serviceId: 'service-3',
      description: 'Hourly with default',
      pricePerHour: new Prisma.Decimal(80),
      durationMinutes: 180,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as ProviderService;

    const result = await calculateServiceTotalPrice({
      providerService,
      createBookingDto: buildDto(),
      locale: 'pt-BR',
      translate: async () => 'error',
    });

    expect(result.normalizedRequestedDurationMinutes).toBe(240);
    expect(result.calculatedTotalPrice.toNumber()).toBeCloseTo(320);
  });
});
