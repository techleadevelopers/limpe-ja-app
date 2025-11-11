import React from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

type SupportMessage = {
  id: string;
  sender: 'user' | 'support';
  content: string;
  createdAt: string;
};

const STORAGE_KEY = '@LimpeJa:SupportChatMessages';

export default function LimpejaSupportChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = React.useState<SupportMessage[] | null>(null);
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setMessages(JSON.parse(raw));
        else setMessages([]);
      } catch {
        setMessages([]);
      }
    })();
  }, []);

  const persist = async (next: SupportMessage[]) => {
    setMessages(next);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const handleSend = async () => {
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

    // Simula resposta automática do suporte (placeholder até integrar backend)
    setTimeout(async () => {
      const reply: SupportMessage = {
        id: Math.random().toString(36).slice(2),
        sender: 'support',
        content: 'Recebemos sua mensagem. Nossa equipe responderá em breve. ✅',
        createdAt: new Date().toISOString(),
      };
      await persist([...(next || []), reply]);
      setSending(false);
    }, 800);
  };

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
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const mine = item.sender === 'user';
          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}> 
              <Text style={[styles.bubbleText, mine ? { color: '#FFF' } : { color: '#212529' }]}>{item.content}</Text>
              <Text style={styles.bubbleTime}>{new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          );
        }}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escreva sua mensagem..."
          placeholderTextColor="#9CA3AF"
          editable={!sending}
        />
        <TouchableOpacity style={[styles.sendBtn, sending && { opacity: 0.6 }]} disabled={sending || !input.trim()} onPress={handleSend} accessibilityLabel="Enviar mensagem">
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
  inputBar: { flexDirection: 'row', alignItems: 'center', top:'-30', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: '#E9ECEF' },
  input: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#1A2538', borderWidth: 1, borderColor: '#E9ECEF' },
  sendBtn: { backgroundColor: '#0A84FF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
});

