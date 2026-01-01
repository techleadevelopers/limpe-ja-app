// hooks/useBookingPricing.ts
import { useMemo } from 'react';
import { ProviderServiceOffering } from '../types/backend/providers';

interface UseBookingPricingProps {
  selectedProviderService: ProviderServiceOffering | null;
  durationInMinutes: number | null;
  discountAmount: number;
}

interface BookingPricingResult {
  calculatedSubtotal: number;
  finalCalculatedPrice: number;
}

export const useBookingPricing = ({
  selectedProviderService,
  durationInMinutes,
  discountAmount,
}: UseBookingPricingProps): BookingPricingResult => {
  const calculatedSubtotal = useMemo(() => {
    if (!selectedProviderService) {
      return 0;
    }

    if (durationInMinutes == null || durationInMinutes <= 0) {
      return 0;
    }

    const effectiveDuration = Math.max(durationInMinutes, 240);
    const rawPerHour = (selectedProviderService as any).pricePerHour;
    const pricePerHour =
      typeof rawPerHour === 'number'
        ? rawPerHour
        : (rawPerHour as any)?.toNumber?.() ?? 0;

    if (!pricePerHour || pricePerHour <= 0) {
      return 0;
    }

    const totalHours = Math.ceil(effectiveDuration / 60);
    return totalHours * pricePerHour;

    return 0;
  }, [selectedProviderService, durationInMinutes]);

  const finalCalculatedPrice = useMemo(() => {
    const priceAfterDiscount = calculatedSubtotal - discountAmount;
    return priceAfterDiscount > 0 ? priceAfterDiscount : 0;
  }, [calculatedSubtotal, discountAmount]);

  return { calculatedSubtotal, finalCalculatedPrice };
};
