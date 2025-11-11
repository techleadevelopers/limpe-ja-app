import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Text,
  TouchableOpacity,
  View,
  Easing,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';

import { formatPriceBRL, formatDateTime, sanitizeText } from '../../../utils/formatters';
import { normalizeBooking } from '../../../utils/normalize';

import { cancelBooking, getBookingDetails } from '../../../services/bookingService';

import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
import { AppColors, AppShadows } from '../../../constants/appStyles';
import Colors from '../../../constants/Colors';
import { useDevice } from '@/utils/responsive';

// Novos imports para integração
import { useProviderServices } from '../../../hooks/useProviderServices';
import ProviderServicesInline from '../../../components/booking/ProviderServicesInline';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient as any);

// Local light theme tokens for this screen only (UI refactor only)
const UI = {
  bg: '#F6F8FB',
  card: 'rgba(255,255,255,0.9)',
  textPrimary: '#1A1A1A',
  textSecondary: '#475569',
  divider: '#EAF1FF',
  accent: '#3A6FD8',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
} as const;

const isCancellableStatus = (status: BookingStatus): status is BookingStatus.CONFIRMED | BookingStatus.PENDING => status === BookingStatus.CONFIRMED || status === BookingStatus.PENDING;
const isCompletedStatus = (status: BookingStatus): status is BookingStatus.COMPLETED => status === BookingStatus.COMPLETED;

// Solid backgrounds for a clean status pill (no gradient look)
const gradients = {
  confirmed: ['rgba(58,111,216,0.08)', 'rgba(58,111,216,0.08)'] as const,
  pending: ['rgba(187,209,249,0.10)', 'rgba(187,209,249,0.10)'] as const,
  inProgress: ['rgba(58,111,216,0.08)', 'rgba(58,111,216,0.08)'] as const,
  completed: ['#F9FAFB', '#F9FAFB'] as const,
  cancelled: ['rgba(239,68,68,0.08)', 'rgba(239,68,68,0.08)'] as const,
  other: ['#F9FAFB', '#F9FAFB'] as const,
  rescheduled: ['rgba(187,209,249,0.10)', 'rgba(187,209,249,0.10)'] as const,
} as const;

type GradientKey = keyof typeof gradients;
const statusToKey = (s?: BookingStatus | null): GradientKey => {
  switch (s) {
    case BookingStatus.CONFIRMED:
      return 'confirmed';
    case BookingStatus.PENDING:
      return 'pending';
    case BookingStatus.IN_PROGRESS:
      return 'inProgress';
    case BookingStatus.COMPLETED:
      return 'completed';
    case BookingStatus.CANCELLED:
      return 'cancelled';
    default:
      return 'other';
  }
};

const getStatusStyle = (status: BookingStatus) => {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return { text: 'CONFIRMADO', color: UI.accent, gradient: gradients.confirmed, icon: 'checkmark-circle-outline' as const };
    case BookingStatus.PENDING:
      return { text: 'PENDENTE', color: UI.accent, gradient: gradients.pending, icon: 'time-outline' as const };
    case BookingStatus.PENDING_PROVIDER_CONFIRMATION:
      return { text: 'AGUARDANDO', color: UI.accent, gradient: gradients.pending, icon: 'hourglass-outline' as const };
    case BookingStatus.IN_PROGRESS:
      return { text: 'EM ANDAMENTO', color: UI.accent, gradient: gradients.inProgress, icon: 'sync-circle-outline' as const };
    case BookingStatus.COMPLETED:
      return { text: 'CONCLUÍDO', color: UI.textSecondary, gradient: gradients.completed, icon: 'flag-outline' as const };
    case BookingStatus.CANCELLED:
      return { text: 'CANCELADO', color: UI.danger, gradient: gradients.cancelled, icon: 'close-circle-outline' as const };
    case BookingStatus.REJECTED:
      return { text: 'REJEITADO', color: UI.textSecondary, gradient: gradients.other, icon: 'alert-circle-outline' as const };
    case BookingStatus.RESCHEDULED:
      return { text: 'REAGENDADO', color: UI.accent, gradient: gradients.rescheduled, icon: 'sync-outline' as const };
    case BookingStatus.NO_SHOW:
      return { text: 'NÃO COMPARECEU', color: UI.textPrimary, gradient: gradients.other, icon: 'person-remove-outline' as const };
    default:
      return { text: 'DESCONHECIDO', color: '#6B7280', gradient: gradients.other, icon: 'help-circle-outline' as const };
  }
};

