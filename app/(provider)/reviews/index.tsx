// app/(provider)/reviews/index.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const WHITE = '#FFFFFF';
const BACKGROUND_ALT = '#F8F9FD';
const TEXT_DARK = '#1A2538';
const TEXT_MEDIUM = '#4A5568';
const TEXT_MUTED = '#7A8599';
const ICON_PRIMARY = '#007AFF';
const SUCCESS_GREEN = '#28a745';
const BORDER_SUBTLE = 'rgba(0,0,0,0.08)';
const SHADOW_COLOR_SECTION = 'rgba(0, 0, 0, 0.1)';

type FilterKey = 'all' | 'positive' | 'neutral' | 'negative';

// Funções de extração seguras (adaptam aos nomes reais do seu backend)
const getClientName = (r: ProviderReview | any) =>
  r?.clientFullName || r?.clientName || r?.client?.fullName || 'Client';

const getClientId = (r: ProviderReview | any) =>
  r?.clientId || r?.client?.id;

const getServiceName = (r: ProviderReview | any) =>
  r?.serviceName || r?.serviceSnapshot?.name || undefined;

const getBookingId = (r: ProviderReview | any) => r?.bookingId;

const getCreatedAt = (r: ProviderReview | any) =>
  r?.createdAt || r?.date || undefined;

const getAvatarUrl = (r: ProviderReview | any) =>
  r?.avatarUrl || r?.client?.avatarUrl || undefined;

const getRating = (r: ProviderReview | any) => r?.rating ?? 0;

const getComment = (r: ProviderReview | any) => r?.comment || '';

// Filtro por sentimento
const FILTERS: { key: FilterKey; label: string; test: (r: ProviderReview | any) => boolean }[] = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'positive', label: 'Positive', test: r => getRating(r) >= 4 },
  { key: 'neutral', label: 'Neutral', test: r => getRating(r) === 3 },
  { key: 'negative', label: 'Negative', test: r => getRating(r) <= 2 },
];

// Micro hook de toque com spring
const useAnimatedTouch = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, friction: 5 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5, tension: 40 }).start();
  };
  return { scaleAnim, onPressIn, onPressOut };
};

const ReviewItem: React.FC<{
  item: ProviderReview | any;
  onOpenBooking?: (bookingId?: string) => void;
  onMessageClient?: (clientId?: string, clientName?: string) => void;
  delay?: number;
}> = ({ item, onOpenBooking, onMessageClient, delay = 0 }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
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
    <Animated.View style={[styles.reviewCard, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={styles.reviewHeader}>
        <View style={styles.clientRow}>
          <View style={styles.clientAvatar}>
            <Ionicons name="person-outline" size={18} color={TEXT_MEDIUM} />
          </View>
          <Text style={styles.clientName} numberOfLines={1}>
            {clientName}
          </Text>
        </View>
        <View style={styles.starsRow}>{stars}</View>
      </View>

      {!!getComment(item) && <Text style={styles.commentText}>{getComment(item)}</Text>}

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={14} color={TEXT_MUTED} />
        <Text style={styles.metaText}>
          {createdAt
            ? new Date(createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
            : '--'}
        </Text>
        {!!serviceName && (
          <>
            <Ionicons name="pricetag-outline" size={14} color={TEXT_MUTED} style={{ marginLeft: 8 }} />
            <Text style={styles.metaText} numberOfLines={1}>{serviceName}</Text>
          </>
        )}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={() => onMessageClient?.(getClientId(item), clientName)}
          onPressIn={messageTouch.onPressIn}
          onPressOut={messageTouch.onPressOut}
          style={[styles.pillButton, styles.pillButtonGhost]}
          accessibilityLabel="Open chat with client"
        >
          <Animated.View style={{ flexDirection: 'row', alignItems: 'center', transform: [{ scale: messageTouch.scaleAnim }] }}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={ICON_PRIMARY} />
            <Text style={styles.pillGhostText}>Message</Text>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onOpenBooking?.(getBookingId(item))}
          onPressIn={detailsTouch.onPressIn}
          onPressOut={detailsTouch.onPressOut}
          style={[styles.pillButton, styles.pillButtonPrimary]}
          accessibilityLabel="Open booking details"
        >
          <Animated.View style={{ flexDirection: 'row', alignItems: 'center', transform: [{ scale: detailsTouch.scaleAnim }] }}>
            <Ionicons name="receipt-outline" size={18} color={WHITE} />
            <Text style={styles.pillPrimaryText}>Booking</Text>
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
      Alert.alert('Error', 'Unable to load your reviews right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [headerAnim]);

  const onRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await fetchData();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchData]);

  // Torna robusto aos diferentes formatos vindos do dashboard
  const reviews: (ProviderReview | any)[] = useMemo(
    () => ((data as any)?.reviews ?? (data as any)?.recentReviews ?? []),
    [data]
  );

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
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Cabeçalho compacto com gradiente e botão voltar (consistente com o estilo do app) */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          onPressIn={headerTouch.onPressIn}
          onPressOut={headerTouch.onPressOut}
          style={styles.headerBackButton}
          accessibilityLabel="Back"
        >
          <Animated.View style={{ transform: [{ scale: headerTouch.scaleAnim }] }}>
            <Ionicons name="arrow-back" size={24} color={WHITE} />
          </Animated.View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ICON_PRIMARY} />
          <Text style={styles.loadingText}>Loading reviews…</Text>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={filtered}
          keyExtractor={(it, index) => (it as any)?.id ?? String(index)}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={ICON_PRIMARY} />}
          ListHeaderComponent={
            <>
              {/* Resumo superior */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryLeft}>
                    <Text style={styles.summaryTitle}>Average rating</Text>
                    <View style={styles.avgRow}>
                      <MaterialCommunityIcons name="star" size={22} color={SUCCESS_GREEN} />
                      <Text style={styles.avgValue}>{avg.toFixed(1)}</Text>
                      <Text style={styles.avgTotal}>({total})</Text>
                    </View>
                  </View>
                  <View style={styles.filterPillsRow}>
                    {FILTERS.map(f => (
                      <TouchableOpacity
                        key={f.key}
                        onPress={() => setFilter(f.key)}
                        style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
                        accessibilityLabel={`Filter ${f.label}`}
                      >
                        <Text style={[styles.filterPillText, filter === f.key && styles.filterPillTextActive]}>{f.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Estado vazio para o filtro atual */}
              {filtered.length === 0 && (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="chatbubbles-outline" size={56} color={TEXT_MUTED} />
                  <Text style={styles.emptyTitle}>No reviews here yet</Text>
                  <Text style={styles.emptySub}>Complete services and ask clients to leave feedback.</Text>
                </View>
              )}
            </>
          }
          renderItem={({ item, index }) => (
            <ReviewItem
              item={item}
              delay={index * 40}
              onOpenBooking={handleOpenBooking}
              onMessageClient={handleMessage}
            />
          )}
        />
      )}
    </View>
  );
};

