// LimpeJaApp/app/(client)/bookings/components/success/ProviderInfoSection.tsx
import React, { useEffect, useRef } from 'react';
import { Image, StyleSheet, Text, View, Animated, Easing, Platform } from 'react-native';
import { renderStars } from '../../../../utils/ui-helpers'; // Assumindo que renderStars está aqui
import { AppColors } from '../../../../constants/appStyles'; // Importe AppColors
import { sanitizeText } from '../../../../utils/formatters'; // Importar sanitizeText
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
  const starColor = AppColors.primaryInteractive; // Usando AppColors para consistência

  // Invocar o hook para obter as métricas do provedor
  const providerMetrics: ProviderMetrics = useProviderMetrics(providerId);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const entryAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 0, // Início imediato para header premium
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

    return () => entryAnimation.stop(); // Cleanup da animação
  }, []);

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
        resizeMode="cover" // Garante que a imagem preencha o espaço sem distorcer
      />
      <View style={styles.providerHeaderText}>
        <Text style={styles.providerNameText} numberOfLines={2} maxFontSizeMultiplier={1.2}>
          {sanitizeText(providerFullName)}
        </Text>
        <Text style={styles.providerRoleText} maxFontSizeMultiplier={1.2}>
          Prestador(a) de Serviço
        </Text>
        {(providerMetrics.acceptanceRate != null ||
          providerMetrics.averageResponseTime != null ||
          (providerMetrics.badges && providerMetrics.badges.length > 0)) && (
          <View style={styles.badgesRow}>
            {providerMetrics.acceptanceRate != null && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {`${providerMetrics.acceptanceRate}% aceitação`}
                </Text>
              </View>
            )}
            {providerMetrics.averageResponseTime != null && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {`${providerMetrics.averageResponseTime} min resposta`}
                </Text>
              </View>
            )}
            {(providerMetrics.badges || []).slice(0, 2).map((badge: string, index: number) => (
              <View key={index} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {renderStars(providerRating, starSize, starColor, starColor)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  providerHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16, // Alinhamento lógico para fluxo downward
    paddingHorizontal: 5,
    paddingTop: Platform.OS === 'android' ? 8 : 0, // Cross-platform
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12, // Espaçamento fixo
    borderWidth: 3,
    borderColor: AppColors.borderNeutral,
  },
  providerHeaderText: {
    flex: 1,
    flexShrink: 1, // Evita overflow
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
});