const renderProviderAvatar = (avatarUrl?: string | null, size: number = 80) => {
  if (!avatarUrl || avatarUrl === '') {
    return (
      <View style={[styles.photoPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
        <Ionicons name="person-circle-outline" size={Math.round(size * 0.8)} color={UI.textSecondary} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri: avatarUrl }}
      style={[styles.providerImage, { width: size, height: size, borderRadius: size / 2 }]}
      resizeMode="cover"
      onError={(e) => __DEV__ && console.log('Erro carregando avatar real (details):', (e as any).nativeEvent?.error || e)}
      onLoad={() => __DEV__ && console.log('Avatar real carregado no details!')}
    />
  );
};

// Subcomponente: HeaderBar (voltar + título + status pill)
function HeaderBar({ booking, router, insets, theme }: { booking: BookingDetails; router: any; insets: any; theme: any }) {
  const statusInfo = getStatusStyle(booking.status);
  const rCard: StyleProp<ViewStyle> = useDevice().isLargePhone
    ? { alignSelf: 'center' as ViewStyle['alignSelf'], width: '100%', maxWidth: 820 }
    : undefined;

  return (
    <View style={[styles.thematicHeader, rCard]}>
      <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFillObject} />
      <View style={{ backgroundColor: 'rgba(255,255,255,0.9)', ...StyleSheet.absoluteFillObject }} />
      <View style={styles.headerBar}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backIcon} 
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} 
          accessibilityRole="button" 
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={22} color={UI.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do agendamento</Text>
        <View style={{ width: 22 }} />
      </View>
    </View>
  );
}

// Subcomponente: ProviderHeaderCard (avatar + serviço + provider + pill)
function ProviderHeaderCard({ booking, providerSectionAnim, providerFloatAnim, rCard, rTitle, theme }: { booking: BookingDetails; providerSectionAnim: any; providerFloatAnim: any; rCard: any; rTitle: any; theme: any }) {
  const statusInfo = getStatusStyle(booking.status);

  return (
    <Animated.View style={[styles.card, rCard, styles.providerSectionCard, { backgroundColor: UI.card, opacity: providerSectionAnim, transform: [{ translateY: providerSectionAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }, { scale: providerSectionAnim.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1] }) }, { translateY: providerFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }] }]}>
      <View style={styles.providerSection}>
        {renderProviderAvatar(booking.providerAvatarUrl, 80)}
        <View style={styles.providerInfo}>
          <Text style={[styles.serviceTypeText, rTitle]} numberOfLines={1}>
            Residencial
          </Text>
          <Text style={styles.serviceNameText} numberOfLines={2}>
            {sanitizeText(booking.serviceName)}
          </Text>
          <Text style={styles.providerNameText} numberOfLines={2}>
            {`com ${sanitizeText(booking.providerFullName)}`}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Subcomponente: DetailsCard (data/hora, endereço, valor, notas)
