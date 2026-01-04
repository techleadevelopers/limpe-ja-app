菃뿂菃뻂// LimpeJaApp/app/client/messages/[chatId].tsx഍
import { Ionicons } from '@expo/vector-icons';഍
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';഍
import React, { useCallback, useEffect, useRef, useState } from 'react';഍
import {഍
  ActivityIndicator,഍
  Alert,഍
  FlatList,഍
  KeyboardAvoidingView,഍
  Platform,഍
  StyleSheet,഍
  Text,഍
  TextInput,഍
  TouchableOpacity,഍
  View,഍
  Animated,഍
  Easing,഍
  Image,഍
} from 'react-native';഍
import { io, Socket } from 'socket.io-client';഍
import { appConfig } from '../../../config/appConfig';഍
import { useAuth } from '../../../hooks/useAuth';഍
import { getBookingDetails } from '../../../services/bookingService';഍
import { getChatMessages, sendMessage as sendChatMessage } from '../../../services/chatService';഍
import { BookingStatus } from '../../../types/backend/bookings';഍
import { Message, SendMessageDto } from '../../../types/backend/chat';഍
import { alertUserError, getUserMessage } from '../../_shared/errors/uiFeedback';഍
import { shadow, textFix, inputFix, pressableFix } from '../../_shared/ui/parity';഍
഍
഍
const SOCKET_URL = appConfig.apiUrl.replace('http', 'ws');഍
഍
const CustomChatHeader: React.FC<{഍
  recipientName?: string;഍
  recipientAvatarUrl?: string;഍
  onBackPress: () => void;഍
}> = ({ recipientName, recipientAvatarUrl, onBackPress }) => {഍
  return (഍
    <View style={chatStyles.customHeader}>഍
      <TouchableOpacity onPress={onBackPress} style={chatStyles.headerButton}>഍
        <Ionicons name="arrow-back" size={24} color="#FFF" />഍
      </TouchableOpacity>഍
      <View style={chatStyles.headerRecipientInfo}>഍
        <Image഍
          source={recipientAvatarUrl ? { uri: recipientAvatarUrl } : require('../../../assets/images/default-avatar.png')}഍
          style={chatStyles.headerAvatar}഍
        />഍
        <View>഍
          <Text style={chatStyles.headerRecipientName}>{recipientName || 'Chat'}</Text>഍
          <Text style={chatStyles.headerRecipientStatus}>Online</Text>഍
        </View>഍
      </View>഍
      <View style={chatStyles.headerActions}>഍
        <TouchableOpacity style={chatStyles.headerButton}>഍
          <Ionicons name="videocam-outline" size={24} color="#5eb2e2ff" />഍
        </TouchableOpacity>഍
        <TouchableOpacity style={chatStyles.headerButton}>഍
          <Ionicons name="call-outline" size={24} color="#5eb2e2ff" />഍
        </TouchableOpacity>഍
      </View>഍
    </View>഍
  );഍
};഍
഍
export default function ChatScreen() {഍
  const router = useRouter();഍
  const { chatId, recipientName, recipientId, recipientAvatarUrl, bookingId } =഍
    useLocalSearchParams<{഍
      chatId?: string;഍
      recipientName?: string;഍
      recipientId?: string;഍
      recipientAvatarUrl?: string;഍
      bookingId?: string;഍
    }>();഍
  const { user, token, isAuthenticated } = useAuth();഍
  const [messages, setMessages] = useState<Message[]>([]);഍
  const [inputText, setInputText] = useState('');഍
  const [isLoading, setIsLoading] = useState(true);഍
  const [chatBlockedMessage, setChatBlockedMessage] = useState<string | null>(null);഍
  const socketRef = useRef<Socket | null>(null);഍
  const flatListRef = useRef<FlatList>(null);഍
  const userId = user?.id;഍
഍
  const chatBlockedAnim = useRef(new Animated.Value(0)).current;഍
  const inputContainerAnim = useRef(new Animated.Value(0)).current;഍
  const sendButtonScaleAnim = useRef(new Animated.Value(1)).current;഍
഍
  useEffect(() => {഍
    if (!isAuthenticated || !token || !chatId || !userId) {഍
      setIsLoading(false);഍
      setChatBlockedMessage('VocĂŞ precisa estar logado para acessar este chat.');഍
      return;഍
    }഍
഍
    const loadChatData = async () => {഍
      setIsLoading(true);഍
      setChatBlockedMessage(null);഍
഍
      try {഍
        const fetchedMessages = await getChatMessages(chatId, { limit: 50, offset: 0 });഍
        setMessages(fetchedMessages.reverse());഍
഍
        // đź‘‡ CorreĂ苃ꟂȀ䄁漁㨀 䰀椀洀瀀攀 漀 攀猀琀愀搀漀 搀攀 攀爀爀漀 愀瀀Ȁ䈁猁 漀 猀甀挀攀猀猀漀 搀愀 爀攀焀甀椀猀椀Ȁ쌁슂§ĂŁo഍
        setChatBlockedMessage(null);഍
഍
        if (bookingId) {഍
          const bookingDetails = await getBookingDetails(bookingId);഍
          if (bookingDetails.status === BookingStatus.COMPLETED) {഍
            setChatBlockedMessage('Este chat foi encerrado, pois o serviĂ苃Ꟃ漀 昀漀椀 挀漀渀挀氀甀Ȁ쌁슂­do.');഍
          } else if (bookingDetails.status === BookingStatus.CANCELLED) {഍
            setChatBlockedMessage('Este chat foi encerrado, pois o agendamento foi cancelado.');഍
          } else if (bookingDetails.status === BookingStatus.PENDING) {഍
            // đź‘‡ Aqui entra a mensagem mais humana഍
            setChatBlockedMessage(഍
              `FaĂ苃Ꟃ愀 漀 瀀愀最愀洀攀渀琀漀 搀漀 猀攀爀瘀椀Ȁ쌁슂§o para falar com ${recipientName || bookingDetails.providerFullName || 'o prestador'}.`഍
            );഍
          }഍
        }഍
      } catch (error: any) {഍
        console.error('Erro ao carregar mensagens ou verificar agendamento:', error);഍
        const normalized = getUserMessage(error);഍
        if (഍
          error.message.includes('NĂŁo Ă苃꧂ 瀀漀猀猀Ȁ쌁슂­vel acessar esta conversa') ||഍
          error.message.includes('NĂŁo Ă苃꧂ 瀀漀猀猀Ȁ쌁슂­vel enviar mensagens')഍
        ) {഍
          setChatBlockedMessage(normalized);഍
        } else {഍
          Alert.alert('Erro', 'NĂŁo foi possĂ苃귂瘀攀氀 挀愀爀爀攀最愀爀 愀猀 洀攀渀猀愀最攀渀猀 搀漀 挀栀愀琀⸀✀⤀㬀ഀഀ਍          猀攀琀䌀栀愀琀䈀氀漀挀欀攀搀䴀攀猀猀愀最攀⠀✀一Ȁ䄁漁 昀漀椀 瀀漀猀猀Ȁ쌁슂­vel carregar as mensagens.');഍
        }഍
      } finally {഍
        setIsLoading(false);഍
        Animated.timing(inputContainerAnim, {഍
          toValue: 1,഍
          duration: 300,഍
          easing: Easing.out(Easing.ease),഍
          useNativeDriver: true,഍
        }).start();഍
      }഍
    };഍
    loadChatData();഍
഍
    const socket = io(SOCKET_URL, {഍
      transports: ['websocket'],഍
      auth: { token },഍
    });഍
഍
    socketRef.current = socket;഍
഍
    socket.on('connect', () => {഍
      socket.emit('joinChat', chatId);഍
    });഍
഍
    socket.on('newMessage', (newMessage: Message) => {഍
      setMessages((prevMessages) => [...prevMessages, newMessage]);഍
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);഍
    });഍
഍
    socket.on('errorMessage', (data: { event: string; message: string }) => {഍
      if (data.event === 'joinChat' || data.event === 'sendMessage') {഍
        setChatBlockedMessage(data.message);഍
      } else {഍
        Alert.alert('Erro no Chat', data.message || 'Houve um problema com a conexĂŁo do chat.');഍
      }഍
    });഍
഍
    socket.on('disconnect', () => {഍
      setChatBlockedMessage('ConexĂŁo com o chat perdida.');഍
    });഍
഍
    return () => {഍
      socket.disconnect();഍
    };഍
  }, [isAuthenticated, token, chatId, userId, bookingId, inputContainerAnim, recipientName]);഍
