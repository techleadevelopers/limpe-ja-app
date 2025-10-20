import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
  cancelAnimation,
  withDelay
} from 'react-native-reanimated';

import { CLIENT_ROUTES } from '../../../../constants/routes';
import { ProviderDisplayInfo } from '../../../../types/backend/providers';
import { Icons3D } from '../../../../constants/icons3d';
import { PricingType } from '../../../../types/backend/services';
import { ProviderServiceOffering } from '../../../../types/backend/provider-service';
// Importar os novos formatadores e helpers
import { formatDistance } from '../../../../utils/formatters';
import { getFormattedServicePrice, getNumericPriceValue } from '../../../../utils/service-helpers';


const AnimatedCardBackground = AnimatedReanimated.createAnimatedComponent(LinearGradient);
const AnimatedPlusButtonGradient = AnimatedReanimated.createAnimatedComponent(LinearGradient);

interface RecomendacaoCardProps {
  item: ProviderDisplayInfo;
}

const RecomendacaoCard: React.FC<RecomendacaoCardProps> = ({ item }) => {
  const router = useRouter();
  const { t } = useTranslation();

  if (!item || !item.id || !item.fullName) {
    console.warn('[RecomendacaoCard] Item inválido ou incompleto. Render ignorado:', item);
    return null;
  }

  // CORRIGIDO: Use Reanimated para scale (compatível com AnimatedCardBackground)
  const hoverScale = useSharedValue(1); // SharedValue do Reanimated para scale

  const onPressInCard = () => {
    hoverScale.value = withTiming(1.03, { duration: 200, easing: Easing.out(Easing.ease) });
  };

  const onPressOutCard = () => {
    hoverScale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
  };

  // Estilo animado para scale - CORRIGIDO: Usa interpolate implícito via useAnimatedStyle para número puro
  const hoverScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hoverScale.value }], // Garante número puro (Reanimated extruda automaticamente)
  }));

  const reflectionTranslateX = useSharedValue(-60);

  useEffect(() => {
    reflectionTranslateX.value = withRepeat(
      withTiming(38 + 60, {
        duration: 1500,
        easing: Easing.linear
      }),
      -1,
      false
    );
  }, []);

  const animatedReflectionStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: reflectionTranslateX.value }],
    };
  });

  const subtleTrembleValue = useSharedValue(0);

  useEffect(() => {
    const SHAKE_AMOUNT = 0.5;
    const SHAKE_DURATION = 50;

    subtleTrembleValue.value = withRepeat(
      withSequence(
        withTiming(SHAKE_AMOUNT, { duration: SHAKE_DURATION, easing: Easing.linear }),
        withTiming(-SHAKE_AMOUNT, { duration: SHAKE_DURATION, easing: Easing.linear }),
        withTiming(0, { duration: SHAKE_DURATION, easing: Easing.linear }),
        withTiming(0, { duration: 4000, easing: Easing.linear })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(subtleTrembleValue);
    };
  }, []);

  const subtleTrembleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: subtleTrembleValue.value },
        { translateY: subtleTrembleValue.value },
      ],
    };
  });

  const renderStars = (rating: number | undefined) => {
    const stars = [];
    const actualRating = rating ?? 0; // CORRIGIDO: Fallback para 0 se undefined
    const fullStars = Math.floor(actualRating);
    const hasHalfStar = actualRating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      let iconName: keyof typeof Ionicons.glyphMap = 'star-outline';
      if (i < fullStars) iconName = 'star';
      else if (hasHalfStar && i === fullStars) iconName = 'star-half';

      stars.push(
        <Ionicons
          key={i}
          name={iconName}
          size={10.5}
          color="#5da2ecff"
          style={styles.ratingStarIcon}
        />
      );
    }
    return <View style={styles.ratingStarContainer}>{stars}</View>;
  };

  const handleCardPress = () => {
    try {
      router.push(CLIENT_ROUTES.PROVIDER_DETAILS(item.id));
    } catch (err) {
      console.error('[RecomendacaoCard] Erro ao navegar:', err);
    }
  };

  const avatarSource = item.avatarUrl
    ? { uri: item.avatarUrl }
    : require('../../../../assets/images/default-avatar.png');

  // --- Lógica para determinar o serviço principal a ser exibido como "A partir de" ---
  let mainServiceForDisplay: ProviderServiceOffering | undefined = undefined;
  let lowestFixedPrice: number | null = null;

  if (item.providerServices && item.providerServices.length > 0) {
    item.providerServices.forEach(service => {
      if (service.pricingType === PricingType.FIXED_PRICE) {
        const currentPrice = getNumericPriceValue(service);
        if (currentPrice > 0 && (lowestFixedPrice === null || currentPrice < lowestFixedPrice)) {
          lowestFixedPrice = currentPrice;
          mainServiceForDisplay = service;
        }
      }
    });

    if (!mainServiceForDisplay) {
      mainServiceForDisplay = item.providerServices[0];
    }
  }

  // Formata a string do preço principal a ser exibida usando o helper
  const mainDisplayedPrice = mainServiceForDisplay
    ? getFormattedServicePrice(mainServiceForDisplay, t)
    : t('provider_details.price_not_available', { defaultValue: 'Preço não disponível' });

  // Obtém o valor numérico do preço principal para comparações futuras
  const numericMainPrice = mainServiceForDisplay ? getNumericPriceValue(mainServiceForDisplay) : null;

  // --- Calcula menor preço por hora entre todos os serviços ---
  let minHourlyPrice: number | null = null;
  if (item.providerServices && item.providerServices.length > 0) {
    item.providerServices.forEach(service => {
      if (service.pricingType === PricingType.HOURLY) {
        const hourlyPrice = getNumericPriceValue(service);
        if (hourlyPrice > 0) {
          if (minHourlyPrice === null || hourlyPrice < minHourlyPrice) {
            minHourlyPrice = hourlyPrice;
          }
        }
      }
    });
  }

  const mainPriceIsExplicitlyHourly = mainServiceForDisplay?.pricingType === PricingType.HOURLY;

  const shouldShowMinHourlyPrice = typeof minHourlyPrice === 'number' && minHourlyPrice > 0 && (
    !mainPriceIsExplicitlyHourly ||
    (mainPriceIsExplicitlyHourly && numericMainPrice !== null && minHourlyPrice < numericMainPrice)
  );

  const categoriesToDisplay: string[] = [];
  if (item.providerServices && item.providerServices.length > 0) {
    if (mainServiceForDisplay?.service?.name) {
      categoriesToDisplay.push(mainServiceForDisplay.service.name);
    } else if (item.providerServices[0].service?.name) {
      categoriesToDisplay.push(item.providerServices[0].service.name);
    }
  }
  if (categoriesToDisplay.length === 0) {
    if (item.bio?.toLowerCase().includes('comercial')) categoriesToDisplay.push('Comercial');
    else if (item.bio?.toLowerCase().includes('escritórios')) categoriesToDisplay.push('Escritório');
    else {
      categoriesToDisplay.push('Limpeza Geral');
    }
  }
  const displayedCategories = categoriesToDisplay.slice(0, 2); // Até 2 categorias

  // Teste visual rápido: Injeta distance: 4000 (4 km) em dev se não vier do backend
  // Formatar a distância usando o valor seguro
  const distanceLabel = (typeof item.distance === 'number' && item.distance > 0)
    ? formatDistance(item.distance)
    : '0 km';

  // Helper para formatar próximo horário (discreto, baseado em data atual)
  const formatNextAvailable = (next: { date: string; time: string } | undefined): string | null => {
    if (!next) return null;
    const today = new Date();
    const nextDate = new Date(next.date);
    const diffDays = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    if (diffDays === 0) return `Hoje, ${next.time}`;
    if (diffDays === 1) return `Amanhã, ${next.time}`;
    return `${days[nextDate.getDay()]} ${next.time}`;
  };

  // Label para próximo horário
  // const nextAvailableLabel = formatNextAvailable(item.nextAvailable); // Comentado conforme solicitado

  // Métricas mini (condicional) - Mantendo estrutura original, mas com ícones em azul
  const hasAcceptanceRate = item.acceptanceRate && item.acceptanceRate > 0;
  const hasResponseTime = item.averageResponseTime && item.averageResponseTime > 0;

  const renderMetrics = () => {
    if (!hasAcceptanceRate && !hasResponseTime) return null;

    return (
      <View style={styles.metricTextContainer}>
        {hasAcceptanceRate && (
          <>
            <Ionicons name="checkmark-done" size={12} color="#5da2ecff" />
            <Text style={styles.metricValue} allowFontScaling={false}>{Math.round((item.acceptanceRate ?? (item as any)?.metrics?.acceptanceRate ?? 1))}%</Text>
          </>
        )}
        {hasAcceptanceRate && hasResponseTime && (
          <Text style={styles.metricSeparator} allowFontScaling={false}> • </Text>
        )}
        {hasResponseTime && (
          <>
            <Text style={[styles.metricIcon, { color: '#5da2ecff' }]} allowFontScaling={false}>•</Text>
            <Ionicons name="time-outline" size={12} color="#5da2ecff" />
          </>
        )}
      </View>
    );
  };

  const renderMetricsPlus = () => {
    if (!hasAcceptanceRate && !hasResponseTime) return null;
    return (
      <View style={styles.metricTextContainer}>
        {hasAcceptanceRate && (
          <>
            <Ionicons name="checkmark-done" size={12} color="#5da2ecff" />
            <Text style={styles.metricValue} allowFontScaling={false}>{Math.round((item.acceptanceRate ?? (item as any)?.metrics?.acceptanceRate ?? 1))}%</Text>
          </>
        )}
        {hasAcceptanceRate && hasResponseTime && (
          <Text style={styles.metricSeparator} allowFontScaling={false}>{' • '}</Text>
        )}
        {hasResponseTime && (
          <>
            <Ionicons name="time-outline" size={12} color="#5da2ecff" />
            <Text style={styles.metricValue} allowFontScaling={false}>{(item.averageResponseTime ?? (item as any)?.metrics?.averageResponseTime ?? 120)} min</Text>
          </>
        )}
      </View>
    );
  };

  return (
    // NOVO: Wrapper com position: 'relative' para posicionar a distância absolutamente
    <View style={styles.cardWrapperWithDistance}>
      {/* NOVO: Micro-Pill de Localização/Distância (Sutil e Compacto) */}
      {distanceLabel && (
        <View style={styles.distancePillSmall}>
          <Ionicons name="location-outline" size={10} color="#5da2ecff" />
          <Text style={styles.distancePillSmallText} numberOfLines={1} allowFontScaling={false}>
            {distanceLabel}
          </Text>
        </View>
      )}

      {/* NOVO: Pill Residencial Absoluto e Independente (Flutuando sobre a imagem) */}
      {displayedCategories.length > 0 && (
        <View style={styles.mainCategoryPillAbsolute}>
          <Text style={styles.categoryChipText} numberOfLines={1} allowFontScaling={false}>
            {displayedCategories[0]}
          </Text>
        </View>
      )}

      {/* CORRIGIDO: Aplica hoverScaleStyle (Reanimated) ao AnimatedCardBackground para compatibilidade */}
      <AnimatedCardBackground
        colors={['rgba(230, 240, 255, 0.7)', 'rgba(196, 197, 205, 0.23)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.animatedCardContainer, hoverScaleStyle]}
      >
        <TouchableOpacity
          style={styles.cardContentWrapper}
          onPress={handleCardPress}
          onPressIn={onPressInCard}
          onPressOut={onPressOutCard}
          activeOpacity={1}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.imageWrapper}>
            <Image source={avatarSource} style={styles.cardImage} />
            {/* CORREÇÃO: Botão movido para cá (sobre a imagem), com position absolute para flutuar e separar do rating/preço */}
            <AnimatedPlusButtonGradient
              colors={['#73c5f5ff', '#70c0eeee','#4fade4ff']}
              style={[styles.plusButton, { overflow: 'hidden' }, subtleTrembleAnimatedStyle]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <AnimatedReanimated.View style={[styles.reflectionOverlay, animatedReflectionStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.7)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </AnimatedReanimated.View>
              <Ionicons name="shield-checkmark" size={22} color="#ffffffc8" />
            </AnimatedPlusButtonGradient>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.providerNameContainer}>
              <Text style={styles.providerName} numberOfLines={1} allowFontScaling={false}>{item.fullName}</Text>
            </View>

            <Text style={styles.serviceDescription} numberOfLines={2} allowFontScaling={false}>
              {item.bio || t('provider.no_description', { defaultValue: 'Nenhuma descrição disponível.' })}
            </Text>

            {/* Métricas mini -- discretas, cor #6C757D */}
            {renderMetricsPlus()}

            {/* REMOVIDO: categoryChipsContainer antigo (centralizado) - agora movido para seções de preço/rating */}

            <View style={styles.priceAndRatingSection}>
              {/* Seção Esquerda: Preço - Com flex e marginRight para separação máxima (não mais "junto") */}
              <View style={{ flex: 0.6, alignItems: 'flex-start', marginRight: 16 }}> {/* CORREÇÃO: flex + marginRight para isolar o preço */}
                <Text style={styles.priceLabel} allowFontScaling={false}>{t('pricing.from', { defaultValue: 'A partir de' })}</Text>
                <Text style={styles.priceValue} allowFontScaling={false}>{mainDisplayedPrice}</Text>

                {shouldShowMinHourlyPrice && minHourlyPrice !== null && (
                  <Text style={styles.hourlyPriceValue} allowFontScaling={false}>
                    {t('common.or', { defaultValue: 'ou' })}
                    {' '}
                    {getFormattedServicePrice({
                      id: '',
                      providerId: item.id || '',
                      serviceId: '',
                      service: { id: '', name: 'Serviço Horário' } as any,
                      pricingType: PricingType.HOURLY,
                      price: minHourlyPrice!,
                      durationMinutes: 60,
                      description: null,
                      pricePerSquareMeter: null,
                      pricePerRoom: null,
                    } as ProviderServiceOffering, t)}
                  </Text>
                )}
              </View>

              {/* Seção Direita: Rating individual - Com flex para ocupar só o necessário, centralizado e separado */}
              <View style={{ flex: 0.4, alignItems: 'center' }}> {/* CORREÇÃO: flex para isolar o rating, sem junção com preço */}
                {/* Chip de Categoria Secundária acima do rating */}
                {displayedCategories.length > 1 && (
                  <View style={styles.rightCategoryChip}>
                    <Text style={styles.categoryChipText} numberOfLines={1} allowFontScaling={false}>
                      {displayedCategories[1] || 'Especializado'}
                    </Text>
                  </View>
                )}

                {renderStars(item.averageRating)}
                <Text style={styles.reviewsCountText} allowFontScaling={false}>
                  {(item.reviewCount ?? 0)} Avaliações
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCardBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapperWithDistance: { // NOVO ESTILO: Container pai para posicionamento absoluto
    width: 177,
    height: 240,
    marginRight: 15,
    marginBottom: 5,
    marginTop: 8,
    position: 'relative', // Essencial
  },
  animatedCardContainer: {
    width: '100%', // Preenche o wrapper
    height: '100%', // Preenche o wrapper
    overflow: 'hidden',
    // Margins removidos daqui e movidos para cardWrapperWithDistance
    borderRightWidth: 1,
    borderBottomWidth: 0.5,
    
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#d1d5db53',
    borderRadius: 12,
    borderTopStartRadius: 22, // Cantos 22
    borderBottomStartRadius: 22,
    borderTopEndRadius: 22, // Cantos 22
    borderBottomEndRadius: 22,
    borderBottomColor: '#d1d5db53',
  },
  // NOVO ESTILO: Micro-Pill de Distância (Sutil e Compacto)
  distancePillSmall: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6, // Padding 6x2
    paddingVertical: 2, // Padding 6x2
    borderRadius: 12,
    maxWidth: '55%',
    overflow: 'hidden',
    ...Platform.select({
      ios: { backgroundColor: 'rgba(255,255,255,0.75)' }, // Blur/white 70-80%
      android: { backgroundColor: 'rgba(255,255,255,0.8)' },
    }),
    // sombra sutilíssima (shadowOpacity 0.06, elevation 2)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  distancePillSmallText: {
    marginLeft: 4,
    fontSize: 10, // Fonte 10
    fontWeight: '600',
    color: '#334155',
  },

  // NOVO ESTILO: Pill de Categoria Principal (Absoluto)
  mainCategoryPillAbsolute: {
    position: 'absolute',
    top: 8, // Flutua 8px abaixo do topo do card (sobre a imagem)
    left: 12, // 12px da esquerda
    zIndex: 5, // Abaixo da distância, mas acima do conteúdo do card
    
    // Appearance
    backgroundColor: '#E6EEF9',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    
    // Floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, 
    shadowRadius: 2,
    elevation: 3,
  },

  cardContentWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 1,
  },
  imageWrapper: {
    width: '100%',
    height: 100, // Foto 3:2 ou 16:9 (190x120 é aprox 16:10)
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', // Para overlay do selo (botão agora aqui)
  },
  // REMOVIDO: verifiedBadge style (não mais usado)
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 12,
  },
  providerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 16, // Nome (16/700)
    fontFamily: 'Montserrat-ExtraBold',
    paddingHorizontal: 0,
    fontWeight: '500', // ALTERADO: FontWeight mais grossa (de '700' para '900' para maior espessura)
    color: '#627490ff',
    flexShrink: 1,
  },
  docCheckIcon: {
    position: 'absolute',
    top: 2,
    right: 5,
    width: 30,
    height: 30,
    resizeMode: 'contain',
    zIndex: 1,
  },
  serviceDescription: {
    fontSize: 11.5, // Bio (2 linhas, 12/regular)
    paddingHorizontal: 2,
    fontWeight: Platform.select({
      ios: '300', 
      android: 'bold' 
    }),
    color: '#6C757D',
    marginBottom: 12, // Ajustado: +4px para compensar remoção de chips centrais
  },
  metricTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -2,
    marginBottom: 4,
    textAlign: 'left',
  },
  metricIcon: {
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 2,
  },
  metricValue: {
    fontSize: 10.5,
    color: '#6C757D', // Métricas mini -- discretas, cor #6C757D
  },
  metricSeparator: {
    fontSize: 10,
    color: '#6C757D',
    marginHorizontal: 0,
  },
  // Novos Styles para Chips Movidos (rightCategoryChip permanece no fluxo)
  // leftCategoryChip foi substituído por mainCategoryPillAbsolute
  rightCategoryChip: {
    backgroundColor: '#E6EEF9',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3, // Padding reduzido para compacto
    marginBottom: 4, // Espaçamento acima das estrelas
    alignSelf: 'center', // Centralizado na seção de rating
  },
  categoryChipText: {
    fontSize: 9, // Fonte ligeiramente menor para chips
    fontWeight: '600', // Destaque
    color: '#000000',
  },
  // CORREÇÃO PRINCIPAL: Removida a lógica de "junção" - agora separação máxima com flex e margin
  priceAndRatingSection: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // CORREÇÃO: Mudado de 'space-between' para alinhar à esquerda sem forçar junção
    alignItems: 'flex-start', // Mantido: Alinha do topo
    paddingHorizontal: 0, // CORREÇÃO: Removido padding para não apertar as seções
    marginTop: 8, // CORREÇÃO: Aumentado para respirar das métricas
  },
  priceLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: -2,
  },
  priceValue: {
    fontSize: 15, // Preço "A partir de" (16/bold)
    fontWeight: 'bold',
    color: '#838891ff',
  },
  hourlyPriceValue: {
    fontSize: 11,
    fontWeight: 'normal',
    color: '#6C757D',
    marginTop: 2,
  },
  ratingSection: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  profileImage: {
    position: 'relative',
    top: -80,
    left: 30,
    width: 37,
    height: 37,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 6,
    backgroundColor: 'transparent',
  },

  plusButton: {
    position: 'absolute', // CORREÇÃO: Adicionado para permitir left/bottom funcionarem
    width: 36,
    height: 36,
    left: 122, // RESTAURADO: Posicionamento horizontal
    bottom: -25, // CORREÇÃO: Ajustado de 80 para 10 (cabe na imagem de 120px height; mude para 80 se quiser mais baixo)
    borderRadius: 53,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1966f5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.48,
    shadowRadius: 28,
    elevation: 6,
    zIndex: 2, // Acima da imagem
  },
  reflectionOverlay: {
    position: 'absolute',
    width: 60,
    height: '100%',
  },
  ratingStarContainer: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  ratingStarIcon: {
    marginRight: 2,
    right: 4,
    top: 3,
  },
  reviewsCountText: {
    fontSize: 8.1, // ALTERAÇÃO: Diminuído em 1% (de 10 para 9.9) para o título de avaliações abaixo das estrelas
    color: '#6C757D',
    right: 6,
    top: 3,
  },
});

export default RecomendacaoCard;
