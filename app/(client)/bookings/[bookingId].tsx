// LimpeJaApp/app/(client)/bookings/[bookingId].tsx
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
  Text,
  TouchableOpacity,
  View,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatPriceBRL, formatDateTime, sanitizeText } from '../../../utils/formatters';
import { normalizeBooking } from '../../../utils/normalize';

import { cancelBooking, getBookingDetails } from '../../../services/bookingService';

import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
import { AppColors, AppShadows } from '../../../constants/appStyles';

// Type guards
const isCancellableStatus = (status: BookingStatus): status is BookingStatus.CONFIRMED | BookingStatus.PENDING => {
  return status === BookingStatus.CONFIRMED || status === BookingStatus.PENDING;
};

const isCompletedStatus = (status: BookingStatus): status is BookingStatus.COMPLETED => {
  return status === BookingStatus.COMPLETED;
};

// Avatar renderer
const renderProviderAvatar = (avatarUrl?: string | null, size: number = 80) => {
  if (__DEV__) console.log('Avatar URL (booking details):', avatarUrl);

  if (!avatarUrl || avatarUrl === '') {
    return (
      <View style={[styles.photoPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
        <Ionicons name="person-circle-outline" size={size * 0.8} color={AppColors.mediumGray} />
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

const gradients = {
  confirmed: ['#D4EDDA', '#C3E6CB'] as const,
  pending: ['#FFF3CD', '#FFEAA7'] as const,
  inProgress: ['#D1ECF1', '#B8E1E9'] as const,
  completed: ['#F8F9FA', '#E9ECEF'] as const,
  cancelled: ['#F8D7DA', '#F1B0B7'] as const,
  other: ['#E2E3E5', '#DEE2E6'] as const,
  rescheduled: ['#EAE6F3', '#D7CFF0'] as const,
} as const;

export default function BookingDetailsScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panicStatus, setPanicStatus] = useState<'IDLE' | 'RECEIVED' | 'ACKED' | 'DISPATCHED' | 'CLOSED'>('IDLE');

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

  // Refs para as animações em loop para cleanup correto
  const providerLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const detailsLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const actionsLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const createAndStartFloatAnimation = useCallback((animValue: Animated.Value) => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
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

      if (__DEV__) console.log('Booking details carregado - Avatar URL:', data.providerAvatarUrl);

      Animated.stagger(150, [
        Animated.timing(providerSectionAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(detailsCardAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(actionsCardAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } catch (err: any) {
      console.error('[BookingDetailsScreen] Erro ao buscar detalhes do agendamento:', err);
      setError(sanitizeText(err?.message || 'Não foi possível carregar os detalhes do agendamento.'));
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, providerSectionAnim, detailsCardAnim, actionsCardAnim]);

  useEffect(() => {
    fetchBooking();

    // Inicia a animação do provider imediatamente
    providerLoopRef.current = createAndStartFloatAnimation(providerFloatAnim);

    // Inicia as outras com delay usando setTimeout, mas armazena as refs para cleanup
    const detailsTimeout = setTimeout(() => {
      detailsLoopRef.current = createAndStartFloatAnimation(detailsFloatAnim);
    }, 100);

    const actionsTimeout = setTimeout(() => {
      actionsLoopRef.current = createAndStartFloatAnimation(actionsFloatAnim);
    }, 200);

    return () => {
      // Cleanup das animações
      providerLoopRef.current?.stop();
      detailsLoopRef.current?.stop();
      actionsLoopRef.current?.stop();

      // Cleanup dos timeouts
      clearTimeout(detailsTimeout);
      clearTimeout(actionsTimeout);
    };
  }, [fetchBooking, providerFloatAnim, detailsFloatAnim, actionsFloatAnim, createAndStartFloatAnimation]);

  const onPressInButton = (animValue: Animated.Value) => {
    Animated.spring(animValue, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 3,
      tension: 100,
    }).start();
  };

  const onPressOutButton = (animValue: Animated.Value) => {
    Animated.spring(animValue, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    Alert.alert(
      'Cancelar Agendamento',
      'Tem certeza que deseja cancelar este agendamento? Esta ação pode estar sujeita a taxas dependendo da política de cancelamento.',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          onPress: async () => {
            console.log('[BookingDetailsScreen] Cancelando agendamento:', booking.id);
            setIsLoading(true);
            try {
              await cancelBooking(booking.id);
              Alert.alert('Sucesso', 'Agendamento cancelado com sucesso!');
              setBooking((prev) => (prev ? { ...prev, status: BookingStatus.CANCELLED } : null));
            } catch (err: any) {
              console.error('[BookingDetailsScreen] Erro ao cancelar agendamento:', err);
              Alert.alert('Erro', sanitizeText(err?.message || 'Não foi possível cancelar o agendamento.'));
            } finally {
              setIsLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleContactProvider = () => {
    if (!booking) return;
    router.push({
      pathname: '/(client)/messages',
      params: {
        providerId: booking.providerId,
        bookingId: booking.id,
        recipientName: sanitizeText(booking.providerFullName),
      },
    });
  };

  const handleReviewService = () => {
    if (!booking) return;
    router.push({
      pathname: '/(common)/feedback/[targetId]',
      params: {
        targetId: booking.id,
        type: 'service',
        serviceName: sanitizeText(booking.serviceName),
        providerName: sanitizeText(booking.providerFullName),
        providerId: booking.providerId,
      },
    });
  };

  const handleViewProviderProfile = () => {
    if (!booking) return;
    router.push({
      pathname: '/(client)/explore/[providerId]',
      params: {
        providerId: booking.providerId,
      },
    });
  };

  const handlePanic = useCallback(() => {
    Alert.alert(
      'Acionar Botão de Pânico',
      'Você tem certeza que deseja acionar o botão de pânico? Nossa equipe de segurança será notificada imediatamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Acionar',
          onPress: () => {
            setPanicStatus('RECEIVED');
            setTimeout(() => setPanicStatus('ACKED'), 3000);
            setTimeout(() => setPanicStatus('DISPATCHED'), 6000);
            setTimeout(() => setPanicStatus('CLOSED'), 10000);
            console.log('Botão de pânico acionado!');
          },
          style: 'destructive',
        },
      ]
    );
  }, []);

  const getStatusStyle = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return {
          text: 'CONFIRMADO',
          color: AppColors.successStandard,
          gradient: gradients.confirmed,
          icon: 'checkmark-circle-outline' as const,
          badgeBg: gradients.confirmed,
        };
      case BookingStatus.PENDING:
        return {
          text: 'PENDENTE',
          color: AppColors.warningYellow,
          gradient: gradients.pending,
          icon: 'time-outline' as const,
          badgeBg: gradients.pending,
        };
      case BookingStatus.PENDING_PROVIDER_CONFIRMATION:
        return {
          text: 'AGUARDANDO PROVEDOR',
          color: AppColors.warningYellow,
          gradient: gradients.pending,
          icon: 'hourglass-outline' as const,
          badgeBg: gradients.pending,
        };
      case BookingStatus.IN_PROGRESS:
        return {
          text: 'EM ANDAMENTO',
          color: AppColors.primaryInteractive,
          gradient: gradients.inProgress,
          icon: 'sync-circle-outline' as const,
          badgeBg: gradients.inProgress,
        };
      case BookingStatus.COMPLETED:
        return {
          text: 'CONCLUÍDO',
          color: AppColors.textAuxiliary,
          gradient: gradients.completed,
          icon: 'flag-outline' as const,
          badgeBg: gradients.completed,
        };
      case BookingStatus.CANCELLED:
        return {
          text: 'CANCELADO',
          color: AppColors.errorRed,
          gradient: gradients.cancelled,
          icon: 'close-circle-outline' as const,
          badgeBg: gradients.cancelled,
        };
      case BookingStatus.REJECTED:
        return {
          text: 'REJEITADO',
          color: AppColors.textAuxiliary,
          gradient: gradients.other,
          icon: 'alert-circle-outline' as const,
          badgeBg: gradients.other,
        };
      case BookingStatus.RESCHEDULED:
        return {
          text: 'REAGENDADO',
          color: '#6F42C1',
          gradient: gradients.rescheduled,
          icon: 'sync-outline' as const,
          badgeBg: gradients.rescheduled,
        };
      case BookingStatus.NO_SHOW:
        return {
          text: 'NÃO COMPARECEU',
          color: AppColors.textBody,
          gradient: gradients.other,
          icon: 'person-remove-outline' as const,
          badgeBg: gradients.other,
        };
      default:
        return {
          text: 'DESCONHECIDO',
          color: AppColors.mediumGray,
          gradient: gradients.other,
          icon: 'help-circle-outline' as const,
          badgeBg: gradients.other,
        };
    }
  };

  // Componente de header reutilizável para evitar repetição
  const renderHeader = (title: string) => (
    <Stack.Screen
      options={{
        title,
        headerTitleAlign: 'center',
        headerTitleStyle: { fontFamily: 'Montserrat-SemiBold' || 'System', fontSize: 20, color: AppColors.textBody },
        headerStyle: { backgroundColor: AppColors.white },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        headerTintColor: AppColors.primaryInteractive,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ paddingVertical: 10, paddingHorizontal: 12 }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={24} color={AppColors.primaryInteractive} />
          </TouchableOpacity>
        ),
      }}
    />
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: Platform.OS === 'ios' ? insets.top + 20 : 20 }]}>
        {renderHeader('Carregando...')}
        <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
        <Text style={styles.loadingText} maxFontSizeMultiplier={1.2}>
          Carregando detalhes do agendamento...
        </Text>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={[styles.centered, { paddingTop: Platform.OS === 'ios' ? insets.top + 20 : 20 }]}>
        {renderHeader('Erro')}
        <Ionicons name="alert-circle-outline" size={48} color={AppColors.errorRed} />
        <Text style={styles.errorText} maxFontSizeMultiplier={1.2}>
          {error || `Agendamento "${bookingId}" não encontrado.`}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.actionButton}>
          <Text style={styles.actionButtonText} maxFontSizeMultiplier={1.2}>
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isReviewed = !!booking.reviewId;
  const statusInfo = getStatusStyle(booking.status);

  // Sanitiza o endereço completo para evitar quebras
  const fullAddress = sanitizeText(
    `${booking.address.street}, ${booking.address.number}${booking.address.complement ? `, ${booking.address.complement}` : ''}, ${booking.address.neighborhood}, ${booking.address.city}-${booking.address.state} - CEP: ${booking.address.cep}`
  );

  // Debug
  if (__DEV__) console.log('[BookingDetails] Provider Avatar URL:', booking.providerAvatarUrl);

  return (
    <ScrollView
      style={[styles.scrollViewContainer, { paddingTop: Platform.OS === 'ios' ? insets.top + 10 : 10, paddingBottom: insets.bottom + 20 }]}
    >
      {renderHeader('Detalhes do Agendamento')}

      <Animated.View
        style={[
          styles.card,
          styles.providerSectionCard,
          {
            opacity: providerSectionAnim,
            transform: [
              { translateY: providerSectionAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
              { scale: providerSectionAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
              { translateY: providerFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
            ],
          },
        ]}
      >
        <BlurView intensity={Platform.OS === 'ios' ? 20 : 40} tint="light" style={StyleSheet.absoluteFillObject} />
        <LinearGradient
          colors={['#F9FBFF', '#E6F0FF'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.providerSection}>
          {renderProviderAvatar(booking.providerAvatarUrl, 80)}
          <View style={styles.providerInfo}>
            <Text style={styles.serviceNameText} numberOfLines={2}>
              {sanitizeText(booking.serviceName)}
            </Text>
            <Text style={styles.providerNameText} numberOfLines={2}>
              com {sanitizeText(booking.providerFullName)}
            </Text>
          </View>
          <LinearGradient
            colors={statusInfo.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusBadge}
          >
            <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]} numberOfLines={1}>
              {statusInfo.text}
            </Text>
          </LinearGradient>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.card,
          {
            opacity: detailsCardAnim,
            transform: [
              { scale: detailsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
              { translateY: detailsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
              { translateY: detailsFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
            ],
          },
        ]}
      >
        <BlurView intensity={Platform.OS === 'ios' ? 20 : 40} tint="light" style={StyleSheet.absoluteFillObject} />
        <LinearGradient
          colors={['#F9FBFF', '#E6F0FF'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Detalhes do Agendamento</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={20} color={AppColors.textAuxiliary} style={styles.icon} />
          <Text style={styles.detailLabel}>Data e Hora:</Text>
          <Text style={styles.detailValue}>
            {formatDateTime(booking.scheduledDate, booking.scheduledTime, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={20} color={AppColors.textAuxiliary} style={styles.icon} />
          <Text style={styles.detailLabel}>Endereço:</Text>
          <Text style={styles.detailValueAddress}>{fullAddress}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={20} color={AppColors.textAuxiliary} style={styles.icon} />
          <Text style={styles.detailLabel}>Valor:</Text>
          <Text style={[styles.detailValue, styles.priceText]}>{formatPriceBRL(booking.totalPrice)}</Text>
        </View>

        {booking.notes && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={20} color={AppColors.textAuxiliary} style={styles.icon} />
            <Text style={styles.detailLabel}>Observações:</Text>
            <Text style={styles.detailValue}>{sanitizeText(booking.notes)}</Text>
          </View>
        )}
      </Animated.View>

      <Animated.View
        style={[
          styles.actionsCard,
          {
            opacity: actionsCardAnim,
            transform: [
              { scale: actionsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
              { translateY: actionsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
              { translateY: actionsFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) },
            ],
          },
        ]}
      >
        <BlurView intensity={Platform.OS === 'ios' ? 20 : 40} tint="light" style={StyleSheet.absoluteFillObject} />
        <LinearGradient
          colors={['#F9FBFF', '#E6F0FF'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Ações</Text>
        </View>

        {isCancellableStatus(booking.status) && (
          <LinearGradient
            colors={['#FF6B6B', '#EE5A52'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.actionButton, styles.cancelButton, { transform: [{ scale: cancelButtonScaleAnim }] }]}
          >
            <TouchableOpacity
              style={styles.actionButtonInner}
              onPress={handleCancelBooking}
              onPressIn={() => onPressInButton(cancelButtonScaleAnim)}
              onPressOut={() => onPressOutButton(cancelButtonScaleAnim)}
              activeOpacity={1}
            >
              <Ionicons name="close-circle-outline" size={20} color={AppColors.white} />
              <Text style={styles.actionButtonText}>Cancelar Agendamento</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        <LinearGradient
          colors={['#4ECDC4', '#44A08D'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.actionButton, { transform: [{ scale: contactButtonScaleAnim }] }]}
        >
          <TouchableOpacity
            style={styles.actionButtonInner}
            onPress={handleContactProvider}
            onPressIn={() => onPressInButton(contactButtonScaleAnim)}
            onPressOut={() => onPressOutButton(contactButtonScaleAnim)}
            activeOpacity={1}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={AppColors.white} />
            <Text style={styles.actionButtonText}>
              Contatar {sanitizeText(booking.providerFullName.split(' ')[0])}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {isCompletedStatus(booking.status) && !isReviewed && (
          <LinearGradient
            colors={['#FFD93D', '#FEC200'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.actionButton, styles.reviewButton, { transform: [{ scale: reviewButtonScaleAnim }] }]}
          >
            <TouchableOpacity
              style={styles.actionButtonInner}
              onPress={handleReviewService}
              onPressIn={() => onPressInButton(reviewButtonScaleAnim)}
              onPressOut={() => onPressOutButton(reviewButtonScaleAnim)}
              activeOpacity={1}
            >
              <Ionicons name="star-outline" size={20} color={AppColors.white} />
              <Text style={styles.actionButtonText}>Avaliar Serviço</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        <LinearGradient
          colors={['#667eea', '#764ba2'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.actionButtonOutline, { transform: [{ scale: profileButtonScaleAnim }] }]}
        >
          <TouchableOpacity
            style={[styles.actionButtonInner, styles.actionButtonOutlineInner]}
            onPress={handleViewProviderProfile}
            onPressIn={() => onPressInButton(profileButtonScaleAnim)}
            onPressOut={() => onPressOutButton(profileButtonScaleAnim)}
            activeOpacity={1}
          >
            <Ionicons name="person-circle-outline" size={20} color={AppColors.primaryInteractive} />
            <Text style={[styles.actionButtonText, styles.actionButtonOutlineText]}>
              Ver Perfil de {sanitizeText(booking.providerFullName.split(' ')[0])}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContainer: {
    flex: 1,
    backgroundColor: AppColors.backgroundLight,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: AppColors.backgroundLight,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.textAuxiliary,
    fontFamily: 'Montserrat-Regular',
  },
  errorText: {
    fontSize: 16,
    color: AppColors.errorRed,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Montserrat-Regular',
    lineHeight: 22,
  },
  actionButton: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  actionButtonInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: AppColors.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    fontFamily: 'Montserrat-SemiBold',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
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
  providerSectionCard: {
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  providerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF4FF',
    borderWidth: 3,
    borderColor: AppColors.primaryInteractive,
  },
  providerImage: {
    borderWidth: 3,
    borderColor: AppColors.primaryInteractive,
  },
  providerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  serviceNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.textBody,
    marginBottom: 6,
    fontFamily: 'Montserrat-SemiBold',
  },
  providerNameText: {
    fontSize: 18,
    color: AppColors.textAuxiliary,
    fontFamily: 'Montserrat-Regular',
    lineHeight: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginLeft: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Montserrat-SemiBold',
  },
  sectionTitleContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.backgroundNeutral,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.textBody,
    fontFamily: 'Montserrat-SemiBold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  icon: {
    marginRight: 14,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 16,
    color: AppColors.textAuxiliary,
    fontWeight: '600',
    marginRight: 8,
    width: 110,
    fontFamily: 'Montserrat-Regular',
  },
  detailValue: {
    fontSize: 16,
    color: AppColors.textBody,
    flex: 1,
    fontFamily: 'Montserrat-Regular',
    lineHeight: 24,
  },
  detailValueAddress: {
    fontSize: 16,
    color: AppColors.textBody,
    flex: 1,
    lineHeight: 24,
    fontFamily: 'Montserrat-Regular',
  },
  priceText: {
    fontWeight: 'bold',
    color: AppColors.primaryInteractive,
    fontFamily: 'Montserrat-SemiBold',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontSize: 18,
  },
  actionsCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 40,
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
  cancelButton: {},
  reviewButton: {},
  actionButtonOutline: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: AppColors.primaryInteractive,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
    }),
  },
  actionButtonOutlineInner: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  actionButtonOutlineText: {
    color: AppColors.primaryInteractive,
    marginLeft: 12,
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 18,
  },
});