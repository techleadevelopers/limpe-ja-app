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
  AccessibilityInfo, // ✅ NOVO: Para reduceMotion check interno
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
  const slideUpAnim = useRef(new Animated.Value(30)).current; // ✅ FIX: Valor fixo 30px para slide up visível (era AppOffsets — genérico)
  const scaleButtonAnim = useRef(new Animated.Value(1)).current;

  // ✅ NOVO: ReduceMotion ref interno para este componente
  const reduceMotionRef = useRef(false);
  useEffect(() => {
      AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
          reduceMotionRef.current = enabled;
      });
  }, []);

  useEffect(() => {
    // ✅ FIX: Pula animação se reduceMotion (A11y)
    if (reduceMotionRef.current) {
        console.log("[ReturnCouponCard] ReduceMotion ativado — pulando animação."); // ✅ DEBUG
        return;
    }

    console.log("[ReturnCouponCard] Iniciando animação slide up + fade."); // ✅ DEBUG: Confirma disparo

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
  }, [fadeAnim, slideUpAnim]); // ✅ FIX: Dependências corretas para re-run se re-mount

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
                <Ionicons name="time-outline" size={11} color={AppColors.white} /> {/* Ícone menor para compacto */}
                <Text style={styles.badgeText} maxFontSizeMultiplier={1.2}>{t('offers.expires_in_days', { count: expiresInDays })}</Text>
              </View>
            )}
          </View>
          
          {/* ✅ Subtitle: numberOfLines=2, mas com lineHeight otimizado para caber sem pular linha extra */}
          <Text style={styles.subtitle} numberOfLines={2} maxFontSizeMultiplier={1.2}>{subtitle}</Text>

          {/* ✅ CodeContainer: Código menor, botão copy compacto para caber lado a lado */}
          <View style={styles.couponCodeContainer}>
            <Text style={styles.couponCode} numberOfLines={1}>{code}</Text>
            <TouchableOpacity
              onPress={handleCopyCode}
              style={[styles.copyButton, { transform: [{ scale: scaleButtonAnim }] }]}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={16} color={AppColors.white} /> {/* Ícone menor para encaixe */}
              <Text style={styles.copyButtonText} numberOfLines={1} maxFontSizeMultiplier={1.2}>{t('offers.copy_code')}</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ RebookButton: Texto menor, paddingVertical:10 para compacto mas touch 44px+ */}
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
    // ✅ AJUSTADO: minHeight reduzido para 220px iOS/230px Android (elementos menores cabem)
    minHeight: Platform.OS === 'ios' ? 220 : 230,
  },
  gradientBackground: {
    padding: 14, // ✅ REDUZIDO: de 16 para 14px – comprime interno, card mais curto
  },
  contentWrapper: {
    // Flex direction can be adjusted if needed
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between', // ✅ Alinhamento premium: Título esquerdo, badge direito
    alignItems: 'center',
    marginBottom: 5, // ✅ REDUZIDO: de 6 para 5px – comprime vertical
  },
  title: {
    // ✅ REDUZIDO: fontSize 15px (era 16) para caber em 1 linha sem wrap
    fontSize: 15,
    fontWeight: 'bold',
    color: AppColors.white,
    flexShrink: 1, // Permite encolher se código longo
    flex: 1, // Ocupa espaço disponível à esquerda
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14, // ✅ Radius menor para compacto
    paddingHorizontal: 5, // ✅ REDUZIDO: de 6 para 5px
    paddingVertical: 2, // ✅ REDUZIDO: de 3 para 2px
    minWidth: 75, // Largura mínima para badge não "pular"
  },
  badgeText: {
    color: AppColors.white,
    fontSize: 10, // ✅ REDUZIDO: de 11 para 10px para caber no badge compacto
    fontWeight: '600',
    marginLeft: 2, // ✅ REDUZIDO: Gap menor
  },
  subtitle: {
    // ✅ REDUZIDO: fontSize 12px (era 11), lineHeight 17px para caber em 2 linhas
    fontSize: 12,
    fontWeight: '400', // Regular para leveza
    color: AppColors.white,
    marginBottom: 10, // ✅ REDUZIDO: de 12 para 10px – comprime sem apertar
    lineHeight: 17, // LineHeight ajustado para texto fluir sem gaps extras
    textAlign: 'center',
  },
  couponCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // ✅ Space-between para código e botão caberem lado a lado
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 9, // ✅ Ligeiramente menor
    paddingVertical: 8, // ✅ REDUZIDO: de 10 para 8px – compacto mas touch ok
    paddingHorizontal: 10, // ✅ REDUZIDO: de 12 para 10px
    marginBottom: 10, // ✅ REDUZIDO: de 12 para 10px – comprime para botão rebook
  },
  couponCode: {
    // ✅ REDUZIDO: fontSize 15px (era 16) para caber melhor ao lado do botão copy
    fontSize: 15,
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
    borderRadius: 7, // ✅ Menor para compacto
    paddingHorizontal: 7, // ✅ REDUZIDO: de 8 para 7px – botão menor para caber
    paddingVertical: 4, // ✅ REDUZIDO: de 5 para 4px
    minHeight: 34, // ✅ REDUZIDO: touch target (34px+ com padding, cabe sem esticar)
  },
  copyButtonText: {
    color: AppColors.white,
    fontSize: 9, // ✅ REDUZIDO: de 10 para 9px para caber no botão compacto
    fontWeight: '600',
    marginLeft: 3, // ✅ Gap menor
  },
  rebookNowButton: {
    backgroundColor: AppColors.white,
    borderRadius: 9, // ✅ Menor
    paddingVertical: 10, // ✅ REDUZIDO: de 12 para 10px – compacto mas minHeight garante touch
    alignItems: 'center',
    minHeight: 40, // ✅ REDUZIDO: Touch target premium (40px, ainda acessível)
  },
  rebookNowButtonText: {
    // ✅ REDUZIDO: fontSize 11px (era 12) para caber centralizado sem pular
    color: AppColors.successStandard,
    fontSize: 11,
    fontWeight: 'bold',
  },
});