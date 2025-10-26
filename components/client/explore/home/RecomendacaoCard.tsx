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

  // NOVO: Extrair apenas o primeiro nome do fullName (split por espaço e pega o primeiro)
  const firstName = item.fullName.split(' ')[0];

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
    // MODIFICADO: Agora renderiza apenas 1 estrela cheia, mantendo a cor original
    if (rating && rating > 0) {
      return (
        <View style={styles.ratingStarContainer}>
          <Ionicons
            name="star"
            size={14.5}
            color="#5da2ecff"
            style={styles.ratingStarIcon}
          />
        </View>
      );
    }
    return null; // Não renderiza se não houver rating
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
  // NOVO: Extração robusta de categorias a partir de todos os serviços do provider
  const normalizeText = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const extractCategoriesFromServices = (services: ProviderServiceOffering[]): string[] => {
    const set = new Set<string>();
    services.forEach((svc) => {
      const nameRaw = svc?.service?.name || '';
      if (!nameRaw) return;
      const n = normalizeText(nameRaw);

      // Detectores por substring (cobrem variações usuais)
      if (/(comercial|empres|corporativ|industrial)/.test(n)) set.add('Comercial');
      if (/(escritorio|escritorio)/.test(n) || /escritor/.test(n)) set.add('Escritório');
      if (/(residencial|domest|casa|lar)/.test(n)) set.add('Residencial');
      if (/obra/.test(n)) set.add('Obra');
      if (/vidro|vidrac/.test(n)) set.add('Vidro');
      if (/estofad|sofa|sof[aá]|poltrona|colch[aã]o/.test(n)) set.add('Estofados');
      if (/passad|passar\s?roupa/.test(n)) set.add('Passadoria');
      if (/limpeza\s?geral|pesad|profund/.test(n)) set.add('Limpeza Geral');
    });
    return Array.from(set);
  };

  const priorityOrder = [
    'Comercial',
    'Escritório',
    'Residencial',
    'Obra',
    'Vidro',
    'Estofados',
    'Passadoria',
    'Limpeza Geral',
  ];

  let detectedCategories: string[] = [];
  if (item.providerServices && item.providerServices.length > 0) {
    detectedCategories = extractCategoriesFromServices(item.providerServices);
  }

  if (detectedCategories.length > 0) {
    // Ordena por prioridade para destacar categorias mais relevantes
    detectedCategories.sort(
      (a, b) => priorityOrder.indexOf(a) - priorityOrder.indexOf(b)
    );
    categoriesToDisplay.push(...detectedCategories);
  } else {
    // Fallback antigo baseado na bio
    const bioNorm = item.bio ? normalizeText(item.bio) : '';
    if (bioNorm.includes('comercial')) categoriesToDisplay.push('Comercial');
    else if (bioNorm.includes('escritorio')) categoriesToDisplay.push('Escritório');
    else if (bioNorm.includes('residencial') || bioNorm.includes('domest')) categoriesToDisplay.push('Residencial');
    else categoriesToDisplay.push('Limpeza Geral');
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
      <View style={[styles.metricTextContainer, { flexDirection: 'row', alignItems: 'center' }]}>
        {hasAcceptanceRate && (
          <View style={[styles.metricRow, hasResponseTime && { marginRight: 3 }]}>
            <Ionicons name="checkmark-done" size={12} color="#5da2ecff" /> {/* Reduzido para compactar */}
            <Text style={styles.metricValue} allowFontScaling={false}>{Math.round((item.acceptanceRate ?? (item as any)?.metrics?.acceptanceRate ?? 1))}%</Text>
          </View>
        )}
        {hasResponseTime && (
          <View style={styles.metricRow}>
            <Ionicons name="time-outline" size={12} color="#5da2ecff" /> {/* Reduzido para compactar */}
            <Text style={styles.metricValue} allowFontScaling={false}>{(item.averageResponseTime ?? (item as any)?.metrics?.averageResponseTime ?? 120)} min</Text>
          </View>
        )}
      </View>
    );
  };

  // NOVO: Função para mapear categoria para ícone (reutilizando os mesmos da CategoriaCard, mas mini e com tint sutil para diferenciar)
  const getCategoryIconSource = (categoryName?: string) => {
    if (!categoryName) return require('../../../../assets/images/icons/residencial.png'); // Default
    const baseName = categoryName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim(); // Normaliza acentos e caixa
    try {
      switch (baseName) {
        case 'residencial': return require('../../../../assets/images/icons/residencial.png');
        case 'comercial': return require('../../../../assets/images/icons/comercial.png');
        case 'obra': return require('../../../../assets/images/icons/obra.png');
        case 'vidro': return require('../../../../assets/images/icons/vidro.png');
        case 'escritorio':
        case 'escritório': return require('../../../../assets/images/icons/escritorio.png');
        case 'estofados': return require('../../../../assets/images/icons/estofados.png');
        case 'passadoria': return require('../../../../assets/images/icons/passadoria.png');
        case 'limpeza geral':
        case 'limpeza': return require('../../../../assets/images/icons/residencial.png'); // Fallback para limpeza geral como residencial
        default: return require('../../../../assets/images/icons/residencial.png');
      }
    } catch {
      return require('../../../../assets/images/icons/residencial.png');
    }
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
              <Ionicons name="shield-checkmark" size={16} color="#ffffffc8" />
            </AnimatedPlusButtonGradient>
            
          </View>

          <View style={styles.infoContainer}>
            {/* Topo: Nome do provedor */}
            <View style={styles.providerNameContainer}>
              <Text style={styles.providerName} numberOfLines={1} allowFontScaling={false}>{firstName}</Text>
            </View>

            {/* Ícones de serviço (mantidos próximos ao nome) */}
            {displayedCategories.length > 0 && (
              <View style={styles.categoryIconsRow}>
                <View style={styles.categoryIconContainer}>
                  <Image source={getCategoryIconSource(displayedCategories[0])} style={styles.categoryIcon} resizeMode="contain" />
                </View>
                {displayedCategories.length > 1 && (
                  <View style={styles.categoryIconContainer}>
                    <Image source={getCategoryIconSource(displayedCategories[1])} style={styles.categoryIcon} resizeMode="contain" />
                  </View>
                )}
              </View>
            )}

            {/* Meio: Estratégia de Preço (seção isolada, centralizada, com badge sutil para destaque) */}
            <View style={styles.priceRow}>
              <Image 
                source={require('../../../../assets/images/icon.png')} 
                style={styles.priceLogo} 
                resizeMode="contain" 
              />
              <View style={styles.priceSection}>
                <Text style={styles.priceLabel} allowFontScaling={false}>{t('pricing.from', { defaultValue: 'A partir de' })}</Text>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceValue} allowFontScaling={false}>{mainDisplayedPrice}</Text>
                </View>
                {shouldShowMinHourlyPrice && minHourlyPrice !== null && (
                  <Text style={styles.hourlyPriceValue} allowFontScaling={false}>
                    {t('common.or', { defaultValue: 'ou' })} {getFormattedServicePrice({
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
            </View>

            {/* Fundo: Métricas + Ratings (agrupados juntos para proximidade) - REMOVIDO: premiumSeparator */}
            <View style={styles.metricsAndRatingSection}> {/* NOVO: Container unificado para métricas e ratings */}
              {renderMetrics()} {/* % e tempo agora aqui, colados às ratings */}
              <View style={styles.ratingSection}>
                {renderStars(item.averageRating)}
                <Text style={styles.reviewsCountText} allowFontScaling={false}>
                  {`(${item.reviewCount ?? 0})`}
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
    width: 155,
    height: 204, // REDUZIDO: De 260 para 220px (economia de 40px)
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
    top: 10,
    right: 5,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3, // Padding 6x2
    paddingVertical: 1, // Padding 6x2
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
    fontSize: 9, // Fonte 10
    fontWeight: '600',
    color: '#334155',
  },

  cardContentWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 1,
  },
  imageWrapper: {
    width: '100%',
    height: 80, // REDUZIDO: De 100 para 85px (economia de 15px)
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
    padding: 8, // REDUZIDO: De 12 para 8px (economia de 8px totais)
  },
  providerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    left: 6,
    top: 2,
    marginBottom: 2, // Reduzido para dar espaço ao pill abaixo
  },
  providerName: {
    fontSize: 15, // Nome (16/700)
    fontFamily: 'Montserrat-ExtraBold',
    paddingHorizontal: 0,
    fontWeight: '500', // ALTERADO: FontWeight mais grossa (de '700' para '900' para maior espessura)
    color: '#627490ff',
    flexShrink: 1,
  },
  // ALTERADO: Estilo para row de ícones de categoria (mini, clean e premium)
  categoryIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4, // Espaçamento abaixo dos ícones, acima das métricas (mantido)
  },
  // NOVO: Estilo para container de cada ícone de categoria (fundo sutil para diferenciar da CategoriaCard)
  categoryIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Fundo azul translúcido premium (tint sutil para não ficar igual à CategoriaCard)
    borderRadius: 14, // Bordas arredondadas menores
    padding: 2, // Padding mínimo para "enquadrar" o ícone
    marginRight: 4, // Espaçamento entre ícones
    top: 23,
    left: 8,
    // Sombra ultra-sutil para premium feel
    shadowColor: '#5da2ec',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  // NOVO: Estilo para o ícone mini de categoria (economiza espaço, ~12px)
  categoryIcon: {
    width: 17,
    height: 17,
    
    // Tint aplicado via overlay se necessário, mas como PNG, o fundo do container já diferencia
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
    marginTop: 0, // REDUZIDO: De -2 para 0 (compactar)
    marginBottom: 2, // REDUZIDO: Adicionado pequeno espaço para ratings
    left: 5,
    
    bottom: 83, // REMOVIDO: Posicionamentos absolutos para fluxo natural
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  metricIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    
  },
  metricValue: {
    fontSize: 9, // REDUZIDO: De 10.5 para 10px (compactar)
    color: '#6C757D', // Métricas mini -- discretas, cor #6C757D
    marginLeft: 2,
  },
  metricSeparator: {
    fontSize: 10,
    color: '#6C757D',
    marginHorizontal: 0,
  },
  // NOVO: Row para o logo e o container de preço (logo à esquerda do priceSection)
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    left: 28,
    top: 25,
    marginBottom: 4,
    marginTop: 2,
  },
  // CORREÇÃO PRINCIPAL: Removida a lógica de "junção" - agora separação máxima com flex e margin
  // NOVO: Seção de preço isolada (estratégia: centralizada, com badge para destaque) - agora sem left/top, pois herdado do row
  priceSection: {
    alignItems: 'center',
    marginLeft: 4, // Pequeno espaçamento entre logo e preço
    marginBottom: 4, // REDUZIDO: De 0 para 4px (espaço mínimo)
    right: 50,
    top: -5,
  },
  // NOVO: Estilo para o logo pequeno ao lado esquerdo do preço (fora do badge)
  priceLogo: {
    width: 34,
    height: 34,
    right: -70,
    bottom: 140,
  },
  // NOVO: Badge para preço (gradiente sutil, economiza altura) - removido o row, pois logo agora fora
  priceBadge: {
    backgroundColor: 'rgba(93, 162, 236, 0.1)', // Fundo azul claro translúcido
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 2,
  },
  priceLabel: {
    fontSize: 10, // REDUZIDO: De 12 para 11px
    color: '#6C757D',
    right: 20,
    marginBottom: 0, // REDUZIDO: Eliminar margin para compactar
  },
  priceValue: {
    fontSize: 11, // Preço "A partir de" (16/bold) - mantido bold para destaque
    fontWeight: 'bold',
    color: '#838891ff',
  },
  hourlyPriceValue: {
    fontSize: 10, // REDUZIDO: De 11 para 10px
    fontWeight: 'normal',
    color: '#6C757D',
    marginTop: 0, // REDUZIDO: Espaço mínimo
  },
  // REMOVIDO: premiumSeparator style (não mais usado)
  // NOVO: Container unificado para métricas e ratings (juntos, row para proximidade)
  metricsAndRatingSection: {
    flexDirection: 'row', // Row para colocar métricas à esquerda e ratings à direita
    alignItems: 'center',
    justifyContent: 'space-between', // Espalha para usar largura
    marginTop: 10, // Sem topo extra
    right: 3,
    top: 10,
    paddingHorizontal: 2,
  },
  ratingSection: { // ALTERADO: Agora parte do container unificado
    flexDirection: 'row', // MUDADO: Para row, para colocar estrela e count lado a lado
    alignItems: 'center',
    marginTop: 0, // Espaçamento acima do rating
    flex: 1, // Ocupa espaço disponível
    alignSelf: 'flex-end', // Alinha à direita no row
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
    width: 26,
    height: 26,
    left: 88, // RESTAURADO: Posicionamento horizontal
    bottom: -320, // AJUSTADO: De -25 para -18 (adapta à imagem menor de 85px)
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
    marginTop: 1, // REDUZIDO: De 2 para 1px
    bottom: 135,
    left: -79,
    
  },
  ratingStarIcon: {
    marginRight: 4, // AJUSTADO: Espaçamento menor para uma única estrela (era 12 para múltiplas)
  },
  reviewsCountText: {
    fontSize: 8, // REDUZIDO: De 9.1 para 9px
    color: '#6C757D',
    bottom: 104,
    right: 0,
    textAlign: 'right', // Alinha à direita no container row
    marginLeft: 2, // Pequeno espaçamento entre estrela e count
  },
});

export default RecomendacaoCard;