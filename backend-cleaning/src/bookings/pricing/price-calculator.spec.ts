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
  city: 'São Paulo',
  state: 'SP',
  latitude: 0,
  longitude: 0,
};

const translate = async (key: string) => key;

const buildDto = (override?: Partial<CreateBookingDto>): CreateBookingDto =>
  ({
    providerId: 'provider-1',
    providerServiceId: 'service-1',
    scheduledDate: '2026-01-01',
    scheduledTime: '10:00',
    totalPrice: 1,
    address: baseAddress as any,
    ...override,
  } as CreateBookingDto);

describe('calculateServiceTotalPrice', () => {
  it('throws when pricingType is unknown', async () => {
    const providerService = {
      id: 'ps1',
      providerId: 'provider-1',
      serviceId: 'service-1',
      description: 'fallback',
      pricingType: 'UNKNOWN',
      price: new Prisma.Decimal(0),
      pricePerHour: new Prisma.Decimal(0),
      pricePerSquareMeter: new Prisma.Decimal(0),
      pricePerRoom: new Prisma.Decimal(0),
      durationMinutes: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as ProviderService;

    await expect(
      calculateServiceTotalPrice({
        providerService,
        createBookingDto: buildDto(),
        locale: 'pt-BR',
        translate,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('calculates hourly totals and enforces minimum duration', async () => {
    const providerService = {
      id: 'ps2',
      providerId: 'provider-1',
      serviceId: 'service-2',
      description: 'Hourly service',
      pricingType: 'HOURLY',
      price: new Prisma.Decimal(0),
      pricePerHour: new Prisma.Decimal(120),
      pricePerSquareMeter: new Prisma.Decimal(0),
      pricePerRoom: new Prisma.Decimal(0),
      durationMinutes: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as ProviderService;

    const result = await calculateServiceTotalPrice({
      providerService,
      createBookingDto: buildDto({ requestedDurationMinutes: 60 }),
      locale: 'pt-BR',
      translate,
      minHourlyMinutes: 240,
    });

    expect(result.normalizedRequestedDurationMinutes).toBe(240);
    expect(result.calculatedTotalPrice.toNumber()).toBeCloseTo(480);
  });

  it('calculates fixed price and ignores totalPrice from client', async () => {
    const providerService = {
      id: 'ps3',
      providerId: 'provider-1',
      serviceId: 'service-3',
      description: 'Fixed',
      pricingType: 'FIXED_PRICE',
      price: new Prisma.Decimal(750),
      pricePerHour: new Prisma.Decimal(0),
      pricePerSquareMeter: new Prisma.Decimal(0),
      pricePerRoom: new Prisma.Decimal(0),
      durationMinutes: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as ProviderService;

    const dto = buildDto({ totalPrice: 999 });
    const result = await calculateServiceTotalPrice({
      providerService,
      createBookingDto: dto,
      locale: 'pt-BR',
      translate,
    });

    expect(result.calculatedTotalPrice.toNumber()).toBe(750);
    expect(result.normalizedRequestedDurationMinutes).toBeUndefined();
  });
});
