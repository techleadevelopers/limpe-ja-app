import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import NotificationUIService from '../../../services/notificationUIService';

import BookServiceButton from '../../../components/client/explore/provider/BookServiceButton';
import InfoChip from '../../../components/client/explore/provider/InfoChip';
// ServiceCategoryBadges removido (voltando ao layout anterior)
import ReviewCard from '../../../components/client/explore/provider/ReviewCard';
import SideIcon from '../../../components/client/explore/provider/SideIcon';

import { VerificationStatus } from '../../../types/backend/auth';
import { ProviderServiceOffering } from '../../../types/backend/provider-service';
import { Offer, ProviderDisplayInfo, ProviderReview } from '../../../types/backend/providers';

import { AppColors } from '../../../constants/appStyles';
import { Icons3D } from '../../../constants/icons3d';
import { useAuth } from '../../../hooks/useAuth';
import { checkActiveChatBooking } from '../../../services/bookingService';
import { getProviderDetails, getProviderOffers } from '../../../services/providerService';
import { styles } from '../../../styles/providerStyles';
import { formatDistance } from '../../../utils/formatters';
import { getNumericPriceValue } from '../../../utils/service-helpers';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MINIMUM_HOURLY_MINUTES = 240;
const MINIMUM_BILLABLE_HOURS = 4;

const formatBRL = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
const computeBillableHours = (durationMinutes?: number) =>
  Math.max(
    MINIMUM_BILLABLE_HOURS,
    Math.ceil((durationMinutes ?? MINIMUM_HOURLY_MINUTES) / 60),
  );

// Type local para PromiseRejectedResult (evita erros TS sem import global)
type PromiseRejectedResult = {
  status: 'rejected';
  reason: any;
};

function RecommendationsSection({ reviews }: { reviews?: ProviderReview[] }) {
  const hasReviews = (reviews?.length ?? 0) > 0;
  const displayed = (reviews ?? []).slice(0, 5);
  const remainingCount = Math.max((reviews?.length ?? 0) - displayed.length, 0);

  const { t } = useTranslation();

  const renderAvatarContent = (review: ProviderReview) => {
    const avatarUrl = review.client?.user?.avatarUrl;
    if (!avatarUrl) {
      return null;
    }
    return <Image source={{ uri: avatarUrl }} style={recommendationStyles.avatarImg} />;
  };

  return (
    <View style={recommendationStyles.avatarsRow}>
      {hasReviews ? (
        <>
          {displayed.map((review, i) => {
            const content = renderAvatarContent(review);
            if (!content) return null;
            return (
              <View
                key={review.id || i}
                style={[
                  recommendationStyles.avatarWrapper,
                  { marginLeft: i === 0 ? 0 : -12 },
                ]}
              >
                {content}
              </View>
            );
          })}
          {remainingCount > 0 && (
            <View style={[recommendationStyles.moreBadge, { marginLeft: -12 }]}>
              <Text style={recommendationStyles.moreBadgeTxt}>+{remainingCount}</Text>
            </View>
          )}
        </>
      ) : null}
    </View>
  );
}

const recommendationStyles = StyleSheet.create({
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 11,
    left: 5,
  },
  avatarWrapper: {
    width: 42,
    height: 42,
    borderRadius: 44,
    //bordas redundantes com o fundo já arredondado e sombra
    // borderWidth: 1,
    // borderColor: AppColors.borderNeutral,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 44,
    // borderWidth: 1,
    // borderColor: AppColors.borderNeutral,
  },
  moreBadge: {
    width: 42,
    height: 42,
    borderRadius: 44,
    backgroundColor: AppColors.textBody,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBadgeTxt: {
    color: AppColors.white,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'RedHatMono' : 'Montserrat-Regular', // Android usa a mesma família visível no iOS
  },
  placeholderDot: {
    width: 42,
    height: 42,
    borderRadius: 44,
    // borda comentada porque o fundo já cria contraste e evita o duplo traço
    // borderWidth: 1,
    // borderColor: AppColors.borderNeutral,
  },
  placeholderBadge: {
    backgroundColor: '#0f172a',
  },
});

