import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert, // CORREÇÃO: Adicionado Alert aqui para resolver TS 2552
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking, // Adicionado para integração com WhatsApp
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView, // horizontal only (ScrollPills)
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // CORREÇÃO: Import correto para TS 2305
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics'; // Haptics premium para interações
import { Ionicons } from '@expo/vector-icons';

// =============================================================
// 3D ICONS (seguir mesmo pacote do menu)
// =============================================================
const Icons3D = {
  support: require('../../../assets/images/3d/support.png'), // CORREÇÃO: Path relativo padrão (ajuste se necessário)
  whatsapp: require('../../../assets/images/3d/whatsapp.png'), // Adicione um ícone 3D para WhatsApp se disponível; caso contrário, use Ionicons
};

// =============================================================
// API (usa instância centralizada do projeto)
// =============================================================
import { api } from '../../../services/api';
import NotificationUIService from '../../../services/notificationUIService';

// Tipos mínimos para alinhar ao backend de tickets (flexível) - Traduzidos para Português na UI
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
export type TicketSeverity = 'BAIXA' | 'MÉDIA' | 'ALTA'; // Traduzido para Português
export type TicketCategory = 'PAGAMENTOS' | 'AGENDAMENTOS' | 'CONTA' | 'TÉCNICO' | 'SEGURANÇA' | 'OUTRO'; // Traduzido para Português

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
// UI — Cabeçalho premium (branco clean, alinhado com menu/mensagens)
// =============================================================
const HEADER_TOP = Platform.OS === 'ios' ? 56 : 28;

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  const insets = useSafeAreaInsets(); // CORREÇÃO: Agora funciona com o import correto
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
      <View style={styles.header}>
        <StatusBar barStyle="dark-content" />
        <View style={{ height: Platform.OS === 'ios' ? insets.top : HEADER_TOP }} />
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => {
              if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBack();
            }} 
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="chevron-back" size={24} color="#4A5568" />
          </TouchableOpacity>

          <Text numberOfLines={1} style={styles.headerTitle}>{title}</Text>

          <View style={styles.iconRightWrap}>
            <Image source={Icons3D.support} style={styles.icon3d} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// =============================================================
// Animated background — bolhas brand (suave, pouco custo) - Tonificado para premium clean
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
  const { data } = await api.get('/v1/support/tickets', { params: { mine: true } });
  return data?.items ?? data ?? [];
}

async function createTicket(dto: CreateTicketDto): Promise<SupportTicket> {
  const { data } = await api.post('/v1/support/tickets', dto);
  return data;
}

// (Opcional) buscar metadados - Com valores em Português
async function fetchMeta(): Promise<{ categories: TicketCategory[]; severities: TicketSeverity[] }> {
  try {
    const { data } = await api.get('/v1/support/meta');
    return {
      categories: data?.categories ?? ['PAGAMENTOS', 'AGENDAMENTOS', 'CONTA', 'TÉCNICO', 'SEGURANÇA', 'OUTRO'],
      severities: data?.severities ?? ['BAIXA', 'MÉDIA', 'ALTA'],
    };
  } catch {
    return { categories: ['PAGAMENTOS', 'AGENDAMENTOS', 'CONTA', 'TÉCNICO', 'SEGURANÇA', 'OUTRO'], severities: ['BAIXA', 'MÉDIA', 'ALTA'] };
  }
}

