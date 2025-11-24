// LimpeJaApp/app/(client)/bookings/index.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Link, Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Text,
  TouchableOpacity,
  View,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios, { AxiosError } from 'axios';

import { formatPriceBRL, formatDateTime, sanitizeText } from '../../../utils/formatters';
import { formatAddressCompact } from '../../../utils/address';
import { normalizeBooking } from '../../../utils/normalize';

import { useAuth } from '../../../hooks/useAuth';
import { getBookingsForUser } from '../../../services/bookingService';
import { getProviderAvatar } from '../../../services/providerService';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
import { AppColors, AppShadows } from '../../../constants/appStyles';
import Colors from '../../../constants/Colors';

import Navbar from '../../../components/client/explore/home/NavBar';
import ScreenContainer from '@/components/layout/ScreenContainer';
import { useDevice } from '@/utils/responsive';
import { fix } from '../../utils/platformFix';

// Local light theme tokens for this screen only (UI refactor only)
const UI = {
  bg: '#f2f2f2',
  card: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  divider: '#E5E7EB',
  accent: '#2563EB',
  success: '#16A34A',
  danger: '#EF4444',
  warning: '#F59E0B',
} as const;

// Tipos e helpers
const { highlightNew } = useLocalSearchParams<{ highlightNew?: string }>();
type FilterType = 'requests' | 'upcoming' | 'completed' | 'cancelled';

const isAxiosError = (error: unknown): error is AxiosError => axios.isAxiosError(error);

const TOP_HAIRLINE = Platform.OS === 'android' ? 1 : StyleSheet.hairlineWidth;
const BOTTOM_HAIRLINE = Platform.OS === 'android' ? 1 : StyleSheet.hairlineWidth;

const getTranslatedStatus = (status: BookingStatus): string => {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return 'Confirmado';
    case BookingStatus.PENDING:
      return 'Pendente';
    case BookingStatus.PENDING_PROVIDER_CONFIRMATION:
      return 'Aguardando confirmação';
    case BookingStatus.IN_PROGRESS:
      return 'Em andamento';
    case BookingStatus.COMPLETED:
      return 'Concluído';
    case BookingStatus.CANCELLED:
      return 'Cancelado';
    case BookingStatus.REJECTED:
      return 'Rejeitado';
    case BookingStatus.RESCHEDULED:
      return 'Reagendado';
    case BookingStatus.NO_SHOW:
      return 'Não compareceu';
    default:
      return 'Desconhecido';
  }
};

// Solid backgrounds for a clean status pill (no gradient look)
const gradients = {
  confirmed: ['rgba(22,163,74,0.12)', 'rgba(22,163,74,0.12)'] as const,
  pending: ['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.15)'] as const,
  inProgress: ['rgba(37,99,235,0.12)', 'rgba(37,99,235,0.12)'] as const,
  completed: ['#F3F4F6', '#F3F4F6'] as const,
  cancelled: ['rgba(239,68,68,0.12)', 'rgba(239,68,68,0.12)'] as const,
  other: ['#F3F4F6', '#F3F4F6'] as const,
  rescheduled: ['rgba(124,58,237,0.12)', 'rgba(124,58,237,0.12)'] as const,
} as const;

