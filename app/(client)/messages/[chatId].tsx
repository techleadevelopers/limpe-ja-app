// LimpeJaApp/app/(client)/messages/[chatId].tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, TouchableOpacity, Alert
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth'; // Ajuste o caminho se necessário

// Definição do tipo de mensagem (mova para types/ se usar em mais lugares)
interface Message {
  id: string;
  text: string;
  timestamp: string; // ISO string
  senderId: string; // ID do remetente ('currentUser' ou ID do outro usuário)
  // Adicione mais campos se necessário, como avatarUrl, messageType (text, image), etc.
}

// Função mockada para simular envio/recebimento de mensagens
const mockChatService = {
  fetchMessages: async (chatId: string, currentUserId: string): Promise<Message[]> => {
    console.log(`[ChatScreen] Buscando mensagens para chatId: ${chatId}`);
    await new Promise(resolve => setTimeout(resolve, 700));
    if (chatId.startsWith('new_')) { // Novo chat
      return [];
    }
    // Simula mensagens existentes para um chat não-novo
    return [
      { id: '3', text: 'Perfeito! Estarei aguardando.', senderId: 'otherUser', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: '2', text: 'Sim, confirmo o agendamento para amanhã às 10h.', senderId: currentUserId, timestamp: new Date(Date.now() - 3600000 * 1).toISOString() },
      { id: '1', text: 'Olá! Gostaria de confirmar nosso agendamento.', senderId: 'otherUser', timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString() },
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // Ordena por data
  },
  sendMessage: async (chatId: string, message: { text: string; senderId: string }): Promise<Message> => {
    console.log(`[ChatScreen] Enviando mensagem para ${chatId}:`, message.text);
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      id: String(Date.now()),
      ...message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Regex para detectar padrões (simplificado)
const PHONE_REGEX = /(\b\d{2}\b\s?[\s9]?\d{4,5}[\s-]?\d{4}\b)|(\b\d{10,11}\b)/; // Pega números de telefone BR
const SOCIAL_MEDIA_REGEX = /instagram\.com|facebook\.com|twitter\.com|wa\.me|t\.me|linkedin\.com/i;

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth(); // Pega o usuário logado
  const params = useLocalSearchParams<{
    chatId: string; // Sempre será uma string (ex: 'new_provider123' ou 'existingChatId')
    recipientName?: string;
    recipientId?: string; // ID do outro participante do chat
  }>();
  
  const { chatId: routeChatId, recipientName, recipientId: paramRecipientId } = params;

  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const currentUserId = user?.id || 'currentUser'; // Fallback se user.id não estiver disponível

  // Determina se é um novo chat e qual é o ID do parceiro de conversa
  const isNewChat = routeChatId.startsWith('new_');
  // Se for novo, o ID do parceiro pode vir de paramRecipientId ou extraído do routeChatId
  const partnerId = isNewChat ? (paramRecipientId || routeChatId.substring(4)) : paramRecipientId; 
  // O effectiveChatId seria o routeChatId se for um chat existente,
  // ou um ID a ser gerado/usado para um novo chat. Para este exemplo, vamos usar o routeChatId.
  const effectiveChatId = routeChatId;

  useEffect(() => {
    if (!user) {
      console.warn("[ChatScreen] Usuário não autenticado, redirecionando para login.");
      router.replace('/(auth)/login');
      return;
    }

    console.log(`[ChatScreen] Configurando chat. ChatID da Rota: ${routeChatId}, É novo?: ${isNewChat}, ParceiroID: ${partnerId}, Nome Parceiro: ${recipientName}`);
    setIsLoading(true);
    mockChatService.fetchMessages(effectiveChatId, currentUserId)
      .then(fetchedMessages => {
        setMessages(fetchedMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())); // Invertido para FlatList invertida
      })
      .catch(err => {
        console.error("[ChatScreen] Erro ao buscar mensagens:", err);
        Alert.alert("Erro", "Não foi possível carregar as mensagens.");
      })
      .finally(() => setIsLoading(false));
  }, [effectiveChatId, currentUserId, user, router]); // Adicionado user e router

  const handleSendMessage = async () => {
    if (inputText.trim().length === 0 || isSending) return;

    const lowerInputText = inputText.toLowerCase();
    if (PHONE_REGEX.test(lowerInputText) || SOCIAL_MEDIA_REGEX.test(lowerInputText)) {
      Alert.alert(
        "Conteúdo Não Permitido",
        "Por favor, não compartilhe números de telefone ou links de redes sociais diretamente no chat. Use a plataforma para todas as comunicações e agendamentos."
      );
      return;
    }

    setIsSending(true);
    const optimisticMessage: Message = {
      id: String(Date.now()) + '_optimistic',
      text: inputText,
      senderId: currentUserId,
      timestamp: new Date().toISOString(),
    };

    setMessages(prevMessages => [optimisticMessage, ...prevMessages]);
    setInputText('');
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });


    try {
      // Em um app real, o `effectiveChatId` para um novo chat seria atualizado aqui
      // com o ID real do chat retornado pelo backend após a primeira mensagem.
      await mockChatService.sendMessage(effectiveChatId, { text: optimisticMessage.text, senderId: currentUserId });
      // Aqui você poderia atualizar a mensagem otimista com o ID real do backend, se necessário
      console.log("[ChatScreen] Mensagem enviada (simulado).");
    } catch (error) {
      console.error("[ChatScreen] Falha ao enviar mensagem:", error);
      Alert.alert("Erro", "Não foi possível enviar sua mensagem.");
      // Reverter a mensagem otimista ou marcar como falha
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const renderMessageItem = useCallback(({ item, index }: { item: Message, index: number }) => {
    const isMyMessage = item.senderId === currentUserId;
    const showDateSeparator = index === messages.length - 1 || 
      new Date(item.timestamp).toDateString() !== new Date(messages[index + 1].timestamp).toDateString();

    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparatorContainer}>
            <Text style={styles.dateSeparatorText}>
              {new Date(item.timestamp).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
        )}
        <View style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.theirMessageRow]}>
          {/* {!isMyMessage && <Image source={{ uri: 'https://via.placeholder.com/30' }} style={styles.avatar} />} */}
          <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble]}>
            <Text style={isMyMessage ? styles.myMessageText : styles.theirMessageText}>{item.text}</Text>
            <Text style={[styles.timestamp, isMyMessage ? styles.myTimestamp : styles.theirTimestamp]}>
              {new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          {/* {isMyMessage && <Image source={{ uri: 'https://via.placeholder.com/30' }} style={styles.avatar} />} */}
        </View>
      </>
    );
  }, [currentUserId, messages]); // Adicionado messages como dependência

  if (isLoading) {
    return (
      <View style={styles.centeredLoader}>
        <Stack.Screen options={{ title: recipientName || 'Carregando Chat...' }} />
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.select({ ios: 90, android: 60 })} // Ajuste conforme o header
    >
      <Stack.Screen options={{ title: recipientName || (isNewChat ? `Chat com ${partnerId}` : 'Chat') }} />
      <Text style={styles.policyReminder}>
        Para sua segurança, mantenha as negociações e o compartilhamento de informações dentro da plataforma LimpeJá.
      </Text>
      {messages.length === 0 ? (
          <View style={styles.emptyChatContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
              <Text style={styles.emptyChatMessage}>Nenhuma mensagem ainda.</Text>
              {isNewChat && <Text style={styles.emptyChatHint}>Envie a primeira mensagem para {recipientName || 'o profissional'}!</Text>}
          </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages} // Já está ordenada para invertida
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesListContent}
          inverted // Importante para o layout de chat
          keyboardShouldPersistTaps="handled"
        />
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Digite sua mensagem..."
          placeholderTextColor="#8e8e92"
          multiline
          editable={!isSending}
        />
        <TouchableOpacity style={[styles.sendButton, isSending && styles.sendButtonDisabled]} onPress={handleSendMessage} disabled={isSending}>
          {isSending ? <ActivityIndicator size="small" color="#007AFF" /> : <Ionicons name="send" size={24} color="#007AFF" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Estilos aprimorados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Um fundo de chat mais suave
  },
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  policyReminder: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#FFFBEA', // Amarelo claro para aviso
    color: '#B2A429',
    fontSize: 12,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FEF0C7',
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    paddingHorizontal: 10,
    paddingVertical: 10, // Para dar espaço em cima e embaixo
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 5,
    maxWidth: '85%', // Para não ocupar a tela inteira
  },
  myMessageRow: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end', // Alinha o container da linha à direita
  },
  theirMessageRow: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start', // Alinha o container da linha à esquerda
  },
  avatar: { // Estilo para avatar (opcional)
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 8,
    alignSelf: 'flex-end', // Alinha o avatar na base do balão
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    minWidth: 60, // Largura mínima para balões pequenos
  },
  myMessageBubble: {
    backgroundColor: '#007AFF', // Azul para minhas mensagens
    borderBottomRightRadius: 4, // Efeito de "cauda"
  },
  theirMessageBubble: {
    backgroundColor: '#FFFFFF', // Branco ou cinza claro para mensagens deles
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderBottomLeftRadius: 4, // Efeito de "cauda"
  },
  myMessageText: {
    color: 'white',
    fontSize: 15,
  },
  theirMessageText: {
    color: 'black',
    fontSize: 15,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirTimestamp: {
    color: '#8E8E92',
  },
  dateSeparatorContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateSeparatorText: {
    backgroundColor: '#E5E5EA',
    color: '#8E8E92',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C7C7CC',
    backgroundColor: '#F9F9F9', // Fundo da área de input
    alignItems: 'flex-end', // Para alinhar o botão com o input multiline
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C7C7CC',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 10 : 8, // Ajustes de padding para multiline
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 16,
    marginRight: 10,
    maxHeight: 100, // Limite para input multiline
  },
  sendButton: {
    padding: 8, // Área de toque maior
    justifyContent: 'center',
    alignItems: 'center',
    height: 40, // Alinhar com a altura mínima do input
    marginBottom: Platform.OS === 'ios' ? 0 : 2, // Ajuste fino para alinhar com input no Android
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyChatContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  emptyChatMessage: {
      fontSize: 18,
      color: '#8e8e92',
      marginTop: 10,
  },
  emptyChatHint: {
      fontSize: 14,
      color: '#aaa',
      marginTop: 5,
      textAlign: 'center',
  }
});