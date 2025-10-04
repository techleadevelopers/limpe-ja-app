import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// =============================================================
// 3D ICONS (seguir mesmo pacote do menu)
// =============================================================
const Icons3D = {
  support: require('@3d/support.png'),
};

// =============================================================
// API (usa instância centralizada do projeto)
// =============================================================
import { api } from '../../../services/api';

// Tipos mínimos para alinhar ao backend de tickets (flexível)
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
export type TicketSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type TicketCategory = 'PAYMENT' | 'BOOKING' | 'ACCOUNT' | 'TECHNICAL' | 'SAFETY' | 'OTHER';

export interface SupportTicket {
  id: string;
  subject: string;
  category: TicketCategory;
  severity?: TicketSeverity;
  message: string;
  bookingId?: string | null;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketDto {
  subject: string;
  message: string;
  category: TicketCategory;
  severity?: TicketSeverity;
  bookingId?: string;
  attachments?: string[]; // storageKeys
}

// =============================================================
// UI — Cabeçalho com mesmo tema do schedule (gradiente + abas pílula)
// =============================================================
const HEADER_TOP = Platform.OS === 'ios' ? 56 : 28;

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <LinearGradient
        colors={["#6AA8FF", "#4A7FF3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <StatusBar barStyle="light-content" />
        <View style={{ height: HEADER_TOP }} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          <Text numberOfLines={1} style={styles.headerTitle}>{title}</Text>

          <View style={styles.iconRightWrap}>
            <Image source={Icons3D.support} style={styles.icon3d} />
          </View>
        </View>

        {/* pílulas decorativas para coerência visual */}
        <View style={styles.tabsPill}>
          <View style={[styles.tabItem, styles.tabItemActive]}>
            <Text style={styles.tabActiveText}>SUPORTE</Text>
          </View>
          <View style={[styles.tabItem, styles.tabItemGhost]}>
            <Text style={styles.tabGhostText}>AJUDA</Text>
          </View>
          <View style={[styles.tabItem, styles.tabItemGhost]}>
            <Text style={styles.tabGhostText}>SEGURANÇA</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// =============================================================
// Animated background — bolhas brand (suave, pouco custo)
// =============================================================
function AnimatedBackdrop() {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop1 = Animated.loop(Animated.sequence([
      Animated.timing(a1, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(a1, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const loop2 = Animated.loop(Animated.sequence([
      Animated.timing(a2, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(a2, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop1.start();
    loop2.start();
    return () => { loop1.stop(); loop2.stop(); };
  }, [a1, a2]);

  const t1 = a1.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const t2 = a2.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.blob, { top: -40, left: -20, transform: [{ translateY: t1 }, { scale: 1.1 }] }]} />
      <Animated.View style={[styles.blob2, { bottom: -60, right: -30, transform: [{ translateY: t2 }, { scale: 1.05 }] }]} />
    </View>
  );
}

// =============================================================
// Serviços HTTP
// =============================================================
async function fetchMyTickets(): Promise<SupportTicket[]> {
  const { data } = await api.get('/support/tickets', { params: { mine: true } });
  return data?.items ?? data ?? [];
}

async function createTicket(dto: CreateTicketDto): Promise<SupportTicket> {
  const { data } = await api.post('/support/tickets', dto);
  return data;
}

// (Opcional) buscar metadados
async function fetchMeta(): Promise<{ categories: TicketCategory[]; severities: TicketSeverity[] }> {
  try {
    const { data } = await api.get('/support/meta');
    return {
      categories: data?.categories ?? ['PAYMENT', 'BOOKING', 'ACCOUNT', 'TECHNICAL', 'SAFETY', 'OTHER'],
      severities: data?.severities ?? ['LOW', 'MEDIUM', 'HIGH'],
    };
  } catch {
    return { categories: ['PAYMENT', 'BOOKING', 'ACCOUNT', 'TECHNICAL', 'SAFETY', 'OTHER'], severities: ['LOW', 'MEDIUM', 'HIGH'] };
  }
}

// =============================================================
// PÁGINA
// =============================================================
export default function SupportIndex() {
  const router = useRouter();
  const { bookingId: routeBookingId } = useLocalSearchParams<{ bookingId?: string }>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [meta, setMeta] = useState<{ categories: TicketCategory[]; severities: TicketSeverity[] }>({ categories: [], severities: [] });

  // formulário
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<TicketCategory>('OTHER');
  const [severity, setSeverity] = useState<TicketSeverity>('LOW');
  const [bookingId, setBookingId] = useState<string | undefined>(routeBookingId);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [items, m] = await Promise.all([fetchMyTickets(), fetchMeta()]);
      setTickets(items);
      setMeta(m);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível carregar o suporte.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setTickets(await fetchMyTickets());
    } catch {}
    setRefreshing(false);
  }, []);

  const canSubmit = subject.trim().length >= 4 && message.trim().length >= 10;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Complete os campos', 'Informe um assunto e descreva o problema com pelo menos 10 caracteres.');
      return;
    }
    try {
      setSubmitting(true);
      const payload: CreateTicketDto = { subject: subject.trim(), message: message.trim(), category, severity, bookingId };
      const created = await createTicket(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubject('');
      setMessage('');
      setCategory('OTHER');
      setSeverity('LOW');
      setBookingId(routeBookingId);
      setTickets((prev) => [created, ...prev]);
      Alert.alert('Enviado', 'Seu ticket foi criado com sucesso. Nossa equipe entrará em contato.');
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro ao enviar', e?.response?.data?.message || 'Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, subject, message, category, severity, bookingId, routeBookingId]);

  const renderTicket = ({ item }: { item: SupportTicket }) => (
    <View style={styles.ticketCard}>
      <View style={styles.ticketRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
        <Text style={styles.ticketSubject} numberOfLines={1}>{item.subject}</Text>
      </View>
      <View style={styles.ticketMetaRow}>
        <Badge label={item.category} />
        {!!item.severity && <Badge label={item.severity} />}
        <Text style={styles.ticketDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.ticketMsg} numberOfLines={2}>{item.message}</Text>
      <View style={styles.ticketActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/support/${item.id}` as any)}>
          <Ionicons name="chatbubbles-outline" size={16} color="#2A72E7" />
          <Text style={styles.actionText}>ver detalhes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f9ff' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <Header title="Suporte" onBack={() => router.back()} />
      <AnimatedBackdrop />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4A7FF3" />
          <Text style={styles.loadingTxt}>Carregando suporte...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 38 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* FORMULÁRIO */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Abrir novo ticket</Text>

              <View style={styles.rowField}>
                <Ionicons name="pricetag-outline" size={18} color="#2A72E7" />
                <ScrollPills
                  items={meta.categories.length ? meta.categories : (['PAYMENT','BOOKING','ACCOUNT','TECHNICAL','SAFETY','OTHER'] as TicketCategory[])}
                  value={category}
                  onChange={(v) => setCategory(v as TicketCategory)}
                />
              </View>

              <View style={styles.rowField}>
                <Ionicons name="warning-outline" size={18} color="#2A72E7" />
                <ScrollPills
                  items={meta.severities.length ? meta.severities : (['LOW','MEDIUM','HIGH'] as TicketSeverity[])}
                  value={severity}
                  onChange={(v) => setSeverity(v as TicketSeverity)}
                />
              </View>

              <TextInput
                placeholder="Assunto do ticket"
                placeholderTextColor="#8aa2d6"
                value={subject}
                onChangeText={setSubject}
                style={styles.input}
                maxLength={120}
              />

              <TextInput
                placeholder="Descreva o problema com detalhes (mín. 10 caracteres)"
                placeholderTextColor="#8aa2d6"
                value={message}
                onChangeText={setMessage}
                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                multiline
              />

              <TextInput
                placeholder="ID do agendamento (opcional)"
                placeholderTextColor="#8aa2d6"
                value={bookingId}
                onChangeText={setBookingId}
                style={styles.input}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, { opacity: submitting ? 0.7 : (canSubmit ? 1 : 0.6) }]}
                onPress={handleSubmit}
                disabled={!canSubmit || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={16} color="#fff" />
                    <Text style={styles.primaryBtnTxt}>Enviar ticket</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* atalho para segurança */}
              <View style={styles.inlineHelp}>
                <Ionicons name="shield-checkmark" size={16} color="#2A72E7" />
                <Text style={styles.inlineHelpTxt}>Emergência ou incidente? </Text>
                <TouchableOpacity onPress={() => router.push('/(client)/safety/report-incident' as any)}>
                  <Text style={[styles.inlineHelpTxt, { textDecorationLine: 'underline', fontWeight: '700' }]}>Relatar agora</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* LISTA DE TICKETS */}
            <View style={{ height: 10 }} />
            <Text style={styles.sectionTitle}>Meus tickets</Text>

            {tickets.length === 0 ? (
              <View style={styles.emptyBox}>
                <Image source={Icons3D.support} style={[styles.icon3d, { width: 44, height: 44 }]} />
                <Text style={styles.emptyTitle}>Sem tickets abertos</Text>
                <Text style={styles.emptySubtitle}>Precisa de ajuda? Abra um ticket e retornaremos rapidamente.</Text>
              </View>
            ) : (
              <FlatList
                data={tickets}
                keyExtractor={(it) => String(it.id)}
                renderItem={renderTicket}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                contentContainerStyle={{ paddingTop: 8 }}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

// =============================================================
// Componentes auxiliares
// =============================================================
function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeTxt}>{label}</Text>
    </View>
  );
}

function ScrollPills<T extends string>({ items, value, onChange }: { items: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {items.map((it) => {
        const active = value === it;
        return (
          <TouchableOpacity key={it} onPress={() => onChange(it)} style={[styles.pill, active ? styles.pillActive : styles.pillGhost]}>
            <Text style={[styles.pillTxt, active ? styles.pillTxtActive : styles.pillTxtGhost]}>{it}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function statusColor(st: TicketStatus) {
  switch (st) {
    case 'OPEN': return '#2A72E7';
    case 'IN_PROGRESS': return '#F5A524';
    case 'RESOLVED': return '#22C55E';
    case 'CLOSED': return '#6B7280';
    case 'CANCELLED': return '#EF4444';
    default: return '#93C5FD';
  }
}

function pad2(n: number) { return n < 10 ? `0${n}` : String(n); }
function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    const day = pad2(d.getDate());
    const mon = pad2(d.getMonth() + 1);
    const y = d.getFullYear();
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    return `${day}/${mon}/${y} ${hh}:${mm}`;
  } catch { return iso; }
}

// =============================================================
// STYLES
// =============================================================
const styles = StyleSheet.create({
  headerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }) as any,
  },
  iconRightWrap: { width: 40, height: 36, justifyContent: 'center', alignItems: 'center' },
  icon3d: { width: 28, height: 28, resizeMode: 'contain' },
  tabsPill: {
    marginTop: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 40,
    padding: 6,
    flexDirection: 'row',
    gap: 6,
  },
  tabItem: { borderRadius: 40, paddingVertical: 8, paddingHorizontal: 14 },
  tabItemActive: { backgroundColor: '#fff' },
  tabActiveText: { color: '#2A72E7', fontWeight: '700', fontSize: 12 },
  tabItemGhost: { backgroundColor: 'transparent' },
  tabGhostText: { color: 'rgba(255,255,255,0.9)', fontWeight: '600', fontSize: 12 },

  // Backdrop
  blob: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 200,
    backgroundColor: 'rgba(106,168,255,0.18)',
    filter: (Platform.OS === 'web' ? 'blur(40px)' : undefined) as any,
  },
  blob2: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: 'rgba(74,127,243,0.16)',
    filter: (Platform.OS === 'web' ? 'blur(44px)' : undefined) as any,
  },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 24 },
  loadingTxt: { marginTop: 10, color: '#4A7FF3', fontWeight: '600' },

  // Form
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 3 },
    }),
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#1f2d5c', marginBottom: 10 },
  rowField: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  input: {
    marginTop: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#1f2d5c',
    borderWidth: 1,
    borderColor: '#d6e2ff',
  },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: '#2A72E7',
    borderRadius: 14,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnTxt: { color: '#fff', fontWeight: '700' },

  inlineHelp: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  inlineHelpTxt: { color: '#2A72E7' },

  pill: { borderRadius: 40, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1 },
  pillActive: { backgroundColor: '#ffffff', borderColor: '#2A72E7' },
  pillGhost: { backgroundColor: '#f0f4ff', borderColor: '#d6e2ff' },
  pillTxt: { fontSize: 12, fontWeight: '700' },
  pillTxtActive: { color: '#2A72E7' },
  pillTxtGhost: { color: '#5672b5' },

  sectionTitle: { marginTop: 2, marginBottom: 8, fontSize: 15, fontWeight: '700', color: '#1f2d5c' },

  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } }, android: { elevation: 2 } }),
  },
  emptyTitle: { marginTop: 8, fontWeight: '700', color: '#1f2d5c' },
  emptySubtitle: { marginTop: 4, textAlign: 'center', color: '#6b7db2' },

  // Tickets
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } }, android: { elevation: 2 } }),
  },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 8 },
  ticketSubject: { flex: 1, fontWeight: '700', color: '#1f2d5c' },
  ticketMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  badge: { backgroundColor: '#eef3ff', borderRadius: 40, paddingVertical: 4, paddingHorizontal: 10 },
  badgeTxt: { color: '#2A72E7', fontWeight: '700', fontSize: 11 },
  ticketDate: { marginLeft: 'auto', color: '#7a8cbf', fontSize: 12 },
  ticketMsg: { marginTop: 6, color: '#425079' },
  ticketActions: { marginTop: 10, flexDirection: 'row', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#edf4ff' },
  actionText: { color: '#2A72E7', fontWeight: '700', fontSize: 12 },
});