function DetailsCard({ booking, detailsCardAnim, detailsFloatAnim, rCard, rDetails, handleCopyAddress, handleOpenInMaps, theme }: { booking: BookingDetails; detailsCardAnim: any; detailsFloatAnim: any; rCard: any; rDetails: any; handleCopyAddress: () => void; handleOpenInMaps: () => void; theme: any }) {
  return (
    <Animated.View style={[styles.card, rCard, { backgroundColor: UI.card, opacity: detailsCardAnim, transform: [{ scale: detailsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1] }) }, { translateY: detailsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }, { translateY: detailsFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }] }]}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>Detalhes do agendamento</Text>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="calendar-outline" size={20} color={UI.textSecondary} style={styles.icon} />
        <Text style={styles.detailLabel}>Data e hora</Text>
        <Text style={[styles.detailValue, rDetails]}>
          {formatDateTime(booking.scheduledDate, booking.scheduledTime, { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(' de ', ' ')}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="location-outline" size={20} color={UI.textSecondary} style={styles.icon} />
        <Text style={styles.detailLabel}>Endereço</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.detailValueAddress, rDetails]}>
            {sanitizeText(`${booking.address.street}, ${booking.address.number}${booking.address.complement ? `, ${booking.address.complement}` : ''}`)}
            {sanitizeText(`\n${booking.address.neighborhood}, ${booking.address.city} - ${booking.address.state}`)}
            {sanitizeText(`\nCEP: ${booking.address.cep}`)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity onPress={handleCopyAddress} style={styles.copyBtn}>
              <Text style={styles.copyBtnTxt}>Copiar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOpenInMaps} style={styles.copyBtn}>
              <Text style={styles.copyBtnTxt}>Abrir no mapa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="cash-outline" size={20} color={UI.textSecondary} style={styles.icon} />
        <Text style={styles.detailLabel}>Valor</Text>
        <Text style={[styles.detailValue, styles.priceText, { color: UI.accent }]}>{formatPriceBRL(booking.totalPrice)}</Text>
      </View>
      {booking.notes && (
        <View style={styles.detailRow}>
          <Ionicons name="document-text-outline" size={20} color={UI.textSecondary} style={styles.icon} />
          <Text style={styles.detailLabel}>Observações</Text>
          <Text style={styles.detailValue}>{sanitizeText(booking.notes)}</Text>
        </View>
      )}
    </Animated.View>
  );
}

