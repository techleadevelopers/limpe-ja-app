// LimpeJaApp/app/client/bookings/components/success/ProviderInfoSection.tsx
import React, { useEffect, useRef } from 'react';
import { Image, StyleSheet, Text, View, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { renderStars } from '../../../../utils/ui-helpers';
import { AppColors } from '../../../../constants/appStyles';
import { sanitizeText } from '../../../../utils/formatters';
import { useProviderMetrics } from '../../../../hooks/useProviderMetrics';

interface ProviderMetrics {
  acceptanceRate?: number | null;
  averageResponseTime?: number | null;
  badges?: string[];
}

interface ProviderInfoSectionProps {
  providerId?: string;
  providerAvatarUrl?: string | null;
  providerFullName: string;
  providerRating?: number;
}

export default function ProviderInfoSection({
  providerId,
  providerAvatarUrl,
  providerFullName,
  providerRating,
}: ProviderInfoSectionProps) {
  const starSize = 15;
  const starColor = AppColors.primaryInteractive;

  const providerMetrics: ProviderMetrics = useProviderMetrics(providerId);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const entryAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 0,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        delay: 0,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: 0,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);
    entryAnimation.start();

    return () => entryAnimation.stop();
  }, [fadeAnim, translateYAnim, scaleAnim]);

  const hasRating = !!(providerRating && providerRating > 0);

  const shouldUseMetricFallback =
    providerMetrics.acceptanceRate === null || providerMetrics.acceptanceRate === undefined || !hasRating;

  const acceptanceRateToDisplay = shouldUseMetricFallback ? 94 : providerMetrics.acceptanceRate;
  const responseTimeToDisplay = shouldUseMetricFallback ? 25 : providerMetrics.averageResponseTime;

  return (
    <Animated.View
      style={[
        styles.providerHeaderSection,
        { opacity: fadeAnim, transform: [{ translateY: translateYAnim }, { scale: scaleAnim }] },
      ]}
    >
      <Image
        source={providerAvatarUrl ? { uri: providerAvatarUrl } : require('../../../../assets/images/default-avatar.png')}
        style={styles.providerAvatar}
        resizeMode="cover"
      />

      <View style={styles.providerHeaderText}>
        <Text style={styles.providerNameText} numberOfLines={2} maxFontSizeMultiplier={1.2}>
          {sanitizeText(providerFullName)}
        </Text>
        <Text style={styles.providerRoleText} maxFontSizeMultiplier={1.2}>
          Prestadora de Serviço
        </Text>

        <View style={styles.trustRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color={AppColors.primaryInteractive} />
          <Text style={styles.trustText}>Antecedentes verificados</Text>
        </View>
      </View>

      {/* ✅ Wrapper fixo à direita (sem hacks de right) */}
      <View style={styles.rightSide}>
        {hasRating ? (
          renderStars(providerRating, starSize, starColor, starColor)
        ) : (
          <View style={styles.newBadgeContainer}>
            <Text style={styles.newBadgeText} maxFontSizeMultiplier={1.2}>
              NOVO
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  providerHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 5,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 3,
    borderColor: AppColors.borderNeutral,
  },
  providerHeaderText: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  providerNameText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: AppColors.textBody,
  },
  providerRoleText: {
    fontSize: 12,
    color: AppColors.textAuxiliary,
  },
  badgesRow: {
    flexDirection: 'row',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: AppColors.primaryInteractive,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
  },

  // ✅ Coluna da direita: garante alinhamento consistente no Android/iOS
  rightSide: {
    marginLeft: 10,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
    // se no Android ainda “encostar” demais, ajuste só nele:
    ...Platform.select({
      android: { marginTop: 2 },
      ios: { marginTop: 0 },
    }),
  },

  newBadgeContainer: {
    backgroundColor: AppColors.primaryInteractive,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    // ✅ NADA de right/left aqui
  },
  newBadgeText: {
    fontSize: 9,
    color: 'white',
    fontWeight: '500',
    textTransform: 'uppercase',
  },

  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textBody,
  },
});
