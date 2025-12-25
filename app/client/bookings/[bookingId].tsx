import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cancelBooking, getBookingDetails } from '../../../services/bookingService';
import { getProviderDetails } from '../../../services/providerService';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
import { formatDateTime, formatPriceBRL, sanitizeText } from '../../../utils/formatters';
import { normalizeBooking } from '../../../utils/normalize';
import { alertUserError, setSafeError } from '../../_shared/errors/uiFeedback';

import { useDevice } from '@/utils/responsive';
import { AppColors } from '../../../constants/appStyles';
import { fix } from '../../../utils/platformFix';

import ProviderServicesInline from '../../../components/booking/ProviderServicesInline';
import TutorialOverlay from '../../../components/ui/TutorialOverlay';
import { useProviderServices } from '../../../hooks/useProviderServices';
import { useTutorial } from '../../../hooks/useTutorial';

// =============================================================================
// Helpers de status / cores
// =============================================================================

const UI = {
  bg: '#F4F6FA',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  accent: '#2563EB',
  danger: '#EF4444',
} as const;

type StatusVisual = {
  label: string;
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function getStatusVisual(status: BookingStatus): StatusVisual {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return { label: 'Confirmado', color: '#16A34A', bg: 'rgba(22,163,74,0.08)', icon: 'checkmark-circle' };
    case BookingStatus.PENDING:
    case BookingStatus.PENDING_PROVIDER_CONFIRMATION:
      return { label: 'Pendente', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: 'time' };
    case BookingStatus.IN_PROGRESS:
      return { label: 'Em andamento', color: UI.accent, bg: 'rgba(37,99,235,0.10)', icon: 'sync' };
    case BookingStatus.COMPLETED:
      return { label: 'Concluído', color: '#4B5563', bg: '#E5E7EB', icon: 'flag' };
    case BookingStatus.CANCELLED:
      return { label: 'Cancelado', color: UI.danger, bg: 'rgba(239,68,68,0.10)', icon: 'close-circle' };
    case BookingStatus.RESCHEDULED:
      return { label: 'Reagendado', color: '#7C3AED', bg: 'rgba(124,58,237,0.10)', icon: 'sync' };
    case BookingStatus.NO_SHOW:
      return { label: 'Não compareceu', color: '#111827', bg: '#E5E7EB', icon: 'person-remove' };
    case BookingStatus.REJECTED:
      return { label: 'Rejeitado', color: '#6B7280', bg: '#E5E7EB', icon: 'alert-circle' };
    default:
      return { label: 'Desconhecido', color: '#6B7280', bg: '#E5E7EB', icon: 'help-circle' };
  }
}

const getStatusMessage = (status: BookingStatus): string | null => {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return 'Profissional confirmado. Acompanhe pelo chat.';
    case BookingStatus.IN_PROGRESS:
      return 'Profissional a caminho ou em serviço.';
    case BookingStatus.COMPLETED:
      return 'Serviço concluído — avalie agora.';
    default:
      return null;
  }
};

const isCancellableStatus = (s: BookingStatus) =>
  s === BookingStatus.CONFIRMED || s === BookingStatus.PENDING || s === BookingStatus.PENDING_PROVIDER_CONFIRMATION;
const isCompletedStatus = (s: BookingStatus) => s === BookingStatus.COMPLETED;

// =============================================================================
// Header (igual Meus Agendamentos)
// =============================================================================

function HeaderBar({ router, insets }: { router: any; insets: any }) {
  return (
    <View style={[styles.headerContainer, fix.blurBg, { paddingTop: fix.padTop(insets.top + 4, insets.top + 18) }]}>
      <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={UI.textPrimary} style={styles.iconAdjust} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fix.font(17) }]} numberOfLines={1}>
          Detalhes do agendamento
        </Text>
        <View style={styles.headerBtn} />
      </View>
    </View>
  );
}

// =============================================================================
// ProviderCard (compacto, igual card da listagem)
// =============================================================================

