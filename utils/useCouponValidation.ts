// hooks/useCouponValidation.ts
import { useState, useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';

import NotificationUIService from '../services/notificationUIService';
import { applyCoupon } from '../services/clientService';
import { formatBRL } from '../utils/formatters';
import { AppColors, AppDurations } from '../constants/appStyles';

interface UseCouponValidationResult {
    couponCode: string;
    setCouponCode: React.Dispatch<React.SetStateAction<string>>;
    discountAmount: number;
    isApplyingCoupon: boolean;
    couponInputAnim: Animated.Value;
    couponFeedbackAnim: Animated.Value;
    couponFeedbackColor: string;
    couponFeedbackIcon: string;
    handleApplyCoupon: () => Promise<void>;
}

export const useCouponValidation = (initialCouponCode?: string): UseCouponValidationResult => {
    const { t } = useTranslation();

    const [couponCode, setCouponCode] = useState<string>(initialCouponCode || '');
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false);
    const couponInputAnim = useRef(new Animated.Value(0)).current;
    const couponFeedbackAnim = useRef(new Animated.Value(0)).current;
    const [couponFeedbackColor, setCouponFeedbackColor] = useState(AppColors.successStandard);
    const [couponFeedbackIcon, setCouponFeedbackIcon] = useState('checkmark-circle');

    const handleApplyCoupon = useCallback(async () => {
        if (!couponCode) {
            NotificationUIService.showInfo(t('offers.invalid_coupon'), t('common.error'));
            return;
        }
        setIsApplyingCoupon(true);
        couponFeedbackAnim.setValue(0); // Reset animation before starting

        try {
            // ATENÇÃO: mockBookingId é usado aqui para validação de cupom.
            // Em um cenário real, você precisaria de um bookingId temporário (rascunho)
            // ou um endpoint de backend que valide o cupom sem a necessidade de um bookingId existente.
            // A recomendação é criar um endpoint POST /coupons/validate { code } no backend.
            const mockBookingId = 'mock-booking-id-for-coupon-validation';

            const result = await applyCoupon(mockBookingId, couponCode);
            const newDiscount = result.discountValue || 0;

            setDiscountAmount(newDiscount);
            setCouponFeedbackColor(AppColors.successStandard);
            setCouponFeedbackIcon('checkmark-circle');
            NotificationUIService.showSuccess(t('offers.coupon_applied_success', { discountValue: formatBRL(newDiscount) }), t('common.success'));

            Animated.timing(couponFeedbackAnim, {
                toValue: 1,
                duration: AppDurations.sm,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start(() => {
                setTimeout(() => {
                    Animated.timing(couponFeedbackAnim, {
                        toValue: 0,
                        duration: AppDurations.sm,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }).start();
                }, 3000);
            });

        } catch (error: any) {
            console.error("Erro ao aplicar cupom:", error.response?.data || error.message);
            setDiscountAmount(0);
            setCouponFeedbackColor(AppColors.errorRed);
            setCouponFeedbackIcon('close-circle');
            NotificationUIService.showError(error.response?.data?.message || t('offers.invalid_coupon'), t('common.error'));
            Animated.timing(couponFeedbackAnim, {
                toValue: 1,
                duration: AppDurations.sm,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start(() => {
                setTimeout(() => {
                    Animated.timing(couponFeedbackAnim, {
                        toValue: 0,
                        duration: AppDurations.sm,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }).start();
                }, 3000);
            });
        } finally {
            setIsApplyingCoupon(false);
        }
    }, [couponCode, couponFeedbackAnim, t]);

    return {
        couponCode,
        setCouponCode,
        discountAmount,
        isApplyingCoupon,
        couponInputAnim,
        couponFeedbackAnim,
        couponFeedbackColor,
        couponFeedbackIcon,
        handleApplyCoupon,
    };
};