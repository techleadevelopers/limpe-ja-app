// app/client/support/index.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// =============================================================
// API
// =============================================================
import { toastUserError } from '../../../_shared/errors/uiFeedback';
import { api } from '../../../services/api';
import NotificationUIService from '../../../services/notificationUIService';

// =============================================================
// STYLES (Movido para o topo para resolver erros de referência 'styles' antes da definição)
// =============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  selectField: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectFieldText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxHeight: '60%',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2538',
    marginBottom: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  optionItemText: {
    fontSize: 15,
    color: '#1E293B',
  },
  headerSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAF1FF',
    ...Platform.select({
      ios: {
        shadowColor: '#3A6FD8',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  headerSimpleTitle: { 
    fontSize: 17, 
    fontWeight: '800', 
    color: '#1A2538' 
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 38,
  },
  header: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#EAF1FF',
    paddingBottom: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#3A6FD8',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 0,
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
    color: '#1A2538',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }) as any,
  },
  iconRightWrap: { width: 40, height: 36, justifyContent: 'center', alignItems: 'center' },
  icon3d: { width: 28, height: 28, resizeMode: 'contain' },
  blob: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 200,
    backgroundColor: 'rgba(58, 111, 216, 0.08)',
  },
  blob2: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: 'rgba(58, 111, 216, 0.06)',
  },
  loadingWrap: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: 24,
    backgroundColor: '#F6F8FB',
  },
  loadingTxt: { 
    marginTop: 10, 
    color: '#3A6FD8', 
    fontWeight: '600',
    fontSize: 16,
  },
  ticketCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAF1FF',
    shadowColor: '#3A6FD8',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 0,
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EAF1FF',
    shadowColor: '#3A6FD8',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 0,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A2538',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 17,
    fontWeight: '800',
    color: '#1A2538',
  },
  ticketSubject: {
    flex: 1,
    fontWeight: '800',
    color: '#1A2538',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  ticketMsg: {
    marginTop: 8,
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
  },
  rowField: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    width: '100%',
  },
  input: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1E293B',
    fontSize: 15,
    elevation: 0,
  },
  primaryBtn: {
    marginTop: 20,
    borderRadius: 14,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3A6FD8',
    shadowColor: '#3A6FD8',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0,
  },
  primaryBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.4,
  },
  whatsappBtn: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    gap: 8,
    shadowColor: '#25D366',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 0,
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
    fontWeight: '800',
    fontSize: 16,
  },
  chatBtn: {
    marginTop: 10,
    backgroundColor: '#3A6FD8',
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#3A6FD8',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0,
  },
  chatBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  inlineHelp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  inlineHelpTxt: { 
    color: '#3A6FD8',
    fontSize: 14,
  },
  pill: {
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  pillActive: {
    backgroundColor: '#EAF1FF',
    borderColor: '#3A6FD8',
  },
  pillGhost: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  pillTxt: {
    fontSize: 13,
    textAlign: 'center',
  },
  pillTxtActive: {
    color: '#3A6FD8',
    fontWeight: '600',
  },
  pillTxtGhost: {
    color: '#64748B',
    fontWeight: '500',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAF1FF',
    shadowColor: '#3A6FD8',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0,
  },
  emptyTitle: {
    fontWeight: '800',
    color: '#1A2538',
    fontSize: 18,
    marginTop: 10,
  },
  emptySubtitle: {
    marginTop: 6,
    textAlign: 'center',
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  ticketRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
  },
  statusDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
  },
  ticketMetaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginTop: 8,
  },
  ticketDate: { 
    marginLeft: 'auto', 
    color: '#64748B', 
    fontSize: 12,
  },
  badge: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAF1FF',
    backgroundColor: '#FFFFFF',
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3A6FD8',
  },
});

// =============================================================
// 3D ICONS
// =============================================================
const Icons3D = {
  support: require('../../../assets/images/3d/support.png'),
  whatsapp: require('../../../assets/images/3d/whatsapp.png'), 
};

// Tipos (sem acentos para consistência com unions)
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
export type TicketSeverity = 'BAIXA' | 'MEDIA' | 'ALTA'; 
export type TicketCategory = 'PAGAMENTOS' | 'AGENDAMENTOS' | 'CONTA' | 'TECNICO' | 'SEGURANCA' | 'OUTRO'; 

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

// Defaults (fora da interface, sem acentos)
const DEFAULT_CATEGORIES: TicketCategory[] = ['PAGAMENTOS','AGENDAMENTOS','CONTA','TECNICO','SEGURANCA','OUTRO'];
const DEFAULT_SEVERITIES: TicketSeverity[] = ['BAIXA','MEDIA','ALTA'];

