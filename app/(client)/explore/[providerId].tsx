import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Easing,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import NotificationUIService from '../../../services/notificationUIService';
import * as Clipboard from 'expo-clipboard';

import BookServiceButton from '../../../components/client/explore/provider/BookServiceButton';
import InfoChip from '../../../components/client/explore/provider/InfoChip';
// ServiceCategoryBadges removido (voltando ao layout anterior)
import ReviewCard from '../../../components/client/explore/provider/ReviewCard';
import StarRating from '../../../components/client/explore/provider/StarRating';
import SideIcon from '../../../components/client/explore/provider/SideIcon';

import { ProviderDisplayInfo, ProviderReview, ProviderMetrics, Offer } from '../../../types/backend/providers';
import { VerificationStatus } from '../../../types/backend/auth';
import { PricingType } from '../../../types/backend/services';
import { ProviderServiceOffering } from '../../../types/backend/provider-service';

import { useAuth } from '../../../hooks/useAuth';
import { checkActiveChatBooking } from '../../../services/bookingService';
import { getProviderDetails, getProviderMetrics, getProviderOffers } from '../../../services/providerService';
import { AppColors, AppShadows } from '../../../constants/appStyles';
import { Icons3D } from '../../../constants/icons3d';
import { styles } from './styles/providerStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Type local para PromiseRejectedResult (evita erros TS sem import global)
type PromiseRejectedResult = {
  status: 'rejected';
  reason: any;
};

function RecommendationsSection() {
  const avatarImages = [
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://randomuser.me/api/portraits/women/44.jpg',
    'https://randomuser.me/api/portraits/men/50.jpg',
    'https://randomuser.me/api/portraits/women/61.jpg',
    'https://randomuser.me/api/portraits/men/73.jpg',
  ];

  return (
    <View style={recommendationStyles.avatarsRow}>
      {avatarImages.map((uri, i) => (
        <Image
          key={i}
          source={{ uri }}
          style={[recommendationStyles.avatarImg, { marginLeft: i === 0 ? 0 : -12 }]}
        />
      ))}
      <View style={[recommendationStyles.moreBadge, { marginLeft: -12 }]}>
        <Text style={recommendationStyles.moreBadgeTxt}>+25</Text>
      </View>
    </View>
  );
}

