// DEV PANEL — QA ONLY — DO NOT SHIP TO PRODUCTION
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { acceptBooking, completeBooking, getBookingDetails, startBooking } from '../services/bookingService';

const QA_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_ENABLE_QA_PANEL === 'true';

type PushAudience = 'client' | 'provider' | 'both';
type PushTemplate = {
  key: string;
  name: string;
  title: string;
  body: string;
  deeplink: string;
  audience: PushAudience;
  category?: string;
  notes?: string;
};

const PUSH_TEMPLATES: PushTemplate[] = [
  {
    key: 'welcome',
    name: 'Bem-vindo',
    title: 'Bem-vindo ao Limpeja!',
    body: 'Sua conta está pronta. Experimente agendar um serviço.',
    deeplink: '/client/explore',
    audience: 'client',
    category: 'onboarding',
  },
  {
    key: 'service_started',
    name: 'Serviço iniciado',
    title: 'Serviço iniciado',
    body: 'Seu prestador começou o atendimento. Aproveite!',
    deeplink: '/client/bookings',
    audience: 'client',
    notes: 'Disparo automático logo após o prestador clicar em “Iniciar”.',
  },
  {
    key: 'service_finished',
    name: 'Serviço finalizado',
    title: 'Serviço finalizado',
    body: 'Serviço concluído com sucesso. Avalie o prestador agora.',
    deeplink: '/client/bookings',
    audience: 'client',
    notes: 'Multiplica em cliente e provider com textos parecidos.',
  },
  {
    key: 'payment_received',
    name: 'Pagamento recebido',
    title: 'Pagamento confirmado',
    body: 'Recebemos o pagamento e liberamos o saldo.',
    deeplink: '/provider/earnings',
    audience: 'provider',
    category: 'finance',
    notes: 'Fluxo financeiro para o prestador após o cliente pagar.',
  },
  {
    key: 'chat_message',
    name: 'Nova mensagem',
    title: 'Nova mensagem do cliente',
    body: 'O cliente enviou uma mensagem. Responda o mais rápido possível.',
    deeplink: '/provider/messages',
    audience: 'provider',
    notes: 'Push disparado sempre que há mensagem nova no chat.',
  },
  {
    key: 'review_request',
    name: 'Pedido de avaliação',
    title: 'Solicitação de avaliação',
    body: 'Peça para o cliente escrever uma avaliação sobre o serviço.',
    deeplink: '/client/reviews',
    audience: 'client',
    notes: 'Enviado após serviço finalizado para estimular o feedback.',
  },
  {
    key: 'payment_approved',
    name: 'Pagamento aprovado',
    title: 'Pagamento confirmado',
    body: 'Recebemos o seu pagamento e liberamos o saldo.',
    deeplink: '/client/wallet/cashback',
    audience: 'client',
    category: 'finance',
    notes: 'Mensagem pós pagamento para cliente e provedor.',
  },
  {
    key: 'support_ticket',
    name: 'Alerta suporte',
    title: 'Suporte LimpeJá',
    body: 'Sua solicitação foi registrada. Em breve responderemos.',
    deeplink: '/client/support/index',
    audience: 'client',
    category: 'support',
    notes: 'Usar para alertas gerais ou tickets críticos.',
  },
  {
    key: 'schedule_reschedule',
    name: 'Serviço reagendado',
    title: 'Agenda atualizada',
    body: 'O prestador reagendou seu atendimento. Confirme as novas horas.',
    deeplink: '/client/bookings',
    audience: 'client',
    notes: 'Notifica o cliente sobre alteração de horário.',
  },
  {
    key: 'provider_balance',
    name: 'Saldo liberado',
    title: 'Saldo liberado para saque',
    body: 'O pagamento foi confirmado e seu saldo já está disponível para saque.',
    deeplink: '/provider/earnings',
    audience: 'provider',
    category: 'finance',
    notes: 'Gatilho financeiro para o prestador.',
  },
];

const AUDIENCE_LABELS: Record<PushAudience, string> = {
  client: 'Cliente',
  provider: 'Prestador',
  both: 'Cliente e prestador',
};

