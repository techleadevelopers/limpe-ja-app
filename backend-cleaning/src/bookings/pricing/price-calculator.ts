import { BadRequestException } from '@nestjs/common';
import { Prisma, ProviderService } from '@prisma/client';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { MIN_HOURLY_MINUTES } from '../../common/constants/pricing';

export type TranslateFn = (
  key: string,
  locale: string,
  replacements?: Record<string, unknown>,
) => Promise<string>;

export interface BookingPriceCalculationResult {
  calculatedTotalPrice: Prisma.Decimal;
  normalizedRequestedDurationMinutes?: number;
}

export interface BookingPriceCalculatorInput {
  providerService: ProviderService;
  createBookingDto: CreateBookingDto;
  locale: string;
  translate: TranslateFn;
  minHourlyMinutes?: number;
}

export async function calculateServiceTotalPrice({
  providerService,
  createBookingDto,
  locale,
  translate,
  minHourlyMinutes = MIN_HOURLY_MINUTES,
}: BookingPriceCalculatorInput): Promise<BookingPriceCalculationResult> {
  const hourlyPrice = providerService.pricePerHour;
  if (!hourlyPrice || hourlyPrice.lessThanOrEqualTo(0)) {
    throw new BadRequestException(
      'Preco por hora nao configurado para este servico.',
    );
  }

  let requestedDuration = createBookingDto.requestedDurationMinutes;
  if (!requestedDuration || requestedDuration <= 0) {
    const serviceDefaultDuration = providerService.durationMinutes ?? 0;
    if (serviceDefaultDuration > 0) {
      requestedDuration = serviceDefaultDuration;
    }
  }

  if (!requestedDuration) {
    const message = await translate(
      'booking.badRequest.durationRequired',
      locale,
    );
    throw new BadRequestException(message);
  }

  const normalizedDuration = Math.max(requestedDuration, minHourlyMinutes);
  const hoursFromDuration = Math.ceil(normalizedDuration / 60);
  const minimumHours = Math.max(
    4,
    Math.ceil(MIN_HOURLY_MINUTES / 60),
  );
  const billedHours = Math.max(hoursFromDuration, minimumHours);

  const calculatedTotalPrice = hourlyPrice.mul(
    new Prisma.Decimal(billedHours),
  );

  if (calculatedTotalPrice.lessThan(0)) {
    const message = await translate('booking.badRequest.negativePrice', locale);
    throw new BadRequestException(message);
  }

  return {
    calculatedTotalPrice,
    normalizedRequestedDurationMinutes: normalizedDuration,
  };
}
