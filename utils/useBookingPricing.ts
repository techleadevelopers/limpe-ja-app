// hooks/useBookingPricing.ts
import { useMemo } from 'react';
import { PricingType } from '../types/backend/services';
import { ProviderServiceOffering } from '../types/backend/providers';

interface UseBookingPricingProps {
    selectedProviderService: ProviderServiceOffering | null;
    durationInMinutes: number | null;
    squareMeters: number | null;
    discountAmount: number;
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
}: UseBookingPricingProps): BookingPricingResult => {
    const calculatedSubtotal = useMemo(() => {
        if (!selectedProviderService || selectedProviderService.price == null) {
            return 0;
        }

        switch (selectedProviderService.pricingType) {
            case PricingType.HOURLY:
                if (durationInMinutes != null && durationInMinutes > 0) {
                    return (durationInMinutes / 60) * selectedProviderService.price;
                }
                break;
            case PricingType.BY_SIZE:
                if (squareMeters != null && squareMeters > 0) {
                    return squareMeters * selectedProviderService.price;
                }
                break;
            default:
                return selectedProviderService.price;
        }
        return 0;
    }, [selectedProviderService, durationInMinutes, squareMeters]);

    const finalCalculatedPrice = useMemo(() => {
        const priceAfterDiscount = calculatedSubtotal - discountAmount;
        return priceAfterDiscount > 0 ? priceAfterDiscount : 0;
    }, [calculatedSubtotal, discountAmount]);

    return { calculatedSubtotal, finalCalculatedPrice };
};