const getSupportRateLimitMessage = (error: unknown): string | null => {
  const code = (error as Record<string, any>)?.response?.data?.code;
  if (code === 'support.rate_limited') {
    return 'Você atingiu o limite de chamados por hora. Tente novamente mais tarde.';
  }
  return null;
};

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

// Função fetchMeta corrigida (removida duplicata, fallback sem acentos, retorna valor)
async function fetchMeta(): Promise<{ categories: TicketCategory[]; severities: TicketSeverity[] }> {
  try {
    const { data } = await api.get('/v1/support/meta');
    return {
      categories: data?.categories ?? DEFAULT_CATEGORIES,
      severities: data?.severities ?? DEFAULT_SEVERITIES,
    };
  } catch {
    return { categories: DEFAULT_CATEGORIES, severities: DEFAULT_SEVERITIES };
  }
}

// =============================================================
// Função para abrir WhatsApp
// =============================================================
const openWhatsApp = async () => {
  const phoneNumber = '+5519993223932';
  const message = 'Olá, preciso de ajuda com o app LimpeJá. Pode me auxiliar?';
  const whatsappUrl = `whatsapp://send?phone=${phoneNumber.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
  
  const supported = await Linking.canOpenURL(whatsappUrl);
  if (supported) {
    await Linking.openURL(whatsappUrl);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } else {
    Alert.alert('WhatsApp não encontrado', `Por favor, instale o WhatsApp ou acesse https://wa.me/${phoneNumber.replace(/\D/g, '')} no navegador.`);
  }
};

// =============================================================
// Função formatLabel (movida para cá para resolver erros de referência)
// =============================================================
const formatLabel = (raw: string) => {
  const s = String(raw).normalize('NFD').replace(/[^\w]/g, '').toUpperCase();
  if (s.includes('LOW')) return 'Baixa (pode esperar)';
  if (s.includes('MEDIUM') || s.includes('MED') || s.includes('MEDIA') || s.includes('MDIA')) return 'Média (hoje)';
  if (s.includes('HIGH') || s.includes('ALTA')) return 'Alta (urgente)';
  if (s.includes('PAY')) return 'Pagamentos';
  if (s.includes('AGEND') || s.includes('APPOINT') || s.includes('SCHEDULE')) return 'Agendamentos';
  if (s === 'CONTA' || s.includes('ACCOUNT')) return 'Minha conta';
  if (s === 'APP' || s.includes('TECH') || s.includes('TECN')) return 'Ajuda técnica';
  if (s.includes('SECUR')) return 'Segurança';
  if (s.includes('QUALITY')) return 'Qualidade';
  if (s.includes('OUTRO') || s === 'OTHER') return 'Outro';
  return String(raw);
};

