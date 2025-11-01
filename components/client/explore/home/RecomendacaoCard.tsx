import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
  withDelay,
  interpolate,
  interpolateColor,
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
const AnimatedPriceReflection = AnimatedReanimated.createAnimatedComponent(LinearGradient);
const AnimatedText = AnimatedReanimated.createAnimatedComponent(Text);

interface RecomendacaoCardProps {
  item: ProviderDisplayInfo;
}

// Escala "crisp" de 7% (sem usar transform para evitar blur)
const UI_SCALE = 1.07;
const S = (n: number) => parseFloat((n * UI_SCALE).toFixed(2));

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

  // NOVO: Animação de loop para texto (Residencial <-> Comercial a cada 4s com fade)
  const fadeValue = useSharedValue(0); // 0: Residencial visível, 1: Comercial visível

  useEffect(() => {
    // Inicia com Residencial (fadeValue = 0)
    fadeValue.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 4000 }), // Hold Residencial por 4s (fadeValue fica em 0)
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }), // Fade para Comercial em 300ms
        withTiming(1, { duration: 4000 }), // Hold Comercial por 4s
        withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) }) // Fade de volta para Residencial em 300ms
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(fadeValue);
    };
  }, []); // Removido [fadeValue] para evitar loop infinito (não é necessário)

  const residencialOpacityStyle = useAnimatedStyle(() => ({
    opacity: 1 - fadeValue.value,
  }));

  const comercialOpacityStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
  }));

  // NOVO: Implementação do badge animado para próximo horário disponível
  const [index, setIndex] = useState(0);
  const slots = [
    { day: 'Ter', time: '09:00' },
    { day: 'Qua', time: '14:30' },
    { day: 'Sex', time: '08:00' },
  ];

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slots.length);
    }, 4000); // troca a cada 4s (sincronizado com ciclo visível + invisível)
    return () => clearInterval(id);
  }, []);

  // CORRIGIDO: Animação de visibilidade do badge inteiro (invisível 2s -> fade in suave 600ms -> visível 2s com pulse lento -> fade out 600ms)
  const badgeVisibility = useSharedValue(0); // 0: invisível, 1: visível
  useEffect(() => {
    badgeVisibility.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2000 }), // Invisível por 2s (sem horário)
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.cubic) }), // Fade in mais lento e suave (600ms, cubic para fluidez)
        withTiming(1, { duration: 2000 }), // Visível por 2s (com pulse lento durante isso)
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.cubic) }) // Fade out mais lento e suave (600ms, cubic)
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(badgeVisibility);
    };
  }, []);

  const badgeVisibilityStyle = useAnimatedStyle(() => ({
    opacity: badgeVisibility.value,
  }));

  // CORRIGIDO: Pulse de luminosidade LENTO só durante o tempo visível (mais sutil, sem afetar transparência do card)
  const pulse = useSharedValue(0);
  useEffect(() => {
    // Pulse mais lento: ciclo de 4000ms (2s up + 2s down), amplitude baixa para suavidade
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }), // Up mais lento (2s)
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }) // Down mais lento (2s)
      ),
      -1,
      true
    );
  }, []);

  const animatedPulseStyle = useAnimatedStyle(() => {
    // CORRIGIDO: Amplitude menor para "piscar" sutil (sem transparência excessiva: 0.9-1 em vez de 0.75-1)
    // E scale mínimo para não distorcer
    return {
      opacity: interpolate(badgeVisibility.value, [0, 1], [0, interpolate(pulse.value, [0, 1], [0.9, 1])]), // Só pulsa quando visível
      transform: [{ scale: interpolate(badgeVisibility.value, [0, 1], [1, interpolate(pulse.value, [0, 1], [1, 1.02])]) }] // Scale só quando visível, mínimo
    };
  });

  // Borda viva: leve pulsar de cor na borda do card (suave, não intrusivo)
  const borderPulse = useSharedValue(0);
  useEffect(() => {
    borderPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedBorderStyle = useAnimatedStyle(() => {
    const c = interpolateColor(borderPulse.value, [0, 1], ['#d1d5db53', '#7aa7ff55']);
    return { borderColor: c, borderBottomColor: c };
  });

  // Reflexo sobre o preço (robusto, baseado na largura real do badge)
  const [priceBadgeWidth, setPriceBadgeWidth] = useState(0);
  const priceReflectionX = useSharedValue(-50);
  useEffect(() => {
    // Reinicia o loop quando a largura estiver disponível
    priceReflectionX.value = withRepeat(
      withTiming(priceBadgeWidth + 50, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
    return () => {
      cancelAnimation(priceReflectionX);
    };
  }, [priceBadgeWidth]);

  const priceReflectionStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: priceReflectionX.value }],
  }));

  // Texto animado baseado no index (muda a cada 4s, sincronizado com o ciclo)
  const currentSlot = slots[index];
  const animatedDayLabel = currentSlot.day;
  const animatedTime = currentSlot.time;

  // Fade sutil no texto durante mudança de index (para suavidade extra)
  const textFade = useSharedValue(1);
  useEffect(() => {
    // Quando index muda, fade rápido no texto para transição suave (aumentado para 400ms para combinar com fade geral)
    textFade.value = withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) });
  }, [index]);

  const fadeTextStyle = useAnimatedStyle(() => ({
    opacity: textFade.value,
  }));

  const renderStars = (rating: number | undefined) => {
    // MODIFICADO: Agora renderiza apenas 1 estrela cheia, mantendo a cor original
    if (rating && rating > 0) {
      return (
        <View style={styles.ratingStarContainer}>
          <Ionicons
            name="star"
            size={S(12)}
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

  // Rating: badge no topo da foto e ocultar rating na base quando presente
  const hasRating = typeof item.averageRating === 'number' && item.averageRating > 0;

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

  // Ordem de prioridade dos ícones: Residencial, Comercial, Pós-Obra ("Obra")
  const priorityOrder = [
    'Residencial',
    'Comercial',
    'Obra',
    'Escritório',
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

  const displayedCategories = categoriesToDisplay.slice(0, 3); // Até 3 categorias

  // NOVO: Função para obter o label do texto abaixo do ícone (mapeamento premium)
  const getCategoryLabel = (categoryName?: string) => {
    if (!categoryName) return 'Geral';
    const baseName = categoryName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    switch (baseName) {
      case 'residencial': return 'Residencial';
      case 'comercial': return 'Comercial';
      case 'obra': return 'Pós-Obra';
      case 'vidro': return 'Vidro';
      case 'escritorio':
      case 'escritório': return 'Escritório';
      case 'estofados': return 'Estofados';
      case 'passadoria': return 'Passadoria';
      case 'limpeza geral':
      case 'limpeza': return 'Limpeza Geral';
      default: return 'Geral';
    }
  };

  // Teste visual rápido: Injeta distance: 4000 (4 km) em dev se não vier do backend
  // Formatar a distância usando o valor seguro
  const distanceLabel = (typeof item.distance === 'number' && item.distance > 0)
    ? formatDistance(item.distance)
    : '0 km';

  // Helper para formatar próximo horário (agora retorna objeto para stack vertical: dia e horário separados)
  const formatNextAvailable = (next: { date: string; time: string } | undefined) => {
    if (!next) return null;
    const today = new Date();
    const nextDate = new Date(next.date);
    const diffDays = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let dayLabel: string;
    if (diffDays === 0) dayLabel = 'Hoje';
    else if (diffDays === 1) dayLabel = 'Amanhã';
    else dayLabel = days[nextDate.getDay()];
    return { dayLabel, time: next.time };
  };

  // Label para próximo horário
  // const nextAvailableLabel = formatNextAvailable(item.nextAvailable); // Comentado conforme solicitado

  // Métricas mini (condicional) - Mantendo estrutura original, mas com ícones em azul
  const hasAcceptanceRate = item.acceptanceRate && item.acceptanceRate > 0;
  const hasResponseTime = item.averageResponseTime && item.averageResponseTime > 0;

  const renderMetrics = () => {
    if (!hasAcceptanceRate && !hasResponseTime) return null;

    return (
      <View style={[styles.metricTextContainer, { flexDirection: 'column', alignItems: 'center' }]}>
        {hasAcceptanceRate && (
          <View style={styles.metricRow}>
            <Ionicons name="checkmark-done" size={S(10.5)} color="#5da2ecff" style={styles.metricPercentIcon} />
            <Text style={styles.metricValue} allowFontScaling={false}>{Math.round((item.acceptanceRate ?? (item as any)?.metrics?.acceptanceRate ?? 1))}%</Text>
          </View>
        )}
        {hasResponseTime && (
          <View style={styles.metricRow}>
          <Ionicons name="time-outline" size={S(10.5)} color="#5da2ecff" />
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
        case 'residencial': return require('../../../../assets/images/icons/residencial5.png');
        case 'comercial': return require('../../../../assets/images/icons/comercial3.png');
        case 'obra': return require('../../../../assets/images/icons/obra4.png');
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

  const formattedNextAvailable = item.nextAvailable ? formatNextAvailable(item.nextAvailable) : null;

  return (
    // NOVO: Wrapper com position: 'relative' para posicionar a distância absolutamente
    <View style={styles.cardWrapperWithDistance}>
      {/* NOVO: Micro-Pill de Localização/Distância (Sutil e Compacto) */}
      {distanceLabel && (
        <View style={styles.distancePillSmall}>
          <Ionicons name="location-outline" size={S(11)} color="#5da2ecff" />
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
        style={[styles.animatedCardContainer, hoverScaleStyle, animatedBorderStyle]}
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
            {/* SEL0 DE SEGURANÇA REFINADO */}
            <AnimatedPlusButtonGradient
              colors={['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.38)']}
              style={[styles.securityBadge, subtleTrembleAnimatedStyle]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <AnimatedReanimated.View style={[styles.reflectionOverlay, animatedReflectionStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(172, 206, 246, 1)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </AnimatedReanimated.View>

              <Ionicons name="shield-checkmark" size={S(17)} color="#5da2ecff" />
            </AnimatedPlusButtonGradient>

            {hasRating && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={S(11)} color="#5da2ecff" style={{ marginRight: 3 }} />
                <Text style={styles.ratingBadgeText} allowFontScaling={false}>{String(item.reviewCount ?? 0)}</Text>
              </View>
            )}

            {/* NOVO: Badge animado flutuante para próximo horário (posição absolute no topo direito da imagem) */}
            {formattedNextAvailable && (
              <AnimatedReanimated.View 
                style={[
                  styles.nextAvailableBadge, { transform: [{ scale: 1 }] }, 
                  // animatedPulseStyle removido: evita blur no texto do dia/hora
                  badgeVisibilityStyle  // Visibilidade: invisível 2s -> fade in 600ms -> visível 2s -> fade out 600ms
                ]}
              >
                <View style={styles.nextAvailableCircle}>
                  <AnimatedText style={[styles.nextAvailableCircleDay, fadeTextStyle]}>
                    {animatedDayLabel}
                  </AnimatedText>
                </View>
                <AnimatedText style={[styles.nextAvailableTimeBelow, fadeTextStyle]}>
                  {animatedTime}
                </AnimatedText>
              </AnimatedReanimated.View>
            )}
          </View>

          <View style={styles.infoContainer}>
            {/* Topo: Nome do provedor */}
            <View style={styles.providerNameContainer}>
              <Text style={styles.providerName} numberOfLines={1} allowFontScaling={false}>{firstName}</Text>
            </View>

            {/* Novo bloco compacto horizontal para categorias (sem textos) - ATUALIZADO SEM BOLINHAS CONECTORAS E COM TÍTULO "SERVIÇOS" ACIMA */}
            {displayedCategories.length > 0 && (
              <View style={styles.categoryLineWrapper}>
                <Text style={styles.servicesTitle}>Serviços</Text>
                <View style={styles.servicesLine} />
                {/* SUBSTITUÍDO: Removidos os 3 mini ícones; agora texto animado loop Residencial <-> Comercial no mesmo local */}
                <View style={styles.categoryTextRow}>
                  <AnimatedText style={[styles.categoryText, residencialOpacityStyle]} numberOfLines={1} allowFontScaling={false}>Residencial</AnimatedText>
                  <AnimatedText style={[styles.categoryText, comercialOpacityStyle]} numberOfLines={1} allowFontScaling={false}>Comercial</AnimatedText>
                </View>
              </View>
            )}

            {/* REMOVIDO: A versão antiga do nextAvailableBackground, substituída pelo novo badge na imageWrapper */}

            {/* Meio: Estratégia de Preço (seção isolada, centralizada, com badge sutil para destaque) */}
            <View style={styles.priceRow}>
              <Image 
                source={require('../../../../assets/images/icon.png')} 
                style={styles.priceLogo} 
                resizeMode="contain" 
              />
              <View style={styles.priceSection}>
                <Text style={styles.priceLabel} allowFontScaling={false}>{t('pricing.from', { defaultValue: 'A partir de' })}</Text>
                <View style={styles.priceBadge} onLayout={(e) => setPriceBadgeWidth(e.nativeEvent.layout.width)}>
                  {/* Reflexo animado sutil sobre o preço */}
                  <AnimatedPriceReflection
                    pointerEvents="none"
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.priceReflectionStripe, priceReflectionStyle]}
                  />
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
              {!hasRating && (
                <View style={styles.ratingSection}>
                  {renderStars(item.averageRating)}
                  <Text style={styles.reviewsCountText} allowFontScaling={false}>
                    {String(item.reviewCount ?? 0)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCardBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapperWithDistance: { // NOVO ESTILO: Container pai para posicionamento absoluto
    width: S(116),
    height: S(164), // AUMENTADO: De 194 para 210px (espaço extra para textos abaixo dos ícones ~16px)
    marginRight: S(15),
    marginBottom: -2,
    marginTop: 8,
    left: 8,
    position: 'relative', // Essencial
    overflow: 'visible',
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
    borderTopStartRadius: 20, // Cantos 22
    borderBottomStartRadius: 20,
    borderTopEndRadius: 20, // Cantos 22
    borderBottomEndRadius: 20,
    borderBottomColor: '#d1d5db53',
  },
  // NOVO ESTILO: Micro-Pill de Distância (Sutil e Compacto)
  distancePillSmall: {
    position: 'absolute',
    top: 10,
    right: 81,
    zIndex: 10,
    backgroundColor: '#F1f2f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2, // Padding 6x2
    paddingVertical: 0.5, // Padding 6x2
    borderRadius: 12,
    maxWidth: '55%',
    overflow: 'hidden',
 
    // sombra sutilíssima (shadowOpacity 0.06, elevation 2)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  distancePillSmallText: {
    marginLeft: 1,
    fontSize: S(9), // Fonte 10
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
    height: S(65), // Mantido: 75px (sem mudança, espaço extra vem do height total)
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', // Para overlay do selo (botão agora aqui)
  },
  // NOVO: Estilos para o badge animado do horário (background mais opaco para evitar transparência no card)
  nextAvailableBadge: {
    position: 'absolute',
    top: 99,                // distância consistente do topo
    right: 18,              // mesma distância do topo para margem lateral
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 8,
    shadowColor: '#5da2ec',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    overflow: 'hidden',
    transform: [{ scale: 0.95 }], // redução de ~5% apenas no badge de horário
  },
  nextAvailableCircle: {
    width: S(32),
    height: S(12),
    borderRadius: 12,
    backgroundColor: '#5dbfecff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5da2ec',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  nextAvailableCircleDay: {
    fontSize: S(10),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  nextAvailableTimeBelow: {
    fontSize: S(9),
    fontWeight: '700',
    color: '#5da2ec',
    marginTop: 3,
  },
  ratingBadge: {
    position: 'absolute',
    top: 78,
    left: 74,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  ratingBadgeText: {
    fontSize: S(9),
    color: '#455161a8',
    fontWeight: '600',
  },
  nextAvailableDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  nextAvailableIcon: {
    marginRight: 2,
    marginTop: Platform.OS === 'ios' ? 0.5 : 0,
  },
  nextAvailableDayText: {
    fontSize: 7.5,
    fontWeight: '600',
    color: '#564f4fff',
    letterSpacing: 0.2,
    marginTop: Platform.OS === 'ios' ? 0.5 : 1, // ajuste fino entre iOS/Android
    marginBottom: 0,
    textAlign: 'center',
  },
  nextAvailableTimeText: {
    fontSize: 7.5,
    fontWeight: '600',
    color: '#564f4fff',
    letterSpacing: 0.2,
    marginTop: 0,
    marginLeft: 4, // fica ao lado do dia ("Seg 14:30")
    textAlign: 'center',
  },
  // REMOVIDO: verifiedBadge style (não mais usado)
  cardImage: {
    width: '100%',
    height: '97%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 8, // Mantido: 8px (espaço suficiente com height aumentado)
  },
  providerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    left: 6,
    top: 1,
    marginBottom: 2, // Reduzido para dar espaço ao pill abaixo
  },
  providerName: {
    fontSize: S(11.5), // Nome (16/700)
    fontFamily: 'Montserrat-ExtraBold',
    paddingHorizontal: 0,
    fontWeight: '500', // ALTERADO: FontWeight mais grossa (de '700' para '900' para maior espessura)
    color: '#627490ff',
    flexShrink: 1,
  },
  // NOVO ESTILO: Wrapper para linha conectando ícones de categorias
  categoryLineWrapper: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    left: 10,
    top: 65,
  },
  // NOVO: Estilo para o título "Serviços" pequeno acima dos ícones
  servicesTitle: {
    fontSize: S(8.5),
    fontWeight: '600',
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 4,
    right: 335,
    top: -46,
  },
  // INJETADO: Linha horizontal de borderWidth 0.8 começando do "S" (aprox. left: 35, considerando centralização e right: -36) até a ponta direita, posicionada acima dos ícones (top: 2 para ficar logo abaixo do título)
  servicesLine: {
    position: 'absolute',
    width: '20%',
    left: 58, // Ajustado para começar aproximadamente no "S" do texto centralizado (considering largura do card 146px, texto ~50px largo, centralizado mas com right -36)
    right: 0, // Até a ponta direita do card
    top: -8, // Posição acima dos ícones, logo abaixo do título (top -3 do título + fontSize 8.5 ≈ linha em top 2 para sobrepor levemente)
    height: 0.8,
    backgroundColor: '#51565e4a', // Mesma cor da borda do card para consistência
  },
  // ATUALIZADO: Row para texto animado (substitui categoryIconRow, mantém posição e centralização para sobrepor textos no centro onde os ícones ficavam)
  categoryTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    right: -7,
    top: 7,
    width: 70, // AUMENTADO: De 50 para 70px para dar espaço suficiente ao texto longo sem quebrar linha (aprox. largura de 3 ícones + gaps + margem extra)
    height: 13, // Altura igual aos ícones antigos
  },
  // NOVO: Estilo para o texto da categoria (tamanho e posição similar aos ícones mini, centralizado, cor azul para consistência, zIndex acima da linha)
  categoryText: {
    position: 'absolute',
    fontSize: S(8.5), // REDUZIDO: De 9 para 8.5px para caber melhor sem quebrar (mantém legibilidade)
    fontWeight: '500',
    color: '#5c6367ff',
    textAlign: 'center',
    left: 16,
    right: 0,
    top: 4, // AJUSTADO: De 4 para 2px para centralizar verticalmente no espaço de 13px height
    zIndex: 2, // Acima da linha
    opacity: 0.95,
  },
  // REMOVIDO: connectingDot (não mais usado)
  // REMOVIDO: categoryInlineIcon (não mais usado, substituído por texto)
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
    fontSize: S(11.5), // Bio (2 linhas, 12/regular)
    paddingHorizontal: 2,
    fontWeight: Platform.select({
      ios: '300', 
      android: 'bold' 
    }),
    color: '#6C757D',
    marginBottom: 12, // Ajustado: +4px para compensar remoção de chips centrais
  },
  metricTextContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 0, // REDUZIDO: De -2 para 0 (compactar)
    marginBottom: 2, // REDUZIDO: Adicionado pequeno espaço para ratings
    left: 7,
    bottom: 77, // REMOVIDO: Posicionamentos absolutos para fluxo natural
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  metricIcon: {
    fontSize: 10,
    fontWeight: 'bold',
    
  },
  // Ajuste fino: ícone de % (aceitação) levemente à direita e acima na pilha
  metricPercentIcon: {
    position: 'relative',
    marginLeft: 2, // ~2% do card (~2-3px) sem quebrar layout
    zIndex: 5,
    elevation: 2,
  },
  metricValue: {
    fontSize: S(8.4), // REDUZIDO: De 10.5 para 10px (compactar)
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
    left: 18,
    top: 23,
    marginBottom: 4,
    marginTop: 2,
  },
  // CORREÇÃO PRINCIPAL: Removida a lógica de "junção" - agora separação máxima com flex e margin
  // NOVO: Seção de preço isolada (estratégia: centralizada, com badge para destaque) - agora sem left/top, pois herdado do row
  priceSection: {
    alignItems: 'center',
    marginLeft: 4, // Pequeno espaçamento entre logo e preço
    marginBottom: 4, // REDUZIDO: De 0 para 4px (espaço mínimo)
    right: 10,
    top: -35,
  },
  // NOVO: Estilo para o logo pequeno ao lado esquerdo do preço (fora do badge)
  priceLogo: {
    width: S(23),
    height: S(23),
    right: 19,
    bottom: 1,
    opacity: 0,
    
    
    
  },
  // NOVO: Badge para preço (gradiente sutil, economiza altura) - removido o row, pois logo agora fora
  priceBadge: {
    backgroundColor: 'rgba(126, 174, 224, 0.12)', // Fundo azul claro translúcido
    borderRadius: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
    marginTop: 2,
  },
  priceReflectionStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -40, // começa fora à esquerda para o sweep
    width: 40,
    borderRadius: 8,
    opacity: 0.9,
  },
  priceLabel: {
    fontSize: S(9.5), // REDUZIDO: De 12 para 11px
    color: '#6C757D',
    right: 43,
    top: 15,
    marginBottom: 0, // REDUZIDO: Eliminar margin para compactar
  },
  priceValue: {
    fontSize: S(9.8), // Preço "A partir de" (16/bold) - mantido bold para destaque
    fontWeight: 'bold',
    left: 3,
    color: '#838891ff',
  },
  hourlyPriceValue: {
    fontSize: S(10), // REDUZIDO: De 11 para 10px
    fontWeight: 'normal',
    color: '#7d786cff',
    marginTop: 0, // REDUZIDO: Espaço mínimo
  },
  // REMOVIDO: premiumSeparator style (não mais usado)
  // NOVO: Container unificado para métricas e ratings (juntos, row para proximidade)
  metricsAndRatingSection: {
    flexDirection: 'row', // Row para colocar métricas à esquerda e ratings à direita
    alignItems: 'center',
    justifyContent: 'space-between', // Espalha para usar largura
    marginTop: 10, // Sem topo extra
    right: 5,
    top: -6,
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

  securityBadge: {
    position: 'absolute',
    width: 26,
    height: 26,
    bottom: 118,  // fixa no canto inferior direito da foto
    right: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,

    // Fundo translúcido e suave — glass premium
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#5da2ec',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,

    // Micro brilho para iOS look
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  reflectionOverlay: {
    position: 'absolute',
    width: 50,
    height: '100%',
  },
  ratingStarContainer: {
    flexDirection: 'row',
    marginTop: 1, // REDUZIDO: De 2 para 1px
    bottom: 74,
    left: 6,
    
  },
  ratingStarIcon: {
    marginRight: 4, // AJUSTADO: Espaçamento menor para uma única estrela (era 12 para múltiplas)
    bottom: 113,
  },
  reviewsCountText: {
    fontSize: S(7), // REDUZIDO: De 9.1 para 9px
    color: '#6C757D',
    bottom: 173.5,
    right: 6,
    textAlign: 'right', // Alinha à direita no container row
    marginLeft: 2, // Pequeno espaçamento entre estrela e count
  },
  // REMOVIDOS: Estilos antigos do nextAvailable (substituídos pelo novo badge)
  // nextAvailableRow, nextAvailableDayRow, nextAvailableDay, nextAvailableTime, nextAvailableBackground
});

export default RecomendacaoCard;