// Subcomponente: ActionsCard (ações)
function ActionsCard({ 
  booking, 
  actionsCardAnim, 
  actionsFloatAnim, 
  rCard, 
  rActionBtn, 
  isCancellableStatus, 
  isCompletedStatus, 
  isReviewed,
  handleCancelBooking, 
  handleContactProvider, 
  handleReviewService, 
  handleViewProviderProfile,
  cancelButtonScaleAnim,
  contactButtonScaleAnim,
  reviewButtonScaleAnim,
  profileButtonScaleAnim,
  onPressInButton,
  onPressOutButton,
  theme,
}: { 
  booking: BookingDetails; 
  actionsCardAnim: any; 
  actionsFloatAnim: any; 
  rCard: any; 
  rActionBtn: any; 
  isCancellableStatus: (status: BookingStatus) => boolean; 
  isCompletedStatus: (status: BookingStatus) => boolean;
  isReviewed: boolean;
  handleCancelBooking: () => void; 
  handleContactProvider: () => void; 
  handleReviewService: () => void; 
  handleViewProviderProfile: () => void;
  cancelButtonScaleAnim: any;
  contactButtonScaleAnim: any;
  reviewButtonScaleAnim: any;
  profileButtonScaleAnim: any;
  onPressInButton: (anim: any) => void;
  onPressOutButton: (anim: any) => void;
  theme: any;
}) {
  const statusInfo = getStatusStyle(booking.status);

  return (
    <Animated.View style={[styles.actionsCard, rCard, { backgroundColor: UI.card, opacity: actionsCardAnim, transform: [{ scale: actionsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1] }) }, { translateY: actionsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }, { translateY: actionsFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) }] }]}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>Ações</Text>
      </View>
      {isCancellableStatus(booking.status) && (
        <AnimatedLinearGradient 
          colors={['#FF6B6B', '#EE5A52']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={[styles.actionButton, rActionBtn, styles.cancelButton, { transform: [{ scale: cancelButtonScaleAnim }] }]}
        >
          <TouchableOpacity 
            style={styles.actionButtonInner} 
            onPress={handleCancelBooking} 
            onPressIn={() => onPressInButton(cancelButtonScaleAnim)} 
            onPressOut={() => onPressOutButton(cancelButtonScaleAnim)} 
            activeOpacity={1}
          >
            <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Cancelar agendamento</Text>
          </TouchableOpacity>
        </AnimatedLinearGradient>
      )}
      <AnimatedLinearGradient 
        colors={['#3B82F6', '#2563EB']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={[styles.actionButton, rActionBtn, { transform: [{ scale: contactButtonScaleAnim }] }]}
      >
        <TouchableOpacity 
          style={styles.actionButtonInner} 
          onPress={handleContactProvider} 
          onPressIn={() => onPressInButton(contactButtonScaleAnim)} 
          onPressOut={() => onPressOutButton(contactButtonScaleAnim)} 
          activeOpacity={1}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Contatar {sanitizeText(booking.providerFullName.split(' ')[0])}</Text>
        </TouchableOpacity>
      </AnimatedLinearGradient>
      {isCompletedStatus(booking.status) && !isReviewed && (
        <AnimatedLinearGradient 
          colors={['#60A5FA', '#3B82F6']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={[styles.actionButton, rActionBtn, styles.reviewButton, { transform: [{ scale: reviewButtonScaleAnim }] }]}
        >
          <TouchableOpacity 
            style={styles.actionButtonInner} 
            onPress={handleReviewService} 
            onPressIn={() => onPressInButton(reviewButtonScaleAnim)} 
            onPressOut={() => onPressOutButton(reviewButtonScaleAnim)} 
            activeOpacity={1}
          >
            <Ionicons name="star-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Avaliar serviço</Text>
          </TouchableOpacity>
        </AnimatedLinearGradient>
      )}
      <AnimatedLinearGradient 
        colors={['#667EEA', '#764BA2']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={[styles.actionButtonOutline, rActionBtn, { borderColor: UI.accent, transform: [{ scale: profileButtonScaleAnim }] }]}
      >
        <TouchableOpacity 
          style={[styles.actionButtonInner, styles.actionButtonOutlineInner]} 
          onPress={handleViewProviderProfile} 
          onPressIn={() => onPressInButton(profileButtonScaleAnim)} 
          onPressOut={() => onPressOutButton(profileButtonScaleAnim)} 
          activeOpacity={1}
        >
          <Ionicons name="person-circle-outline" size={20} color={UI.accent} />
          <Text style={[styles.actionButtonText, styles.actionButtonOutlineText, { color: UI.accent }]}>Ver perfil de {sanitizeText(booking.providerFullName.split(' ')[0])}</Text>
        </TouchableOpacity>
      </AnimatedLinearGradient>
    </Animated.View>
  );
}

// Subcomponente: ReviewSheet (modal)
function ReviewSheet({ showReviewSheet, setShowReviewSheet, booking, router }: { showReviewSheet: boolean; setShowReviewSheet: (v: boolean) => void; booking: BookingDetails; router: any }) {
  return (
    <Modal visible={showReviewSheet} transparent animationType="slide" onRequestClose={() => setShowReviewSheet(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: UI.textPrimary, marginBottom: 8 }}>Avaliar serviço</Text>
          <Text style={{ fontSize: 14, color: UI.textSecondary, marginBottom: 16, lineHeight: 20 }}>Conte como foi sua experiência. Sua opinião ajuda outros clientes e os prestadores.</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              onPress={() => {
                setShowReviewSheet(false);
                router.push({ pathname: '/(common)/feedback/[targetId]', params: { targetId: booking.id, type: 'service', serviceName: sanitizeText(booking.serviceName), providerName: sanitizeText(booking.providerFullName), providerId: booking.providerId } } as any);
              }}
              style={{ flex: 1, backgroundColor: UI.accent, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginRight: 8 }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Avaliar agora</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowReviewSheet(false)}
              style={{ flex: 1, backgroundColor: '#F9FAFB', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginLeft: 8 }}
            >
              <Text style={{ color: UI.textPrimary, fontWeight: '700' }}>Depois</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function BookingDetailsScreen() {
  // Theme aligned with Cashback/Missions
  const scheme = (Colors as any)?.scheme || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSmallPhone, isLargePhone } = useDevice();

  const rCard: StyleProp<ViewStyle> = React.useMemo(
    () => (isLargePhone ? { alignSelf: 'center' as ViewStyle['alignSelf'], width: '100%', maxWidth: 820 } : undefined),
    [isLargePhone]
  );
  const rTitle: StyleProp<TextStyle> = React.useMemo(() => (isLargePhone ? { fontSize: 24 } : undefined), [isLargePhone]);
  const rDetails: StyleProp<TextStyle> = React.useMemo(() => (isSmallPhone ? { lineHeight: 22 } : undefined), [isSmallPhone]);
  const rActionBtn: StyleProp<ViewStyle> = React.useMemo(() => ({ minHeight: 50 }), []);

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panicStatus, setPanicStatus] = useState<'IDLE' | 'RECEIVED' | 'ACKED' | 'DISPATCHED' | 'CLOSED'>('IDLE');
  const [showReviewSheet, setShowReviewSheet] = useState(false);

  const providerSectionAnim = useRef(new Animated.Value(0)).current;
  const detailsCardAnim = useRef(new Animated.Value(0)).current;
  const actionsCardAnim = useRef(new Animated.Value(0)).current;

  const cancelButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const contactButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const reviewButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const profileButtonScaleAnim = useRef(new Animated.Value(1)).current;

  const providerFloatAnim = useRef(new Animated.Value(0)).current;
  const detailsFloatAnim = useRef(new Animated.Value(0)).current;
  const actionsFloatAnim = useRef(new Animated.Value(0)).current;

  // Integração: Hook para serviços do prestador (após booking carregado)
  const { services: providerServices } = useProviderServices(booking?.providerId);

  const createAndStartFloatAnimation = useCallback((animValue: Animated.Value) => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
      { iterations: -1 }
    );
    loop.start();
    return loop;
  }, []);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) {
      setError('ID do agendamento não fornecido.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const rawData = await getBookingDetails(bookingId);
      const data = normalizeBooking(rawData);
      setBooking(data);
      try {
        const completed = data.status === BookingStatus.COMPLETED;
        const alreadyReviewed = !!(data.isReviewed || data.reviewId);
        if (completed && !alreadyReviewed) setShowReviewSheet(true);
      } catch {}

      const D = 240; const S = 60;
      Animated.stagger(S, [
        Animated.timing(providerSectionAnim, { toValue: 1, duration: D, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(detailsCardAnim, { toValue: 1, duration: D, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(actionsCardAnim, { toValue: 1, duration: D, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } catch (err: any) {
      console.error('[BookingDetailsScreen] Erro ao buscar detalhes:', err);
      setError(sanitizeText(err?.message || 'Não foi possível carregar os detalhes do agendamento.'));
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();

    const providerLoop = createAndStartFloatAnimation(providerFloatAnim);
    const detailsTimeout = setTimeout(() => {
      const detailsLoop = createAndStartFloatAnimation(detailsFloatAnim);
      return () => detailsLoop.stop();
    }, 80);
    const actionsTimeout = setTimeout(() => {
      const actionsLoop = createAndStartFloatAnimation(actionsFloatAnim);
      return () => actionsLoop.stop();
    }, 160);

    return () => {
      providerLoop.stop();
      clearTimeout(detailsTimeout);
      clearTimeout(actionsTimeout);
    };
  }, [fetchBooking]);

  const onPressInButton = (animValue: Animated.Value) => {
    Animated.spring(animValue, { toValue: 0.96, useNativeDriver: true, friction: 3, tension: 100 }).start();
  };

  const onPressOutButton = (animValue: Animated.Value) => {
    Animated.spring(animValue, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }).start();
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    Alert.alert('Cancelar agendamento', 'Deseja cancelar este agendamento? Dependendo da política, taxas podem ser aplicadas.', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        onPress: async () => {
          setIsLoading(true);
          try {
            await cancelBooking(booking.id);
            // Removido Alert de sucesso; use Toast.show({ type: 'success', text1: 'Agendamento cancelado.' }) aqui se tiver Toast
            setBooking((prev) => (prev ? { ...prev, status: BookingStatus.CANCELLED } : null));
          } catch (err: any) {
            console.error('Erro ao cancelar:', err);
            Alert.alert('Erro', sanitizeText(err?.message || 'Não foi possível cancelar o agendamento.'));
          } finally {
            setIsLoading(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleContactProvider = () => {
    if (!booking) return;
    router.push({ pathname: '/(client)/messages', params: { providerId: booking.providerId, bookingId: booking.id, recipientName: sanitizeText(booking.providerFullName) } });
  };

  const handleReviewService = () => {
    if (!booking) return;
    router.push({
      pathname: '/(common)/feedback/[targetId]',
      params: { targetId: booking.id, type: 'service', serviceName: sanitizeText(booking.serviceName), providerName: sanitizeText(booking.providerFullName), providerId: booking.providerId },
    });
  };

  const handleViewProviderProfile = () => {
    if (!booking) return;
    router.push({ pathname: '/(client)/explore/[providerId]', params: { providerId: booking.providerId } });
  };

  const handlePanic = useCallback(() => {
    Alert.alert('Botão de Pânico', 'Deseja acionar o botão de pânico? Segurança será notificada.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Acionar',
        onPress: () => {
          setPanicStatus('RECEIVED');
          setTimeout(() => setPanicStatus('ACKED'), 3000);
          setTimeout(() => setPanicStatus('DISPATCHED'), 6000);
          setTimeout(() => setPanicStatus('CLOSED'), 10000);
        },
        style: 'destructive',
      },
    ]);
  }, []);

  const handleCopyAddress = useCallback(() => {
    if (!booking) return;
    try {
      const a = booking.address;
      const text = `${a.street}, ${a.number}${a.complement ? `, ${a.complement}` : ''} - ${a.neighborhood}, ${a.city} - ${a.state}, ${a.cep}`;
      Clipboard.setStringAsync(text);
      // Opcional: Toast.show({ type: 'success', text1: 'Endereço copiado' });
    } catch {}
  }, [booking]);

  const handleOpenInMaps = useCallback(() => {
    if (!booking) return;
    const a = booking.address;
    const query = encodeURIComponent(`${a.street}, ${a.number} ${a.complement || ''}, ${a.neighborhood}, ${a.city} - ${a.state}, ${a.cep}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() => Alert.alert('Não foi possível abrir o mapa'));
  }, [booking]);

  // Integração: onSelect para ProviderServicesInline
  const handleSelectService = useCallback((serviceId: string) => {
    if (!booking) return;
    router.push({
      pathname: '/(client)/bookings/schedule-service',
      params: { providerId: booking.providerId, serviceId },
    } as any);
  }, [booking, router]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: Platform.OS === 'ios' ? insets.top + 20 : 20 }]}>
        <Stack.Screen
          options={{
            title: 'Carregando...',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontFamily: 'System', fontWeight: '700', fontSize: 18, color: UI.textPrimary },
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerShadowVisible: false,
            headerTintColor: UI.accent,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 10, paddingHorizontal: 12 }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} accessibilityRole="button" accessibilityLabel="Voltar">
                <Ionicons name="arrow-back" size={24} color={UI.accent} />
              </TouchableOpacity>
            ),
          } as any}
        />
        <ActivityIndicator size="large" color={UI.accent} />
        <Text style={styles.loadingText}>Carregando detalhes do agendamento...</Text>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={[styles.centered, { paddingTop: Platform.OS === 'ios' ? insets.top + 20 : 20 }]}>
        <Stack.Screen
          options={{
            title: 'Reserva não encontrada',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontFamily: 'System', fontWeight: '700', fontSize: 18, color: UI.textPrimary },
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerShadowVisible: false,
            headerTintColor: UI.accent,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 10, paddingHorizontal: 12 }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} accessibilityRole="button" accessibilityLabel="Voltar">
                <Ionicons name="arrow-back" size={24} color={UI.accent} />
              </TouchableOpacity>
            ),
          } as any}
        />
        <Ionicons name="alert-circle-outline" size={48} color={UI.danger} />
        <Text style={styles.errorText}>{error || `Agendamento "${bookingId}" não encontrado.`}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isReviewed = !!booking.reviewId;

  return (
    <>
      <ScrollView style={[styles.scrollViewContainer, { backgroundColor: UI.bg, paddingTop: Platform.OS === 'ios' ? insets.top + 10 : 10, paddingBottom: insets.bottom + 20 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        {/* Subcomponentes no ScrollView */}
        <HeaderBar booking={booking} router={router} insets={insets} theme={theme} />
        <ProviderHeaderCard
          booking={booking}
          providerSectionAnim={providerSectionAnim}
          providerFloatAnim={providerFloatAnim}
          rCard={rCard}
          rTitle={rTitle}
          theme={theme}
        />
        <DetailsCard
          booking={booking}
          detailsCardAnim={detailsCardAnim}
          detailsFloatAnim={detailsFloatAnim}
          rCard={rCard}
          rDetails={rDetails}
          handleCopyAddress={handleCopyAddress}
          handleOpenInMaps={handleOpenInMaps}
          theme={theme}
        />
        <ActionsCard
          booking={booking}
          actionsCardAnim={actionsCardAnim}
          actionsFloatAnim={actionsFloatAnim}
          rCard={rCard}
          rActionBtn={rActionBtn}
          isCancellableStatus={isCancellableStatus}
          isCompletedStatus={isCompletedStatus}
          isReviewed={isReviewed}
          handleCancelBooking={handleCancelBooking}
          handleContactProvider={handleContactProvider}
          handleReviewService={handleReviewService}
          handleViewProviderProfile={handleViewProviderProfile}
          cancelButtonScaleAnim={cancelButtonScaleAnim}
          contactButtonScaleAnim={contactButtonScaleAnim}
          reviewButtonScaleAnim={reviewButtonScaleAnim}
          profileButtonScaleAnim={profileButtonScaleAnim}
          onPressInButton={onPressInButton}
          onPressOutButton={onPressOutButton}
          theme={theme}
        />
        {/* Novo: ProviderServicesInline para upsell */}
        <ProviderServicesInline
          data={providerServices}
          onSelect={handleSelectService}
        />
      </ScrollView>
      {/* Subcomponente: ReviewSheet (Modal fora do ScrollView) */}
      <ReviewSheet showReviewSheet={showReviewSheet} setShowReviewSheet={setShowReviewSheet} booking={booking} router={router} />
    </>
  );
}

const styles = StyleSheet.create({
  scrollViewContainer: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 16, fontSize: 15, color: UI.textSecondary, fontWeight: '500', lineHeight: 22 },
  errorText: { fontSize: 16, color: UI.danger, textAlign: 'center', marginBottom: 24, fontWeight: '500', lineHeight: 22 },

  // Header fixo translúcido + blur leve
  thematicHeader: { 
    marginHorizontal: 12, 
    marginBottom: 6, 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24, 
    borderTopLeftRadius: 8, 
    borderTopRightRadius: 8, 
    overflow: 'hidden', 
    backgroundColor: 'rgba(255,255,255,0.9)',
    ...Platform.select({ 
      ios: { 
        shadowColor: '#3A6FD8', 
        shadowOpacity: 0.08, 
        shadowRadius: 10, 
        shadowOffset: { width: 0, height: 3 } 
      }, 
      android: { elevation: 3 } 
    }) 
  },
  headerBar: { paddingTop: 8, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backIcon: { 
    width: 40, 
    height: 36, 
    justifyContent: 'center', 
    alignItems: 'center',
    ...Platform.select({ 
      ios: { 
        shadowColor: '#3A6FD8', 
        shadowOpacity: 0.08, 
        shadowRadius: 4, 
        shadowOffset: { width: 0, height: 1 } 
      } 
    })
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: UI.textPrimary, 
    flex: 1, 
    textAlign: 'center',
    letterSpacing: 0.3
  },

  actionButton: { 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 14, 
    minHeight: 50,
    ...Platform.select({ 
      ios: { 
        shadowColor: '#3A6FD820', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.20, 
        shadowRadius: 8 
      }, 
      android: { elevation: 6 } 
    }) 
  },
  actionButtonInner: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 20 
  },
  actionButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 12 
  },

  card: { 
    borderRadius: 18, 
    padding: 18, 
    marginHorizontal: 16, 
    marginTop: 16, 
    marginBottom: 12, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: UI.divider,
    ...Platform.select({ 
      ios: { 
        shadowColor: '#3A6FD8', 
        shadowOpacity: 0.08, 
        shadowRadius: 10, 
        shadowOffset: { width: 0, height: 3 } 
      }, 
      android: { elevation: 3 } 
    }) 
  },
  providerSectionCard: { paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', position: 'relative' },
  providerSection: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 16 },

  photoPlaceholder: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#F0F9FF', 
    borderWidth: 1, 
    borderColor: UI.divider 
  },
  providerImage: { borderWidth: 1, borderColor: UI.divider },

  providerInfo: { flex: 1 },
  serviceTypeText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: UI.textSecondary, 
    marginBottom: 4 
  },
  serviceNameText: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: UI.textPrimary, 
    marginBottom: 2,
    lineHeight: 22
  },
  providerNameText: { 
    fontSize: 15, 
    color: UI.accent, 
    fontWeight: '500',
    lineHeight: 21
  },

  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, alignSelf: 'flex-start', marginLeft: 12 },
  statusText: { fontSize: 13, fontWeight: '700', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },

  sectionTitleContainer: { marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: UI.divider },
  sectionTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: UI.textPrimary, 
    letterSpacing: 0.3 
  },

  // Bloco de detalhes redesenhado (mini-cards)
  detailRow: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#3A6FD8',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },
  icon: { width: 20, textAlign: 'center' as any, marginRight: 0 },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: UI.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    flex: 2,
    fontSize: 15,
    color: UI.textPrimary,
    fontWeight: '500',
    lineHeight: 21,
  },
  detailValueAddress: { 
    flex: 1, 
    fontSize: 15, 
    color: UI.textPrimary, 
    lineHeight: 21, 
    fontWeight: '500' 
  },

  priceText: {
    color: '#3A6FD8',
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'rgba(58,111,216,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Botões secundários (micro-pílulas translúcidas)
  copyBtn: {
    backgroundColor: '#EAF1FF',
    borderColor: '#BBD1F9',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  copyBtnTxt: {
    color: '#3A6FD8',
    fontWeight: '600',
    fontSize: 13,
  },

  actionsCard: { 
    borderRadius: 18, 
    padding: 18, 
    marginHorizontal: 16, 
    marginTop: 16, 
    marginBottom: 40, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: UI.divider,
    ...Platform.select({ 
      ios: { 
        shadowColor: '#3A6FD8', 
        shadowOpacity: 0.08, 
        shadowRadius: 10, 
        shadowOffset: { width: 0, height: 3 } 
      }, 
      android: { elevation: 3 } 
    }) 
  },
  cancelButton: {},
  reviewButton: {},
  actionButtonOutline: { 
    borderRadius: 14, 
    borderWidth: 1, 
    marginBottom: 16, 
    ...Platform.select({ 
      ios: { 
        shadowColor: '#3A6FD820', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.20, 
        shadowRadius: 8 
      }, 
      android: { elevation: 4 } 
    }) 
  },
  actionButtonOutlineInner: { 
    backgroundColor: 'transparent', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 20 
  },
  actionButtonOutlineText: { 
    marginLeft: 12, 
    fontSize: 16, 
    fontWeight: '600' 
  },
});