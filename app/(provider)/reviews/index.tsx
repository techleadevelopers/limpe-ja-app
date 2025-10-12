import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
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
} from 'react-native';

import { getMyProviderDashboard } from '../../../services/dashboardService';
import { ProviderDashboard, ProviderReview } from '../../../types/backend/providers';

// Reaproveitei tokens de design (cores / espaçamento) consistentes com a outra tela
const Colors = {
  primary: 'rgba(0,122,255,0.9)',
  bgSoft: '#E3F2FD',
  surface: '#FFFFFF',
  text: '#212529',
  textMuted: '#6C757D',
  textSubtle: '#868E96',
  success: '#2E7D32',
  border: '#E9ECEF',
  shadow: 'rgba(0,122,255,0.12)',
};

const Radii = { xl: 24, md: 12, pill: 999 };
const Spacing = { xs: 8, sm: 12, md: 18, lg: 24, xl: 32 };

// Small helpers
const ICON_PRIMARY = Colors.primary;
const TEXT_DARK = Colors.text;
const TEXT_MEDIUM = Colors.textMuted;
const TEXT_MUTED = Colors.textSubtle;
const WHITE = Colors.surface;
const BORDER_SUBTLE = Colors.border;
const SUCCESS_GREEN = Colors.success;
const SHADOW_COLOR_SECTION = Colors.shadow;

type FilterKey = 'all' | 'positive' | 'neutral' | 'negative';

// Extractors seguros (compatíveis com variações no backend)
const getClientName = (r: ProviderReview | any) =>
  r?.clientFullName || r?.clientName || r?.client?.fullName || 'Cliente';

const getClientId = (r: ProviderReview | any) => r?.clientId || r?.client?.id;
const getServiceName = (r: ProviderReview | any) => r?.serviceName || r?.serviceSnapshot?.name || undefined;
const getBookingId = (r: ProviderReview | any) => r?.bookingId;
const getCreatedAt = (r: ProviderReview | any) => r?.createdAt || r?.date || undefined;
const getAvatarUrl = (r: ProviderReview | any) => r?.avatarUrl || r?.client?.avatarUrl || undefined;
const getRating = (r: ProviderReview | any) => r?.rating ?? 0;
const getComment = (r: ProviderReview | any) => r?.comment || '';

// Filtros (sentimento)
const FILTERS: { key: FilterKey; label: string; test: (r: ProviderReview | any) => boolean }[] = [
  { key: 'all', label: 'Todos', test: () => true },
  { key: 'positive', label: 'Positivos', test: r => getRating(r) >= 4 },
  { key: 'neutral', label: 'Neutros', test: r => getRating(r) === 3 },
  { key: 'negative', label: 'Negativos', test: r => getRating(r) <= 2 },
];

// micro-hook para toque animado
const useAnimatedTouch = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, friction: 6 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 60 }).start();
  return { scaleAnim, onPressIn, onPressOut };
};