export default ReviewsScreen;

// -------------------- styles --------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_ALT,
  },
  customHeader: {
    ...Platform.select({
      ios: { paddingTop: 50 },
      android: { paddingTop: 30 },
      default: { paddingTop: 30 },
    }),
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: ICON_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  headerBackButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    backgroundColor: BACKGROUND_ALT,
  },
  loadingText: { marginTop: 8, color: TEXT_MUTED },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 24 },

  summaryCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_SECTION, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLeft: { flexDirection: 'column' },
  summaryTitle: { fontSize: 14, color: TEXT_MEDIUM, marginBottom: 4, fontWeight: '600' },
  avgRow: { flexDirection: 'row', alignItems: 'center' },
  avgValue: { fontSize: 22, color: TEXT_DARK, fontWeight: '800', marginLeft: 6 },
  avgTotal: { fontSize: 12, color: TEXT_MUTED, marginLeft: 6 },

  filterPillsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },
  filterPillActive: {
    backgroundColor: '#EBF5FF',
    borderColor: ICON_PRIMARY,
  },
  filterPillText: { color: TEXT_MEDIUM, fontSize: 12, fontWeight: '600' },
  filterPillTextActive: { color: ICON_PRIMARY },

  emptyStateContainer: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    marginBottom: 12,
  },
  emptyTitle: { marginTop: 12, fontWeight: '700', color: TEXT_DARK, fontSize: 16 },
  emptySub: { color: TEXT_MUTED, marginTop: 4, textAlign: 'center' },

  reviewCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  clientRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  clientAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BACKGROUND_ALT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },
  clientName: { color: TEXT_DARK, fontWeight: '700', maxWidth: '85%' },
  starsRow: { flexDirection: 'row', alignItems: 'center' },
  commentText: { color: TEXT_DARK, lineHeight: 18, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  metaText: { color: TEXT_MUTED, fontSize: 12, marginLeft: 4 },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pillButton: {
    height: 36,
    borderRadius: 999,
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
  pillGhostText: { marginLeft: 6, color: ICON_PRIMARY, fontWeight: '700' },
  pillButtonPrimary: { backgroundColor: ICON_PRIMARY },
  pillPrimaryText: { marginLeft: 6, color: WHITE, fontWeight: '700' },
});
