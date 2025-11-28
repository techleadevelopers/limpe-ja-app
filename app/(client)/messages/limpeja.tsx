import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Animated,
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
  { key: 'booking', label: 'Problema com agendamento' },
  { key: 'payment', label: 'Pagamento / PIX' },
  { key: 'arrival', label: 'Prestador/Cliente não chegou' },
  { key: 'refund', label: 'Reembolso / cancelamento' },
  { key: 'safety', label: 'Segurança ou incidente' },
  { key: 'other', label: 'Outros' },
];

const supportReply = (key: string) => {
  switch (key) {
    case 'booking':
      return [
        'Tudo certo, vou te ajudar com seu agendamento. 👇',
        '• Remarcar',
        '• Cancelar',
        '• Atualizar horário/endereço',
        'Me envie o ID do agendamento para acelerar tudo pra você.',
      ].join('\n');

    case 'payment':
      return [
        'Sobre pagamento/PIX:',
        '• Serviço concluído: repasse libera após confirmação.',
        '• Serviço não concluído: valor fica reservado com segurança.',
        'Se quiser, envie o ID do agendamento que eu verifico em instantes.',
      ].join('\n');

    case 'arrival':
      return [
        'Entendi, vamos resolver isso juntos. 💙',
        '• Prestador atrasado',
        '• Cliente não chegou',
        'Se passar da tolerância, já abro um ticket imediato. Me envie o ID.',
      ].join('\n');

    case 'refund':
      return [
        'Sobre reembolso/cancelamento:',
        '• Até 24h antes: sem custo 💙',
        '• Menos de 24h: pode haver retenção parcial.',
        'Me envie o ID do agendamento que faço a análise rápida.',
      ].join('\n');

    case 'safety':
      return [
        'Sua segurança é prioridade máxima. 🔒',
        'Vou abrir um fluxo prioritário.',
        'Envie ID, data/hora e uma breve descrição.',
      ].join('\n');

    default:
      return 'Perfeito, me envie ID do agendamento + data/hora e, se tiver, um print. Posso abrir um ticket agora mesmo.';
  }
};

export default function LimpejaSupportChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const storageKey = useMemo(
    () => `@LimpeJa:SupportChatMessages:${user?.id ?? 'anonymous'}`,
    [user?.id]
  );
  const [messages, setMessages] = useState<SupportMessage[] | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);

  // ---- AUTO SCROLL ----
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
  }, [messages]);

  // ---- CHIP ANIMATION ----
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateChip = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const simulateTyping = async (callback: () => void) => {
    setTyping(true);
    setTimeout(() => {
      callback();
      setTyping(false);
    }, 850);
  };

  const persist = useCallback(
    async (next: SupportMessage[]) => {
      setMessages(next);
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
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

  // BOAS-VINDAS PREMIUM
  useEffect(() => {
    if (messages && messages.length === 0) {
      const welcome: SupportMessage = {
        id: Math.random().toString(36).slice(2),
        sender: 'support',
        content:
          '👋 Olá! Sou o Assistente LimpeJá.\nEstou aqui para ajudar você de forma rápida, humana e segura.\n\nSe quiser, escolha uma opção abaixo ou me envie sua dúvida.',
        createdAt: new Date().toISOString(),
      };
      persist([welcome]);
    }
  }, [messages, persist]);

  const append = useCallback(
    async (msg: SupportMessage, base?: SupportMessage[]) => {
      const source = base ?? messages ?? [];
      await persist([...source, msg]);
    },
    [messages, persist]
  );

  const maybeEscalate = useCallback(
    async (baseList: SupportMessage[]) => {
      if (interactionCount >= 1) {
        const escalation: SupportMessage = {
          id: Math.random().toString(36).slice(2),
          sender: 'support',
          content:
            'Só pra agilizar: me envie o ID do agendamento + horário e endereço. Com isso consigo abrir um ticket automático e priorizado pra você. 💙',
          createdAt: new Date().toISOString(),
        };
        await append(escalation, baseList);
      }
    },
    [append, interactionCount]
  );

  const handleQuickAction = useCallback(
    async (key: string) => {
      if (!messages) return;

      animateChip();

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

      const replyContent = supportReply(key);
      const reply: SupportMessage = {
        id: Math.random().toString(36).slice(2),
        sender: 'support',
        content: replyContent,
        createdAt: new Date().toISOString(),
      };

      await simulateTyping(async () => {
        const withReply = [...next, reply];
        await persist(withReply);
        setInteractionCount((c) => c + 1);
        await maybeEscalate(withReply);
      });
    },
    [messages, persist, maybeEscalate]
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

    const autoMessage =
      'Recebi sua mensagem 💙\nSe quiser agilizar, pode me enviar o ID do agendamento, data/hora e endereço.';

    const auto: SupportMessage = {
      id: Math.random().toString(36).slice(2),
      sender: 'support',
      content: autoMessage,
      createdAt: new Date().toISOString(),
    };

    await simulateTyping(async () => {
      await append(auto, next);
      setInteractionCount((c) => c + 1);
      setSending(false);
    });
  }, [append, input, messages, persist, sending]);

  const headerTitle = useMemo(() => 'Suporte LimpeJá', []);

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

      {/* HEADER PREMIUM */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1A2538" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* LISTA */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const mine = item.sender === 'user';
          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={[styles.bubbleText, mine ? { color: '#FFF' } : { color: '#1A2538' }]}>
                {item.content}
              </Text>
              <Text style={styles.bubbleTime}>
                {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* TYPING */}
      {typing && (
        <View style={styles.typingContainer}>
          <View style={styles.typingBubble}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      )}

      {/* QUICK ACTIONS */}
      <View style={styles.quickActionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <Animated.View key={action.key} style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity style={styles.quickActionBtn} onPress={() => handleQuickAction(action.key)}>
                <Text style={styles.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* INPUT */}
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

  header: {
    paddingTop: 80,
    paddingHorizontal: 16,
    paddingBottom: 14,
    top: -15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A2538' },

  listContent: { paddingHorizontal: 12, paddingBottom: 12 },

  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '82%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginVertical: 6,
  },

  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: '#0A84FF',
    borderTopRightRadius: 4,
  },

  bubbleTheirs: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(220,230,255,0.6)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  bubbleText: { fontSize: 14, fontWeight: '500' },
  bubbleTime: { fontSize: 10, marginTop: 4, opacity: 0.6 },

  typingContainer: { paddingHorizontal: 12, marginBottom: 8 },
  typingBubble: {
    backgroundColor: '#F1F5FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 6,
    width: 60,
  },
  dot: {
    width: 6,
    height: 6,
    backgroundColor: '#A7B5D9',
    borderRadius: 50,
    opacity: 0.8,
  },

  quickActionsContainer: { paddingHorizontal: 22, paddingTop: 6, marginBottom: 10, },
  quickActions: { gap: 8, paddingBottom: 4 },

  quickActionBtn: {
    backgroundColor: '#E8F2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },

  quickActionText: { color: '#0A84FF', fontWeight: '700', fontSize: 12 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 25,
    gap: 8,
    marginBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1A2538',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  sendBtn: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
});
