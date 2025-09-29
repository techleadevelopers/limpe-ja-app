// LimpeJaApp/components/coupons/ReturnCouponCard.tsx (ou o caminho equivalente)
import React, { useRef, useEffect, useCallback } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Easing,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { AppColors, AppDurations, AppOffsets, AppShadows, AppTypography, SCREEN_WIDTH } from '../../../../constants/appStyles';

interface ReturnCouponCardProps {
  code: string;
  title: string;
  subtitle?: string;
  expiresAt?: Date;
  onRebookNow: (code: string) => void;
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
    const entryAnim = Animated.parallel([
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
    ]);
    entryAnim.start();

    return () => entryAnim.stop(); // Cleanup
  }, [fadeAnim, slideUpAnim]);

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
  }, [code, t, scaleButtonAnim]);

  const handleRebookNowPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleButtonAnim, { toValue: 0.96, duration: AppDurations.xs, useNativeDriver: true }),
      Animated.spring(scaleButtonAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start(() => onRebookNow(code));
  }, [code, onRebookNow, scaleButtonAnim]);

  const formattedExpiresAt = expiresAt ? expiresAt.toLocaleDateString(t('common.locale'), { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const expiresInDays = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <Animated.View style={[styles.cardContainer, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
      <LinearGradient
        colors={[AppColors.successStandard, AppColors.successStrong]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <View style={styles.contentWrapper}>
          {/* ✅ Header: Alinhado space-between, título flexShrink para caber; badge à direita compacto */}
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1} maxFontSizeMultiplier={1.2}>{title}</Text>
            {expiresInDays !== null && expiresInDays > 0 && (
              <View style={styles.badge}>
                <Ionicons name="time-outline" size={12} color={AppColors.white} /> {/* Ícone menor (era 14) para compacto */}
                <Text style={styles.badgeText} maxFontSizeMultiplier={1.2}>{t('offers.expires_in_days', { count: expiresInDays })}</Text>
              </View>
            )}
          </View>
          
          {/* ✅ Subtitle: numberOfLines=2, mas com lineHeight otimizado para caber sem pular linha extra */}
          <Text style={styles.subtitle} numberOfLines={2} maxFontSizeMultiplier={1.2}>{subtitle}</Text>

          {/* ✅ CodeContainer: Código menor (18px era 20), botão copy compacto (paddingVertical:5 era 6, ícone 18px era 20) para caber lado a lado */}
          <View style={styles.couponCodeContainer}>
            <Text style={styles.couponCode} numberOfLines={1}>{code}</Text>
            <TouchableOpacity
              onPress={handleCopyCode}
              style={[styles.copyButton, { transform: [{ scale: scaleButtonAnim }] }]}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={18} color={AppColors.white} /> {/* Ícone menor para encaixe */}
              <Text style={styles.copyButtonText} numberOfLines={1} maxFontSizeMultiplier={1.2}>{t('offers.copy_code')}</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ RebookButton: Texto menor (14px era 16), paddingVertical:12 (era 14) para compacto mas touch 44px+ */}
          <TouchableOpacity
            onPress={handleRebookNowPress}
            style={[styles.rebookNowButton, { transform: [{ scale: scaleButtonAnim }] }]}
            activeOpacity={0.7}
          >
            <Text style={styles.rebookNowButtonText} numberOfLines={1} maxFontSizeMultiplier={1.2}>{t('offers.rebook_now')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: SCREEN_WIDTH - 32, // Fix: Ajuste para safe areas iOS, previne lateral scroll
    borderRadius: 15,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 10, // ✅ FIX: Reduzido para 5px (era 35) – minimiza gap acima do cupom (com PIX), conforme comentário original
    marginBottom: 10, // Gap final confortável (20px, permite scroll suave)
    ...AppShadows.medium,
    // ✅ Mantido minHeight sem alteração (250px iOS/260px Android) – elementos internos ajustados para caber
    minHeight: Platform.OS === 'ios' ? 250 : 260,
  },
  gradientBackground: {
    padding: 16, // ✅ Reduzido de 20 para 16 – comprime interno sem perder conforto, elementos cabem melhor
  },
  contentWrapper: {
    // Flex direction can be adjusted if needed
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between', // ✅ Alinhamento premium: Título esquerdo, badge direito
    alignItems: 'center',
    marginBottom: 6, // ✅ Reduzido de 8 para 6 – comprime para caber mais conteúdo vertical
  },
  title: {
    // ✅ Fonte menor (18px bold, era AppTypography.title ~20px) para caber em 1 linha sem wrap
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.white,
    flexShrink: 1, // Permite encolher se código longo
    flex: 1, // Ocupa espaço disponível à esquerda
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16, // ✅ Radius menor (era 20) para compacto
    paddingHorizontal: 6, // ✅ Padding horizontal reduzido (era 8) para encaixe
    paddingVertical: 3, // ✅ Vertical reduzido (era 4)
    minWidth: 80, // Largura mínima para badge não "pular"
  },
  badgeText: {
    color: AppColors.white,
    fontSize: 11, // ✅ Menor (era 12) para caber no badge compacto
    fontWeight: '600',
    marginLeft: 3, // ✅ Menor gap (era 4)
  },
  subtitle: {
    // ✅ Fonte ligeiramente menor (13px era 14/AppTypography.body) e lineHeight otimizado para caber em 2 linhas
    fontSize: 11,
    fontWeight: '400', // Regular para leveza
    color: AppColors.white,
    marginBottom: 12, // ✅ Reduzido de 16 para 12 – comprime sem apertar
    lineHeight: 16, // LineHeight ajustado para texto fluir sem gaps extras
    textAlign: 'center',
  },
  couponCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // ✅ Space-between para código e botão caberem lado a lado
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingVertical: 10, // ✅ Reduzido de 12 para 10 – compacto mas touch ok
    paddingHorizontal: 12, // ✅ Horizontal reduzido (era 15) para elementos caberem
    marginBottom: 12, // ✅ Reduzido de 16 para 12 – comprime para botão rebook
  },
  couponCode: {
    // ✅ Fonte menor (18px bold, era 20) para caber melhor ao lado do botão copy
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.white,
    letterSpacing: 1,
    flexShrink: 1, // Encolhe se necessário, mas numberOfLines=1 mantém 1 linha
    flex: 1, // Ocupa espaço disponível à esquerda
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8, // ✅ Reduzido de 10 para 8 – botão menor para caber
    paddingVertical: 5, // ✅ Vertical reduzido (era 6) para compacto
    minHeight: 36, // ✅ Mantido touch target (36px+ com padding, cabe sem esticar)
  },
  copyButtonText: {
    color: AppColors.white,
    fontSize: 10, // ✅ Menor (era 14) para caber no botão compacto
    fontWeight: '600',
    marginLeft: 4, // ✅ Gap menor (era 5)
  },
  rebookNowButton: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    paddingVertical: 12, // ✅ Reduzido de 14 para 12 – compacto mas minHeight garante touch
    alignItems: 'center',
    minHeight: 44, // Touch target premium mantido
  },
  rebookNowButtonText: {
    // ✅ Fonte menor (14px bold, era 16) para caber centralizado sem pular
    color: AppColors.successStandard,
    fontSize: 12,
    fontWeight: 'bold',
  },
});