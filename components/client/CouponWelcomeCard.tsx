// LimpeJaApp/components/client/CouponWelcomeCard.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Easing,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { AppColors, AppDurations, AppOffsets, AppShadows, AppTypography, SCREEN_WIDTH } from '../../constants/appStyles';

interface CouponWelcomeCardProps {
  code: string;
  title: string;
  subtitle?: string;
  expiresAt?: string | null; // <-- CORREÇÃO AQUI: Agora aceita string ou null
  onUseNow: (code: string) => void;
  onDismiss: () => void;
}

interface CouponWelcomeCardStyles {
  cardContainer: ViewStyle;
  gradientBackground: ViewStyle;
  contentWrapper: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  badge: ViewStyle;
  badgeText: TextStyle;
  subtitle: TextStyle;
  couponCodeContainer: ViewStyle;
  couponCode: TextStyle;
  copyButton: ViewStyle;
  copyButtonText: TextStyle;
  actionsContainer: ViewStyle;
  useNowButton: ViewStyle;
  useNowButtonText: TextStyle;
  dismissButton: ViewStyle;
  dismissButtonText: TextStyle;
}


const CouponWelcomeCard: React.FC<CouponWelcomeCardProps> = ({
  code,
  title,
  subtitle,
  expiresAt,
  onUseNow,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(AppOffsets.translateY * 2)).current;
  const scaleButtonAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: AppDurations.md,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: AppDurations.md,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCopyCode = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(code);
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('offers.coupon_code_copied', { code }),
      });
      Animated.sequence([
        Animated.timing(scaleButtonAnim, { toValue: 0.96, duration: AppDurations.xs, useNativeDriver: true }),
        Animated.spring(scaleButtonAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
      ]).start();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('offers.failed_to_copy_coupon'),
      });
    }
  }, [code, t]);

  const handleUseNowPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleButtonAnim, { toValue: 0.96, duration: AppDurations.xs, useNativeDriver: true }),
      Animated.spring(scaleButtonAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start(() => onUseNow(code));
  }, [code, onUseNow]);

  const handleDismissPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleButtonAnim, { toValue: 0.96, duration: AppDurations.xs, useNativeDriver: true }),
      Animated.spring(scaleButtonAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start(() => onDismiss());
  }, [onDismiss]);

  // Convertendo expiresAt para Date object para cálculos e formatação
  const expirationDate = expiresAt ? new Date(expiresAt) : undefined;

  const formattedExpiresAt = expirationDate ? expirationDate.toLocaleDateString(t('common.locale'), { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const expiresInDays = expirationDate ? Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <Animated.View style={[styles.cardContainer, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
      <LinearGradient
        colors={[AppColors.primaryInteractive, AppColors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {expiresInDays !== null && expiresInDays > 0 && (
              <View style={styles.badge}>
                <Ionicons name="time-outline" size={14} color={AppColors.white} />
                <Text style={styles.badgeText}>{t('offers.expires_in_days', { count: expiresInDays })}</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.couponCodeContainer}>
            <Text style={styles.couponCode}>{code}</Text>
            <TouchableOpacity
              onPress={handleCopyCode}
              style={[styles.copyButton, { transform: [{ scale: scaleButtonAnim }] }]}
            >
              <Ionicons name="copy-outline" size={20} color={AppColors.white} />
              <Text style={styles.copyButtonText}>{t('offers.copy_code')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              onPress={handleUseNowPress}
              style={[styles.useNowButton, { transform: [{ scale: scaleButtonAnim }] }]}
            >
              <Text style={styles.useNowButtonText}>{t('offers.use_now')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDismissPress}
              style={[styles.dismissButton, { transform: [{ scale: scaleButtonAnim }] }]}
            >
              <Text style={styles.dismissButtonText}>{t('common.dismiss')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create<CouponWelcomeCardStyles>({
  cardContainer: {
    width: SCREEN_WIDTH * 0.9,
    borderRadius: 15,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 20,
    ,
  },
  gradientBackground: {
    padding: 20,
  },
  contentWrapper: {
    // Flex direction can be adjusted if needed
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    ...AppTypography.title,
    color: AppColors.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  subtitle: {
    ...AppTypography.body,
    color: AppColors.white,
    fontSize: 16,
    marginBottom: 15,
  },
  couponCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  couponCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.white,
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  copyButtonText: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  useNowButton: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
  },
  useNowButtonText: {
    color: AppColors.primaryInteractive,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dismissButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    flex: 0.6,
  },
  dismissButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CouponWelcomeCard;