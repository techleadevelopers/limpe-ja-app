import { useCallback, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import NotificationUIService from '../services/notificationUIService';
import { AppColors, AppDurations } from '../constants/appStyles';

interface UseCouponValidationOptions {
  couponCode: string;
  onApplyCoupon?: () => Promise<void>;
}

interface UseCouponValidationResult {
  isApplyingCoupon: boolean;
  couponInputAnim: Animated.Value;
  couponFeedbackAnim: Animated.Value;
  couponFeedbackColor: string;
  couponFeedbackIcon: string;
  handleApplyCoupon: () => Promise<void>;
}

export const useCouponValidation = (
  options: UseCouponValidationOptions,
): UseCouponValidationResult => {
  const { couponCode, onApplyCoupon } = options;
  const { t } = useTranslation();
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const couponInputAnim = useRef(new Animated.Value(0)).current;
  const couponFeedbackAnim = useRef(new Animated.Value(0)).current;
  const [couponFeedbackColor, setCouponFeedbackColor] = useState(
    AppColors.successStandard,
  );
  const [couponFeedbackIcon, setCouponFeedbackIcon] = useState('checkmark-circle');

  const animateFeedback = useCallback(() => {
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
  }, [couponFeedbackAnim]);

  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode) {
      NotificationUIService.showInfo(
        t('offers.invalid_coupon'),
        t('common.error'),
      );
      return;
    }

    if (!onApplyCoupon) {
      NotificationUIService.showInfo(
        t('offers.coupon_requires_context', {
          defaultValue: 'Informe o agendamento para validar o cupom.',
        }),
        t('common.info'),
      );
      return;
    }

    setIsApplyingCoupon(true);
    couponFeedbackAnim.setValue(0);

    try {
      await onApplyCoupon();
      setCouponFeedbackColor(AppColors.successStandard);
      setCouponFeedbackIcon('checkmark-circle');
      NotificationUIService.showSuccess(
        t('offers.coupon_applied_success', {
          defaultValue: 'Cupom solicitado. Atualizamos a cotação.',
        }),
        t('common.success'),
      );
    } catch (error: any) {
      setCouponFeedbackColor(AppColors.errorRed);
      setCouponFeedbackIcon('close-circle');
      NotificationUIService.showError(
        error?.response?.data?.message || t('offers.invalid_coupon'),
        t('common.error'),
      );
    } finally {
      setIsApplyingCoupon(false);
      animateFeedback();
    }
  }, [couponCode, onApplyCoupon, t, couponFeedbackAnim, animateFeedback]);

  return {
    isApplyingCoupon,
    couponInputAnim,
    couponFeedbackAnim,
    couponFeedbackColor,
    couponFeedbackIcon,
    handleApplyCoupon,
  };
};
