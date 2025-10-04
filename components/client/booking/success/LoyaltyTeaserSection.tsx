import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, AppShadows } from '../../../../constants/appStyles';
import * as Haptics from 'expo-haptics';

interface LoyaltyTeaserSectionProps {
  headerPrimaryColor: string;
  currentPoints?: number;
  nextRewardName?: string | null;
  isLoading?: boolean;
  onPressLearnMore?: () => void;
}

const formatPoints = (points?: number): string => {
  if (points === undefined || Number.isNaN(points)) {
    return '0';
  }
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(points);
};

export default function LoyaltyTeaserSection({
  headerPrimaryColor,
  currentPoints,
  nextRewardName,
  isLoading = false,
  onPressLearnMore,
}: LoyaltyTeaserSectionProps) {
  const gradientColors: [string, string] = [AppColors.backgroundLight, `${AppColors.backgroundNeutral}50`];
  const trophyColor = AppColors.warningYellow;
  const darkBlueButtonColor = AppColors.primaryDark;
  const buttonGradientColors: [string, string] = [AppColors.primaryInteractive, darkBlueButtonColor];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const learnMoreButtonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        delay: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, translateYAnim]);

  const onPressInLearnMoreButton = () => {
    Animated.spring(learnMoreButtonScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutLearnMoreButton = () => {
    Animated.spring(learnMoreButtonScaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleLearnMorePress = () => {
    Haptics.selectionAsync();
    onPressLearnMore?.();
  };

  return (
    <Animated.View
      style={[
        styles.loyaltyTeaserSection,
        { opacity: fadeAnim, transform: [{ translateY: translateYAnim }, { scale: scaleAnim }] },
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Ionicons name="trophy-outline" size={35} color={trophyColor} style={styles.loyaltyIcon} />
      <Text style={styles.loyaltyTeaserTitle} maxFontSizeMultiplier={1.2}>
        Programa de Fidelidade
      </Text>
      <Text style={styles.loyaltyTeaserText} maxFontSizeMultiplier={1.2}>
        {isLoading ? 'Sincronizando seus pontos...' : `Você tem ${formatPoints(currentPoints)} pontos disponíveis.`}
      </Text>
      {nextRewardName ? (
        <Text style={styles.loyaltySecondaryText} maxFontSizeMultiplier={1.2}>
          Próxima recompensa: {nextRewardName}
        </Text>
      ) : (
        <Text style={styles.loyaltySecondaryText} maxFontSizeMultiplier={1.2}>
          Complete missões para desbloquear recompensas exclusivas.
        </Text>
      )}
      <TouchableOpacity
        style={[styles.learnMoreButton, { transform: [{ scale: learnMoreButtonScaleAnim }] }]}
        onPressIn={onPressInLearnMoreButton}
        onPressOut={onPressOutLearnMoreButton}
        onPress={handleLearnMorePress}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={buttonGradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.learnMoreButtonGradient}
        >
          {isLoading ? (
            <ActivityIndicator color={AppColors.white} size="small" />
          ) : (
            <Text style={styles.learnMoreButtonText} maxFontSizeMultiplier={1.1}>
              Ver benefícios
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loyaltyTeaserSection: {
    borderRadius: 12,
    padding: 18,
    marginHorizontal: 15,
    marginTop: 20,
    alignItems: 'center',
    ...AppShadows.medium,
    overflow: 'hidden',
    borderWidth: 0,
  },
  loyaltyIcon: {
    marginBottom: 10,
  },
  loyaltyTeaserTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.textBody,
    marginBottom: 4,
    textAlign: 'center',
  },
  loyaltyTeaserText: {
    fontSize: 14,
    color: AppColors.textAuxiliary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  loyaltySecondaryText: {
    fontSize: 13,
    color: AppColors.textAuxiliary,
    textAlign: 'center',
    marginBottom: 12,
  },
  learnMoreButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
    minWidth: 160,
  },
  learnMoreButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnMoreButtonText: {
    color: AppColors.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