function ProviderCard({ booking, provider }: { booking: BookingDetails; provider: any }) {
  const status = getStatusVisual(booking.status);
  const statusMessage = getStatusMessage(booking.status);
  const avatarUrl = provider?.avatarUrl || booking.providerAvatarUrl;
  const providerName = provider?.fullName || booking.providerFullName;

  return (
    <>
      <View style={styles.providerCard}>
        <View style={styles.providerLeft}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person-circle-outline" size={54} color="#94A3B8" style={styles.iconAdjust} />
          )}

          <View>
            <Text style={styles.serviceName} numberOfLines={1}>
              {sanitizeText(booking.serviceName)}
            </Text>
            <Text style={styles.providerName} numberOfLines={1}>
              Com {sanitizeText(providerName)}
            </Text>
          </View>
        </View>

        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={14} color={status.color} style={styles.iconAdjust} />
          <Text style={[styles.statusText, { color: status.color }]} numberOfLines={1}>
            {status.label}
          </Text>
        </View>
      </View>
      {statusMessage && (
        <View style={[styles.statusBanner, { backgroundColor: status.bg, borderColor: status.color }]}>
          <Ionicons name="information-circle-outline" size={16} color={status.color} style={styles.iconAdjust} />
          <Text style={[styles.statusBannerText, { color: status.color }]}>{statusMessage}</Text>
        </View>
      )}
    </>
  );
}

// =============================================================================
// DetailsCard (único card, clean)
// =============================================================================