// =============================================================
// PÁGINA PRINCIPAL
// =============================================================
export default function SupportIndex() {
  const router = useRouter();
  const { bookingId: routeBookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [meta, setMeta] = useState<{ categories: TicketCategory[]; severities: TicketSeverity[] }>({ categories: [], severities: [] });

  // UI: selects compactos
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showSeveritySheet, setShowSeveritySheet] = useState(false);

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
      toastUserError(e, 'Erro ao carregar o suporte');
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
      setCategory('OUTRO');
      setSeverity('BAIXA');
      setBookingId(routeBookingId);
      setTickets((prev) => [created, ...prev]);
      NotificationUIService.showSuccess('Seu ticket foi criado com sucesso.', 'Enviado');
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const rateLimitMsg = getSupportRateLimitMessage(e);
      if (rateLimitMsg) {
        Alert.alert('Limite atingido', rateLimitMsg);
      } else {
        toastUserError(e, 'Erro ao enviar');
      }
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
      style={{ marginHorizontal: 16 }}
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
    <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
      <View style={styles.formCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Ionicons name="add-circle" size={26} color="#3A6FD8" />
          <Text style={[styles.formTitle, { marginLeft: 8 }]}>Abrir novo ticket</Text>
        </View>
        
        <View style={[styles.rowField, { marginBottom: 14 }]}>
          <Ionicons name="pricetag-outline" size={18} color="#3A6FD8" />
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={styles.selectField}
              onPress={() => setShowCategorySheet(true)}
              accessibilityRole="button"
              accessibilityLabel="Selecionar categoria"
            >
              <Text style={styles.selectFieldText}>{formatLabel(String(category))}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.rowField, { marginBottom: 14 }]}>
          <Ionicons name="warning-outline" size={18} color="#3A6FD8" />
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={styles.selectField}
              onPress={() => setShowSeveritySheet(true)}
              accessibilityRole="button"
              accessibilityLabel="Selecionar severidade"
            >
              <Text style={styles.selectFieldText}>{formatLabel(String(severity))}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        <TextInput
          placeholder="Assunto do ticket"
          placeholderTextColor="#94A3B8"
          value={subject}
          onChangeText={setSubject}
          style={styles.input}
          maxLength={120}
          accessibilityLabel="Assunto do ticket"
          accessibilityHint="Digite o assunto do seu ticket de suporte."
        />
        <TextInput
          placeholder="Descreva o problema com detalhes (mín. 10 caracteres)"
          placeholderTextColor="#94A3B8"
          value={message}
          onChangeText={setMessage}
          style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
          multiline
          accessibilityLabel="Descrição do problema"
          accessibilityHint="Descreva o problema em detalhes."
        />
        <TextInput
          placeholder="ID do agendamento (opcional)"
          placeholderTextColor="#94A3B8"
          value={bookingId || ''}
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
          <Ionicons name="shield-checkmark" size={16} color="#3A6FD8" />
          <Text style={styles.inlineHelpTxt}>Emergência ou incidente? </Text>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/common/safety/incident-report' as any);
            }}
            accessibilityRole="button"
            accessibilityLabel="Relatar incidente"
          >
            <Text style={[styles.inlineHelpTxt, { textDecorationLine: 'underline', fontWeight: '800' }]}>Relatar agora</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={openWhatsApp}
          accessibilityRole="button"
          accessibilityLabel="Falar pelo WhatsApp"
          accessibilityHint="Toque para abrir o WhatsApp e enviar mensagem para suporte."
        >
          <View style={styles.whatsappIconWrap}>
            {Icons3D.whatsapp ? (
              <Image source={Icons3D.whatsapp} style={styles.whatsappIcon3d} />
            ) : (
              <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" /> 
            )}
          </View>
          <Text style={styles.whatsappBtnTxt}>Fale pelo WhatsApp</Text>
        </TouchableOpacity>

          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => router.push('/client/messages' as any)}
          accessibilityRole="button"
          accessibilityLabel="Conversar com o suporte"
          accessibilityHint="Toque para abrir o chat de suporte dentro do app."
        >
          <Ionicons name="chatbubbles-outline" size={20} color="#FFFFFF" />
          <Text style={styles.chatBtnTxt}>Mensagem no App</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 10 }} />
      <Text style={[styles.sectionTitle, { marginHorizontal: 16 }]}>Meus tickets</Text>
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
      <View style={[styles.headerSimple, { paddingTop: insets.top + 12, paddingBottom: 12 }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={22} color="#1A2538" />
        </TouchableOpacity>
        <Text style={styles.headerSimpleTitle}>Suporte</Text>
        <View style={{ width: 22 }} />
      </View>
      
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#3A6FD8" />
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
          contentContainerStyle={{ paddingTop: 10, paddingBottom: insets.bottom + 38 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3A6FD8" />}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <Modal transparent visible={showCategorySheet} animationType="fade" onRequestClose={() => setShowCategorySheet(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.optionTitle}>Categoria</Text>
            {(meta.categories.length ? meta.categories : DEFAULT_CATEGORIES).map((it) => (
              <TouchableOpacity key={String(it)} style={styles.optionItem} onPress={() => { setCategory(it as TicketCategory); setShowCategorySheet(false); }}>
                <Text style={styles.optionItemText}>{formatLabel(String(it))}</Text>
                {category === it && <Ionicons name="checkmark-circle" size={18} color="#3A6FD8" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
      <Modal transparent visible={showSeveritySheet} animationType="fade" onRequestClose={() => setShowSeveritySheet(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.optionTitle}>Severidade</Text>
            {(meta.severities.length ? meta.severities : DEFAULT_SEVERITIES).map((it) => (
              <TouchableOpacity key={String(it)} style={styles.optionItem} onPress={() => { setSeverity(it as TicketSeverity); setShowSeveritySheet(false); }}>
                <Text style={styles.optionItemText}>{formatLabel(String(it))}</Text>
                {severity === it && <Ionicons name="checkmark-circle" size={18} color="#3A6FD8" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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

function statusColor(st: TicketStatus) {
  switch (st) {
    case 'OPEN': return '#3A6FD8';
    case 'IN_PROGRESS': return '#F59E0B';
    case 'RESOLVED': return '#10B981';
    case 'CLOSED': return '#6B7280';
    case 'CANCELLED': return '#EF4444';
    default: return '#BBD1F9';
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