഍
  useEffect(() => {഍
    if (chatBlockedMessage) {഍
      Animated.timing(chatBlockedAnim, {഍
        toValue: 1,഍
        duration: 300,഍
        easing: Easing.out(Easing.ease),഍
        useNativeDriver: true,഍
      }).start();഍
    } else {഍
      Animated.timing(chatBlockedAnim, {഍
        toValue: 0,഍
        duration: 200,഍
        easing: Easing.out(Easing.ease),഍
        useNativeDriver: true,഍
      }).start();഍
    }഍
  }, [chatBlockedMessage, chatBlockedAnim]);഍
഍
  const handleSendMessage = useCallback(async () => {഍
    if (inputText.trim() === '' || !user?.id || !chatId || !recipientId || chatBlockedMessage) {഍
      return;഍
    }഍
഍
    const newMessageData: SendMessageDto = {഍
      chatId,഍
      senderId: user.id,഍
      receiverId: recipientId,഍
      content: inputText.trim(),഍
    };഍
഍
    try {഍
      if (socketRef.current && socketRef.current.connected) {഍
        socketRef.current.emit('sendMessage', newMessageData);഍
      } else {഍
        await sendChatMessage(newMessageData);഍
      }഍
      setInputText('');഍
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);഍
    } catch (error: any) {഍
      const normalized = getUserMessage(error);഍
      if (error.message.includes('NĂŁo Ă苃꧂ 瀀漀猀猀Ȁ쌁슂­vel enviar mensagens')) {഍
        setChatBlockedMessage(normalized);഍
      } else {഍
        alertUserError(error, 'Erro ao enviar mensagem');഍
      }഍
    }഍
  }, [inputText, user, chatId, recipientId, chatBlockedMessage]);഍