const renderProviderAvatar = (avatarUrl?: string | null, size: number = 60) => {
  const [imageError, setImageError] = useState(false);

  if (!avatarUrl || avatarUrl === '' || imageError) {
    return (
      <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
        <Ionicons name="person-circle-outline" size={Math.round(size * 0.8)} color={AppColors.mediumGray} style={styles.iconAdjust} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: avatarUrl }}
      style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
      contentFit="cover"
      cachePolicy="memory-disk"
      placeholder={null}
      transition={400}
      onError={(e: any) => {
        setImageError(true);
        if (__DEV__) console.log('Erro carregando avatar real (bookings):', e.error || e);
      }}
      onLoad={() => {
        if (__DEV__) console.log('Avatar real carregado com sucesso!');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    />
  );
};

const AnimatedBookingItem: React.FC<{ item: BookingDetails; index: number }> = ({ item, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pressScaleAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const { isLargePhone } = useDevice();

  const rCard: StyleProp<ViewStyle> = React.useMemo<StyleProp<ViewStyle>>(
    () =>
      isLargePhone
        ? ({ alignSelf: 'center', width: '100%', maxWidth: 820 } as ViewStyle)
        : undefined,
    [isLargePhone]
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 420, delay: index * 40, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 420, delay: index * 40, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: 1, duration: 3500 + (index % 3) * 100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0, duration: 3500 + (index % 3) * 100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        { iterations: -1 }
      );
      loop.start();
      return () => loop.stop();
    });
  }, [fadeAnim, slideAnim, floatAnim, index]);

  const onPressInHandler = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(pressScaleAnim, { toValue: 0.985, useNativeDriver: true, friction: 6, tension: 90 }).start();
  }, [pressScaleAnim]);

  const onPressOutHandler = useCallback(() => {
    Animated.spring(pressScaleAnim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 90 }).start();
  }, [pressScaleAnim]);

  const getStatusStyle = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return { text: UI.success, gradient: gradients.confirmed, icon: 'checkmark-circle-outline' as const, badgeIcon: 'checkmark-circle' as const };
      case BookingStatus.PENDING:
        return { text: UI.warning, gradient: gradients.pending, icon: 'time-outline' as const, badgeIcon: 'time' as const };
      case BookingStatus.PENDING_PROVIDER_CONFIRMATION:
        return { text: UI.warning, gradient: gradients.pending, icon: 'hourglass-outline' as const, badgeIcon: 'hourglass' as const };
      case BookingStatus.IN_PROGRESS:
        return { text: UI.accent, gradient: gradients.inProgress, icon: 'sync-circle-outline' as const, badgeIcon: 'sync' as const };
      case BookingStatus.COMPLETED:
        return { text: UI.textSecondary, gradient: gradients.completed, icon: 'flag-outline' as const, badgeIcon: 'flag' as const };
      case BookingStatus.CANCELLED:
        return { text: UI.danger, gradient: gradients.cancelled, icon: 'close-circle-outline' as const, badgeIcon: 'close-circle' as const };
      case BookingStatus.REJECTED:
        return { text: UI.textSecondary, gradient: gradients.other, icon: 'alert-circle-outline' as const, badgeIcon: 'alert-circle' as const };
      case BookingStatus.RESCHEDULED:
        return { text: '#7C3AED', gradient: gradients.rescheduled, icon: 'sync-outline' as const, badgeIcon: 'sync' as const };
      case BookingStatus.NO_SHOW:
        return { text: UI.textSecondary, gradient: gradients.other, icon: 'person-remove-outline' as const, badgeIcon: 'person-remove' as const };
      default:
        return { text: UI.textSecondary, gradient: gradients.other, icon: 'help-circle-outline' as const, badgeIcon: 'help-circle' as const };
    }
  };

  const statusInfo = getStatusStyle(item.status);

  const formattedAddress = item.address
    ? sanitizeText(
        `${item.address.street}, ${item.address.number}` +
          `${item.address.complement ? ` - ${item.address.complement}` : ''}` +
          `, ${item.address.neighborhood}, ${item.address.city} - ${item.address.state}`
      )
    : 'Endereço não disponível';

  return (
    <Animated.View
      style={[
        styles.itemCard,
        fix.blurBg,
        rCard,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
            { scale: pressScaleAnim },
          ],
        },
      ]}
    >
      <BlurView intensity={Platform.OS === 'ios' ? 18 : 36} tint="light" style={StyleSheet.absoluteFillObject} />
      <LinearGradient colors={['#FFFFFF', '#F6FBFF'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />

      {item.id ? (
        <Link href={`/(client)/bookings/${item.id}`} asChild>
          <TouchableOpacity style={styles.itemCardContent} onPressIn={onPressInHandler} onPressOut={onPressOutHandler} activeOpacity={0.95}>
            {/* Botão + adicionado DENTRO do card, no topo direito, ANTES do badge CONFIRMADO */}
            <TouchableOpacity onPress={() => console.log('add action')} style={styles.addButton}>
              <Ionicons name="add" size={22} color="#FFFFFF" style={styles.iconAdjust} />
            </TouchableOpacity>

            <View style={styles.avatarContainer}>{renderProviderAvatar(item.providerAvatarUrl)}</View>

            <View style={styles.itemDetails}>
              <Text style={styles.itemServiceName} numberOfLines={1}>
                {sanitizeText(item.serviceName)}
              </Text>
              <Text style={styles.itemProviderName} numberOfLines={1}>
                {`Com ${sanitizeText(item.providerFullName)}`}
              </Text>

              <View style={styles.itemMetaRow}>
              <Ionicons name="calendar-outline" size={13} color={AppColors.textAuxiliary} style={[styles.metaIcon, styles.iconAdjust]} />
                <Text style={styles.itemDate} numberOfLines={1}>
                  {formatDateTime(item.scheduledDate, item.scheduledTime, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              {item.address && (
                <View style={styles.itemAddressContainer}>
                  <Ionicons name="location-outline" size={13} color={AppColors.textAuxiliary} style={[styles.metaIcon, styles.iconAdjust]} />
                  <Text style={styles.itemAddressText} numberOfLines={2}>
                    {(() => { const f = formatAddressCompact(item.address); return [f.line1, f.line2].filter(Boolean).join(', '); })()}
                  </Text>
                </View>
              )}

              <View style={styles.itemPriceContainer}>
                <MaterialCommunityIcons name="currency-usd" size={14} color={UI.accent} style={styles.iconAdjust} />
                <Text style={styles.itemPriceText}>{formatPriceBRL(item.totalPrice)}</Text>
              </View>
            </View>

            <LinearGradient colors={statusInfo.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.statusBadge, styles.statusBadgeAbsolute]}>
              <Ionicons name={statusInfo.badgeIcon} size={12} color={statusInfo.text} style={styles.statusBadgeIcon} />
              <Text style={[styles.statusText, { color: statusInfo.text }]} numberOfLines={1}>
                {getTranslatedStatus(item.status)}
              </Text>
            </LinearGradient>

          </TouchableOpacity>
        </Link>
      ) : (
        <TouchableOpacity style={styles.itemCardContent} onPress={() => router.replace('/(client)/bookings' as any)} onPressIn={onPressInHandler} onPressOut={onPressOutHandler} activeOpacity={0.95}>
          <View style={styles.avatarContainer}>{renderProviderAvatar(undefined)}</View>
          <View style={styles.itemDetails}>
            <Text style={styles.itemServiceName} numberOfLines={1}>
              Reserva indisponível
            </Text>
            <Text style={styles.itemProviderName} numberOfLines={1}>
              Toque para atualizar
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default function MyBookingsScreen() {
  // Theme aligned with Cashback/Missions
  const scheme = (Colors as any)?.scheme || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  const router = useRouter();
  const { highlightNew } = useLocalSearchParams<{ highlightNew?: string }>();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>((highlightNew ? 'requests' : 'upcoming') as FilterType);
  const [headerTitle, setHeaderTitle] = useState('Meus Agendamentos');
  const insets = useSafeAreaInsets();
  const { isSmallPhone, isLargePhone } = useDevice();

  const rFilterBtn: StyleProp<ViewStyle> = React.useMemo(() => (isSmallPhone ? { minHeight: 44, paddingVertical: 12 } : undefined), [isSmallPhone]);
  const navWrap: StyleProp<ViewStyle> = React.useMemo(() => (isLargePhone ? { alignSelf: 'center', width: '100%', maxWidth: 820 } : undefined), [isLargePhone]);

  const navbarFadeAnim = useRef(new Animated.Value(0)).current;
  const navbarSlideAnim = useRef(new Animated.Value(80)).current;
  const navbarGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(navbarFadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.spring(navbarSlideAnim, { toValue: 0, useNativeDriver: true, friction: 8, tension: 100 }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(navbarGlowAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(navbarGlowAnim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ]),
        { iterations: -1 }
      ),
    ]).start();
    return () => navbarGlowAnim.stopAnimation();
  }, []);

  const filters: Array<{ label: string; value: FilterType; icon: keyof typeof Ionicons.glyphMap }> = [
    { label: 'Solicitações', value: 'requests', icon: 'hourglass-outline' },
    { label: 'Próximos', value: 'upcoming', icon: 'calendar-outline' },
    { label: 'Histórico', value: 'completed', icon: 'checkmark-done-outline' },
    { label: 'Cancelados', value: 'cancelled', icon: 'close-circle-outline' },
  ];

  const filterButtonAnims = useRef(filters.map(() => new Animated.Value(1))).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  const onPressInFilterButton = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(filterButtonAnims[index], { toValue: 0.95, useNativeDriver: true, friction: 4, tension: 90 }).start();
  }, []);

  const onPressOutFilterButton = useCallback(() => {
    filterButtonAnims.forEach((anim) => {
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 4, tension: 90 }).start();
    });
  }, []);

  const loadBookings = useCallback(
    async (currentFilter: FilterType, refreshing: boolean = false) => {
      if (!refreshing) {
        setIsLoading(true);
        setHeaderTitle('Carregando agendamentos...');
      }
      setBookings([]);
      Animated.timing(contentAnim, { toValue: 0, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }).start(async () => {
        if (!user?.id) {
          console.warn('[MyBookingsScreen] Usuário ausente; abortando fetch.');
          setIsLoading(false);
          setHeaderTitle('Meus Agendamentos');
          setIsRefreshing(false);
          return;
        }

        try {
          let rawBookings: any[] = [];

          const getAndNormalizeWithAvatar = async (status: BookingStatus) => {
            const bookings = await getBookingsForUser(status);
            let normalized = bookings.map(normalizeBooking);

            const avatarPromises = normalized.map(async (b) => {
              if (b.providerAvatarUrl) return b;
              try {
                const avatar = await getProviderAvatar(b.providerId);
                return { ...b, providerAvatarUrl: avatar?.url || null };
              } catch (err) {
                if (__DEV__) console.warn('Erro fetch avatar:', err);
                return b;
              }
            });

            const withAvatars = await Promise.all(avatarPromises);
            return withAvatars;
          };

          if (currentFilter === 'requests') {
            const pendingProvider = await getAndNormalizeWithAvatar(BookingStatus.PENDING_PROVIDER_CONFIRMATION);
            const pendingClient = await getAndNormalizeWithAvatar(BookingStatus.PENDING);
            rawBookings = [...pendingProvider, ...pendingClient];
          } else if (currentFilter === 'upcoming') {
            const confirmed = await getAndNormalizeWithAvatar(BookingStatus.CONFIRMED);
            const inProgress = await getAndNormalizeWithAvatar(BookingStatus.IN_PROGRESS);
            rawBookings = [...confirmed, ...inProgress];
          } else if (currentFilter === 'completed') {
            rawBookings = await getAndNormalizeWithAvatar(BookingStatus.COMPLETED);
          } else if (currentFilter === 'cancelled') {
            const canceled = await getAndNormalizeWithAvatar(BookingStatus.CANCELLED);
            const rejected = await getAndNormalizeWithAvatar(BookingStatus.REJECTED);
            rawBookings = [...canceled, ...rejected];
          }

          const now = new Date();
          const filteredAndSortedBookings = rawBookings
            .filter((b) => {
              const bookingDateTime = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
              if (currentFilter === 'requests' || currentFilter === 'upcoming') return bookingDateTime >= now;
              if (currentFilter === 'completed') return bookingDateTime < now;
              return true;
            })
            .sort((a, b) => {
              const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`).getTime();
              const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`).getTime();
              return dateA - dateB;
            });

          if (__DEV__) {
            filteredAndSortedBookings.forEach((b) => console.log('Bookings carregados - Avatar URL:', b.providerAvatarUrl));
          }

          setBookings(filteredAndSortedBookings);
          setHeaderTitle('Meus Agendamentos');
          if (refreshing) Alert.alert('Sucesso', 'Agendamentos atualizados!');
        } catch (err: unknown) {
          console.error('Erro ao buscar agendamentos:', err);
          let errorMessage = 'Não foi possível carregar seus agendamentos.';
          if (isAxiosError(err) && err.response) {
            errorMessage = (err.response.data as any)?.message || (err as any).message || errorMessage;
          } else if (err instanceof Error) {
            errorMessage = err.message || errorMessage;
          }
          Alert.alert('Erro', sanitizeText(errorMessage));
          setHeaderTitle('Erro ao carregar');
        } finally {
          setIsLoading(false);
          setIsRefreshing(false);
          Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
        }
      });
    },
    [user?.id]
  );

  useEffect(() => {
    loadBookings(activeFilter);
  }, [activeFilter, loadBookings]);

  // Se a tela foi aberta com highlightNew (ex.: pós pagamento), garanta que o filtro mostre solicitações
  useEffect(() => {
    if (highlightNew === 'true') {
      setActiveFilter('requests');
    }
  }, [highlightNew]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadBookings(activeFilter, true);
  }, [activeFilter, loadBookings]);

  const handleFilterChange = (newFilter: FilterType) => {
    if (newFilter === activeFilter) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveFilter(newFilter);
  };

  const EmptyListFeedback = () => {
    const iconAnim = useRef(new Animated.Value(0)).current;
    const textAnim = useRef(new Animated.Value(0)).current;
    const subTextAnim = useRef(new Animated.Value(0)).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.stagger(140, [
        Animated.timing(iconAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(textAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(subTextAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(buttonAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    }, []);

    let title = 'Nenhum agendamento encontrado.';
    let subText = 'Ajuste o filtro ou verifique novamente mais tarde.';
    let ctaButton = null;
    let iconName: keyof typeof Ionicons.glyphMap = 'help-circle-outline';

    if (activeFilter === 'requests') {
      title = 'Nenhuma solicitação pendente.';
      subText = 'Você ainda não possui pedidos aguardando confirmação.';
      iconName = 'hourglass-outline';
      ctaButton = (
        <Animated.View style={{ opacity: buttonAnim, transform: [{ scale: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }}>
          <TouchableOpacity style={styles.emptyStateButton} onPress={() => router.push('/(client)/explore/todas-categorias' as any)}>
            <Ionicons name="search-outline" size={18} color={AppColors.white} style={styles.iconAdjust} />
            <Text style={styles.emptyStateButtonText}>Explorar categorias</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    } else if (activeFilter === 'upcoming') {
      title = 'Você não possui serviços futuros agendados.';
      subText = 'Explore e agende novos serviços para vê-los aqui.';
      iconName = 'calendar-outline';
      ctaButton = (
        <Animated.View style={{ opacity: buttonAnim, transform: [{ scale: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }}>
          <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(client)/explore' as any)}>
            <Text style={styles.exploreButtonText}>Explorar serviços</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    } else if (activeFilter === 'completed') {
      title = 'Seu histórico está vazio.';
      subText = 'Conclua serviços para vê-los aqui.';
      iconName = 'archive-outline';
    } else if (activeFilter === 'cancelled') {
      title = 'Nenhum serviço cancelado.';
      subText = 'Serviços cancelados aparecerão aqui.';
      iconName = 'close-circle-outline';
    }

    return (
      <View style={styles.centeredFeedback}>
        <Animated.View style={{ opacity: iconAnim, transform: [{ scale: iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
          <Ionicons name={iconName} size={68} color={AppColors.backgroundNeutral} />
        </Animated.View>

        <Animated.Text style={[styles.emptyText, { opacity: textAnim, transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]} numberOfLines={2}>
          {title}
        </Animated.Text>

        <Animated.Text style={[styles.emptySubText, { opacity: subTextAnim, transform: [{ translateY: subTextAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]} numberOfLines={3}>
          {subText}
        </Animated.Text>

        {ctaButton}
      </View>
    );
  };

  return (
    <ScreenContainer style={[styles.container, { backgroundColor: theme.background, paddingTop: 0, paddingBottom: 92 }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header temático (alinha com ScheduleHeader: vidro leve + cantos arredondados) */}
      <Animated.View style={{ opacity: navbarFadeAnim, transform: [{ translateY: navbarSlideAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }}>
        <View style={[styles.thematicHeader, fix.blurBg, { paddingTop: fix.padTop(0, 14) }]}>
          <BlurView intensity={Platform.OS === 'ios' ? 10 : 20} tint="light" style={StyleSheet.absoluteFillObject} />
          <LinearGradient colors={[ theme.cardBackground as any, theme.cardBackground as any ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn} accessibilityRole="button" accessibilityLabel="Voltar">
              <Ionicons name="arrow-back" size={22} color={(theme as any).text} style={styles.iconAdjust} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: (theme as any).text, fontSize: fix.font(17) }]}>{headerTitle}</Text>
            <View style={styles.headerIconBtn} />
          </View>
        </View>
      </Animated.View>

      {/* filtros: apenas botões de opções, sem o cabeçalho "Filtrar" */}

      <View
        style={[
          styles.filterContainer,
          {
            marginTop: 8,
            backgroundColor: (theme as any).cardBackground,
            borderTopColor: (theme as any).borderSubtle || '#EEF3FA',
            borderBottomColor: (theme as any).borderSubtle || '#E9F0FA',
          },
        ]}
      >
        {filters.map((filterItem, index) => (
          <Animated.View
            key={filterItem.value}
            style={{ transform: [{ scale: filterButtonAnims[index] }] }}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                rFilterBtn,
                activeFilter === filterItem.value && [
                  styles.filterButtonActive,
                  { backgroundColor: (theme as any).primary, borderColor: (theme as any).primary },
                ],
              ]}
              onPress={() => handleFilterChange(filterItem.value)}
              onPressIn={() => onPressInFilterButton(index)}
              onPressOut={onPressOutFilterButton}
              accessibilityRole="button"
              accessibilityLabel={`Filtrar por ${filterItem.label}`}
            >
              <Ionicons
                name={filterItem.icon}
                size={13}
                color={activeFilter === filterItem.value ? '#FFFFFF' : AppColors.textBody}
                style={styles.filterIcon}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === filterItem.value && styles.filterButtonTextActive,
                ]}
                numberOfLines={1}
              >
                {filterItem.label}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {isLoading && bookings.length === 0 ? (
        <View style={styles.centeredFeedback}>
          <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
          <Text style={styles.loadingText}>Carregando agendamentos...</Text>
        </View>
      ) : bookings.length > 0 ? (
        <Animated.FlatList
          data={bookings}
          renderItem={({ item, index }) => <AnimatedBookingItem item={item} index={index} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContentContainer, { paddingBottom: 140 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={AppColors.primaryInteractive} title="Atualizando..." titleColor={AppColors.primaryInteractive} />}
          style={{ opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}
        />
      ) : (
        <EmptyListFeedback />
      )}

      <Animated.View style={[styles.navbarContainer, fix.blurBg, navWrap, { opacity: navbarFadeAnim, transform: [{ translateY: navbarSlideAnim }] }]}>
        <BlurView intensity={Platform.OS === 'ios' ? 10 : 20} tint="light" style={StyleSheet.absoluteFillObject} />
        <LinearGradient colors={['rgba(255,255,255,0.96)', 'rgba(255,255,255,0.86)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFillObject} />
        <Animated.View style={[StyleSheet.absoluteFillObject, { shadowColor: AppColors.primaryInteractive + '30', shadowOffset: { width: 0, height: 0 }, shadowOpacity: navbarGlowAnim, shadowRadius: 18, elevation: navbarGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) }]} />
        <Navbar />
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.bg },
  // Header temático (vidro leve + bordas arredondadas) alinhado ao ScheduleHeader
  thematicHeader: {
    marginHorizontal: 12,
    marginTop: 28,
    marginBottom: 6,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1.5 },
    }),
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 10, marginTop: 28},
  headerIconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: UI.textPrimary, left: 4, },
  navbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 94,
    zIndex: 1000,
    elevation: Platform.OS === 'android' ? 1.5 : 20,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.18, shadowRadius: 12 },
      android: { elevation: 1.5 },
    }),
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
    backgroundColor: AppColors.white,
    borderBottomColor: '#F1F6FB',
    borderBottomWidth: 1,
  },
  filterHelp: { padding: 6 },
  filterHeaderTitle: { fontSize: fix.font(18), fontWeight: '700', color: AppColors.textBody, fontFamily: 'Montserrat-SemiBold' },
  filterHeaderSub: { fontSize: 15, color: AppColors.textAuxiliary, marginTop: 2, marginBottom: 10, fontFamily: 'Montserrat-Regular' },

  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'android' ? 12 : 10,
    bottom: 10,
    paddingHorizontal: 5,
    backgroundColor: AppColors.white,
    borderTopWidth: TOP_HAIRLINE,
    borderTopColor: '#EEF3FA',
    borderBottomWidth: BOTTOM_HAIRLINE,
    borderBottomColor: '#E9F0FA',
    marginBottom: 2,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'android' ? 12 : 10,
    paddingHorizontal: 12,
    borderRadius: 28,
    marginHorizontal: 8,
    minHeight: 42,
    marginBottom: 10,
    marginTop: 10,
    backgroundColor: AppColors.backgroundNeutral,
    borderWidth: 1,
    borderColor: AppColors.borderNeutral,
  },
  filterButtonActive: {
    backgroundColor: AppColors.primaryInteractive,
    borderColor: AppColors.primaryInteractive,
    ...Platform.select({
      ios: { shadowColor: AppColors.primaryInteractive + '22', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },
      android: { elevation: 1.5 },
    }),
  },
  filterIcon: { marginRight: 8, transform: [{ translateY: Platform.OS === 'android' ? 1 : 0 }] },
  filterButtonText: { fontSize: 13, fontWeight: '600', color: AppColors.textBody, fontFamily: 'Montserrat-Regular' },
  filterButtonTextActive: { color: AppColors.white, fontWeight: '700', fontFamily: 'Montserrat-SemiBold' },

  listContentContainer: { paddingVertical: 18, paddingHorizontal: 16 },
    itemCard: {
      backgroundColor: UI.card,
      borderRadius: 18,
      marginBottom: 20,
      overflow: 'hidden',
      ...Platform.select({
        ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12 },
        android: { elevation: 1.5 },
      }),
    },
  itemCardContent: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, position: 'relative' },
  avatarContainer: { marginRight: 14, width: 60 },
  avatarImage: { borderWidth: 2, borderColor: AppColors.backgroundNeutral },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.backgroundLight, borderWidth: 2, borderColor: AppColors.backgroundNeutral },

  itemDetails: { flex: 1, justifyContent: 'space-between' },
  itemServiceName: { fontSize: fix.font(17), fontWeight: '700', color: AppColors.textBody, marginBottom: 4, fontFamily: 'Montserrat-SemiBold' },
  itemProviderName: { fontSize: 14, color: AppColors.textAuxiliary, marginBottom: 8, fontFamily: 'Montserrat-Regular' },

  itemMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  metaIcon: { marginRight: 6 },
  itemDate: { fontSize: 13, color: AppColors.textAuxiliary, fontFamily: 'Montserrat-Regular' },

  itemAddressContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  itemAddressText: { fontSize: 13, color: AppColors.textAuxiliary, flex: 1, fontFamily: 'Montserrat-Regular', lineHeight: 18 },

  itemPriceContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  itemPriceText: { fontSize: 16, fontWeight: '700', color: UI.accent, marginLeft: 6, fontFamily: 'Montserrat-SemiBold' },

  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, alignSelf: 'flex-start' },
  statusBadgeAbsolute: { 
    position: 'absolute',
    top: 16,     // Desce mais para alinhamento visual correto
    right: 16,   // Ajustado para right: 16 (melhor espaçamento)
    zIndex: 20,
  },
  statusBadgeIcon: { marginRight: 6, transform: [{ translateY: Platform.OS === 'android' ? 1 : 0 }] },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'Montserrat-SemiBold' },

  // Estilo ajustado para o botão + (fundo azul premium, ícone branco, alinhado com o preço no canto inferior direito)
  addButton: {
    position: 'absolute',
    bottom: 16,          // Posicionado na linha do preço (parte inferior do card)
    right: 16,           // No canto direito (evita colisão com preço à esquerda)
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563EB',   // Fundo azul forte (premium, igual à imagem)
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',       // Sombra azul sutil
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 30,                   // Maior zIndex para ficar na frente
  },

  // REMOVIDO: itemChevron (seta bugada sumiu completamente)

  centeredFeedback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: UI.bg },
  loadingText: { fontSize: 15, color: AppColors.textAuxiliary, fontFamily: 'Montserrat-Regular', marginTop: 12 },

  emptyText: { fontSize: fix.font(20), fontWeight: '700', color: AppColors.textBody, textAlign: 'center', marginBottom: 10, fontFamily: 'Montserrat-SemiBold' },
  emptySubText: { fontSize: 15, color: AppColors.textAuxiliary, textAlign: 'center', marginBottom: 24, fontFamily: 'Montserrat-Regular', lineHeight: 20 },

  emptyStateButton: { backgroundColor: AppColors.primaryInteractive, paddingVertical: Platform.OS === 'android' ? 16 : 14, paddingHorizontal: 26, borderRadius: 28, flexDirection: 'row', alignItems: 'center', marginTop: 8, ...AppShadows.medium },
  emptyStateButtonText: { color: AppColors.white, fontSize: 15, fontWeight: '600', marginLeft: 10, fontFamily: 'Montserrat-Regular' },

  exploreButton: { backgroundColor: '#5196d3ff', paddingVertical: Platform.OS === 'android' ? 16 : 14, paddingHorizontal: 34, borderRadius: 30, marginTop: 10, ...AppShadows.medium },
  exploreButtonText: { color: AppColors.white, fontSize: 16, fontWeight: '700', fontFamily: 'Montserrat-SemiBold' },
  iconAdjust: { transform: [{ translateY: Platform.OS === 'android' ? 1 : 0 }] },
});