// =============================================================
// Função para abrir WhatsApp
// =============================================================
const openWhatsApp = async () => {
  const phoneNumber = '+5519993223932';
  const message = 'Olá, preciso de ajuda com o app Relax. Pode me auxiliar?'; // Mensagem pré-definida em Português
  const whatsappUrl = `whatsapp://send?phone=${phoneNumber.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
  
  const supported = await Linking.canOpenURL(whatsappUrl);
  if (supported) {
    await Linking.openURL(whatsappUrl);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } else {
    // Fallback para web ou app não instalado
    Alert.alert('WhatsApp não encontrado', 'Por favor, instale o WhatsApp ou acesse https://wa.me/${phoneNumber} no navegador.');
  }
};

// =============================================================
// PÁGINA
// =============================================================
export default function SupportIndex() {
  const router = useRouter();
  const { bookingId: routeBookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const insets = useSafeAreaInsets(); // CORREÇÃO: Agora funciona

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [meta, setMeta] = useState<{ categories: TicketCategory[]; severities: TicketSeverity[] }>({ categories: [], severities: [] });

  // formulário
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<TicketCategory>('OUTRO');
  const [severity, setSeverity] = useState<TicketSeverity>('BAIXA');
  const [bookingId, setBookingId] = useState<string | undefined>(routeBookingId);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [items, m] = await Promise.all([fetchMyTickets(), fetchMeta()]);
      setTickets(items);
      setMeta(m);
    } catch (e: any) {
      NotificationUIService.showError(e?.message || 'Não foi possível carregar o suporte.', 'Erro');
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
      Alert.alert('Complete os campos', 'Informe um assunto e descreva o problema com pelo menos 10 caracteres.'); // CORREÇÃO: Agora Alert está importado
      return;
    }
    try {
      setSubmitting(true);
      const payload: CreateTicketDto = { subject: subject.trim(), message: message.trim(), category, severity, bookingId };
      const created = await createTicket(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubject('');
      setMessage('');
      setCategory('OUTRO');
      setSeverity('BAIXA');
      setBookingId(routeBookingId);
      setTickets((prev) => [created, ...prev]);
      NotificationUIService.showSuccess('Seu ticket foi criado com sucesso.', 'Enviado');
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      NotificationUIService.showError(e?.response?.data?.message || 'Tente novamente.', 'Erro ao enviar');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, subject, message, category, severity, bookingId, routeBookingId]);

  const renderTicket = ({ item }: { item: SupportTicket }) => (
    <TouchableOpacity 
      onPress={() => {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/support/${item.id}` as any);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Ticket: ${item.subject}`}
    >
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
      </View>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View style={{ padding: 16 }}>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Abrir novo ticket</Text>
        <View style={styles.rowField}>
          <Ionicons name="pricetag-outline" size={18} color="#4A90E2" />
          <ScrollPills
            items={meta.categories.length ? meta.categories : (['PAGAMENTOS','AGENDAMENTOS','CONTA','TÉCNICO','SEGURANÇA','OUTRO'] as TicketCategory[])}
            value={category}
            onChange={(v) => setCategory(v as TicketCategory)}
          />
        </View>
        <View style={styles.rowField}>
          <Ionicons name="warning-outline" size={18} color="#4A90E2" />
          <ScrollPills
            items={meta.severities.length ? meta.severities : (['BAIXA','MÉDIA','ALTA'] as TicketSeverity[])}
            value={severity}
            onChange={(v) => setSeverity(v as TicketSeverity)}
          />
        </View>
        <TextInput
          placeholder="Assunto do ticket"
          placeholderTextColor="#9CA3AF"
          value={subject}
          onChangeText={setSubject}
          style={styles.input}
          maxLength={120}
          accessibilityLabel="Assunto do ticket"
          accessibilityHint="Digite o assunto do seu ticket de suporte."
        />
        <TextInput
          placeholder="Descreva o problema com detalhes (mín. 10 caracteres)"
          placeholderTextColor="#9CA3AF"
          value={message}
          onChangeText={setMessage}
          style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
          multiline
          accessibilityLabel="Descrição do problema"
          accessibilityHint="Descreva o problema em detalhes."
        />
        <TextInput
          placeholder="ID do agendamento (opcional)"
          placeholderTextColor="#9CA3AF"
          value={bookingId}
          onChangeText={setBookingId}
          style={styles.input}
          accessibilityLabel="ID do agendamento"
          accessibilityHint="Digite o ID do agendamento relacionado, se aplicável."
        />
        <TouchableOpacity
          style={[styles.primaryBtn, { opacity: submitting ? 0.7 : (canSubmit ? 1 : 0.6) }]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          accessibilityRole="button"
          accessibilityLabel="Enviar ticket"
          accessibilityHint="Toque para enviar o ticket de suporte."
          accessibilityState={{ disabled: !canSubmit || submitting }}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
              <Text style={styles.primaryBtnTxt}>Enviar ticket</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={styles.inlineHelp}>
          <Ionicons name="shield-checkmark" size={16} color="#4A90E2" />
          <Text style={styles.inlineHelpTxt}>Emergência ou incidente? </Text>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(client)/safety/report-incident' as any);
            }}
            accessibilityRole="button"
            accessibilityLabel="Relatar incidente"
          >
            <Text style={[styles.inlineHelpTxt, { textDecorationLine: 'underline', fontWeight: '700' }]}>Relatar agora</Text>
          </TouchableOpacity>
        </View>
        {/* Botão WhatsApp integrado - Ícone moderno e robusto */}
        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={openWhatsApp}
          accessibilityRole="button"
          accessibilityLabel="Falar pelo WhatsApp"
          accessibilityHint="Toque para abrir o WhatsApp e enviar mensagem para suporte."
        >
          <View style={styles.whatsappIconWrap}>
            {/* Use ícone 3D se disponível, senão Ionicons */}
            {Icons3D.whatsapp ? (
              <Image source={Icons3D.whatsapp} style={styles.whatsappIcon3d} />
            ) : (
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            )}
          </View>
          <Text style={styles.whatsappBtnTxt}>Fale pelo WhatsApp</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 10 }} />
      <Text style={styles.sectionTitle}>Meus tickets</Text>
    </View>
  );

  const Empty = () => (
    <View style={[styles.emptyBox, { marginHorizontal: 16 }]}>
      <Image source={Icons3D.support} style={[styles.icon3d, { width: 44, height: 44 }]} />
      <Text style={styles.emptyTitle}>Sem tickets abertos</Text>
      <Text style={styles.emptySubtitle}>Precisa de ajuda? Abra um ticket e retornaremos rapidamente.</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Suporte" onBack={() => router.back()} />
      <AnimatedBackdrop />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingTxt}>Carregando suporte...</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderTicket}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={Empty}
          contentContainerStyle={{ paddingBottom: 38 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </KeyboardAvoidingView>
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
          <TouchableOpacity 
            key={it} 
            onPress={() => {
              if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(it);
            }} 
            style={[styles.pill, active ? styles.pillActive : styles.pillGhost]}
            accessibilityRole="button"
            accessibilityLabel={`Selecionar ${it}`}
          >
            <Text style={[styles.pillTxt, active ? styles.pillTxtActive : styles.pillTxtGhost]}>{it}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function statusColor(st: TicketStatus) {
  switch (st) {
    case 'OPEN': return '#4A90E2'; // Azul premium
    case 'IN_PROGRESS': return '#F59E0B'; // Amarelo suave
    case 'RESOLVED': return '#10B981'; // Verde premium
    case 'CLOSED': return '#6B7280'; // Cinza médio
    case 'CANCELLED': return '#EF4444'; // Vermelho suave
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
// STYLES (Premium: Branco clean, sombras suaves, conforto iOS/Android)
// =============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB', // Fundo suave premium
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 38,
  },
  header: {
    backgroundColor: '#FFFFFF', // Branco premium
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingBottom: 14,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#4A5568', // Cinza escuro premium
    fontSize: 18, // Legível e premium
    fontWeight: '700',
    letterSpacing: 0.8, // Espaçamento refinado
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }) as any,
  },
  iconRightWrap: { width: 40, height: 36, justifyContent: 'center', alignItems: 'center' },
  icon3d: { width: 28, height: 28, resizeMode: 'contain' },

  // Backdrop (tonificado para sutileza premium)
  blob: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 200,
    backgroundColor: 'rgba(74, 144, 226, 0.08)', // Azul sutil
  },
  blob2: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: 'rgba(74, 144, 226, 0.06)', // Mais sutil
  },

  // Loading
  loadingWrap: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: 24,
    backgroundColor: '#F6F8FB',
  },
  loadingTxt: { 
    marginTop: 10, 
    color: '#4A90E2', 
    fontWeight: '600',
    fontSize: 16,
  },

  // Form
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16, // Espaçamento confortável
    ...Platform.select({
      ios: { 
        shadowColor: '#000', 
        shadowOpacity: 0.06, 
        shadowRadius: 10, 
        shadowOffset: { width: 0, height: 4 } // Sutil para iOS
      },
      android: { elevation: 3 },
    }),
  },
  formTitle: { 
    fontSize: 18, // Premium legível
    fontWeight: '700', 
    color: '#4A5568', 
    marginBottom: 16, // Espaçamento generoso
  },
  rowField: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, // Gap confortável
    marginBottom: 12,
  },
  input: {
    marginTop: 8,
    backgroundColor: '#F8F9FA', // Fundo claro premium
    borderRadius: 12,
    paddingHorizontal: 16, // Padding espaçoso
    paddingVertical: 14,
    color: '#4A5568',
    borderWidth: 1,
    borderColor: '#E9ECEF', // Borda sutil
    fontSize: 16, // Legível
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: '#4A90E2', // Azul premium
    borderRadius: 14,
    minHeight: 48, // Altura confortável para toque
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryBtnTxt: { 
    color: '#FFFFFF', 
    fontWeight: '700',
    fontSize: 16,
  },

  // Botão WhatsApp - Moderno e robusto
  whatsappBtn: {
    marginTop: 16,
    backgroundColor: '#25D366', // Verde oficial do WhatsApp
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  whatsappIconWrap: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappIcon3d: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  whatsappBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  inlineHelp: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  inlineHelpTxt: { 
    color: '#4A90E2',
    fontSize: 14,
  },

  pill: { 
    borderRadius: 20, // Pill arredondado confortável
    paddingVertical: 8, 
    paddingHorizontal: 16,
    borderWidth: 1,
    minWidth: 80, // Largura mínima maior para nomes em Português
  },
  pillActive: { 
    backgroundColor: '#FFFFFF', 
    borderColor: '#4A90E2' 
  },
  pillGhost: { 
    backgroundColor: '#F8F9FA', 
    borderColor: '#E9ECEF' 
  },
  pillTxt: { 
    fontSize: 13, // Legível
    fontWeight: '600',
    textAlign: 'center',
  },
  pillTxtActive: { 
    color: '#4A90E2' 
  },
  pillTxtGhost: { 
    color: '#6B7280' 
  },

  sectionTitle: { 
    marginTop: 8, 
    marginBottom: 12, 
    fontSize: 18, // Premium
    fontWeight: '700', 
    color: '#4A5568' 
  },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24, // Espaçamento generoso
    alignItems: 'center',
    ...Platform.select({ 
      ios: { 
        shadowColor: '#000', 
        shadowOpacity: 0.06, 
        shadowRadius: 10, 
        shadowOffset: { width: 0, height: 4 } 
      }, 
      android: { elevation: 2 } 
    }),
  },
  emptyTitle: { 
    marginTop: 12, 
    fontWeight: '700', 
    color: '#4A5568',
    fontSize: 18,
  },
  emptySubtitle: { 
    marginTop: 6, 
    textAlign: 'center', 
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20, // Leitura confortável
  },

  // Tickets
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16, // Espaçamento confortável
    ...Platform.select({ 
      ios: { 
        shadowColor: '#000', 
        shadowOpacity: 0.06, 
        shadowRadius: 10, 
        shadowOffset: { width: 0, height: 4 } 
      }, 
      android: { elevation: 2 } 
    }),
  },
  ticketRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, // Gap sutil
  },
  statusDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, // Mais arredondado
  },
  ticketSubject: { 
    flex: 1, 
    fontWeight: '700', 
    color: '#4A5568',
    fontSize: 16,
  },
  ticketMetaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginTop: 8,
  },
  badge: { 
    backgroundColor: '#F8F9FA', 
    borderRadius: 12, // Pill pequeno
    paddingVertical: 4, 
    paddingHorizontal: 8,
  },
  badgeTxt: { 
    color: '#4A90E2', 
    fontWeight: '600', 
    fontSize: 12,
  },
  ticketDate: { 
    marginLeft: 'auto', 
    color: '#9CA3AF', 
    fontSize: 12,
  },
  ticketMsg: { 
    marginTop: 8, 
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20, // Confortável para leitura
  },
});