഍
  const renderMessage = ({ item }: { item: Message }) => {഍
    const isMyMessage = item.senderId === userId;഍
    return (഍
      <View഍
        style={[഍
          chatStyles.messageBubble,഍
          isMyMessage ? chatStyles.myMessage : chatStyles.theirMessage,഍
          // Removido isMyMessage ? chatStyles.myMessageTail : chatStyles.theirMessageTail,഍
          chatStyles.messageShadow,഍
        ]}഍
      >഍
        <Text style={[chatStyles.messageContent, isMyMessage ? { color: '#FFFFFF' } : { color: '#212529' }]}>഍
          {item.content}഍
        </Text>഍
        <Text഍
          style={[഍
            chatStyles.messageTime,഍
            isMyMessage ? { color: 'rgba(255,255,255,0.7)' } : { color: '#6C757D' },഍
          ]}഍
        >഍
          {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}഍
        </Text>഍
      </View>഍
    );഍
  };഍
഍
  if (isLoading) {഍
    return (഍
      <View style={chatStyles.loadingContainer}>഍
        <ActivityIndicator size="large" color="#4A90E2" /> {/* Cor do ActivityIndicator ajustada */}഍
        <Text style={chatStyles.loadingText}>Carregando mensagens...</Text>഍
      </View>഍
    );഍
  }഍
഍
  const isInputDisabled = !isAuthenticated || !!chatBlockedMessage;഍
