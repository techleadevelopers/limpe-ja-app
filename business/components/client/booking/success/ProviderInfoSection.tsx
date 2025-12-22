// LimpeJaApp/app/client/bookings/components/success/ProviderInfoSection.tsx
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
  }, []);

  // 🛑 DECISÃO FINAL: Exibir estrelas se o rating for > 0 (inclui o mockado 5).
  // Se for 0, null ou undefined, exibe "NOVO".
  const hasRating = providerRating && providerRating > 0;

  // Usa fallback 94/25 se o provedor não tem métricas OU se não tem rating (> 0)
  const shouldUseMetricFallback = providerMetrics.acceptanceRate === null || providerMetrics.acceptanceRate === undefined || !hasRating;

  const acceptanceRateToDisplay = shouldUseMetricFallback 
    ? 94 
    : providerMetrics.acceptanceRate;

  const responseTimeToDisplay = shouldUseMetricFallback 
    ? 25 
    : providerMetrics.averageResponseTime;


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
          Prestador(a) de Serviço
        </Text>
        
        {/* BLOCO BADGES (MÉTRICAS: 94% / 25 min fallback) */}
        <View style={styles.badgesRow}>
          {/* Aceitação */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {`${acceptanceRateToDisplay}% aceitação`}
            </Text>
          </View>
          
          {/* Tempo de Resposta */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {`${responseTimeToDisplay} min resposta`}
            </Text>
          </View>
          
          {/* Outros Badges (Primeiros 2) */}
          {(providerMetrics.badges || []).slice(0, 2).map((badge: string, index: number) => (
            <View key={index} style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* 🛑 EXIBIÇÃO DE CLASSIFICAÇÃO / NOVO */}
      {hasRating ? (
        renderStars(providerRating, starSize, starColor, starColor)
      ) : (
        <View style={styles.newBadgeContainer}>
          <Text style={styles.newBadgeText} maxFontSizeMultiplier={1.2}>
            NOVO
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  providerHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16, 
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
    // ✅ Mantido: minWidth: 0 para corrigir o layout horizontal
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
  // ✅ CORRIGIDO: Container para o minicard "NOVO" (compacto)
  newBadgeContainer: {
    marginLeft: 'auto', // Empurra para a direita
    backgroundColor: AppColors.primaryInteractive, 
    paddingHorizontal: 4, // Padding horizontal reduzido (mais compacto)
    paddingVertical: 2, 
    borderRadius: 12, 
    alignSelf: 'flex-start',
    height: 22, // Garante altura consistente com os badges
    justifyContent: 'center', // Centraliza o texto
    right: 270,
  },
  // ✅ ESTILO: Texto do minicard "NOVO"
  newBadgeText: {
    fontSize: 9, 
    color: 'white', 
    fontWeight: '500', 
    textTransform: 'uppercase',
  },
});