interface ProviderDisplayInfoWithStatus extends ProviderDisplayInfo {
  status?: string;
}

function dedupeReviews(reviews?: ProviderReview[]) {
  if (!reviews?.length) {
    return [];
  }
  const seen = new Set<string>();
  return reviews.filter((review) => {
    const uniqueKey =
      review.id ??
      `${review.clientId ?? 'client'}:${review.rating ?? '0'}:${review.comment?.trim().toLowerCase() ?? ''}:${
        review.createdAt ?? ''
      }`;
    if (seen.has(uniqueKey)) {
      return false;
    }
    seen.add(uniqueKey);
    return true;
  });
}

const SecurityBanner: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <View style={securityBannerStyles.container}>
    <LinearGradient
      colors={['#EAF3FF', '#DCEBFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={securityBannerStyles.card}
    >
      <View style={securityBannerStyles.leftSection}>
        <View style={securityBannerStyles.iconBadge}>
          <Ionicons name="shield-checkmark" size={18} color="#fff" />
        </View>
        <View style={securityBannerStyles.textWrap}>
          <Text style={securityBannerStyles.title}>Seguranca LimpeJa</Text>
          <Text style={securityBannerStyles.subtitle} numberOfLines={2}>
            Dicas e garantias para seu atendimento com tranquilidade.
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={onPress} style={securityBannerStyles.cta}>
        <Text style={securityBannerStyles.ctaText}>Ver</Text>
      </TouchableOpacity>
    </LinearGradient>
  </View>
);

const securityBannerStyles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH - 40,
    height: 90,
    alignSelf: 'center',
    marginTop: Platform.OS === 'android' ? 2 : 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primaryInteractive,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 0,
      },
    }),
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: AppColors.textBody,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: AppColors.textAuxiliary,
    lineHeight: 18,
  },
  cta: {
    backgroundColor: AppColors.primaryInteractive,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default function ProviderDetailsScreen() {
  const params = useLocalSearchParams();
  const providerId = params.providerId;
  const paramDistance =
    params?.distance && !Array.isArray(params.distance) && Number.isFinite(Number(params.distance))
      ? Number(params.distance)
      : undefined;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [provider, setProvider] = useState<ProviderDisplayInfoWithStatus | null | undefined>(undefined);
  const [providerOffers, setProviderOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canInitiateChat, setCanInitiateChat] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | undefined>(undefined);
  // Local state for retry (to force useEffect)
  const [tempProviderId, setTempProviderId] = useState<string | undefined>(providerId as string);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const mainContentAnim = useRef(new Animated.Value(0)).current;
  const bookNowButtonAnim = useRef(new Animated.Value(0)).current;
  const imageFadeAnim = useRef(new Animated.Value(0)).current;
  const imageScaleAnim = useRef(new Animated.Value(0.8)).current;
  const infoChipAnim = useRef(new Animated.Value(0)).current;
  const addReviewButtonPulseAnim = useRef(new Animated.Value(1)).current;

  const callButtonAnim = useRef(new Animated.Value(1)).current;
  const chatButtonAnim = useRef(new Animated.Value(1)).current;
  const mapButtonAnim = useRef(new Animated.Value(1)).current;
  const shareButtonAnim = useRef(new Animated.Value(1)).current;

  // Adicionado ref para verificar se o componente está montado
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true; // Componente montado

    // Declarar pulseLoop aqui para que seja acessível na função de limpeza
    let pulseLoop: Animated.CompositeAnimation | undefined;

    if (tempProviderId && typeof tempProviderId === 'string') {
      // Use tempProviderId
      if (isMounted.current) {
        setIsLoading(true);
        setError(null);
        setProvider(undefined);
        setCanInitiateChat(false);
        setActiveBookingId(undefined);
        setProviderOffers([]); // Reset offers para evitar dados velhos/erros
      }
      mainContentAnim.setValue(0);
      bookNowButtonAnim.setValue(0);
      imageFadeAnim.setValue(0);
      imageScaleAnim.setValue(0.8);
      infoChipAnim.setValue(0);

      pulseLoop = Animated.loop(
        // Atribuir à variável declarada fora
        Animated.sequence([
          Animated.timing(addReviewButtonPulseAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(addReviewButtonPulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // MELHORIA: Usar Promise.allSettled para falhas parciais (ex.: offers falha, mas provider carrega)
      Promise.allSettled([
        getProviderDetails(tempProviderId),
        getProviderOffers(tempProviderId),
      ]).then(async (results) => {
        if (!isMounted.current) return; // Verifica se o componente ainda está montado

        const [providerResult, offersResult] = results;

        

        // Provider details - CORRECAO TS: Type guard para 'rejected'
        let finalProviderData: ProviderDisplayInfoWithStatus | null = null;
        if (providerResult.status === 'fulfilled' && providerResult.value) {
          const distance = Number.isFinite(paramDistance)
            ? paramDistance
            : providerResult.value?.distance ?? null;
          finalProviderData = { ...providerResult.value, distance };

          const rawReviews = providerResult.value.reviews ?? [];
          finalProviderData.reviews = dedupeReviews(rawReviews);
        } else {
          // CORREÇÃO TS: Só acessa reason se for 'rejected'
          if (__DEV__) {
            if (providerResult.status === 'rejected') {
              console.warn(
                '[ProviderDetailsScreen] Falha ao carregar provider (silencioso):',
                (providerResult as PromiseRejectedResult).reason
              );
            } else {
              console.warn(
                '[ProviderDetailsScreen] Provider carregado mas inválido (valor falsy, silencioso)'
              );
            }
          }
          finalProviderData = null;
        }

        // Provider offers - MELHORIA: Filtrar erros/inválidos + CORREÇÃO TS
        let offersData: Offer[] = [];
        if (offersResult.status === 'fulfilled') {
          const rawOffers = offersResult.value || [];
          // Filtro premium AGRESSIVO: Pular offers com dados de erro (ex.: description com "erro", "cannot", "get", "active-chat" ou strings longas)
          offersData = rawOffers.filter((offer) => {
            if (
              !offer ||
              typeof offer !== 'object' ||
              !offer.title ||
              !offer.id ||
              (offer.description && (
                offer.description.toLowerCase().includes('erro') ||
                offer.description.toLowerCase().includes('cannot') ||
                offer.description.toLowerCase().includes('get') ||
                offer.description.toLowerCase().includes('active-chat') ||
                offer.description.length > 100  // Erros são longos, offers curtas
              )) ||
              typeof offer.discountValue !== 'number'  // Desconto deve ser número
            ) {
              if (__DEV__) {
                console.warn('[ProviderDetailsScreen] Offer inválido filtrado (silencioso):', offer);
              }
              return false;
            }
            return true;
          });
        } else {
          if (__DEV__) {
            if (offersResult.status === 'rejected') {
              console.warn(
                '[ProviderDetailsScreen] Falha ao carregar offers (silencioso, usa []):',
                (offersResult as PromiseRejectedResult).reason
              );
            } else {
              console.warn('[ProviderDetailsScreen] Offers carregado mas inválido (silencioso)');
            }
          }
          offersData = []; // Silencioso: Não mostra seção se vazia
        }

        setProvider(finalProviderData);
        setProviderOffers(offersData);

        if (!finalProviderData) {
          setError(t('provider_details.provider_not_found_friendly', { providerId: tempProviderId }));
        } else {
         // Chat check - MELHORIA: Try-catch ainda mais isolado e silencioso (SEM ALERT)
if (isAuthenticated && user?.id) {
  (async () => {
    try {
      const chatBookingStatus = await checkActiveChatBooking(
        user.id,
        finalProviderData.id
      );
      if (!isMounted.current) return;
      setCanInitiateChat(chatBookingStatus.canChat);
      setActiveBookingId(chatBookingStatus.bookingId);
      if (__DEV__) {
        console.log(`[ProviderDetailsScreen] Chat OK: ${chatBookingStatus.canChat}`);
      }
    } catch (chatError) {
      // TOTALMENTE SILENCIOSO: Não loga nada em prod, só desabilita chat (SEM ALERT)
      // REFORÇO: Como o service não throw mais, isso é redundante, mas mantém para safety
      if (__DEV__) {
        console.warn('[ProviderDetailsScreen] Chat check falhou (silencioso, do service fallback):', chatError);
      }
      setCanInitiateChat(false);
      setActiveBookingId(undefined);
      // NÃO MOSTRA NADA AO USUÁRIO AQUI - só no handleChatPress se tentar usar
    }
  })();
}

          // Animações só se provider carregou
          Animated.parallel([
            Animated.timing(imageFadeAnim, {
              toValue: 1,
              duration: 500,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.spring(imageScaleAnim, {
              toValue: 1,
              friction: 8,
              tension: 100,
              useNativeDriver: true,
            }),
            Animated.stagger(150, [
              Animated.spring(mainContentAnim, {
                toValue: 1,
                damping: 10,
                stiffness: 100,
                useNativeDriver: true,
              }),
              Animated.spring(bookNowButtonAnim, {
                toValue: 1,
                damping: 10,
                stiffness: 100,
                useNativeDriver: true,
              }),
              Animated.timing(infoChipAnim, {
                toValue: 1,
                duration: 600,
                easing: Easing.ease,
                delay: 200,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        }
      })
      .catch((err) => {
        // CATCH GERAL (raro com allSettled, mas para unhandled) - SILENCIOSO
        if (__DEV__) {
          console.error("[ProviderDetailsScreen] Erro geral (silencioso):", err);
        }
        if (isMounted.current) {
          setError(t('provider_details.error_loading_details_friendly'));
          setProvider(null);
          setProviderOffers([]);
        }
      })
      .finally(() => {
        if (isMounted.current) {
          setIsLoading(false);
        }
      });
    } else {
      if (isMounted.current) {
        setError(t('provider_details.invalid_professional_id_friendly'));
        setIsLoading(false);
        setProvider(null);
        setProviderOffers([]);
      }
    }
    return () => {
      isMounted.current = false; // Componente desmontado
      if (pulseLoop) {
        pulseLoop.stop(); // Garante o cleanup da animação em loop
      }
    };
  }, [
    tempProviderId,
    isAuthenticated,
    user?.id,
    t,
    paramDistance,
    addReviewButtonPulseAnim,
    bookNowButtonAnim,
    imageFadeAnim,
    imageScaleAnim,
    infoChipAnim,
    mainContentAnim,
  ]); // Depend on tempProviderId

  useEffect(() => {
    setDescriptionExpanded(false);
  }, [provider?.bio]);

  useEffect(() => {
    if (!isLoading && (error || !provider)) {
      router.replace('/client/explore' as any);
    }
  }, [error, provider, isLoading, router]);

  const requireAuthOrRedirect = useCallback(
    (actionName?: string) => {
      if (isAuthenticated) {
        return true;
      }

      const title = t('auth.registration_required_title', 'Cadastro necessário');
      const message =
        actionName === 'chat'
          ? t(
              'auth.registration_required_chat',
              'Crie sua conta para conversar com o profissional.'
            )
          : t('auth.registration_required', 'Crie seu cadastro para continuar.');

      Alert.alert(
        title,
        message,
        [
          { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
          { text: t('common.continue', 'Continuar'), onPress: () => router.push('/auth/client-register' as any) },
        ],
        { cancelable: true }
      );
      return false;
    },
    [isAuthenticated, router, t]
  );

  const guardedRouter = useMemo(
    () =>
      ({
        ...router,
        push: (...args: any[]) => {
          if (!requireAuthOrRedirect('book_service')) {
            return;
          }
          return (router as any).push(...args);
        },
      } as typeof router),
    [router, requireAuthOrRedirect]
  );

  const handleChatPress = () => {
    if (!requireAuthOrRedirect('chat')) {
      return;
    }
    if (provider && user && activeBookingId) {
        router.push({
          pathname: '/client/messages/[bookingId]',
          params: {
            bookingId: activeBookingId,
            recipientName: provider.fullName,
            recipientId: provider.id,
            recipientAvatarUrl: provider.avatarUrl,
          },
        } as any);
      } else {
      // Mensagem AMIGÁVEL e só se o usuário clicar (não automática) - USE TOAST, NÃO ALERT
      NotificationUIService.showInfo(
        t('provider_details.chat_unavailable_message_friendly', {
          providerName: provider?.fullName || 'o profissional',
        }),
        t('provider_details.chat_unavailable_title_friendly')
      );
    }
  };

  const handleActionButtonPressIn = (animValue: Animated.Value) => {
    Animated.spring(animValue, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handleActionButtonPressOut = (animValue: Animated.Value) => {
    Animated.spring(animValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const isServiceAvailable = (service?: ProviderServiceOffering) =>
    Boolean(service && getNumericPriceValue(service) > 0 && !service.needsReview);

  const formatPriceDisplay = (service?: ProviderServiceOffering) => {
    if (!service) {
      return t('provider_details.price_not_available', { defaultValue: 'Preço não disponível' });
    }
    const hourly = getNumericPriceValue(service);
    if (hourly <= 0) {
      return t('provider_details.price_not_available', { defaultValue: 'Preço não disponível' });
    }
    return `${formatBRL(hourly)}/h`;
  };

  const handleViewAllReviews = () => {
    if (provider) {
      router.push({
        pathname: '/common/feedback/[targetId]',
        params: { targetId: provider.id, targetType: 'provider' },
      } as any);
    }
  };

  const displayReviews = useMemo(() => dedupeReviews(provider?.reviews), [provider?.reviews]);
  const hasReviews = displayReviews.length > 0;
  const [isReviewsExpanded, setReviewsExpanded] = useState(hasReviews);
  useEffect(() => {
    if (hasReviews) {
      setReviewsExpanded(true);
    }
  }, [hasReviews]);

  const distanceLabel = useMemo(() => {
    if (typeof provider?.distance === 'number' && Number.isFinite(provider.distance) && provider.distance >= 0) {
      return formatDistance(provider.distance, null);
    }
    return null;
  }, [provider?.distance]);

  useEffect(() => {
      if (provider?.providerServices) {
        console.log('[ProviderDetails] price payload', provider.providerServices.map((svc) => ({
          id: svc.id,
          pricePerHour: svc.pricePerHour,
          needsReview: svc.needsReview,
          price: svc.price,
        })));
      }
  }, [provider?.providerServices]);

  if (isLoading) {
    return (
      <View style={[styles.centeredFeedback, { backgroundColor: AppColors.white }]}>
        <Stack.Screen options={{ title: t('common.loading'), headerShown: false }} />
        <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
      </View>
    );
  }

  if (error || !provider) {
    return null;
  }

  const bookableService = provider.providerServices?.find(isServiceAvailable);
  const primaryService = bookableService ?? provider.providerServices?.[0];
  const isPrimaryServiceValid = isServiceAvailable(primaryService);
  const firstProviderServiceOfferingId = bookableService?.id;
  const estimatedTotalPrice =
    isPrimaryServiceValid && primaryService?.durationMinutes
      ? formatBRL((primaryService.pricePerHour ?? 0) * computeBillableHours(primaryService.durationMinutes))
      : null;

  return (
    <View style={styles.screenContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          backgroundColor: AppColors.white,
          borderBottomWidth: 1,
          borderBottomColor: AppColors.backgroundNeutral,
          paddingTop: Platform.OS === 'ios'
  ? insets.top + 14 : Math.max(insets.top, 0) + 12, // Android: sobe/encaixa igual
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={20}
            color={AppColors.textBody}
            style={{ top: Platform.OS === 'ios' ? 0 : 6 }}
          />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: Platform.OS === 'ios' ? 17 : 17,
            left: 4,
            top: Platform.OS === 'ios' ? 0 : 4,
            fontFamily: 'Montserrat-Regular',
            fontWeight: Platform.OS === 'ios' ? '800' :'700',
            color: AppColors.textBody,
            marginRight: 24,
          }}
        >
          Detalhes
        </Text>
      </View>

      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={[
          styles.scrollContentContainer,
          { paddingBottom: Platform.OS === 'ios' ? 120 : 80 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.providerImageContainer,
            { opacity: imageFadeAnim, transform: [{ scale: imageScaleAnim }] },
          ]}
        >
          <Image
            source={{
              uri:
                provider.avatarUrl ||
                'https://placehold.co/600x400/E0E0E0/6C757D?text=' + t('provider_details.no_photo'),
            }}
            style={styles.providerImage}
            resizeMode="cover"
            onError={(e) => {
              if (__DEV__) {
                console.log('Erro imagem (silencioso):', e.nativeEvent.error);
              }
            }}
          />
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() =>
              NotificationUIService.showInfo(t('provider_details.save_favorite'), t('common.save'))
            }
          >
            <Ionicons name="heart" size={18} color={AppColors.primaryInteractive} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.contentArea,
            {
              opacity: mainContentAnim,
              transform: [
                {
                  translateY: mainContentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
              ],
            },
          ]}
        >
            <View style={styles.providerInfoWhiteCard}>
              <View style={styles.providerNameRow}>
                <Text style={styles.providerNameWhiteCard}>{provider.fullName}</Text>
{provider.reviewCount && provider.reviewCount > 0 ? (
  <View style={styles.compactRatingBadge}>
    {/* ⬅️ NOVO: View para forçar o recorte do ícone */}
    <View style={{ marginRight: 4, marginVertical: 0, padding: 0 }}> 
      <Ionicons 
        name="star" 
        size={18} 
        color={'#307ff5ff'} 
        style={{ margin: 0, padding: 0,  }} // Garante que o ícone é renderizado sem margem
      />
    </View>
    <Text style={styles.compactRatingText}>
      {typeof provider.averageRating === 'number'
        ? provider.averageRating.toFixed(1)
        : 'N/A'}
    </Text>
  </View>
                ) : (
                  <View style={styles.compactNewProviderBadge}>
                    <Text style={styles.compactNewProviderBadgeText}>NOVO</Text>
                  </View>
                )}
            </View>

            <View style={styles.locationContainerWhiteCard}>
              <Ionicons
                name="location-sharp"
                size={Platform.OS === 'android' ? 16 : 18}
                color='#45474bff'
                backgroundColor='transparent'
                borderRadius={9}
                paddingHorizontal={4}
                paddingVertical={4}
              />
              <Text style={styles.locationTextWhiteCard}>
                {provider.address?.city || t('common.not_available')}
                <Text style={styles.locationDistanceText}>
                  {' · '}
                  {distanceLabel ?? ''}
                </Text>
              </Text>
            </View>

            {(() => {
              const providerBio = (provider?.bio ?? '').trim();
              const descriptionText = providerBio || t('provider_details.no_description');
              const hasLongDescription = providerBio.length > 240;
              return (
                <>
                  <Text
                    style={styles.descriptionText}
                    numberOfLines={descriptionExpanded ? undefined : 3}
                    ellipsizeMode="tail"
                  >
                    {descriptionText}
                  </Text>
                  {hasLongDescription && (
                    <TouchableOpacity
                      style={styles.descriptionToggle}
                      onPress={() => setDescriptionExpanded((prev) => !prev)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.descriptionToggleText}>
                        {descriptionExpanded
                          ? t('provider_details.show_less', { defaultValue: 'Mostrar menos' })
                          : t('provider_details.show_more', { defaultValue: 'Mostrar mais' })}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              );
            })()}

            <View style={styles.priceBackgroundWrapper}>
              <View style={styles.priceWrapper}>
                <Text style={styles.priceValue}>{formatPriceDisplay(primaryService)}</Text>
                {isPrimaryServiceValid ? (
                  <>
                    <Text style={styles.priceSubLabel}>{t('provider_details.minimum_hours', { defaultValue: 'Mínimo 4h' })}</Text>
                    {estimatedTotalPrice && (
                      <Text style={styles.priceUnit}>
                        {`Total: ${estimatedTotalPrice} (4h mín.)`}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.priceSubLabel}>
                    {primaryService?.needsReview
                      ? t('provider_details.price_review', { defaultValue: 'Preço em revisão' })
                      : t('provider_details.price_not_available', { defaultValue: 'Preço não disponível' })}
                  </Text>
                )}
              </View>
              <Image source={Icons3D.facial} style={styles.priceFacialIconFloating} />
              <Animated.View
                style={[
                  styles.infoChipsContainer,
                  {
                    opacity: infoChipAnim,
                    transform: [
                      {
                        translateY: infoChipAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {provider.yearsOfExperience !== undefined && provider.yearsOfExperience !== null && (
                  <InfoChip
                    iconName="hourglass-outline"
                    iconSize={16}
                    text={t('provider_details.years_experience', {
                      count: provider.yearsOfExperience,
                    })}
                  />
                )}
                {provider.verificationStatus === VerificationStatus.APPROVED && (
                  <InfoChip iconName="shield-checkmark-outline" iconSize={16} text={t('provider_details.verified')} />
                )}
              </Animated.View>
            </View>
          </View>

          <View style={styles.tabContentContainer}>

            <SecurityBanner onPress={() => router.push('/client/explore/security' as any)} />

            {provider && (
              <SideIcon
                showSecurity={provider.verificationStatus === VerificationStatus.APPROVED}
                showFacialRecognition={true}
                rating={provider.averageRating}
                onPressSecurity={() =>
                  NotificationUIService.showInfo(
                    'Este provedor passou por verificação de segurança 3D.',
                    'Segurança 3D'
                  )
                }
                onPressFacialRecognition={() =>
                  NotificationUIService.showInfo(
                    'Este provedor utiliza reconhecimento facial para verificação.',
                    'Reconhecimento Facial'
                  )
                }
                onPressRating={() =>
                  NotificationUIService.showInfo(
                    `Avaliação média do provedor: ${
                      typeof provider.averageRating === 'number'
                        ? provider.averageRating.toFixed(1)
                        : 'N/A'
                    }`,
                    'Avaliação'
                  )
                }
              />
            )}

            {/*
            <View style={styles.actionButtonsContainer}>
              <Animated.View style={{ transform: [{ scale: callButtonAnim }] }}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    if (!requireAuthOrRedirect('call')) return;
                    NotificationUIService.showInfo(
                      t('provider_details.call_functionality'),
                      t('provider_details.call')
                    );
                  }}
                  onPressIn={() => handleActionButtonPressIn(callButtonAnim)}
                  onPressOut={() => handleActionButtonPressOut(callButtonAnim)}
                >
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color={styles.actionButtonText.color}
                  />
                  <Text style={styles.actionButtonText}>{t('provider_details.call')}</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: chatButtonAnim }] }}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    if (!requireAuthOrRedirect('chat')) return;
                    NotificationUIService.showInfo(
                      t('provider_details.chat_functionality'),
                      t('provider_details.chat')
                    );
                  }}
                  onPressIn={() => handleActionButtonPressIn(chatButtonAnim)}
                  onPressOut={() => handleActionButtonPressOut(chatButtonAnim)}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color={styles.actionButtonText.color}
                  />
                  <Text style={styles.actionButtonText}>{t('provider_details.chat')}</Text>
                </TouchableOpacity>
              </Animated.View>

              <View style={[styles.actionButton, styles.disabledActionButton]}>
                <Ionicons name="chatbubble-outline" size={16} color="#9aa2b6" />
                <Text style={[styles.actionButtonText, styles.disabledActionButtonText]}>
                  {t('provider_details.privacy_mode')}
                </Text>
              </View>

              <Animated.View style={{ transform: [{ scale: mapButtonAnim }] }}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    if (!requireAuthOrRedirect('map')) return;
                    NotificationUIService.showInfo(
                      t('provider_details.map_functionality'),
                      t('provider_details.map')
                    );
                  }}
                  onPressIn={() => handleActionButtonPressIn(mapButtonAnim)}
                  onPressOut={() => handleActionButtonPressOut(mapButtonAnim)}
                >
                  <Ionicons name="map-outline" size={16} color={styles.actionButtonText.color} />
                  <Text style={styles.actionButtonText}>{t('provider_details.map')}</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: shareButtonAnim }] }}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    NotificationUIService.showInfo(
                      t('provider_details.share_functionality'),
                      t('provider_details.share')
                    )
                  }
                  onPressIn={() => handleActionButtonPressIn(shareButtonAnim)}
                  onPressOut={() => handleActionButtonPressOut(shareButtonAnim)}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={16}
                    color={styles.actionButtonText.color}
                  />
                  <Text style={styles.actionButtonText}>{t('provider_details.share')}</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
            */}

            <TouchableOpacity
              style={[
                localStyles.reviewSectionHeader,
                !hasReviews && localStyles.reviewSectionHeaderCollapsed,
              ]}
              activeOpacity={hasReviews ? 1 : 0.75}
              onPress={!hasReviews ? () => setReviewsExpanded((prev) => !prev) : undefined}
            >
              <View style={localStyles.reviewHeaderContent}>
                <Text style={styles.sectionTitle}>
                  {t('provider_details.reviews_and_recommendations_title', 'Avaliações & Recomendações')}
                </Text>
                {!hasReviews && (
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={AppColors.textBody}
                    style={[
                      localStyles.expandIcon,
                      {
                        transform: [{ rotate: isReviewsExpanded ? '180deg' : '0deg' }],
                      },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>

            {hasReviews && <RecommendationsSection reviews={displayReviews} />}

            {hasReviews ? (
              <View style={styles.reviewsDetailContainer}>
                <View style={styles.averageRatingContainer}>
                  <Image source={Icons3D.like} style={styles.likeIcon} />
                  <Text style={styles.averageRatingText}>
                    {typeof provider.averageRating === 'number'
                      ? provider.averageRating.toFixed(1)
                      : 'N/A'}
                  </Text>
                  <Text style={styles.totalReviewsText}>
                    {t('provider_details.reviews_count', { count: provider.reviewCount || 0 })}
                  </Text>
                </View>

                {displayReviews.slice(0, 3).map((review, index) => (
                  <ReviewCard key={review.id || index} review={review} />
                ))}

                {displayReviews.length > 3 && (
                  <TouchableOpacity
                    style={styles.viewAllReviewsButton}
                    onPress={handleViewAllReviews}
                  >
                    <Text style={styles.viewAllReviewsButtonText}>
                      {t('provider_details.view_all_reviews')}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={AppColors.primaryInteractive}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              isReviewsExpanded && (
                <View style={styles.newProviderNoReviewsContainer}>
                  <View style={styles.newProviderBadgeContainer}>
                    <Image
                      source={require('../../../assets/images/vass.png')}
                      style={styles.newProviderBadgeIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.newProviderNoReviewsTitle}>
                    {t('provider_details.new_provider_title', 'Novo na LimpeJá!')}
                  </Text>
                  <Text style={styles.newProviderNoReviewsSubtitle}>
                    {t('provider_details.be_the_first_review', 'Seja o primeiro cliente a deixar uma avaliação.')}
                  </Text>
                </View>
              )
            )}
            
          </View>
        </Animated.View>
      </ScrollView>
      {bookableService ? (
        <BookServiceButton
          providerId={provider.id}
          serviceId={bookableService.id}
          router={guardedRouter}
          bookNowButtonAnim={bookNowButtonAnim}
          servicePrice={bookableService.pricePerHour}
          sticky
          safeBottomInset={Platform.OS === 'ios' ? insets.bottom : 35}
          isAuthenticated={isAuthenticated}
          requireAuthOrRedirect={requireAuthOrRedirect}
          verificationStatus={provider.verificationStatus}
        />
      ) : (
        <View style={localStyles.unavailableNotice}>
          <Text style={localStyles.unavailableNoticeText}>
            {primaryService?.needsReview
              ? t('provider_details.price_review', { defaultValue: 'Preço em revisão' })
              : t('provider_details.price_not_available', { defaultValue: 'Preço não disponível' })}
          </Text>
        </View>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  reviewSectionHeader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewHeaderContent: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  expandIcon: {
    marginTop: 14,
  },
  reviewSectionHeaderCollapsed: {
    marginBottom: 10,
  },
  unavailableNotice: {
    marginHorizontal: 24,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: AppColors.border,
    alignItems: 'center',
  },
  unavailableNoticeText: {
    color: AppColors.danger,
    fontWeight: '600',
  },
});
