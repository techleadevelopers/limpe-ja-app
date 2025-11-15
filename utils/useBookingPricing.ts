// hooks/useBookingPricing.ts
import { useMemo } from 'react';
import { PricingType } from '../types/backend/services';
import { ProviderServiceOffering } from '../types/backend/providers';

interface UseBookingPricingProps {
  selectedProviderService: ProviderServiceOffering | null;
  durationInMinutes: number | null;
  squareMeters: number | null;
  discountAmount: number;
  // Número de slots de horário selecionados (para serviços por hora)
  slotCount?: number;
}

interface BookingPricingResult {
  calculatedSubtotal: number;
  finalCalculatedPrice: number;
}

export const useBookingPricing = ({
  selectedProviderService,
  durationInMinutes,
  squareMeters,
  discountAmount,
  slotCount,
}: UseBookingPricingProps): BookingPricingResult => {
  const calculatedSubtotal = useMemo(() => {
    if (!selectedProviderService) {
      return 0;
    }

    const slots = slotCount ?? 0;

    switch (selectedProviderService.pricingType) {
      case PricingType.HOURLY: {
        // Usa número de slots se informado; caso contrário, cai para durationInMinutes
        if ((durationInMinutes != null && durationInMinutes > 0) || slots > 0) {
          const rawPerHour = (selectedProviderService as any).pricePerHour;
          const pricePerHour =
            typeof rawPerHour === 'number'
              ? rawPerHour
              : (rawPerHour as any)?.toNumber?.() ??
                (typeof selectedProviderService.price === 'number'
                  ? selectedProviderService.price
                  : (selectedProviderService.price as any)?.toNumber?.() ?? 0);

          if (!pricePerHour || pricePerHour <= 0) {
            return 0;
          }

          const hours =
            slots > 0
              ? slots
              : (durationInMinutes as number) / 60;

          return hours * pricePerHour;
        }
        break;
      }
      case PricingType.BY_SIZE:
        if (squareMeters != null && squareMeters > 0 && selectedProviderService.price != null) {
          return squareMeters * selectedProviderService.price;
        }
        break;
      default:
        if (selectedProviderService.price != null) {
          // Mesmo para FIXED_PRICE/CUSTOM_QUOTE, se a tela estiver permitindo
          // seleção de múltiplos slots, multiplicar pelo número de slots.
          if (slots > 0) {
            return slots * selectedProviderService.price;
          }
          return selectedProviderService.price;
        }
        break;
    }

    return 0;
  }, [selectedProviderService, durationInMinutes, squareMeters, slotCount]);

  const finalCalculatedPrice = useMemo(() => {
    const priceAfterDiscount = calculatedSubtotal - discountAmount;
    return priceAfterDiscount > 0 ? priceAfterDiscount : 0;
  }, [calculatedSubtotal, discountAmount]);

  return { calculatedSubtotal, finalCalculatedPrice };
};
