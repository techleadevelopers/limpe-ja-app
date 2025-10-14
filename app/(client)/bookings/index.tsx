// LimpeJaApp/app/(client)/bookings/index.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import * as Haptics from 'expo-haptics';
import { Link, Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image'; // NOVO: Para cache e loading suave em produÃƒÂ§ÃƒÂ£o
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorValue } from 'react-native'; // Para tipagem explÃƒÂ­cita de cores no LinearGradient
import axios, { AxiosError } from 'axios'; // CORRIGIDO: Import AxiosError para type guard (resolve TS2872)

// Importar utilitÃƒÂ¡rios de formataÃƒÂ§ÃƒÂ£o e normalizaÃƒÂ§ÃƒÂ£o
import { formatPriceBRL, formatDateTime, sanitizeText } from '../../../utils/formatters';
import { normalizeBooking } from '../../../utils/normalize';

import { useAuth } from '../../../hooks/useAuth';
import { getBookingsForUser } from '../../../services/bookingService';
import { getProviderAvatar } from '../../../services/providerService'; // NOVO: Assuma que existe (crie se necessÃƒÂ¡rio)
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
import { AppColors, AppShadows } from '../../../constants/appStyles';

// INJEÃƒâ€¡ÃƒÆ’O: Import do Navbar premium animado de explore/home (agora como bottom nav)
import Navbar from '../../../components/client/explore/home/NavBar'; // Caminho ajustado para components/explore/home/navbar

// DEFINE O TIPO DE FILTRO GLOBALMENTE PARA CONSISTÃƒÅ NCIA
type FilterType = 'requests' | 'upcoming' | 'completed' | 'cancelled';

// CORRIGIDO TS2872: Type guard robusto para AxiosError (nÃƒÂ£o mais "sempre verdadeiro")
const isAxiosError = (error: unknown): error is AxiosError => {
  return axios.isAxiosError(error);  // Usa a funÃƒÂ§ÃƒÂ£o built-in, mas com type guard custom para narrowing
};

const TOP_HAIRLINE   = Platform.OS === 'android' ? 1 : StyleSheet.hairlineWidth;
const BOTTOM_HAIRLINE= Platform.OS === 'android' ? 1 : StyleSheet.hairlineWidth;

// Helper para traduzir o status do agendamento
const getTranslatedStatus = (status: BookingStatus): string => {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return 'Confirmado';
    case BookingStatus.PENDING:
      return 'Pendente';
    case BookingStatus.PENDING_PROVIDER_CONFIRMATION:
      return 'Aguardando ConfirmaÃƒÂ§ÃƒÂ£o';
    case BookingStatus.IN_PROGRESS:
      return 'Em Andamento';
    case BookingStatus.COMPLETED:
      return 'ConcluÃƒÂ­do';
    case BookingStatus.CANCELLED:
      return 'Cancelado';
    case BookingStatus.REJECTED:
      return 'Rejeitado';
    case BookingStatus.RESCHEDULED:
      return 'Reagendado';
    case BookingStatus.NO_SHOW:
      return 'NÃƒÂ£o Compareceu';
    default:
      return 'Desconhecido';
  }
};

// FunÃƒÂ§ÃƒÂ£o unificada para renderizar avatar REAL (atualizada para produÃƒÂ§ÃƒÂ£o com expo-image e loading/error)
// CORREÃƒâ€¡ÃƒÆ’O TS2339: onError usa e.error (string), nÃƒÂ£o e.nativeEvent.error
const renderProviderAvatar = (avatarUrl?: string | null, size: number = 60) => {
  const [imageError, setImageError] = useState(false); // Estado local para erro (loading gerenciado por expo-image)

  if (__DEV__) console.log('Avatar URL (bookings list):', avatarUrl);

  if (!avatarUrl || avatarUrl === '' || imageError) {
    return (
      <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
        <Ionicons name="person-circle-outline" size={size * 0.8} color={AppColors.mediumGray} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: avatarUrl }}
      style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
      contentFit="cover"
      cachePolicy="memory-disk" // Cache para produÃƒÂ§ÃƒÂ£o (rÃƒÂ¡pido/offline)
      placeholder={null} // Opcional: blurhash do backend para loading suave
      transition={1000} // Fade in suave
      onError={(e) => {
        // CORREÃƒâ€¡ÃƒÆ’O: Usa e.error (string do ImageErrorEventData), nÃƒÂ£o nativeEvent
        setImageError(true);
        if (__DEV__) console.log('Erro carregando avatar real (bookings):', e.error);
      }}
      onLoad={() => {
        if (__DEV__) console.log('Avatar real carregado com sucesso!');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Feedback tÃƒÂ¡til em prod
      }}
    />
  );
};