const ActionButton = ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => (
  <TouchableOpacity style={[styles.button, disabled && styles.buttonDisabled]} onPress={onPress} disabled={disabled}>
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

export default function DevPanelScreen() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(PUSH_TEMPLATES[0]?.key ?? '');
  const [targetUserId, setTargetUserId] = useState('');
  const [pushCustomData, setPushCustomData] = useState('');
  const [pushStatusText, setPushStatusText] = useState<string | null>(null);
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [bookingMeta, setBookingMeta] = useState<{
    clientUserId?: string;
    providerUserId?: string;
    clientName?: string;
    providerName?: string;
    status?: string;
  } | null>(null);
  const [isFetchingBookingMeta, setIsFetchingBookingMeta] = useState(false);
  const [lastPreview, setLastPreview] = useState<PushTemplate | null>(null);
  const [previewActive, setPreviewActive] = useState(false);
  const isDisabled = useMemo(() => !bookingId || !!loading, [bookingId, loading]);
  const selectedTemplate = useMemo(
    () => PUSH_TEMPLATES.find((template) => template.key === selectedTemplateKey) ?? null,
    [selectedTemplateKey],
  );

  const { user: authUser } = useAuth();
  const resolvedTargetUserId = useMemo(() => {
    const manual = targetUserId.trim();
    if (manual) return manual;
    return authUser?.id ?? '';
  }, [targetUserId, authUser?.id]);

  const loggedUserLabel = useMemo(() => {
    if (!authUser) return 'nenhum usuário logado';
    const fallbackName = authUser.fullName || authUser.email || 'usuário';
    return `${fallbackName} (${authUser.id})`;
  }, [authUser]);

  useEffect(() => {
    if (authUser?.id && !targetUserId.trim()) {
      setTargetUserId(authUser.id);
    }
  }, [authUser?.id, targetUserId]);

  const parseAdditionalJson = (value: string) => {
    if (!value.trim()) return undefined;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const handleLoadBookingMeta = async () => {
    const trimmed = bookingId.trim();
    if (!trimmed) {
      Alert.alert('Informe o bookingId', 'Digite um booking completo antes de buscar participantes.');
      return;
    }

    setIsFetchingBookingMeta(true);
    try {
      const details = await getBookingDetails(trimmed);
      setBookingMeta({
        clientUserId: details.client?.userId || details.client?.id,
        providerUserId: details.provider?.userId || details.provider?.id,
        clientName: details.client?.user?.fullName || details.client?.fullName,
        providerName: details.provider?.user?.fullName || details.provider?.fullName,
        status: details.status,
      });
      setTargetUserId(
        details.client?.userId || details.client?.id || details.provider?.userId || details.provider?.id || '',
      );
      setPushStatusText(`Booking ${details.id} carregado (${details.status})`);
    } catch (error: any) {
      const msg = error?.message || 'Falha ao carregar booking';
      setPushStatusText(msg);
      Alert.alert('Erro', msg);
    } finally {
      setIsFetchingBookingMeta(false);
    }
  };

  const handleAssignTarget = (role: 'client' | 'provider') => {
    if (!bookingMeta) {
      Alert.alert('Booking ausente', 'Busque o booking primeiro.');
      return;
    }

    const candidate = role === 'client' ? bookingMeta.clientUserId : bookingMeta.providerUserId;
    if (!candidate) {
      Alert.alert('Usuário indisponível', `Não há ${role}UserId no booking atual.`);
      return;
    }

    setTargetUserId(candidate);
  };

  const handleUseCurrentUser = () => {
    if (!authUser?.id) {
      Alert.alert('Usuário não autenticado', 'Faça login para enviar push com o seu usuário.');
      return;
    }
    setTargetUserId(authUser.id);
    setPushStatusText(`Alvo definido para ${authUser.id}`);
  };

  const handleSendPush = async (template?: PushTemplate) => {
    const templateToUse = template ?? selectedTemplate;
    if (!templateToUse) {
      Alert.alert('Selecione um template');
      return;
    }

    if (!resolvedTargetUserId) {
      Alert.alert(
        'Informe o target',
        'Faça login ou cole o userId do cliente/prestador que deve receber o push.',
      );
      return;
    }

    if (template && template.key !== selectedTemplateKey) {
      setSelectedTemplateKey(template.key);
    }

    setTargetUserId(resolvedTargetUserId);

    const parsedExtras = parseAdditionalJson(pushCustomData);
    if (pushCustomData.trim() && parsedExtras === null) {
      Alert.alert('JSON inválido', 'Verifique o campo “dados extras”.');
      return;
    }

    setIsSendingPush(true);
    setPushStatusText(null);
    triggerPreview(templateToUse);
    try {
      let sanitizedType = (templateToUse.key || templateToUse.name || '').trim();
      if (!sanitizedType) {
        sanitizedType = 'qa_notification';
      }
      const sanitizedMessage =
        templateToUse.body?.trim() ||
        templateToUse.title?.trim() ||
        templateToUse.name?.trim() ||
        'Notificação';

      const payload: Record<string, unknown> = {
        userId: resolvedTargetUserId,
        type: sanitizedType,
        title: templateToUse.title,
        message: sanitizedMessage,
        targetUrl: templateToUse.deeplink,
        category: templateToUse.category ?? 'qa',
      };
      if (parsedExtras) {
        payload.actionButtons = parsedExtras;
      }
      await api.post('/notifications/qa/send', payload);
      const displayTemplateName = templateToUse.name?.trim() || sanitizedType;
      const success = `Push “${displayTemplateName}” enviado para ${resolvedTargetUserId}`;
      setPushStatusText(success);
      Alert.alert('Push enviado', success);
    } catch (error: any) {
      const msg = error?.message || 'Erro ao enviar push';
      setPushStatusText(msg);
      Alert.alert('Erro', msg);
    } finally {
      setIsSendingPush(false);
    }
  };

  const triggerPreview = (template: PushTemplate) => {
    setLastPreview(template);
    setPreviewActive(true);
    setTimeout(() => setPreviewActive(false), 2200);
  };

  if (!QA_ENABLED) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Painel desativado</Text>
        <Text style={styles.subtitle}>Habilite EXPO_PUBLIC_ENABLE_QA_PANEL=true (ou __DEV__) para usar.</Text>
      </SafeAreaView>
    );
  }

  const handle = async (label: string, fn: (id: string) => Promise<any>) => {
    setLoading(label);
    setStatusText(null);
    try {
      const res = await fn(bookingId.trim());
      setStatusText(JSON.stringify(res, null, 2));
      Alert.alert('OK', `${label} enviado. Verifique push/deeplink.`);
    } catch (e: any) {
      const msg = e?.message || 'Erro';
      setStatusText(msg);
      Alert.alert('Erro', msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Painel DEV (QA)</Text>
        <Text style={styles.subtitle}>Somente staging/QA. Usa endpoints reais. Não simula push local.</Text>
        <Text style={styles.label}>bookingId</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite o bookingId"
          value={bookingId}
          onChangeText={setBookingId}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.row}>
          <ActionButton label="Accept booking" onPress={() => handle('Accept', acceptBooking)} disabled={isDisabled} />
          <ActionButton label="Start booking" onPress={() => handle('Start', startBooking)} disabled={isDisabled} />
          <ActionButton label="Complete booking" onPress={() => handle('Complete', completeBooking)} disabled={isDisabled} />
        </View>

        <ActionButton label="Refetch booking" onPress={() => handle('Refetch', getBookingDetails)} disabled={isDisabled} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auditoria QA</Text>
          <Text style={styles.sectionText}>
            Este painel revisa push de dev: serviços iniciados/finalizados, pagamentos, mensagens e reviews (o mesmo disparo usado em produção). Configure o target, verifique os detalhes do booking e veja o card de push antes de enviar.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Templates disponíveis</Text>
          <View style={styles.templateList}>
            {PUSH_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.key}
                style={[
                  styles.templateTag,
                  selectedTemplateKey === template.key && styles.templateTagActive,
                ]}
                onPress={() => setSelectedTemplateKey(template.key)}
                accessibilityLabel={`Selecionar template ${template.name}`}
              >
                <Text
                  style={[
                    styles.templateTagText,
                    selectedTemplateKey === template.key && styles.templateTagTextActive,
                  ]}
                >
                  {template.name}
                </Text>
                <Text style={styles.templateNotes}>{template.notes || AUDIENCE_LABELS[template.audience]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedTemplate && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Preview do push</Text>
            <Text style={styles.previewLabel}>Título</Text>
            <Text style={styles.previewValue}>{selectedTemplate.title}</Text>
            <Text style={styles.previewLabel}>Mensagem</Text>
            <Text style={styles.previewValue}>{selectedTemplate.body}</Text>
            <Text style={styles.previewLabel}>Deep link</Text>
            <Text style={styles.previewValue}>{selectedTemplate.deeplink}</Text>
            <Text style={styles.previewLabel}>Público principal</Text>
            <Text style={styles.previewValue}>{AUDIENCE_LABELS[selectedTemplate.audience]}</Text>
          </View>
        )}
        {lastPreview && (
          <View style={[styles.livePreview, previewActive && styles.livePreviewActive]}>
            <Text style={styles.livePreviewStatus}>Mensagem simulada</Text>
            <Text style={styles.livePreviewTitle}>{lastPreview.title ?? 'Sem título'}</Text>
            <Text style={styles.livePreviewBody}>{lastPreview.body}</Text>
            <Text style={styles.livePreviewMeta}>
              {AUDIENCE_LABELS[lastPreview.audience]} · {lastPreview.category ?? 'geral'}
            </Text>
          </View>
        )}

        <Text style={styles.label}>Usuário alvo (client ou provider)</Text>
        <TextInput
          style={styles.input}
          placeholder="Cole o userId para receber o push"
          value={targetUserId}
          onChangeText={setTargetUserId}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.currentUserText}>Logado: {loggedUserLabel}</Text>
        <View style={[styles.row, styles.targetRow]}>
          <TouchableOpacity style={styles.miniButton} onPress={handleUseCurrentUser}>
            <Text style={styles.miniButtonText}>Usar meu usuário</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.miniButton} onPress={() => handleAssignTarget('client')}>
            <Text style={styles.miniButtonText}>Usar client</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.miniButton} onPress={() => handleAssignTarget('provider')}>
            <Text style={styles.miniButtonText}>Usar provider</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.miniButton}
            onPress={handleLoadBookingMeta}
            disabled={isFetchingBookingMeta || !bookingId.trim()}
          >
            <Text style={styles.miniButtonText}>
              {isFetchingBookingMeta ? 'Carregando...' : 'Carregar participantes'}
            </Text>
          </TouchableOpacity>
        </View>

        {bookingMeta && (
          <View style={styles.bookingMeta}>
            <Text style={styles.metaLabel}>Booking status</Text>
            <Text style={styles.metaValue}>{bookingMeta.status ?? '—'}</Text>
            <Text style={styles.metaLabel}>Client</Text>
            <Text style={styles.metaValue}>{bookingMeta.clientName ?? bookingMeta.clientUserId ?? 'sem dados'}</Text>
            <Text style={styles.metaLabel}>Provider</Text>
            <Text style={styles.metaValue}>{bookingMeta.providerName ?? bookingMeta.providerUserId ?? 'sem dados'}</Text>
          </View>
        )}

        <Text style={styles.label}>Dados extras (JSON)</Text>
        <TextInput
          style={[styles.input, styles.jsonInput]}
          placeholder='Ex: { "priority": "high" }'
          value={pushCustomData}
          onChangeText={setPushCustomData}
          multiline
          numberOfLines={3}
          autoCapitalize="none"
        />
        <ActionButton
          label={isSendingPush ? 'Enviando push...' : 'Enviar push de teste'}
          onPress={handleSendPush}
          disabled={isSendingPush}
        />
        {pushStatusText && (
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Push status</Text>
            <Text style={styles.statusValue}>{pushStatusText}</Text>
          </View>
        )}

        {loading && <Text style={styles.loading}>Processando: {loading}...</Text>}
        {statusText && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Resposta</Text>
            <Text style={styles.result}>{statusText}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.link} onPress={() => router.back()}>
          <Text style={styles.linkText}>Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.light?.text || '#111' },
  subtitle: { fontSize: 14, color: '#555' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8, color: '#222' },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7e2',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  targetRow: { alignItems: 'center', marginTop: 8 },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  buttonDisabled: { backgroundColor: '#9db7f5' },
  buttonText: { color: '#fff', fontWeight: '700' },
  loading: { color: '#2563EB', fontWeight: '600' },
  resultBox: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  resultTitle: { fontWeight: '700', marginBottom: 6 },
  result: { fontFamily: 'monospace', fontSize: 12, color: '#111' },
  link: { marginTop: 20 },
  linkText: { color: '#2563EB', fontWeight: '600' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  sectionText: { fontSize: 13, color: '#4b5563' },
  templateList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  templateTag: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: '#f8fafc',
    minWidth: 120,
    marginRight: 8,
    marginBottom: 8,
  },
  templateTagActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  templateTagText: { fontSize: 14, fontWeight: '600', color: '#1d4ed8' },
  templateTagTextActive: { color: '#fff' },
  templateNotes: { fontSize: 11, color: '#475569', marginTop: 4 },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewTitle: { fontWeight: '700', fontSize: 15, marginBottom: 6 },
  previewLabel: { fontSize: 11, color: '#64748b', marginTop: 6 },
  previewValue: { fontSize: 14, color: '#111' },
  livePreview: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f8fafc',
    shadowColor: '#111',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 0,
  },
  livePreviewActive: {
    borderColor: '#2563eb',
    backgroundColor: '#e0e7ff',
  },
  livePreviewStatus: { fontSize: 11, color: '#2563EB', fontWeight: '600' },
  livePreviewTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginTop: 4 },
  livePreviewBody: { fontSize: 14, color: '#1f2937', marginTop: 4 },
  livePreviewMeta: { fontSize: 11, color: '#475569', marginTop: 4 },
  miniButton: {
    backgroundColor: '#ecedf3',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
    marginRight: 8,
  },
  miniButtonText: { fontSize: 12, fontWeight: '600', color: '#1d4ed8' },
  currentUserText: { fontSize: 12, color: '#4b5563', marginTop: 4 },
  bookingMeta: {
    borderWidth: 1,
    borderColor: '#d9e2ec',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    backgroundColor: '#fff',
  },
  metaLabel: { fontSize: 11, color: '#475569', marginTop: 4 },
  metaValue: { fontSize: 13, color: '#0f172a' },
  jsonInput: { minHeight: 76, textAlignVertical: 'top' },
  statusBox: {
    marginTop: 8,
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#0f172a',
  },
  statusLabel: { fontSize: 11, color: '#cbd5f5' },
  statusValue: { fontSize: 12, color: '#fff', fontFamily: 'monospace' },
});