function DetailsCard({
  booking,
  onCopy,
  onOpenMap,
}: {
  booking: BookingDetails;
  onCopy: () => void;
  onOpenMap: () => void;
}) {
  const addr = booking.address;

  return (
    <View style={styles.detailsCard}>
      {/* Data & hora */}
      <View style={styles.detailItem}>
        <Ionicons name="calendar-outline" size={20} color={UI.textSecondary} style={styles.iconAdjust} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.detailLabel}>Data & hora</Text>
          <Text style={styles.detailValue}>
            {formatDateTime(
              booking.scheduledDate,
              booking.scheduledTime,
              { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
            )}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Endereço */}
      <View style={styles.detailItem}>
        <Ionicons name="location-outline" size={20} color={UI.textSecondary} style={styles.iconAdjust} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.detailLabel}>Local do serviço</Text>
          <Text style={styles.detailValue}>
            {sanitizeText(`${addr.street}, ${addr.number}${addr.complement ? `, ${addr.complement}` : ''}`)}
            {'\n'}
            {sanitizeText(`${addr.neighborhood}, ${addr.city} - ${addr.state}`)}
            {'\n'}
            CEP: {addr.cep}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Valor */}
      <View style={styles.detailItem}>
        <Ionicons name="cash-outline" size={20} color={UI.textSecondary} style={styles.iconAdjust} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.detailLabel}>Valor</Text>
          <Text style={styles.detailPrice}>{formatPriceBRL(booking.totalPrice)}</Text>
        </View>
      </View>

      {/* Observações */}
      {booking.notes && (
        <>
          <View style={styles.divider} />
          <View style={styles.detailItem}>
            <Ionicons name="document-text-outline" size={20} color={UI.textSecondary} style={styles.iconAdjust} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.detailLabel}>Observações</Text>
              <Text style={styles.detailValue}>{sanitizeText(booking.notes)}</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

// =============================================================================
// ActionsCard — versão PREMIUM OFICIAL (única)
// =============================================================================

function ActionsCard({
  booking,
  onCancel,
  onContact,
  onReview,
  onViewProfile,
}: {
  booking: BookingDetails;
  onCancel: () => void;
  onContact: () => void;
  onReview: () => void;
  onViewProfile: () => void;
}) {
  const firstName = booking.providerFullName.split(" ")[0];
  const canCancel = isCancellableStatus(booking.status);
  const canReview =
    isCompletedStatus(booking.status) &&
    !(booking.isReviewed || booking.reviewId);

  return (
    <View style={premium.card}>
      <Text style={premium.title}>Ações</Text>

      {/* Contatar (ação principal) */}
      <TouchableOpacity
        style={[premium.button, premium.primaryButton]}
        onPress={() => {
          if (Platform.OS === 'ios') Haptics.selectionAsync();
          onContact();
        }}
        activeOpacity={0.9}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" style={styles.iconAdjust} />
        <Text style={premium.primaryText}>Contatar {firstName}</Text>
      </TouchableOpacity>

      {/* Avaliar */}
      {canReview && (
        <TouchableOpacity
          style={[premium.button, premium.lightButton]}
          onPress={() => {
            if (Platform.OS === 'ios') Haptics.selectionAsync();
            onReview();
          }}
          activeOpacity={0.9}
        >
          <Ionicons name="star-outline" size={20} color={UI.accent} style={styles.iconAdjust} />
          <Text style={premium.lightText}>Avaliar serviço</Text>
        </TouchableOpacity>
      )}

      {/* Ver perfil */}
      <TouchableOpacity
        style={[premium.button, premium.lightButton]}
        onPress={() => {
          if (Platform.OS === 'ios') Haptics.selectionAsync();
          onViewProfile();
        }}
        activeOpacity={0.9}
      >
        <Ionicons name="person-circle-outline" size={20} color={UI.accent} style={styles.iconAdjust} />
        <Text style={premium.lightText}>Ver perfil de {firstName}</Text>
      </TouchableOpacity>

      {/* Cancelar (secundário, menos evidente) */}
      {canCancel && (
        <TouchableOpacity
          style={[premium.button, premium.dangerButton]}
          onPress={() => {
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onCancel();
          }}
          activeOpacity={0.9}
        >
          <Ionicons name="close-circle-outline" size={20} color={UI.danger} style={styles.iconAdjust} />
          <Text style={premium.dangerText}>Cancelar agendamento</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// =============================================================================
// ReviewSheet (modal de avaliação)
// =============================================================================

function ReviewSheet({
  visible,
  onClose,
  booking,
  router,
}: {
  visible: boolean;
  onClose: () => void;
  booking: BookingDetails;
  router: any;
}) {
  useEffect(() => {
    if (visible && Platform.OS === 'ios') {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.reviewOverlay}>
        <View style={styles.reviewSheet}>
          <Text style={styles.reviewTitle}>Como foi sua limpeza?</Text>
          <Text style={styles.reviewSubtitle}>
            Avalie sua experiência para mantermos o padrão premium do LimpeJá.
          </Text>

          <View style={styles.reviewButtonsRow}>
            <TouchableOpacity
              style={styles.reviewPrimaryBtn}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  try { Haptics.selectionAsync(); } catch {}
                }
                onClose();
                router.push({
                  pathname: '/common/feedback/[targetId]',
                  params: {
                    targetId: booking.id,
                    type: 'service',
                    serviceName: sanitizeText(booking.serviceName),
                    providerName: sanitizeText(booking.providerFullName),
                    providerId: booking.providerId,
                  },
                } as any);
              }}
            >
              <Text style={styles.reviewPrimaryText}>Avaliar agora</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reviewSecondaryBtn}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  try { Haptics.selectionAsync(); } catch {}
                }
                onClose();
              }}
            >
              <Text style={styles.reviewSecondaryText}>Depois</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// =============================================================================
// TELA PRINCIPAL
// =============================================================================

export default function BookingDetailsScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLargePhone } = useDevice();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewSheet, setShowReviewSheet] = useState(false);
  const lastStatusRef = useRef<BookingStatus | null>(null);

  const { services: providerServices } = useProviderServices(booking?.providerId);
  const bookingActionsTutorial = useTutorial('booking_details_actions');

  const loadBooking = useCallback(async () => {
    try {
      if (!bookingId) {
        setError('ID do agendamento não fornecido.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);

      const raw = await getBookingDetails(bookingId);
      const normalized = normalizeBooking(raw);
      setBooking(normalized);

      try {
        const providerData = await getProviderDetails(normalized.providerId);
        setProvider(providerData);
      } catch (err) {
        console.log('Erro fetch provider:', err);
      }

      const completed = normalized.status === BookingStatus.COMPLETED;
      const alreadyReviewed = !!(normalized.isReviewed || normalized.reviewId);
      if (completed && !alreadyReviewed) setShowReviewSheet(true);
    } catch (err: any) {
      console.error('Erro ao carregar agendamento:', err);
      setSafeError(setError, err);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  useEffect(() => {
    const status = booking?.status;
    if (!status) return;
    const relevant = [
      BookingStatus.CONFIRMED,
      BookingStatus.IN_PROGRESS,
      BookingStatus.COMPLETED,
    ];
    if (lastStatusRef.current !== status && relevant.includes(status)) {
      if (Platform.OS === 'ios') {
        try { Haptics.selectionAsync(); } catch {}
      }
    }
    lastStatusRef.current = status;
  }, [booking?.status]);

  // Tutorial contextual: explica rapidamente as ações da tela
  useEffect(() => {
    if (booking && bookingActionsTutorial.isReady && !bookingActionsTutorial.hasSeen) {
      bookingActionsTutorial.show();
    }
  }, [booking, bookingActionsTutorial.isReady, bookingActionsTutorial.hasSeen, bookingActionsTutorial.show]);

  // Handlers
  const handleCancel = () => {
    if (!booking) return;
    Alert.alert(
      'Cancelar agendamento',
      'Deseja cancelar este agendamento? Dependendo da política, taxas podem ser aplicadas.',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
            onPress: async () => {
              try {
                setIsLoading(true);
                await cancelBooking(booking.id);
                setBooking((prev) => (prev ? { ...prev, status: BookingStatus.CANCELLED } : prev));
              } catch (err: any) {
                alertUserError(err, 'Erro ao cancelar o agendamento');
              } finally {
                setIsLoading(false);
              }
            },
        },
      ],
    );
  };

  const handleContact = () => {
    if (!booking) return;
    router.push({
      pathname: '/client/messages',
      params: {
        providerId: booking.providerId,
        bookingId: booking.id,
        recipientName: sanitizeText(booking.providerFullName),
      },
    } as any);
  };

  const handleReview = () => {
    if (!booking) return;
    router.push({
      pathname: '/common/feedback/[targetId]',
      params: {
        targetId: booking.id,
        type: 'service',
        serviceName: sanitizeText(booking.serviceName),
        providerName: sanitizeText(booking.providerFullName),
        providerId: booking.providerId,
      },
    } as any);
  };

  const handleViewProfile = () => {
    if (!booking) return;
    router.push({
      pathname: '/client/explore/[providerId]',
      params: { providerId: booking.providerId },
    } as any);
  };

  const handleCopyAddress = () => {
    if (!booking) return;
    const a = booking.address;
    const text = `${a.street}, ${a.number}${a.complement ? `, ${a.complement}` : ''} - ${a.neighborhood}, ${a.city} - ${a.state}, ${a.cep}`;
    Clipboard.setStringAsync(text);
  };

  const handleOpenMaps = () => {
    if (!booking) return;
    const a = booking.address;
    const query = encodeURIComponent(
      `${a.street}, ${a.number} ${a.complement || ''}, ${a.neighborhood}, ${a.city} - ${a.state}, ${a.cep}`,
    );
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() => Alert.alert('Não foi possível abrir o mapa'));
  };

  const handleSelectService = (serviceId: string) => {
    if (!booking) return;
    router.push({
      pathname: '/client/bookings/schedule-service',
      params: { providerId: booking.providerId, serviceId },
    } as any);
  };

  // STATES DE LOADING / ERRO
  if (isLoading && !booking) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={UI.accent} />
        <Text style={styles.loadingText}>Carregando detalhes do agendamento...</Text>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="alert-circle-outline" size={48} color={UI.danger} />
        <Text style={styles.errorText}>{error || 'Agendamento não encontrado.'}</Text>
        {/* Usando o estilo de botão Premium para a ação de Voltar */}
        <TouchableOpacity style={[premium.button, premium.primaryButton]} onPress={() => router.back()}>
          <Text style={premium.primaryText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // TELA PRINCIPAL
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={[styles.container]} overScrollMode="never" showsVerticalScrollIndicator={false}>
        <HeaderBar router={router} insets={useSafeAreaInsets()} />

        <View style={[styles.contentWrapper, isLargePhone && { alignSelf: 'center', width: '100%', maxWidth: 820 }]}>
          <ProviderCard booking={booking} provider={provider} />
          <DetailsCard booking={booking} onCopy={handleCopyAddress} onOpenMap={handleOpenMaps} />
          <ActionsCard
            booking={booking}
            onCancel={handleCancel}
            onContact={handleContact}
            onReview={handleReview}
            onViewProfile={handleViewProfile}
          />

          <ProviderServicesInline data={providerServices} onSelect={handleSelectService} />
        </View>
      </ScrollView>

      <ReviewSheet
        visible={showReviewSheet}
        onClose={() => setShowReviewSheet(false)}
        booking={booking}
        router={router}
      />

      <TutorialOverlay
        visible={bookingActionsTutorial.isVisible}
        title="Ações do seu agendamento"
        subtitle={
          `Use o chat para falar com ${sanitizeText((booking?.providerFullName || '').split(' ')[0] || 'o profissional')}.\n\n` +
          'Se precisar, Você pode cancelar pelo botão "Cancelar agendamento".'
        }
        iconName="chatbubble-ellipses-outline"
        onConfirm={bookingActionsTutorial.markSeen}
      />
    </>
  );
}

// =============================================================================
// ESTILOS
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.bg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: UI.bg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: UI.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    marginVertical: 16,
    fontSize: 16,
    color: UI.danger,
    textAlign: 'center',
  },

  headerContainer: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.96)',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(15,23,42,0.15)',
        shadowRadius: 10,
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 0.5,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  headerBtn: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: UI.textPrimary,
  },

  contentWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },

  // ProviderCard
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(15,23,42,0.10)',
        shadowRadius: 10,
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 0.5,
      },
    }),
  },
  providerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: AppColors.backgroundNeutral,
    marginRight: 12,
  },
  serviceName: {
    fontSize: fix.font(16),
    fontWeight: '700',
    color: AppColors.textBody,
  },
  providerName: {
    fontSize: 14,
    color: AppColors.textAuxiliary,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    gap: 6,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // DetailsCard
  detailsCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(15,23,42,0.08)',
        shadowRadius: 8,
        shadowOpacity: 0.16,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 0.5,
      },
    }),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: UI.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: UI.textPrimary,
    lineHeight: 20,
  },
  detailPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: UI.accent,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  detailButtonsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 8 : 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  pillBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: UI.accent,
  },

  // ReviewSheet
  reviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'flex-end',
  },
  reviewSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
  },
  reviewTitle: {
    fontSize: fix.font(18),
    fontWeight: '700',
    color: UI.textPrimary,
    marginBottom: 6,
  },
  reviewSubtitle: {
    fontSize: 14,
    color: UI.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  reviewButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reviewPrimaryBtn: {
    flex: 1,
    backgroundColor: UI.accent,
    borderRadius: 10,
    paddingVertical: Platform.OS === 'android' ? 14 : 12,
    alignItems: 'center',
  },
  reviewPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reviewSecondaryBtn: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: Platform.OS === 'android' ? 14 : 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewSecondaryText: {
    color: UI.textPrimary,
    fontWeight: '700',
  },
  iconAdjust: { transform: [{ translateY: Platform.OS === 'android' ? 1 : 0 }] },
});

// =============================================================================
// ESTILOS PREMIUM PARA AÃƒâ€¡Ãƒâ€¢ES (Renomeado para 'premium' para uso exclusivo do ActionsCard)
// =============================================================================

const premium = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.08)",
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 0.5 },
    }),
  },

  title: {
    fontSize: fix.font(16),
    fontWeight: "700",
    color: UI.textPrimary,
    marginBottom: 12,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: Platform.OS === 'android' ? 14 : 12,
    marginBottom: 10,
  },

  // Danger
  dangerButton: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  dangerText: {
    color: UI.danger,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },

  // Primary
  primaryButton: {
    backgroundColor: "#4285F4",
  },
  primaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },

  // Light
  lightButton: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#CBD5FF",
  },
  lightText: {
    color: UI.accent,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
});