// CORREÃƒâ€¡ÃƒÆ’O TS: DefiniÃƒÂ§ÃƒÂ£o de gradients como tuples readonly (as const) para compatibilidade com ColorValue[]
const gradients = {
  confirmed: ['#D4EDDA', '#C3E6CB'] as const,
  pending: ['#FFF3CD', '#FFEAA7'] as const,
  inProgress: ['#D1ECF1', '#B8E1E9'] as const,
  completed: ['#F8F9FA', '#E9ECEF'] as const,
  cancelled: ['#F8D7DA', '#F1B0B7'] as const,
  other: ['#E2E3E5', '#DEE2E6'] as const,
  rescheduled: ['#EAE6F3', '#D7CFF0'] as const, // Adicionado
} as const;

// Componente para um item da lista de agendamentos com animaÃƒÂ§ÃƒÂ£o de entrada e feedback de toque
// ALINHADO: Completo, com avatar real integrado e getStatusStyle corrigido
const AnimatedBookingItem: React.FC<{ item: BookingDetails; index: number }> = ({ item, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pressScaleAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter(); // Para navegaÃƒÂ§ÃƒÂ£o

  useEffect(() => {
    const entryAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    entryAnimation.start(() => {
      const floatLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 3000 + (index % 3) * 100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 3000 + (index % 3) * 100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );
      floatLoop.start();

      return () => floatLoop.stop();
    });

    return () => entryAnimation.stop();
  }, [fadeAnim, slideAnim, floatAnim, index]);

  const onPressInHandler = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(pressScaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 4,
      tension: 80,
    }).start();
  }, [pressScaleAnim]);

  const onPressOutHandler = useCallback(() => {
    Animated.spring(pressScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 80,
    }).start();
  }, [pressScaleAnim]);

  // CORREÃƒâ€¡ÃƒÆ’O TS: getStatusStyle com retorno tipado (gradient como readonly string[])
  const getStatusStyle = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return {
          text: AppColors.successStandard,
          gradient: gradients.confirmed, // Tuple readonly compatÃƒÂ­vel
          icon: 'checkmark-circle-outline' as const,
          iconColor: AppColors.successStandard,
          badgeIcon: 'checkmark-circle' as const,
        };
      case BookingStatus.PENDING:
        return {
          text: AppColors.warningYellow,
          gradient: gradients.pending,
          icon: 'time-outline' as const,
          iconColor: AppColors.warningYellow,
          badgeIcon: 'time' as const,
        };
      case BookingStatus.PENDING_PROVIDER_CONFIRMATION:
        return {
          text: AppColors.warningYellow,
          gradient: gradients.pending,
          icon: 'hourglass-outline' as const,
          iconColor: AppColors.warningYellow,
          badgeIcon: 'hourglass' as const,
        };
      case BookingStatus.IN_PROGRESS:
        return {
          text: AppColors.primaryInteractive,
          gradient: gradients.inProgress,
          icon: 'sync-circle-outline' as const,
          iconColor: AppColors.primaryInteractive,
          badgeIcon: 'sync' as const,
        };
      case BookingStatus.COMPLETED:
        return {
          text: AppColors.textAuxiliary,
          gradient: gradients.completed,
          icon: 'flag-outline' as const,
          iconColor: AppColors.textAuxiliary,
          badgeIcon: 'flag' as const,
        };
      case BookingStatus.CANCELLED:
        return {
          text: AppColors.errorRed,
          gradient: gradients.cancelled,
          icon: 'close-circle-outline' as const,
          iconColor: AppColors.errorRed,
          badgeIcon: 'close-circle' as const,
        };
      case BookingStatus.REJECTED:
        return {
          text: AppColors.textAuxiliary,
          gradient: gradients.other,
          icon: 'alert-circle-outline' as const,
          iconColor: AppColors.textAuxiliary,
          badgeIcon: 'alert-circle' as const,
        };
      case BookingStatus.RESCHEDULED:
        return {
          text: '#6F42C1',
          gradient: gradients.rescheduled, // Usando o novo tuple
          icon: 'sync-outline' as const,
          iconColor: '#6F42C1',
          badgeIcon: 'sync' as const,
        };
      case BookingStatus.NO_SHOW:
        return {
          text: AppColors.textBody,
          gradient: gradients.other,
          icon: 'person-remove-outline' as const,
          iconColor: AppColors.textBody,
          badgeIcon: 'person-remove' as const,
        };
      default:
        return {
          text: AppColors.textAuxiliary,
          gradient: gradients.other,
          icon: 'help-circle-outline' as const,
          iconColor: AppColors.textAuxiliary,
          badgeIcon: 'help-circle' as const,
        };
    }
  };

  const statusInfo = getStatusStyle(item.status);

  // IntegraÃƒÂ§ÃƒÂ£o: Sempre usa avatar real do provider ou placeholder (com log)
  const getBookingItemMainIcon = (providerAvatarUrl: string | undefined | null) => {
    if (__DEV__) console.log('Integrando avatar real no booking card:', providerAvatarUrl);
    return renderProviderAvatar(providerAvatarUrl, 60);
  };

  const formattedAddress = item.address
    ? sanitizeText(
        `${item.address.street}, ${item.address.number}` +
          `${item.address.complement ? ` - ${item.address.complement}` : ''}` +
          `, ${item.address.neighborhood}, ${item.address.city} - ${item.address.state}`
      )
    : 'EndereÃƒÂ§o nÃƒÂ£o disponÃƒÂ­vel';

  return (
    <Animated.View
      style={[
        styles.itemCard,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
            { scale: pressScaleAnim },
          ],
        },
      ]}>
      <BlurView intensity={Platform.OS === 'ios' ? 20 : 40} tint="light" style={StyleSheet.absoluteFillObject} />
      <LinearGradient
        colors={['#F9FBFF', '#E6F0FF'] as const} // CORREÃƒâ€¡ÃƒÆ’O: as const para compatibilidade TS
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Link href={`/(client)/bookings/${item.id}`} asChild>
        <TouchableOpacity style={styles.itemCardContent} onPressIn={onPressInHandler} onPressOut={onPressOutHandler}>
          {/* Avatar real integrado ÃƒÂ  esquerda */}
          <View style={styles.avatarContainer}>{getBookingItemMainIcon(item.providerAvatarUrl)}</View>

          {/* Infos no centro */}
          <View style={styles.itemDetails}>
            <Text style={styles.itemServiceName} numberOfLines={1}>
              {sanitizeText(item.serviceName)}
            </Text>
            <Text style={styles.itemProviderName} numberOfLines={1}>
              Com: {sanitizeText(item.providerFullName)}
            </Text>
            <View style={styles.itemMetaRow}>
              <Ionicons name="calendar-outline" size={14} color={AppColors.textAuxiliary} style={styles.metaIcon} />
              <Text style={styles.itemDate} numberOfLines={1}>
                {formatDateTime(item.scheduledDate, item.scheduledTime, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            {item.address && (
              <View style={styles.itemAddressContainer}>
                <Ionicons name="location-outline" size={14} color={AppColors.textAuxiliary} style={styles.metaIcon} />
                <Text style={styles.itemAddressText} numberOfLines={2}>
                  {formattedAddress}
                </Text>
              </View>
            )}
            <View style={styles.itemPriceContainer}>
              <MaterialCommunityIcons name="currency-usd" size={14} color={AppColors.primaryInteractive} />
              <Text style={styles.itemPriceText}>{formatPriceBRL(item.totalPrice)}</Text>
            </View>
          </View>

          {/* Badge de status - CORREÃƒâ€¡ÃƒÆ’O: colors agora ÃƒÂ© tuple compatÃƒÂ­vel */}
          <LinearGradient
            colors={statusInfo.gradient} // TS aceita como readonly string[]
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statusBadge, styles.statusBadgeAbsolute]}>
            <Ionicons name={statusInfo.badgeIcon} size={12} color={statusInfo.text} style={styles.statusBadgeIcon} />
            <Text style={[styles.statusText, { color: statusInfo.text }]} numberOfLines={1}>
              {getTranslatedStatus(item.status)}
            </Text>
          </LinearGradient>

          {/* Chevron */}
          <Ionicons name="chevron-forward-outline" size={22} color={AppColors.mediumGray} style={styles.itemChevron} />
        </TouchableOpacity>
      </Link>
    </Animated.View>
  );
};