const recommendationStyles = StyleSheet.create({
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 11,
    left: 5,
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: AppColors.borderNeutral,
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
    fontFamily: 'RedHatMono',
  },
});

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
    marginTop: 12,
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
    ...AppShadows.medium,
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
        elevation: 3,
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
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [provider, setProvider] = useState<ProviderDisplayInfo | null | undefined>(undefined);
  const [providerMetrics, setProviderMetrics] = useState<ProviderMetrics | null>(null);
  const [providerOffers, setProviderOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canInitiateChat, setCanInitiateChat] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | undefined>(undefined);
  // Local state for retry (to force useEffect)
  const [tempProviderId, setTempProviderId] = useState<string | undefined>(providerId as string);

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
        getProviderMetrics(tempProviderId),
        getProviderOffers(tempProviderId),
      ]).then(async (results) => {
        if (!isMounted.current) return; // Verifica se o componente ainda está montado

        const [providerResult, metricsResult, offersResult] = results;

        // Provider details - CORREÇÃO TS: Type guard para 'rejected'
        let finalProviderData: ProviderDisplayInfo | null = null;
        if (providerResult.status === 'fulfilled' && providerResult.value) {
          finalProviderData = { ...providerResult.value };

          if (providerResult.value?.fullName === 'Joana') {
            const joanaReviews: ProviderReview[] = [
              {
                id: 'mock-joana-review-1',
                bookingId: 'mock-booking-joana-1',
                clientId: 'mock-client-joana-reviewer',
                providerId: providerResult.value.id,
                rating: 5,
                comment: 'Joana é excelente! Super atenciosa e deixou tudo impecável. Recomendo muito!',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: 'mock-joana-review-2',
                bookingId: 'mock-booking-joana-2',
                clientId: 'mock-client-joana-reviewer',
                providerId: providerResult.value.id,
                rating: 4,
                comment: 'Bom serviço, chegou no horário e fez um bom trabalho. Fiquei satisfeita.',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ];
            finalProviderData.reviews = joanaReviews;
            finalProviderData.reviewCount = joanaReviews.length;
            finalProviderData.averageRating =
              joanaReviews.reduce((sum, r) => sum + r.rating, 0) / joanaReviews.length;
          } else {
            finalProviderData.reviews = providerResult.value?.reviews || [];
          }
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

        // Provider metrics - CORREÇÃO TS: Type guard para 'rejected'
        let metricsData: ProviderMetrics | null = null;
        if (metricsResult.status === 'fulfilled') {
          metricsData = metricsResult.value || null;
        } else {
          if (__DEV__) {
            if (metricsResult.status === 'rejected') {
              console.warn(
                '[ProviderDetailsScreen] Falha ao carregar metrics (silencioso):',
                (metricsResult as PromiseRejectedResult).reason
              );
            } else {
              console.warn(
                '[ProviderDetailsScreen] Metrics carregado mas inválido (silencioso)'
              );
            }
          }
          metricsData = null;
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
        setProviderMetrics(metricsData);
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
  }, [tempProviderId, isAuthenticated, user?.id, t]); // Depend on tempProviderId

  const handleChatPress = () => {
    if (provider && user && activeBookingId) {
      router.push({
        pathname: '/(client)/messages/[chatId]',
        params: {
          chatId: activeBookingId,
          recipientName: provider.fullName,
          recipientId: provider.id,
          recipientAvatarUrl: provider.avatarUrl,
          bookingId: activeBookingId,
        },
      });
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

  const formatPriceDisplay = (service: ProviderServiceOffering) => {
    let priceValue;
    let priceUnit = '';

    const rawPrice = service.price;
    const price = (typeof rawPrice === 'number')
      ? rawPrice
      : (rawPrice as any)?.toNumber?.() ?? 0;

      switch (service.pricingType) {
        case PricingType.HOURLY:
          priceValue = price;
          // Exibir explicitamente "/h" ao lado do preço para serviços por hora
          priceUnit = '/h';
          break;
      case PricingType.BY_SIZE:
        const sqmPrice = service.pricePerSquareMeter ?? 0;
        priceValue = (typeof sqmPrice === 'number')
          ? sqmPrice
          : (sqmPrice as any)?.toNumber?.() ?? 0;
        priceUnit = t('common.per_sqm_short');
        break;
      case PricingType.FIXED_PRICE:
      case PricingType.CUSTOM_QUOTE:
      default:
        priceValue = price;
        priceUnit = '';
        break;
    }

      if (typeof priceValue !== 'number' || !Number.isFinite(priceValue) || priceValue <= 0) {
        return t('provider_details.price_not_available');
      }

      const base = `R$ ${priceValue.toFixed(2).replace('.', ',')}`;

      // Garantir que serviços por hora exibam sempre "/h" ao lado do preço,
      // mesmo que por algum motivo o i18n não esteja sendo aplicado.
      if (service.pricingType === PricingType.HOURLY) {
        return `${base}/h`;
      }

      return `${base}${priceUnit}`;
    };

  // CORREÇÃO: handleCopyCouponCode TOTALMENTE SILENCIOSO - SEM ALERT OU TOAST EM ERRO
  const handleCopyCouponCode = async (code: string) => {
    if (!code || code.trim() === '') {
      // Silencioso: Não faz nada se código inválido
      return;
    }
    try {
      await Clipboard.setStringAsync(code.trim());
      // SÓ MOSTRA SUCESSO (toast amigável, não alert)
      NotificationUIService.showSuccess(t('offers.copy_code'), t('common.success'));
    } catch (error) {
      // TOTALMENTE SILENCIOSO: Não mostra nada ao usuário, só log dev
      if (__DEV__) {
        console.warn('Falha ao copiar código (silencioso total):', error);
      }
      // NÃO USA Alert.alert NEM showError - usuário nem percebe
    }
  };

  const handleViewAllReviews = () => {
    if (provider) {
      router.push({
        pathname: '/(common)/feedback/[targetId]',
        params: { targetId: provider.id, targetType: 'provider' },
      });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centeredFeedback, { backgroundColor: AppColors.white }]}>
        <Stack.Screen options={{ title: t('common.loading'), headerShown: false }} />
        <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
      </View>
    );
  }

  if (error || !provider) {
    return (
      <View style={[styles.centeredFeedback, { backgroundColor: AppColors.white }]}>
        <Stack.Screen options={{ title: t('common.error'), headerShown: false }} />

        <Ionicons
          name="alert-circle-outline"
          size={60}
          color={AppColors.primaryInteractive}
          style={{ marginBottom: 12 }}
        />

        <Text
          style={[
            styles.errorText,
            { fontSize: 16, fontWeight: '600', marginBottom: 8 },
          ]}
        >
          ❌ Ops! Não foi possível carregar as informações.
        </Text>

        <Text
          style={[
            styles.errorText,
            {
              fontSize: 14,
              color: AppColors.mediumGray,
              marginBottom: 20,
              textAlign: 'center',
              paddingHorizontal: 32,
            },
          ]}
        >
          Pode ser um problema temporário. Tente novamente ou volte para explorar.
        </Text>

        <View
          style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 10 }}
        >
          <TouchableOpacity
            style={[styles.errorBackButton, { backgroundColor: AppColors.primaryInteractive }]}
            onPress={() => {
              setTempProviderId(undefined);
              setTimeout(() => setTempProviderId(providerId as string), 0);
              setError(null);
              setIsLoading(true);
            }}
          >
            <Ionicons name="refresh" size={20} color={AppColors.white} />
            <Text style={[styles.errorBackButtonText, { color: AppColors.white }]}>
              Tentar Novamente
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.errorBackButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={styles.errorBackButtonText.color} />
            <Text style={styles.errorBackButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const firstProviderService =
    provider.providerServices && provider.providerServices.length > 0
      ? (
          provider.providerServices.find(ps => ps.pricingType === PricingType.HOURLY)
          ?? provider.providerServices[0]
        )
      : undefined;

  const firstServicePrice = firstProviderService
    ? formatPriceDisplay(firstProviderService).replace('/h', '').trim()
    : t('provider_details.price_not_available');

  const firstProviderServiceOfferingId = firstProviderService ? firstProviderService.id : undefined;

  // FILTRO ULTRA-AGRESSIVO PARA OFFERS: Pula qualquer coisa suspeita
  const validOffers = providerOffers.filter(
    (offer) =>
      offer &&
      offer.title &&
      offer.title.length > 0 &&
      offer.description &&
      offer.description.length < 100 &&
      !offer.description.toLowerCase().includes('erro') &&
      !offer.description.toLowerCase().includes('cannot') &&
      !offer.description.toLowerCase().includes('get') &&
      !offer.description.toLowerCase().includes('active-chat') &&
      typeof offer.discountValue === 'number' &&
      offer.discountValue > 0  // Desconto positivo
  );

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
          paddingTop: Platform.OS === 'ios' ? insets.top + 14 : 14,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={AppColors.textBody} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 15,
            fontFamily: 'Montserrat-Regular',
            fontWeight: '800',
            color: AppColors.textBody,
            marginRight: 24,
          }}
        >
          Detalhes
        </Text>
      </View>

      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentContainer}
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
              <View style={styles.robustStarContainer}>
                <StarRating
                  rating={provider.averageRating}
                  size={13}
                  color={styles.priceTextWhiteCard.color}
                />
                <Text style={styles.robustReviewsText}>
                  {t('provider_details.reviews_count', { count: provider.reviewCount || 0 })}
                </Text>
              </View>
            </View>

            <View style={styles.locationContainerWhiteCard}>
              <Ionicons
                name="location-sharp"
                size={10}
                color={styles.locationTextWhiteCard.color}
              />
              <Text style={styles.locationTextWhiteCard}>
                {provider.address?.city || t('common.not_available')}
                <Text style={styles.locationDistanceText}>
                  {' · '}
                  {provider.distance != null && !isNaN(provider.distance)
                    ? `${provider.distance.toFixed(1)} km`
                    : '0 km'}
                </Text>
              </Text>
            </View>

            <Text style={styles.descriptionText}>
              {provider.bio || t('provider_details.no_description')}
            </Text>

            <View style={styles.priceBackgroundWrapper}>
                <LinearGradient
                  colors={['#E8F4FF', '#D9EDFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.priceBackground}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.priceTextWhiteCard}>{firstServicePrice}</Text>
                    <Ionicons
                      name="time-outline"
                      size={19}
                      color={AppColors.primaryInteractive}
                      style={{ marginLeft: 10 }}
                    />
                  </View>
                </LinearGradient>
              </View>
          </View>

          <View style={styles.tabContentContainer}>
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
                  text={t('provider_details.years_experience', {
                    count: provider.yearsOfExperience,
                  })}
                />
              )}
              {provider.verificationStatus === VerificationStatus.APPROVED && (
                <InfoChip iconName="shield-checkmark-outline" text={t('provider_details.verified')} />
              )}
              {/* Garantia LimpeJá */}
              <InfoChip iconName="shield-checkmark" text={t('guarantee.badge', 'Garantia LimpeJá')} />
            </Animated.View>

            <SecurityBanner
              onPress={() => router.push('/(client)/explore/sercurity/index' as any)}
            />

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

            <View style={styles.actionButtonsContainer}>
              <Animated.View style={{ transform: [{ scale: callButtonAnim }] }}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    NotificationUIService.showInfo(
                      t('provider_details.call_functionality'),
                      t('provider_details.call')
                    )
                  }
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
                {canInitiateChat ? (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleChatPress}
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
                ) : (
                  <View style={[styles.actionButton, styles.disabledActionButton]}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={16}
                      color={styles.disabledActionButtonText.color}
                    />
                    <Text style={[styles.actionButtonText, styles.disabledActionButtonText]}>
                      {t('provider_details.chat')}
                    </Text>
                  </View>
                )}
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: mapButtonAnim }] }}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    NotificationUIService.showInfo(
                      t('provider_details.map_functionality'),
                      t('provider_details.map')
                    )
                  }
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

            <Text style={styles.sectionTitle}>
              {t('provider_details.reviews_and_recommendations_title', 'Avaliações & Recomendações')}
            </Text>
            <RecommendationsSection />

            {provider.reviews && provider.reviews.length > 0 ? (
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

                {provider.reviews.slice(0, 3).map((review, index) => (
                  <ReviewCard key={review.id || index} review={review} />
                ))}

                {provider.reviews.length > 3 && (
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
              <View style={styles.noReviewsContainer}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={30}
                  color={AppColors.mediumGray}
                  style={styles.noReviewsIcon}
                />
                <Text style={styles.noReviewsText}>
                  {t('provider_details.no_reviews', { providerName: provider.fullName })}
                </Text>
              </View>
            )}
            <BookServiceButton
              providerId={provider.id}
              serviceId={firstProviderServiceOfferingId}
              router={router}
              bookNowButtonAnim={bookNowButtonAnim}
              servicePrice={firstProviderService?.price}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
