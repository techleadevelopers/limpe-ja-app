// hooks/useCouponValidation.ts
import { useState, useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';

import NotificationUIService from '../services/notificationUIService';
import { applyCoupon as applyCouponToBooking } from '../services/clientService';
import { applyCoupon as applyCouponGlobal } from '../services/couponService';
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

type CouponBookingData = {
    originalPrice?: number;
    clientId?: string;
    providerServiceId?: string;
    providerId?: string;
    scheduledDate?: string;
};

export const useCouponValidation = (
    initialCouponCode?: string,
    opts?: { bookingId?: string; bookingData?: CouponBookingData }
): UseCouponValidationResult => {
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
            let newDiscount = 0;

            if (opts?.bookingId) {
                const result = await applyCouponToBooking(opts.bookingId, couponCode);
                newDiscount = result.discountValue || 0;
            } else if (opts?.bookingData) {
                const result = await applyCouponGlobal({ code: couponCode, bookingData: opts.bookingData });
                newDiscount = result.discountValue || 0;
            } else {
                NotificationUIService.showInfo(
                    t('offers.coupon_requires_context', 'Informe o agendamento para validar o cupom.'),
                    t('common.info')
                );
                setIsApplyingCoupon(false);
                return;
            }

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