export default function MyBookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('upcoming');
  const [headerTitle, setHeaderTitle] = useState('Meus Agendamentos'); // NOVO: Estado para tÃƒÂ­tulo dinÃƒÂ¢mico
  const insets = useSafeAreaInsets();

  // INJEÃƒâ€¡ÃƒÆ’O: AnimaÃƒÂ§ÃƒÂµes premium para o Bottom Navbar (fade, slide up from bottom e glow)
  const navbarFadeAnim = useRef(new Animated.Value(0)).current;
  const navbarSlideAnim = useRef(new Animated.Value(80)).current; // ComeÃƒÂ§a fora da tela (de baixo)
  const navbarGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // AnimaÃƒÂ§ÃƒÂ£o de entrada premium para o Bottom Navbar (slide up + fade + glow loop)
    Animated.parallel([
      Animated.timing(navbarFadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(navbarSlideAnim, { toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(navbarGlowAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false, // Glow nÃƒÂ£o usa native driver
          }),
          Animated.timing(navbarGlowAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
        { iterations: -1 }
      ),
    ]).start();

    return () => {
      navbarGlowAnim.stopAnimation();
    };
  }, [navbarFadeAnim, navbarSlideAnim, navbarGlowAnim]);

  const filters: Array<{ label: string; value: FilterType; icon: keyof typeof Ionicons.glyphMap }> = [
    { label: 'SolicitaÃƒÂ§ÃƒÂµes', value: 'requests', icon: 'hourglass-outline' },
    { label: 'PrÃƒÂ³ximos', value: 'upcoming', icon: 'calendar-outline' },
    { label: 'HistÃƒÂ³rico', value: 'completed', icon: 'checkmark-done-outline' },
    { label: 'Cancelados', value: 'cancelled', icon: 'close-circle-outline' },
  ];

  const filterButtonAnims = useRef(filters.map(() => new Animated.Value(1))).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  const onPressInFilterButton = useCallback(
    (index: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(filterButtonAnims[index], {
        toValue: 0.9,
        useNativeDriver: true,
        friction: 3,
        tension: 80,
      }).start();
    },
    [filterButtonAnims]
  );

  const onPressOutFilterButton = useCallback(() => {
    filterButtonAnims.forEach((anim) => {
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 3,
        tension: 80,
      }).start();
    });
  }, [filterButtonAnims]);

  // ATUALIZADO: FunÃƒÂ§ÃƒÂ£o para carregar bookings com normalizeBooking e fetch paralelo de avatars se null
  const loadBookings = useCallback(
    async (currentFilter: FilterType, refreshing: boolean = false) => {
      if (!refreshing) {
        setIsLoading(true);
        setHeaderTitle('Carregando Agendamentos...'); // Atualiza tÃƒÂ­tulo no loading
      }
      setBookings([]);

      Animated.timing(contentAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(async () => {
        if (!user?.id) {
          console.warn("[MyBookingsScreen] User ID ausente, nÃƒÂ£o foi possÃƒÂ­vel carregar agendamentos.");
          setIsLoading(false);
          setHeaderTitle('Meus Agendamentos'); // Restaura tÃƒÂ­tulo
          setIsRefreshing(false);
          return;
        }

        try {
          let rawBookings: any[] = [];

          // ATUALIZADO: FunÃƒÂ§ÃƒÂ£o com fetch paralelo de avatars
          const getAndNormalizeWithAvatar = async (status: BookingStatus) => {
            const bookings = await getBookingsForUser(status);
            let normalized = bookings.map(normalizeBooking);
            
            // Fetch paralelo de avatars para produÃƒÂ§ÃƒÂ£o (se backend nÃƒÂ£o incluir)
            const avatarPromises = normalized
              .filter(b => !b.providerAvatarUrl) // SÃƒÂ³ se null
              .map(async (b) => {
                try {
                  const avatar = await getProviderAvatar(b.providerId); // Fetch extra
                  return { ...b, providerAvatarUrl: avatar.url };
                } catch (err) {
                  if (__DEV__) console.warn('Falha no fetch de avatar (fallback null):', err);
                  return b; // Fallback para null
                }
              });

            const withAvatars = await Promise.all(avatarPromises);
            return normalized.map((b, i) => withAvatars[i] || b);
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
              if (currentFilter === 'requests' || currentFilter === 'upcoming') {
                return bookingDateTime >= now;
              }
              if (currentFilter === 'completed') {
                return bookingDateTime < now;
              }
              return true;
            })
            .sort((a, b) => {
              const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`).getTime();
              const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`).getTime();
              return dateA - dateB;
            });

          // Debug: Log geral dos avatars nos bookings (alinhado com [bookingId].tsx)
          if (__DEV__) {
            filteredAndSortedBookings.forEach((b) => {
              console.log('Bookings carregados - Avatar URL:', b.providerAvatarUrl);
              console.log('Integrando avatar real no booking card:', b.providerAvatarUrl);
            });
          }

          setBookings(filteredAndSortedBookings);
          setHeaderTitle('Meus Agendamentos'); // Restaura tÃƒÂ­tulo apÃƒÂ³s load
          if (refreshing) Alert.alert('Sucesso', 'Agendamentos atualizados!');
        } catch (err: unknown) {  // CORRIGIDO: Tipagem unknown para type guard
          // CORREÃƒâ€¡ÃƒÆ’O TS2872: Type guard com isAxiosError para evitar "sempre verdadeiro"
          console.error('Erro ao buscar agendamentos:', err);
          let errorMessage = 'NÃƒÂ£o foi possÃƒÂ­vel carregar seus agendamentos.';
          if (isAxiosError(err) && err.response) {
            // SÃƒÂ³ acessa response se for AxiosError (guarda o tipo)
            errorMessage = (err.response.data as any)?.message || err.message || errorMessage;
          } else if (err instanceof Error) {  // Fallback para Error genÃƒÂ©rico
            errorMessage = err.message || errorMessage;
          }
          Alert.alert(
            'Erro',
            sanitizeText(errorMessage)
          );
          setHeaderTitle('Erro ao Carregar'); // TÃƒÂ­tulo para erro
        } finally {
          setIsLoading(false);
          setIsRefreshing(false);
          Animated.timing(contentAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start();
        }
      });
    },
    [user?.id, contentAnim, isAxiosError]  // Adicionado dependency para type guard
  );

  useEffect(() => {
    loadBookings(activeFilter);
  }, [activeFilter, loadBookings]);

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
      const entryAnimation = Animated.stagger(150, [
        Animated.timing(iconAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(textAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(subTextAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(buttonAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]);
      entryAnimation.start();
      return () => entryAnimation.stop();
    }, []);

    let title = 'Nenhum agendamento encontrado.';
    let subText = 'Ajuste o filtro ou verifique mais tarde.';
    let ctaButton = null;
    let iconName: keyof typeof Ionicons.glyphMap = 'help-circle-outline';

    if (activeFilter === 'requests') {
      title = 'Nenhuma solicitaÃƒÂ§ÃƒÂ£o de agendamento.';
      subText = 'Parece que vocÃƒÂª nÃƒÂ£o fez nenhum pedido pendente ainda.';
      iconName = 'hourglass-outline';
      ctaButton = (
        <Animated.View
          style={{
            opacity: buttonAnim,
            transform: [{ scale: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
          }}>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => router.push('/(client)/explore/todas-categorias' as any)}>
            <Ionicons name="search-outline" size={20} color={AppColors.white} />
            <Text style={styles.emptyStateButtonText} maxFontSizeMultiplier={1.2}>
              Explorar Categorias
            </Text>
          </TouchableOpacity>
        </Animated.View>
      );
    } else if (activeFilter === 'upcoming') {
      title = 'VocÃƒÂª nÃƒÂ£o tem serviÃƒÂ§os futuros agendados.';
      subText = 'Explore e agende novos serviÃƒÂ§os para vÃƒÂª-los aqui!';
      iconName = 'calendar-outline';
      ctaButton = (
        <Animated.View
          style={{
            opacity: buttonAnim,
            transform: [{ scale: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
          }}>
          <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(client)/explore' as any)}>
            <Text style={styles.exploreButtonText} maxFontSizeMultiplier={1.2}>
              Explorar ServiÃƒÂ§os
            </Text>
          </TouchableOpacity>
        </Animated.View>
      );
    } else if (activeFilter === 'completed') {
      title = 'Seu histÃƒÂ³rico de serviÃƒÂ§os estÃƒÂ¡ vazio.';
      subText = 'Comece a agendar e concluir serviÃƒÂ§os para vÃƒÂª-los aqui!';
      iconName = 'archive-outline';
    } else if (activeFilter === 'cancelled') {
      title = 'Nenhum serviÃƒÂ§o cancelado.';
      subText = 'ServiÃƒÂ§os cancelados ou recusados aparecerÃƒÂ£o aqui.';
      iconName = 'close-circle-outline';
    }

    return (
      <View style={styles.centeredFeedback}>
        <Animated.View
          style={{
            opacity: iconAnim,
            transform: [{ scale: iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          }}>
          <Ionicons name={iconName} size={64} color={AppColors.backgroundNeutral} />
        </Animated.View>
        <Animated.Text
          style={[
            styles.emptyText,
            {
              opacity: textAnim,
              transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
          maxFontSizeMultiplier={1.2}>
          {title}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.emptySubText,
            {
              opacity: subTextAnim,
              transform: [{ translateY: subTextAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
          maxFontSizeMultiplier={1.2}>
          {subText}
        </Animated.Text>
        {ctaButton}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? insets.top + 10 : 10, paddingBottom: insets.bottom + 80 }]}>
      {/* Ã¢Å“â€¦ HEADER SUPERIOR: Restaurado com Stack.Screen (tÃƒÂ­tulo dinÃƒÂ¢mico, back custom, clean) */}
      <Stack.Screen
        options={{
          title: headerTitle, // Usa estado dinÃƒÂ¢mico (ex: muda no loading)
          headerShown: true,
          headerTitleAlign: 'center', // Centraliza no iOS
          headerTitleStyle: {
            fontFamily: 'Montserrat-SemiBold',
            fontSize: 20,
            color: AppColors.textBody,
          },
          headerStyle: {
            backgroundColor: AppColors.white,
            // Removida borda azul Ã¢â‚¬â€ visual clean/neutro
          },
          headerShadowVisible: false, // Sem sombra Ã¢â‚¬â€ look moderno
          headerBackButtonDisplayMode: 'minimal', // iOS: Sem texto "Back"
          headerTintColor: AppColors.primaryInteractive,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingVertical: 10, paddingHorizontal: 12 }} // ÃƒÂrea de toque confortÃƒÂ¡vel
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} // Toque expandido (Ã¢â€°Â¥44dp)
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons name="arrow-back" size={24} color={AppColors.primaryInteractive} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Ã¢Å“â€¦ NOVO: Bloco "Filtrar" com tÃƒÂ­tulo + sub (visÃƒÂ­vel, respirÃƒÂ¡vel) */}
      <View style={styles.filterHeaderRow}>
        <Text style={styles.filterHeaderTitle}>Filtrar</Text>
        <Text style={styles.filterHeaderSub}>Selecione uma opÃƒÂ§ÃƒÂ£o</Text>
      </View>

      <View style={[styles.filterContainer, { marginTop: Platform.OS === 'ios' ? 10 : 5 }]}>
        {filters.map((filterItem, index) => (
          <Animated.View key={filterItem.value} style={{ transform: [{ scale: filterButtonAnims[index] }] }}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === filterItem.value && styles.filterButtonActive,
              ]}
              onPress={() => handleFilterChange(filterItem.value)}
              onPressIn={() => onPressInFilterButton(index)}
              onPressOut={onPressOutFilterButton}
              accessibilityRole="button"
              accessibilityLabel={`Filtrar por ${filterItem.label}`} // A11y: Label dinÃƒÂ¢mico
            >
              <Ionicons
                name={filterItem.icon}
                size={12}
                color={activeFilter === filterItem.value ? AppColors.white : AppColors.textBody}
                style={styles.filterIcon}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === filterItem.value && styles.filterButtonTextActive,
                ]}
                maxFontSizeMultiplier={1.2}
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
          <Text style={styles.loadingText} maxFontSizeMultiplier={1.2}>
            Carregando agendamentos...
          </Text>
        </View>
      ) : bookings.length > 0 ? (
        <Animated.FlatList
          data={bookings}
          renderItem={({ item, index }) => <AnimatedBookingItem item={item} index={index} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContentContainer,
            { paddingBottom: 100 }, // EspaÃƒÂ§o extra para bottom nav (altura ~80dp + safe area)
          ]}
          showsVerticalScrollIndicator={false} // Clean: Sem indicador vertical
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={AppColors.primaryInteractive}
              title="Atualizando agendamentos..."
              titleColor={AppColors.primaryInteractive}
            />
          }
          style={{
            opacity: contentAnim,
            transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }}
        />
      ) : (
        <EmptyListFeedback />
      )}

      {/* INJEÃƒâ€¡ÃƒÆ’O: Bottom Navbar premium animado integrado na parte inferior */}
      <Animated.View
        style={[
          styles.navbarContainer,
          {
            opacity: navbarFadeAnim,
            transform: [{ translateY: navbarSlideAnim }], // Slide up from bottom
          },
        ]}
      >
        <BlurView intensity={Platform.OS === 'ios' ? 10 : 20} tint="light" style={StyleSheet.absoluteFillObject} />
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Efeito de glow animado (premium: sombra pulsante sutil na bottom) */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              shadowColor: AppColors.primaryInteractive + '40',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: navbarGlowAnim,
              shadowRadius: 20,
              elevation: navbarGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
            },
          ]}
        />
        <Navbar
          title={headerTitle} // Passa o tÃƒÂ­tulo dinÃƒÂ¢mico (se o bottom nav suportar; opcional)
          onBackPress={() => router.back()} // Callback para back (se aplicÃƒÂ¡vel no bottom nav)
          showSearch={false} // Customiza para bookings (sem search)
          showNotifications={true} // Opcional: Mostra notificaÃƒÂ§ÃƒÂµes se o Navbar suportar
          animated={true} // Flag para ativar animaÃƒÂ§ÃƒÂµes internas no Navbar
          currentRoute="bookings" // Adicione prop para destacar a aba "bookings" no bottom nav
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundLight,
  },
  // INJEÃƒâ€¡ÃƒÆ’O: Estilos para o Bottom Navbar premium animado (posiÃƒÂ§ÃƒÂ£o inferior)
  navbarContainer: {
    position: 'absolute',
    bottom: 0, // Fixado na parte inferior
    left: 0,
    right: 0,
    height: 80, // Altura fixa para bottom nav (ajuste se necessÃƒÂ¡rio)
    zIndex: 1000, // Acima do conteÃƒÂºdo
    elevation: 20, // Android: ElevaÃƒÂ§ÃƒÂ£o alta para premium
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: -4 }, // Sombra para cima (bottom nav)
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  // Ã¢Å“â€¦ NOVO: Estilos para bloco "Filtrar" (tÃƒÂ­tulo visÃƒÂ­vel + sub) - Removido paddingTop extra
  filterHeaderRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 2,
    backgroundColor: AppColors.white,
  },
  filterHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.textBody,
    fontFamily: 'Montserrat-SemiBold',
  },
  filterHeaderSub: {
    fontSize: 12,
    color: AppColors.textAuxiliary,
    marginTop: 2,
    fontFamily: 'Montserrat-Regular',
  },
 filterContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 22,
  paddingHorizontal: 6,
  backgroundColor: AppColors.white,
  // Ã°Å¸â€Â¹ Borda premium apenas em cima e embaixo
  borderTopWidth: TOP_HAIRLINE,
  borderTopColor:  '#EEF3FA',   // tom bem claro (top)
  borderBottomWidth: BOTTOM_HAIRLINE,
  borderBottomColor:'#E3ECF6',  // tom 1 nÃƒÂ­vel mais forte (bottom)
  borderLeftWidth: 0,
  borderRightWidth: 0,
  borderStyle: 'solid',

  // Ã°Å¸â€Â¹ Sem sombra aqui para nÃƒÂ£o poluir o traÃƒÂ§o fino
  // ...AppShadows.medium,   // Ã¢ÂÅ’ remova

  marginBottom: 10,           // respiro abaixo dos botÃƒÂµes
},
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9, // Ã¢â€ Â Era 2 (fino); agora respirÃƒÂ¡vel
    paddingHorizontal: 12,
    bottom: 0,
    
    borderRadius: 25,
    marginHorizontal: 6,
    minHeight: 40,         // Ã¢Â¬â€¦Ã¯Â¸Â NOVO: Alvo de toque confortÃƒÂ¡vel (CORREÃƒâ€¡ÃƒÆ’O APLICADA)
    backgroundColor: AppColors.backgroundNeutral,
    borderWidth: 1,
    borderColor: AppColors.borderNeutral,
    // Removido right:15 Ã¢â‚¬â€ alinha ÃƒÂ­cone/texto
  },
  filterButtonActive: {
    backgroundColor: AppColors.primaryInteractive,
    borderColor: AppColors.primaryInteractive,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.primaryInteractive + '33',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: { elevation: 5 },
    }),
  },
  filterIcon: {
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textBody, // Cor mais escura para inativo (melhor contraste)
    fontFamily: 'Montserrat-Regular',
  },
  filterButtonTextActive: {
    color: AppColors.white,
    fontWeight: '700', // Negrito para ativo
    fontFamily: 'Montserrat-SemiBold',
  },
  listContentContainer: {
    paddingVertical: 20, // Mantido: Respiro premium acima/abaixo
    paddingHorizontal: 16,
    
  },
  itemCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    marginBottom: 24, // ReforÃƒÂ§ado: Respiro entre cards
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.15)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  itemCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    position: 'relative',
  },
  avatarContainer: {
    marginRight: 16,
    width: 60,
  },
  avatarImage: {
    borderWidth: 2,
    borderColor: AppColors.backgroundNeutral,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.backgroundLight,
    borderWidth: 2,
    borderColor: AppColors.backgroundNeutral,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemServiceName: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textBody,
    marginBottom: 4,
    fontFamily: 'Montserrat-SemiBold',
  },
  itemProviderName: {
    fontSize: 15,
    color: AppColors.textAuxiliary,
    marginBottom: 8,
    fontFamily: 'Montserrat-Regular',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaIcon: {
    marginRight: 6,
  },
  itemDate: {
    fontSize: 14,
    color: AppColors.textAuxiliary,
    fontFamily: 'Montserrat-Regular',
  },
  itemAddressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemAddressText: {
    fontSize: 14,
    color: AppColors.textAuxiliary,
    flex: 1,
    fontFamily: 'Montserrat-Regular',
    lineHeight: 20,
  },
  itemPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemPriceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.primaryInteractive,
    marginLeft: 4,
    fontFamily: 'Montserrat-SemiBold',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusBadgeAbsolute: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  statusBadgeIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontFamily: 'Montserrat-SemiBold',
  },
  itemChevron: {
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: AppColors.backgroundLight,
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.textAuxiliary,
    fontFamily: 'Montserrat-Regular',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.textBody,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Montserrat-SemiBold',
  },
  emptySubText: {
    fontSize: 16,
    color: AppColors.textAuxiliary,
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Montserrat-Regular',
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: AppColors.primaryInteractive,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    ...AppShadows.medium,
  },
  emptyStateButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    fontFamily: 'Montserrat-Regular',
  },
  exploreButton: {
    backgroundColor: AppColors.successStandard,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 20,
    ...AppShadows.medium,
  },
  exploreButtonText: {
    color: AppColors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Montserrat-SemiBold',
  },
});