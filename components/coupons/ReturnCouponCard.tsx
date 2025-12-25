import React, { useRef, useEffect, useCallback } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { AppColors, AppDurations, AppOffsets, AppShadows, AppTypography, SCREEN_WIDTH } from '../../constants/appStyles';

interface ReturnCouponCardProps {
  code: string;
  title: string;
  subtitle?: string;
  expiresAt?: Date; // <<-- DEVE SER 'Date | undefined'
  onRebookNow: (code: string) => void; // <<-- DEVE SER 'onRebookNow'
}

export const ReturnCouponCard: React.FC<ReturnCouponCardProps> = ({
  code,
  title,
  subtitle,
  expiresAt,
  onRebookNow,
}) => {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(AppOffsets.translateY)).current;
  const scaleButtonAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: AppDurations.lg,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: AppDurations.lg,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideUpAnim]);

  const handleCopyCode = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(code);
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('offers.coupon_code_copied', { code }), // Usando a nova chave de tradução
      });
      Animated.sequence([
        Animated.timing(scaleButtonAnim, { toValue: 0.96, duration: AppDurations.xs, useNativeDriver: true }),
        Animated.spring(scaleButtonAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
      ]).start();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('offers.failed_to_copy_coupon'), // Usando a nova chave de tradução
      });
    }
  }, [code, t, scaleButtonAnim]);

  const handleRebookNowPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleButtonAnim, { toValue: 0.96, duration: AppDurations.xs, useNativeDriver: true }),
      Animated.spring(scaleButtonAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start(() => onRebookNow(code));
  }, [code, onRebookNow, scaleButtonAnim]);

  // Calcula os dias restantes para expiração
  const expiresInDays = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  // Definindo as cores do gradiente para um azul claro e limpo
  // Usando AppColors.primaryInteractive como base e um tom mais claro
  const lightBlueGradientColors = [
    '#B3E0FF', // Um azul claro pastel
    '#80C0FF', // Um azul um pouco mais vibrante
  ];

  return (
    <Animated.View style={[styles.cardContainer, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
      <LinearGradient
        colors={lightBlueGradientColors} // Alterado para o gradiente azul claro
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

          <TouchableOpacity
            onPress={handleRebookNowPress}
            style={[styles.rebookNowButton, { transform: [{ scale: scaleButtonAnim }] }]}
          >
            <Text style={styles.rebookNowButtonText}>{t('offers.rebook_now')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: SCREEN_WIDTH * 0.9,
    borderRadius: 15,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: -10,
    marginBottom: -5,
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
    fontSize: 20,
    fontWeight: AppTypography.title.fontWeight,
    color: AppColors.white,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  badgeText: {
    color: AppColors.white,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: AppTypography.body.fontWeight,
    color: AppColors.white,
  },
  couponCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginTop: 15, // Adicionado um pouco de margem superior
    marginBottom: 10,
  },
  couponCode: {
    fontSize: 18,
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
  rebookNowButton: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  rebookNowButtonText: {
    color: AppColors.primaryInteractive, // Alterado para a cor azul interativa
    fontSize: 16,
    fontWeight: 'bold',
  },
});