const ReviewItem: React.FC<{
  item: ProviderReview | any;
  onOpenBooking?: (bookingId?: string) => void;
  onMessageClient?: (clientId?: string, clientName?: string) => void;
  delay?: number;
}> = ({ item, onOpenBooking, onMessageClient, delay = 0 }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 320, delay, useNativeDriver: true }),
    ]).start();
  }, [fade, slide, delay]);

  const messageTouch = useAnimatedTouch();
  const detailsTouch = useAnimatedTouch();

  const rating = getRating(item);
  const stars = Array.from({ length: 5 }).map((_, i) => {
    const name = i < Math.floor(rating) ? 'star' : i < rating ? 'star-half' : 'star-outline';
    return <Ionicons key={i} name={name as any} size={14} color={ICON_PRIMARY} style={{ marginRight: 2 }} />;
  });

  const clientName = getClientName(item);
  const createdAt = getCreatedAt(item);
  const serviceName = getServiceName(item);

  return (
    <Animated.View style={[localStyles.reviewCard, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={localStyles.reviewHeader}>
        <View style={localStyles.clientRow}>
          <View style={localStyles.clientAvatar}>
            <Ionicons name="person-outline" size={18} color={TEXT_MEDIUM} />
          </View>
          <Text style={localStyles.clientName} numberOfLines={1}>
            {clientName}
          </Text>
        </View>

        <View style={localStyles.starsRow} accessibilityLabel={`Avaliação: ${rating} de 5`}>
          {stars}
        </View>
      </View>

      {!!getComment(item) && <Text style={localStyles.commentText}>{getComment(item)}</Text>}

      <View style={localStyles.metaRow}>
        <Ionicons name="calendar-outline" size={14} color={TEXT_MUTED} />
        <Text style={localStyles.metaText}>
          {createdAt ? new Date(createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '--'}
        </Text>

        {!!serviceName && (
          <>
            <Ionicons name="pricetag-outline" size={14} color={TEXT_MUTED} style={{ marginLeft: 8 }} />
            <Text style={[localStyles.metaText, { maxWidth: 160 }]} numberOfLines={1}>
              {serviceName}
            </Text>
          </>
        )}
      </View>

      <View style={localStyles.actionsRow}>
        <TouchableOpacity
          onPress={() => onMessageClient?.(getClientId(item), clientName)}
          onPressIn={messageTouch.onPressIn}
          onPressOut={messageTouch.onPressOut}
          style={[localStyles.pillButton, localStyles.pillButtonGhost]}
          accessibilityLabel={`Enviar mensagem para ${clientName}`}
        >
          <Animated.View style={{ flexDirection: 'row', alignItems: 'center', transform: [{ scale: messageTouch.scaleAnim }] }}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={ICON_PRIMARY} />
            <Text style={localStyles.pillGhostText}>Mensagem</Text>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onOpenBooking?.(getBookingId(item))}
          onPressIn={detailsTouch.onPressIn}
          onPressOut={detailsTouch.onPressOut}
          style={[localStyles.pillButton, localStyles.pillButtonPrimary]}
          accessibilityLabel="Abrir detalhes da reserva"
        >
          <Animated.View style={{ flexDirection: 'row', alignItems: 'center', transform: [{ scale: detailsTouch.scaleAnim }] }}>
            <Ionicons name="receipt-outline" size={18} color={WHITE} />
            <Text style={localStyles.pillPrimaryText}>Reserva</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const ReviewsScreen: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [data, setData] = useState<ProviderDashboard | (ProviderDashboard & any) | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const resp = await getMyProviderDashboard();
      setData(resp as any);
    } catch (e: any) {
      console.error('[Reviews] fetchData error:', e?.response?.data || e?.message);
      Alert.alert('Erro', 'Não foi possível carregar as avaliações no momento.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, [headerAnim]);

  const onRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await fetchData();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchData]);

  const reviews: (ProviderReview | any)[] = useMemo(() => ((data as any)?.reviews ?? (data as any)?.recentReviews ?? []), [data]);
  const avg: number = (data as any)?.averageRating ?? (data as any)?.avgRating ?? 0;
  const total: number = (data as any)?.totalReviews ?? reviews.length;

  const filtered = useMemo(() => {
    const f = FILTERS.find(f => f.key === filter)!;
    return reviews.filter(f.test);
  }, [reviews, filter]);

  const headerTouch = useAnimatedTouch();

  const handleOpenBooking = (bookingId?: string) => {
    if (!bookingId) return;
    router.push({ pathname: '/(provider)/active-booking/[bookingId]', params: { bookingId } } as any);
  };

  const handleMessage = (clientId?: string, clientName?: string) => {
    if (!clientId) return;
    router.push({ pathname: '/(provider)/messages/[chatId]', params: { chatId: clientId, recipientName: clientName || 'Cliente' } } as any);
  };

  return (
    <View style={localStyles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View
        style={[
          localStyles.customHeader,
          { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] as any },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          onPressIn={headerTouch.onPressIn}
          onPressOut={headerTouch.onPressOut}
          style={localStyles.headerBackButton}
          accessibilityLabel="Voltar"
        >
          <Animated.View style={{ transform: [{ scale: headerTouch.scaleAnim }] }}>
            <Ionicons name="arrow-back" size={24} color={WHITE} />
          </Animated.View>
        </TouchableOpacity>

        <Text style={localStyles.headerTitle}>Avaliações</Text>

        <View style={{ width: 28 }} />
      </Animated.View>

      {isLoading ? (
        <View style={localStyles.loadingContainer}>
          <ActivityIndicator size="large" color={ICON_PRIMARY} />
          <Text style={localStyles.loadingText}>Carregando avaliações…</Text>
        </View>
      ) : (
        <FlatList
          style={localStyles.list}
          contentContainerStyle={localStyles.listContent}
          data={filtered}
          keyExtractor={(it, index) => (it as any)?.id ?? String(index)}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={ICON_PRIMARY} />}
          ListHeaderComponent={
            <>
              <View style={localStyles.summaryCard}>
                <View style={localStyles.summaryRow}>
                  <View style={localStyles.summaryLeft}>
                    <Text style={localStyles.summaryTitle}>Avaliação média</Text>
                    <View style={localStyles.avgRow}>
                      <MaterialCommunityIcons name="star" size={22} color={SUCCESS_GREEN} />
                      <Text style={localStyles.avgValue}>{avg.toFixed(1)}</Text>
                      <Text style={localStyles.avgTotal}>({total})</Text>
                    </View>
                  </View>

                  <View style={localStyles.filterPillsRow}>
                    {FILTERS.map(f => (
                      <TouchableOpacity
                        key={f.key}
                        onPress={() => setFilter(f.key)}
                        style={[localStyles.filterPill, filter === f.key && localStyles.filterPillActive]}
                        accessibilityLabel={`Filtrar: ${f.label}`}
                      >
                        <Text style={[localStyles.filterPillText, filter === f.key && localStyles.filterPillTextActive]}>{f.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {filtered.length === 0 && (
                <View style={localStyles.emptyStateContainer}>
                  <Ionicons name="chatbubbles-outline" size={56} color={TEXT_MUTED} />
                  <Text style={localStyles.emptyTitle}>Ainda sem avaliações</Text>
                  <Text style={localStyles.emptySub}>Realize serviços e peça aos clientes que deixem uma avaliação.</Text>
                </View>
              )}
            </>
          }
          renderItem={({ item, index }) => (
            <ReviewItem item={item} delay={index * 40} onOpenBooking={handleOpenBooking} onMessageClient={handleMessage} />
          )}
        />
      )}
    </View>
  );
};

export default ReviewsScreen;

/* Styles locais, alinhados com o design tokens acima */
const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSoft,
  },
  customHeader: {
    ...Platform.select({
      ios: { paddingTop: 50 },
      android: { paddingTop: 30 },
      default: { paddingTop: 30 },
    }),
    paddingBottom: 14,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 4 },
    }),
  },
  headerBackButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '700',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgSoft,
  },
  loadingText: { marginTop: 8, color: TEXT_MEDIUM },

  list: { flex: 1 },
  listContent: { padding: Spacing.sm, paddingBottom: 24 },

  summaryCard: {
    backgroundColor: WHITE,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_SECTION, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLeft: { flexDirection: 'column' },
  summaryTitle: { fontSize: 14, color: TEXT_MEDIUM, marginBottom: 6, fontWeight: '600' },
  avgRow: { flexDirection: 'row', alignItems: 'center' },
  avgValue: { fontSize: 22, color: TEXT_DARK, fontWeight: '800', marginLeft: 8 },
  avgTotal: { fontSize: 12, color: TEXT_MUTED, marginLeft: 8 },

  filterPillsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },
  filterPillActive: {
    backgroundColor: 'rgba(0,122,255,0.06)',
    borderColor: Colors.primary,
  },
  filterPillText: { color: TEXT_MEDIUM, fontSize: 13, fontWeight: '600' },
  filterPillTextActive: { color: Colors.primary },

  emptyStateContainer: {
    backgroundColor: WHITE,
    borderRadius: Radii.md,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    marginBottom: Spacing.md,
  },
  emptyTitle: { marginTop: 12, fontWeight: '700', color: TEXT_DARK, fontSize: 16 },
  emptySub: { color: TEXT_MUTED, marginTop: 6, textAlign: 'center' },

  reviewCard: {
    backgroundColor: WHITE,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  clientRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },
  clientName: { color: TEXT_DARK, fontWeight: '700', maxWidth: '70%' },
  starsRow: { flexDirection: 'row', alignItems: 'center' },

  commentText: { color: TEXT_DARK, lineHeight: 20, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  metaText: { color: TEXT_MUTED, fontSize: 12, marginLeft: 4 },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pillButton: {
    height: 40,
    borderRadius: Radii.pill,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  pillButtonGhost: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },
  pillGhostText: { marginLeft: 8, color: Colors.primary, fontWeight: '700' },
  pillButtonPrimary: { backgroundColor: Colors.primary },
  pillPrimaryText: { marginLeft: 8, color: WHITE, fontWeight: '700' },
});