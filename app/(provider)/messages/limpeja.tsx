import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';

type SupportMessage = {
  id: string;
  sender: 'user' | 'support';
  content: string;
  createdAt: string;
};

const QUICK_ACTIONS = [
  { key: 'booking', label: 'Agendamentos / clientes' },
  { key: 'payment', label: 'Pagamentos / PIX' },
  { key: 'arrival', label: 'Cheguei / cliente ausente' },
  { key: 'refund', label: 'Cancelamento / reembolso' },
  { key: 'safety', label: 'Segurança / incidente' },
  { key: 'other', label: 'Outros' },
];

const supportReply = (key: string) => {
  switch (key) {
    case 'booking':
      return [
        'Vamos resolver seu agendamento.',
        'Escolha: remarcar, cancelar ou atualizar horário/endereço.',
        'Envie o ID do agendamento e data/hora para agilizar.',
      ].join('\n');
    case 'payment':
      return [
        'Pagamentos / PIX:',
        '• Serviço concluído: repasse é liberado após confirmação.',
        '• Aguardando: valor fica reservado.',
        'Envie o ID do agendamento para checar status ou abrir ticket.',
      ].join('\n');
    case 'arrival':
      return [
        'Chegada / cliente ausente:',
        'Informe se está aguardando, atrasado ou no local.',
        'Posso abrir contato pelo app; se exceder tolerância, acionamos suporte.',
      ].join('\n');
    case 'refund':
      return [
        'Cancelamento / reembolso:',
        '• Até 24h: sem custo.',
        '• Menos de 24h: pode haver retenção parcial.',
        'Mande o ID do agendamento para estimar prazo.',
      ].join('\n');
    case 'safety':
      return [
        'Segurança / incidente:',
        'Abrirei um ticket prioritário. Envie ID do agendamento, data/hora e breve descrição.',
      ].join('\n');
    default:
      return 'Envie ID do agendamento, data/hora, endereço e um print (se houver). Posso abrir ticket agora e manter você informado.';
  }
};

export default function LimpejaSupportChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const storageKey = useMemo(
    () => `@LimpeJa:SupportChatMessages:provider:${user?.id ?? 'anonymous'}`,
    [user?.id]
  );

  const [messages, setMessages] = useState<SupportMessage[] | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const flatListRef = useRef<FlatList<SupportMessage>>(null);

  const persist = useCallback(
    async (next: SupportMessage[]) => {
      setMessages(next);
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // silent
      }
    },
    [storageKey]
  );

  useEffect(() => {
    setMessages(null);
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) setMessages(JSON.parse(raw));
        else setMessages([]);
      } catch {
        setMessages([]);
      }
    })();
  }, [storageKey]);

  useEffect(() => {
    if (messages && messages.length === 0) {
      const welcome: SupportMessage = {
        id: Math.random().toString(36).slice(2),
        sender: 'support',
        content:
          'Olá, sou o assistente do LimpeJá. Escolha uma opção ou descreva sua dúvida:\n• Agendamentos / clientes\n• Pagamentos / PIX\n• Cheguei / cliente ausente\n• Cancelamento / reembolso\n• Segurança / incidente\n• Outros',
        createdAt: new Date().toISOString(),
      };
      persist([welcome]);
    }
  }, [messages, persist]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages]);

  const simulateTyping = async (cb: () => void) => {
    setTyping(true);
    setTimeout(() => {
      cb();
      setTyping(false);
    }, 700);
  };

  const handleQuickAction = useCallback(
    async (key: string) => {
      if (!messages) return;
      const action = QUICK_ACTIONS.find((a) => a.key === key);
      if (!action) return;

      const mine: SupportMessage = {
        id: Math.random().toString(36).slice(2),
        sender: 'user',
        content: action.label,
        createdAt: new Date().toISOString(),
      };
      const next = [...messages, mine];
      await persist(next);

      await simulateTyping(async () => {
        const reply: SupportMessage = {
          id: Math.random().toString(36).slice(2),
          sender: 'support',
          content: supportReply(key),
          createdAt: new Date().toISOString(),
        };
        const withReply = [...next, reply];
        await persist(withReply);
        setInteractionCount((c) => c + 1);
        if (interactionCount >= 1) {
          const escalation: SupportMessage = {
            id: Math.random().toString(36).slice(2),
            sender: 'support',
            content:
              'Para agilizar: envie ID do agendamento, data/hora, endereço e um print (se houver). Posso abrir um ticket automático e acompanhar.',
            createdAt: new Date().toISOString(),
          };
          await persist([...withReply, escalation]);
        }
      });
    },
    [messages, persist, interactionCount]
  );

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !messages || sending) return;
    setSending(true);
    const mine: SupportMessage = {
      id: Math.random().toString(36).slice(2),
      sender: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    const next = [...messages, mine];
    await persist(next);
    setInput('');

    await simulateTyping(async () => {
      const auto: SupportMessage = {
        id: Math.random().toString(36).slice(2),
        sender: 'support',
        content:
          'Recebemos sua mensagem. Use as opções rápidas ou envie ID do agendamento, data/hora e endereço para agilizar.',
        createdAt: new Date().toISOString(),
      };
      await persist([...next, auto]);
      setInteractionCount((c) => c + 1);
      setSending(false);
    });
  }, [input, messages, persist, sending]);

  if (!messages) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={22} color="#1A2538" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suporte LimpeJá</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const mine = item.sender === 'user';
          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={[styles.bubbleText, mine ? { color: '#FFF' } : { color: '#212529' }]}>{item.content}</Text>
              <Text style={styles.bubbleTime}>
                {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
        ListFooterComponent={
          typing ? (
            <View style={[styles.bubble, styles.bubbleTheirs]}>
              <Text style={[styles.bubbleText, { color: '#212529' }]}>Digitando...</Text>
            </View>
          ) : null
        }
      />

      <View style={styles.quickActionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity key={action.key} style={styles.quickActionBtn} onPress={() => handleQuickAction(action.key)}>
              <Text style={styles.quickActionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escreva sua mensagem..."
          placeholderTextColor="#9CA3AF"
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, sending && { opacity: 0.6 }]}
          disabled={sending || !input.trim()}
          onPress={handleSend}
          accessibilityLabel="Enviar mensagem"
        >
          <Ionicons name="send" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 80, paddingHorizontal: 16, paddingBottom: 12, top: -15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A2538' },
  listContent: { paddingHorizontal: 12, paddingBottom: 12 },
  bubble: { alignSelf: 'flex-start', maxWidth: '80%', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, marginVertical: 6 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: '#0A84FF', borderTopRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#F2F4F7', borderTopLeftRadius: 4 },
  bubbleText: { fontSize: 14 },
  bubbleTime: { fontSize: 10, marginTop: 4, opacity: 0.7 },
  quickActionsContainer: { paddingHorizontal: 10, paddingTop: 6 },
  quickActions: { gap: 8, paddingBottom: 4 },
  quickActionBtn: { backgroundColor: '#E8F2FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  quickActionText: { color: '#0A84FF', fontWeight: '700', fontSize: 12 },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: '#E9ECEF' },
  input: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#1A2538', borderWidth: 1, borderColor: '#E9ECEF' },
  sendBtn: { backgroundColor: '#0A84FF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
});
