// LimpeJaApp/app/(client)/messages/[chatId].tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, TouchableOpacity, Alert, Animated, Image
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth'; // Ajuste o caminho se necessário
import { LinearGradient } from 'expo-linear-gradient'; // Importar para gradientes nas bolhas

// Definição do tipo de mensagem (mova para types/ se usar em mais lugares)
interface Message {
  id: string;
  text: string;
  timestamp: string; // ISO string
  senderId: string; // ID do remetente ('currentUser' ou ID do outro usuário)
  read?: boolean; // Adicionado para status de leitura
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
      { id: '3', text: 'Perfeito! Estarei aguardando.', senderId: 'otherUser', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), read: true },
      { id: '2', text: 'Sim, confirmo o agendamento para amanhã às 10h.', senderId: currentUserId, timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), read: true },
      { id: '1', text: 'Olá! Gostaria de confirmar nosso agendamento.', senderId: 'otherUser', timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(), read: false },
      { id: '4', text: 'Estou a caminho!', senderId: currentUserId, timestamp: new Date(Date.now() - 3600000 * 0.2).toISOString(), read: false },
      { id: '5', text: 'Chego em 10 minutos.', senderId: currentUserId, timestamp: new Date().toISOString(), read: false },
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // Ordena por data
  },
  sendMessage: async (chatId: string, message: { text: string; senderId: string }): Promise<Message> => {
    console.log(`[ChatScreen] Enviando mensagem para ${chatId}:`, message.text);
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      id: String(Date.now()),
      ...message,
      timestamp: new Date().toISOString(),
      read: false, // Nova mensagem não lida
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
    recipientAvatarUrl?: string; // Adicionado para avatar
    bookingId?: string; // ID do agendamento, se o chat for contextualizado
  }>();
  
  const { chatId: routeChatId, recipientName, recipientId: paramRecipientId, recipientAvatarUrl, bookingId } = params;

  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // Simula "digitando..."
  const [showLongPressOptions, setShowLongPressOptions] = useState<Message | null>(null); // Estado para opções de long press

  const currentUserId = user?.id || 'currentUser'; // Fallback se user.id não estiver disponível

  // Determina se é um novo chat e qual é o ID do parceiro de conversa
  const isNewChat = routeChatId.startsWith('new_');
  const partnerId = isNewChat ? (paramRecipientId || routeChatId.substring(4)) : paramRecipientId; 
  const effectiveChatId = routeChatId; // Em um app real, para new_chat, o ID seria gerado no backend

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const inputBorderAnim = useRef(new Animated.Value(0)).current;
  const sendButtonScaleAnim = useRef(new Animated.Value(1)).current;

  // Animação de entrada do cabeçalho
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  // Animação da borda do input
  const animateInputBorder = (animationValue: Animated.Value, isFocused: boolean) => {
    Animated.timing(animationValue, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // Border color não suporta native driver
    }).start();
  };

  const getInputBorderColor = (animationValue: Animated.Value) => {
    return animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#CED4DA', '#007AFF'], // Cinza para normal, azul para focado
    });
  };

  // Animação do botão de envio
  const onPressInSendButton = () => {
    Animated.spring(sendButtonScaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutSendButton = () => {
    Animated.spring(sendButtonScaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

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
  }, [effectiveChatId, currentUserId, user, router, isNewChat, partnerId, recipientName]);

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
      read: false,
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
      // Simula que a outra pessoa está digitando por um tempo
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    } catch (error) {
      console.error("[ChatScreen] Falha ao enviar mensagem:", error);
      Alert.alert("Erro", "Não foi possível enviar sua mensagem.");
      // Reverter a mensagem otimista ou marcar como falha
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleLongPressMessage = (message: Message) => {
    setShowLongPressOptions(message);
    Alert.alert(
      "Opções da Mensagem",
      `Mensagem: "${message.text}"`,
      [
        { text: "Copiar", onPress: () => Alert.alert("Copiado!", message.text) },
        { text: "Responder", onPress: () => Alert.alert("Responder", `Você está respondendo a: "${message.text}"`) },
        { text: "Excluir", onPress: () => Alert.alert("Excluir", "Mensagem excluída (simulado)") },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  const renderMessageItem = useCallback(({ item, index }: { item: Message, index: number }) => {
    const isMyMessage = item.senderId === currentUserId;
    const showDateSeparator = index === messages.length - 1 || 
      new Date(item.timestamp).toDateString() !== new Date(messages[index + 1].timestamp).toDateString();
    
    // Animação para cada bolha de mensagem ao aparecer (simulado para novas mensagens)
    const messageAnim = new Animated.Value(0);
    useEffect(() => {
        Animated.timing(messageAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [item.id, messageAnim]); // Dispara a animação para cada item novo

    return (
      <Animated.View style={{ opacity: messageAnim, transform: [{ translateY: messageAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        {showDateSeparator && (
          <View style={styles.dateSeparatorContainer}>
            <Text style={styles.dateSeparatorText}>
              {new Date(item.timestamp).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
        )}
        <TouchableOpacity
          onLongPress={() => handleLongPressMessage(item)}
          delayLongPress={300}
          activeOpacity={0.7}
          style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.theirMessageRow]}
        >
          {/* Avatar do outro usuário */}
          {!isMyMessage && (
            <Image 
              source={{ uri: recipientAvatarUrl || 'https://via.placeholder.com/40/007AFF/FFFFFF?text=P' }} 
              style={styles.avatar} 
            />
          )}
          
          {isMyMessage ? (
            <LinearGradient
              colors={['#007AFF', '#005DCC']} // Gradiente para minhas mensagens
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.messageBubble, styles.myMessageBubble]}
            >
              <Text style={styles.myMessageText}>{item.text}</Text>
              <View style={styles.timestampAndStatus}>
                <Text style={styles.myTimestamp}>
                  {new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {item.read ? (
                  <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.8)" style={{ marginLeft: 4 }} />
                ) : (
                  <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.6)" style={{ marginLeft: 4 }} />
                )}
              </View>
            </LinearGradient>
          ) : (
            <View style={[styles.messageBubble, styles.theirMessageBubble]}>
              <Text style={styles.theirMessageText}>{item.text}</Text>
              <Text style={styles.theirTimestamp}>
                {new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }, [currentUserId, messages, recipientAvatarUrl, handleLongPressMessage]);

  if (isLoading) {
    return (
      <View style={styles.centeredLoader}>
        <Stack.Screen options={{ headerShown: false }} />
        {/* Custom Header para o estado de loading */}
        <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerRecipientInfo}>
                <Image source={{ uri: recipientAvatarUrl || 'https://via.placeholder.com/40/007AFF/FFFFFF?text=P' }} style={styles.headerAvatar} />
                <Text style={styles.headerRecipientName}>Carregando Chat...</Text>
            </View>
            <View style={styles.headerActionIconPlaceholder} />
        </Animated.View>
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.select({ ios: 90, android: 60 })} // Ajuste conforme o header
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerRecipientInfo}>
              <Image source={{ uri: recipientAvatarUrl || 'https://via.placeholder.com/40/007AFF/FFFFFF?text=P' }} style={styles.headerAvatar} />
              <View>
                <Text style={styles.headerRecipientName}>{recipientName || (isNewChat ? `Novo Chat` : 'Chat')}</Text>
                {isTyping && <Text style={styles.typingIndicator}>digitando...</Text>}
              </View>
          </View>
          <TouchableOpacity style={styles.headerActionIcon} onPress={() => Alert.alert("Opções", "Ver perfil, Ligar, etc.")}>
              <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
          </TouchableOpacity>
      </Animated.View>

      {/* Booking Context Card (se aplicável) */}
      {bookingId && (
        <TouchableOpacity style={styles.bookingContextCard} onPress={() => Alert.alert("Agendamento", `Detalhes do Agendamento ${bookingId}`)}>
          <Ionicons name="calendar-outline" size={20} color="#1C3A5F" />
          <View style={styles.bookingContextText}>
            <Text style={styles.bookingContextTitle}>Agendamento #AB1234 - Limpeza Padrão</Text>
            <Text style={styles.bookingContextSubtitle}>Amanhã, 10:00h - Status: Confirmado</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#1C3A5F" />
        </TouchableOpacity>
      )}

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
      <View style={styles.inputAreaContainer}>
        {/* Adicionar botões de mídia/voz aqui */}
        <TouchableOpacity style={styles.mediaButton} onPress={() => Alert.alert("Anexar", "Funcionalidade de anexo de mídia")}>
            <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Animated.View style={[styles.inputContainerWrapper, { borderColor: getInputBorderColor(inputBorderAnim) }]}>
            <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                onFocus={() => animateInputBorder(inputBorderAnim, true)}
                onBlur={() => animateInputBorder(inputBorderAnim, false)}
                placeholder="Digite sua mensagem..."
                placeholderTextColor="#8e8e92"
                multiline
                editable={!isSending}
            />
            <TouchableOpacity 
                style={[styles.sendButton, isSending && styles.sendButtonDisabled, { transform: [{ scale: sendButtonScaleAnim }] }]} 
                onPress={handleSendMessage}
                onPressIn={onPressInSendButton}
                onPressOut={onPressOutSendButton}
                disabled={isSending}
            >
                {isSending ? <ActivityIndicator size="small" color="#007AFF" /> : <Ionicons name="send" size={24} color="#FFFFFF" />}
            </TouchableOpacity>
        </Animated.View>
        <TouchableOpacity style={styles.mediaButton} onPress={() => Alert.alert("Voz", "Funcionalidade de mensagem de voz")}>
            <Ionicons name="mic-outline" size={28} color="#007AFF" />
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
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF', // Cor primária do app
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20, // Ajuste para status bar iOS
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerBackButton: {
    marginRight: 15,
  },
  headerRecipientInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  headerRecipientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerOnlineStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 5,
  },
  headerActionIcon: {
    marginLeft: 15,
  },
  headerActionIconPlaceholder: { // Para alinhar o título no centro durante o loading
    width: 24, // Largura do ícone
    marginLeft: 15,
  },
  typingIndicator: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  bookingContextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F2FF', // Azul claro
    padding: 12,
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B3D9FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingContextText: {
    flex: 1,
    marginLeft: 10,
  },
  bookingContextTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C3A5F',
  },
  bookingContextSubtitle: {
    fontSize: 12,
    color: '#495057',
    marginTop: 2,
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
  avatar: { // Estilo para avatar
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
    alignSelf: 'flex-end', // Alinha o avatar na base do balão
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    minWidth: 60, // Largura mínima para balões pequenos
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessageBubble: {
    borderBottomRightRadius: 4, // Efeito de "cauda"
  },
  theirMessageBubble: {
    backgroundColor: '#FFFFFF', // Branco ou cinza claro para mensagens deles
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
  timestampAndStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
  },
  theirTimestamp: {
    color: '#8E8E92',
    fontSize: 10,
    alignSelf: 'flex-end',
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
  inputAreaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C7C7CC',
    backgroundColor: '#F9F9F9',
  },
  inputContainerWrapper: { // Novo container para aplicar a borda animada
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 25, // Mais arredondado para chat
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    paddingTop: Platform.OS === 'ios' ? 10 : 8, // Ajustes de padding para multiline
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 5, // Ajuste para não ter padding duplo
    maxHeight: 100, // Limite para input multiline
  },
  sendButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40, // Botão circular
    borderRadius: 20,
    backgroundColor: '#007AFF', // Cor do botão de envio
    marginLeft: 5,
  },
  sendButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#A0CFFF',
  },
  mediaButton: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 5 : 2,
    marginHorizontal: 5,
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