഍
  const onPressInSendButton = () => {഍
    Animated.spring(sendButtonScaleAnim, { ഍
      toValue: 0.9, ഍
      useNativeDriver: true,഍
      friction: 5, // Ajuste para mais "mola"഍
      tension: 80, // Retorno rĂ菃蟂瀂椀搀漀ഀഀ਍    紀⤀⸀猀琀愀爀琀⠀⤀㬀ഀഀ਍  紀㬀ഀഀ਍  挀漀渀猀琀 漀渀倀爀攀猀猀伀甀琀匀攀渀搀䈀甀琀琀漀渀 㴀 ⠀⤀ 㴀㸀 笀ഀഀ਍    䄀渀椀洀愀琀攀搀⸀猀瀀爀椀渀最⠀猀攀渀搀䈀甀琀琀漀渀匀挀愀氀攀䄀渀椀洀Ⰰ 笀 ഀഀ਍      琀漀嘀愀氀甀攀㨀 ㄀Ⰰ ഀഀ਍      昀爀椀挀琀椀漀渀㨀 㔀Ⰰ ഀഀ਍      琀攀渀猀椀漀渀㨀 㠀　Ⰰ ഀഀ਍      甀猀攀一愀琀椀瘀攀䐀爀椀瘀攀爀㨀 琀爀甀攀 ഀഀ਍    紀⤀⸀猀琀愀爀琀⠀⤀㬀ഀഀ਍  紀㬀ഀഀ਍ഀഀ਍  爀攀琀甀爀渀 ⠀ഀഀ਍    㰀䬀攀礀戀漀愀爀搀䄀瘀漀椀搀椀渀最嘀椀攀眀ഀഀ਍      猀琀礀氀攀㴀笀挀栀愀琀匀琀礀氀攀猀⸀挀漀渀琀愀椀渀攀爀紀ഀഀ਍      戀攀栀愀瘀椀漀爀㴀笀倀氀愀琀昀漀爀洀⸀伀匀 㴀㴀㴀 ✀椀漀猀✀ 㼀 ✀瀀愀搀搀椀渀最✀ 㨀 ✀栀攀椀最栀琀✀紀ഀഀ਍      欀攀礀戀漀愀爀搀嘀攀爀琀椀挀愀氀伀昀昀猀攀琀㴀笀倀氀愀琀昀漀爀洀⸀伀匀 㴀㴀㴀 ✀椀漀猀✀ 㼀 㤀　 㨀 　紀ഀഀ਍    㸀ഀഀ਍      㰀匀琀愀挀欀⸀匀挀爀攀攀渀 漀瀀琀椀漀渀猀㴀笀笀 栀攀愀搀攀爀匀栀漀眀渀㨀 昀愀氀猀攀 紀紀 ⼀㸀ഀഀ਍      㰀䌀甀猀琀漀洀䌀栀愀琀䠀攀愀搀攀爀ഀഀ਍        爀攀挀椀瀀椀攀渀琀一愀洀攀㴀笀爀攀挀椀瀀椀攀渀琀一愀洀攀紀ഀഀ਍        爀攀挀椀瀀椀攀渀琀䄀瘀愀琀愀爀唀爀氀㴀笀爀攀挀椀瀀椀攀渀琀䄀瘀愀琀愀爀唀爀氀紀ഀഀ਍        漀渀䈀愀挀欀倀爀攀猀猀㴀笀⠀⤀ 㴀㸀 爀漀甀琀攀爀⸀戀愀挀欀⠀⤀紀ഀഀ਍      ⼀㸀ഀഀ਍ഀഀ਍ഀഀ਍ഀഀ਍      㰀䄀渀椀洀愀琀攀搀⸀嘀椀攀眀ഀഀ਍        猀琀礀氀攀㴀笀嬀ഀഀ਍          挀栀愀琀匀琀礀氀攀猀⸀挀栀愀琀䈀氀漀挀欀攀搀䌀漀渀琀愀椀渀攀爀Ⰰഀഀ਍          笀 漀瀀愀挀椀琀礀㨀 挀栀愀琀䈀氀漀挀欀攀搀䄀渀椀洀Ⰰ 栀攀椀最栀琀㨀 挀栀愀琀䈀氀漀挀欀攀搀䄀渀椀洀⸀椀渀琀攀爀瀀漀氀愀琀攀⠀笀 椀渀瀀甀琀刀愀渀最攀㨀 嬀　Ⰰ ㄀崀Ⰰ 漀甀琀瀀甀琀刀愀渀最攀㨀 嬀　Ⰰ 㔀　崀 紀⤀ 紀Ⰰഀഀ਍        崀紀ഀഀ਍      㸀ഀഀ਍        笀挀栀愀琀䈀氀漀挀欀攀搀䴀攀猀猀愀最攀 ☀☀ ⠀ഀഀ਍          㰀㸀ഀഀ਍            㰀䤀漀渀椀挀漀渀猀 渀愀洀攀㴀∀椀渀昀漀爀洀愀琀椀漀渀ⴀ挀椀爀挀氀攀ⴀ漀甀琀氀椀渀攀∀ 猀椀稀攀㴀笀㈀㐀紀 挀漀氀漀爀㴀∀⌀䐀䌀㌀㔀㐀㔀∀ ⼀㸀ഀഀ਍            㰀吀攀砀琀 猀琀礀氀攀㴀笀挀栀愀琀匀琀礀氀攀猀⸀挀栀愀琀䈀氀漀挀欀攀搀吀攀砀琀紀㸀笀挀栀愀琀䈀氀漀挀欀攀搀䴀攀猀猀愀最攀紀㰀⼀吀攀砀琀㸀ഀഀ਍          㰀⼀㸀ഀഀ਍        ⤀紀ഀഀ਍      㰀⼀䄀渀椀洀愀琀攀搀⸀嘀椀攀眀㸀ഀഀ਍ഀഀ਍      㰀䘀氀愀琀䰀椀猀琀ഀഀ਍        爀攀昀㴀笀昀氀愀琀䰀椀猀琀刀攀昀紀ഀഀ਍        搀愀琀愀㴀笀洀攀猀猀愀最攀猀紀ഀഀ਍        欀攀礀䔀砀琀爀愀挀琀漀爀㴀笀⠀椀琀攀洀⤀ 㴀㸀 椀琀攀洀⸀椀搀紀ഀഀ਍        爀攀渀搀攀爀䤀琀攀洀㴀笀爀攀渀搀攀爀䴀攀猀猀愀最攀紀ഀഀ਍        猀琀礀氀攀㴀笀挀栀愀琀匀琀礀氀攀猀⸀洀攀猀猀愀最攀猀䰀椀猀琀紀ഀഀ਍        挀漀渀琀攀渀琀䌀漀渀琀愀椀渀攀爀匀琀礀氀攀㴀笀挀栀愀琀匀琀礀氀攀猀⸀洀攀猀猀愀最攀猀䰀椀猀琀䌀漀渀琀攀渀琀紀ഀഀ਍        漀渀䌀漀渀琀攀渀琀匀椀稀攀䌀栀愀渀最攀㴀笀⠀⤀ 㴀㸀 昀氀愀琀䰀椀猀琀刀攀昀⸀挀甀爀爀攀渀琀㼀⸀猀挀爀漀氀氀吀漀䔀渀搀⠀笀 愀渀椀洀愀琀攀搀㨀 琀爀甀攀 紀⤀紀ഀഀ਍      ⼀㸀ഀഀ਍      㰀䄀渀椀洀愀琀攀搀⸀嘀椀攀眀 猀琀礀氀攀㴀笀嬀挀栀愀琀匀琀礀氀攀猀⸀椀渀瀀甀琀䌀漀渀琀愀椀渀攀爀Ⰰ 笀 漀瀀愀挀椀琀礀㨀 椀渀瀀甀琀䌀漀渀琀愀椀渀攀爀䄀渀椀洀 紀Ⰰ 挀栀愀琀匀琀礀氀攀猀⸀椀渀瀀甀琀䌀漀渀琀愀椀渀攀爀匀栀愀搀漀眀崀紀㸀ഀഀ਍        㰀吀漀甀挀栀愀戀氀攀伀瀀愀挀椀琀礀 猀琀礀氀攀㴀笀挀栀愀琀匀琀礀氀攀猀⸀椀渀瀀甀琀䤀挀漀渀紀㸀ഀഀ਍            㰀䤀漀渀椀挀漀渀猀 渀愀洀攀㴀∀愀琀琀愀挀栀ⴀ漀甀琀氀椀渀攀∀ 猀椀稀攀㴀笀㈀㐀紀 挀漀氀漀爀㴀∀⌀㠀㘀㠀䔀㤀㘀∀ ⼀㸀ഀഀ਍        㰀⼀吀漀甀挀栀愀戀氀攀伀瀀愀挀椀琀礀㸀ഀഀ਍        㰀吀攀砀琀䤀渀瀀甀琀ഀഀ਍          猀琀礀氀攀㴀笀嬀挀栀愀琀匀琀礀氀攀猀⸀椀渀瀀甀琀Ⰰ 椀猀䤀渀瀀甀琀䐀椀猀愀戀氀攀搀 ☀☀ 挀栀愀琀匀琀礀氀攀猀⸀搀椀猀愀戀氀攀搀䤀渀瀀甀琀崀紀ഀഀ਍          瘀愀氀甀攀㴀笀椀渀瀀甀琀吀攀砀琀紀ഀഀ਍          漀渀䌀栀愀渀最攀吀攀砀琀㴀笀猀攀琀䤀渀瀀甀琀吀攀砀琀紀ഀഀ਍          瀀氀愀挀攀栀漀氀搀攀爀㴀笀椀猀䤀渀瀀甀琀䐀椀猀愀戀氀攀搀 㼀 ✀䌀栀愀琀 椀渀搀椀猀瀀漀渀Ȁ쌁슂­vel' : 'Digite sua mensagem...'}഍
          placeholderTextColor="#6C757D"഍
          multiline഍
          editable={!isInputDisabled}഍
        />഍
        <TouchableOpacity style={chatStyles.inputIcon}>഍
            <Ionicons name="happy-outline" size={24} color="#5eb2e2ff" />഍
        </TouchableOpacity>഍
        <TouchableOpacity style={chatStyles.inputIcon}>഍
            <Ionicons name="mic-outline" size={24} color="#868E96" />഍
        </TouchableOpacity>഍
        <TouchableOpacity഍
          onPress={handleSendMessage}഍
          style={[഍
            chatStyles.sendButton,഍
            isInputDisabled && chatStyles.disabledSendButton,഍
            { transform: [{ scale: sendButtonScaleAnim }] },഍
          ]}഍
          onPressIn={onPressInSendButton}഍
          onPressOut={onPressOutSendButton}഍
          disabled={isInputDisabled}഍
        >഍
          <Ionicons name="send" size={24} color="#eee3e3ff" />഍
        </TouchableOpacity>഍
      </Animated.View>഍
    </KeyboardAvoidingView>഍
  );഍
}഍
഍
const chatStyles = StyleSheet.create({഍
  container: {഍
    flex: 1,഍
    backgroundColor: '#F0F8FF', // Alterado para o azul claro do perfil഍
  },഍
  loadingContainer: {഍
    flex: 1,഍
    justifyContent: 'center',഍
    alignItems: 'center',഍
    backgroundColor: '#F0F8FF', // Alterado para o azul claro do perfil഍
  },഍
  loadingText: {഍
    marginTop: 10,഍
    fontSize: 16,഍
    color: '#6C757D',഍
  },഍
  customHeader: {഍
    top: 10,഍
    flexDirection: 'row',഍
    marginBottom: 20,഍
    alignItems: 'center',഍
    justifyContent: 'space-between',഍
    backgroundColor: '#FFFFFF', // Branco como na category഍
    borderBottomEndRadius: 32,഍
    borderBottomStartRadius: 32,഍
    paddingHorizontal: 15,഍
    paddingVertical: Platform.OS === 'ios' ? 40 : 20,഍
    paddingTop: Platform.OS === 'ios' ? 40 : 20,഍
    borderBottomLeftRadius: 40,഍
    borderBottomRightRadius: 40,഍
    ...shadow(2),഍
  },഍
  headerButton: {഍
    ...pressableFix(),഍
    padding: 5,഍
    top: 20,഍
  },഍
  headerRecipientInfo: {഍
    flexDirection: 'row',഍
    top: 20,഍
    alignItems: 'center',഍
    flex: 1,഍
    marginLeft: 10,഍
  },഍
  headerAvatar: {഍
    width: 40,഍
    height: 40,഍
    borderRadius: 20,഍
    marginRight: 10,഍
    borderWidth: 1,഍
    borderColor: '#FFF',഍
  },഍
  headerRecipientName: {഍
    ...textFix({ fontSize: 18, fontWeight: '600' }),഍
    color: '#4d85a5ff',഍
  },഍
  headerRecipientStatus: {഍
    ...textFix({ fontSize: 12 }),഍
    color: '#4d85a5ff',഍
  },഍
  headerActions: {഍
    flexDirection: 'row',഍
  },഍
  panicBannerWrapper: {഍
    marginHorizontal: 15,഍
    marginTop: 10,഍
    marginBottom: 5,഍
  },഍
  chatBlockedContainer: {഍
    backgroundColor: '#FFE0E6',഍
    paddingVertical: 10,഍
    paddingHorizontal: 15,഍
    flexDirection: 'row',഍
    alignItems: 'center',഍
    justifyContent: 'center',഍
    borderBottomWidth: 1,഍
    borderBottomColor: '#FFC0CB',഍
    overflow: 'hidden',഍
  },഍
  chatBlockedText: {഍
    marginLeft: 8,഍
    color: '#DC3545',഍
    fontSize: 14,഍
    textAlign: 'center',഍
    flex: 1,഍
  },഍
  messagesList: {഍
    flex: 1,഍
    paddingHorizontal: 10,഍
  },഍
  messagesListContent: {഍
    paddingVertical: 10,഍
  },഍
  messageBubble: {഍
    padding: 12,഍
    borderRadius: 18,഍
    maxWidth: '80%',഍
    marginBottom: 10,഍
    flexDirection: 'column',഍
  },഍
  messageShadow: {഍
    ...shadow(1),഍
  },഍
  myMessage: {഍
    alignSelf: 'flex-end',഍
    backgroundColor: '#4A90E2', // Alterado para o azul principal do perfil഍
    borderTopRightRadius: 18,഍
    borderBottomRightRadius: 4,഍
    borderTopLeftRadius: 18,഍
    borderBottomLeftRadius: 18,഍
  },഍
  // myMessageTail: { }, // Removido഍
  theirMessage: {഍
    alignSelf: 'flex-start',഍
    backgroundColor: '#FFFFFF',഍
    borderTopLeftRadius: 18,഍
    borderBottomLeftRadius: 4,഍
    borderTopRightRadius: 18,഍
    borderBottomRightRadius: 18,഍
  },഍
  // theirMessageTail: { }, // Removido഍
  messageContent: {഍
    ...textFix({ fontSize: 15 }),഍
  },഍
  messageTime: {഍
    ...textFix({ fontSize: 10 }),഍
    alignSelf: 'flex-end',഍
    marginTop: 5,഍
  },഍
  inputContainer: {഍
    flexDirection: 'row',഍
    alignItems: 'flex-end',഍
    padding: 10,഍
    backgroundColor: '#FFFFFF',഍
    borderTopWidth: 1,഍
    borderTopColor: '#E9ECEF',഍
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,഍
  },഍
  inputContainerShadow: {഍
    ...shadow(2),഍
  },഍
  inputIcon: {഍
    padding: 8,഍
    marginBottom: Platform.OS === 'ios' ? 0 : 5,഍
  },഍
  input: {഍
    flex: 1,഍
    backgroundColor: '#F8F9FA',഍
    borderRadius: 25,഍
    paddingHorizontal: 15,഍
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,഍
    fontSize: 16,഍
    marginHorizontal: 5,഍
    maxHeight: 120,഍
    minHeight: 45,഍
    borderColor: '#E9ECEF',഍
    borderWidth: 1,഍
    ...inputFix(),഍
  },഍
  disabledInput: {഍
    backgroundColor: '#E9ECEF',഍
    color: '#ADB5BD',഍
  },഍
  sendButton: {഍
    ...pressableFix(),഍
    backgroundColor: '#4A90E2', // Alterado para o azul principal do perfil഍
    borderRadius: 25,഍
    width: 50,഍
    height: 50,഍
    justifyContent: 'center',഍
    alignItems: 'center',഍
    marginLeft: 5,഍
    marginBottom: Platform.OS === 'ios' ? 0 : 5,഍
  },഍
  disabledSendButton: {഍
    backgroundColor: '#A0CFFF', // Azul mais claro para o botĂŁo desabilitado഍
  },഍
});഍
