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
  let calculatedTotalPrice: Prisma.Decimal;
  let normalizedRequestedDurationMinutes: number | undefined;

  switch (providerService.pricingType) {
    case 'FIXED_PRICE':
      if (!providerService.price) {
        throw new BadRequestException('Preço do serviço não configurado.');
      }
      calculatedTotalPrice = providerService.price;
      break;
    case 'HOURLY': {
      let requestedDuration = createBookingDto.requestedDurationMinutes;
      if (!requestedDuration || requestedDuration <= 0) {
        const serviceDefaultDuration = providerService.durationMinutes ?? 0;
        if (serviceDefaultDuration > 0) {
          requestedDuration = serviceDefaultDuration;
        }
      }

      if (!requestedDuration) {
        const message = await translate('booking.badRequest.durationRequired', locale);
        throw new BadRequestException(message);
      }

      const normalizedDuration = Math.max(requestedDuration, minHourlyMinutes);
      if (normalizedDuration !== requestedDuration) {
        requestedDuration = normalizedDuration;
      }
      normalizedRequestedDurationMinutes = requestedDuration;

      const hourlyBase = providerService.pricePerHour ?? providerService.price;
      if (!hourlyBase) {
        throw new BadRequestException('Preço por hora não configurado para este serviço.');
      }

      calculatedTotalPrice = hourlyBase.mul(
        new Prisma.Decimal(requestedDuration).div(new Prisma.Decimal(60)),
      );
      break;
    }
    case 'BY_SIZE': {
      if (
        createBookingDto.requestedSquareMeters &&
        providerService.pricePerSquareMeter
      ) {
        calculatedTotalPrice = providerService.pricePerSquareMeter.mul(
          new Prisma.Decimal(createBookingDto.requestedSquareMeters),
        );
      } else if (
        createBookingDto.requestedRoomCount &&
        providerService.pricePerRoom
      ) {
        calculatedTotalPrice = providerService.pricePerRoom.mul(
          new Prisma.Decimal(createBookingDto.requestedRoomCount),
        );
      } else {
        const message = await translate('booking.badRequest.sizeOrRoomsRequired', locale);
        throw new BadRequestException(message);
      }
      break;
    }
    default:
      throw new BadRequestException('Tipo de precificação inválido.');
  }

  if (calculatedTotalPrice.lessThan(0)) {
    const message = await translate('booking.badRequest.negativePrice', locale);
    throw new BadRequestException(message);
  }

  return {
    calculatedTotalPrice,
    normalizedRequestedDurationMinutes,
  };
}
