// app/(provider)/components/dashboard/ProviderOverviewSection.tsx
import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, FlatList, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Adicionado MaterialCommunityIcons
import { LinearGradient } from 'expo-linear-gradient'; // Para usar em highlights ou botões

import { Booking as BookingType } from '../../../../types'; // Ajuste o caminho se necessário

// Hook para animação de toque (reutilizável)
const useAnimatedTouch = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };
  return { scaleAnim, onPressIn, onPressOut };
};

interface ProviderOverviewSectionProps {
  contentAnim: Animated.Value; // Animação de entrada para toda a seção
  upcomingServices: BookingType[];
  onServicePress: (id: string) => void;
  onViewAllServicesPress: () => void;
  onViewAllMessagesPress: () => void;
  onAcceptRequest?: (bookingId: string) => void;
  onRejectRequest?: (bookingId: string) => void;
  // CORREÇÃO: clientName agora é string, não string | undefined
  onChatWithClient?: (clientId: string, clientName: string) => void; // Nova prop para chat
  unreadMessagesCount?: number; // Para o link de mensagens
}

// Cores para o tema (ajustadas e expandidas)
const WHITE = '#FFFFFF';
const BACKGROUND_ALT = '#F8F9FD'; // Um branco levemente azulado para itens
const TEXT_DARK = '#1A2538'; // Um azul escuro/preto para texto principal
const TEXT_MEDIUM = '#4A5568'; // Cinza azulado para texto secundário
const TEXT_MUTED = '#7A8599'; // Cinza mais claro
const ICON_PRIMARY = '#007AFF'; // Azul vibrante principal
const SUCCESS_GREEN = '#28a745';
const DANGER_RED = '#dc3545';
const WARNING_YELLOW = '#FFC107'; // Para pendências
const BORDER_SUBTLE = 'rgba(0,0,0,0.08)'; // Borda bem sutil
const SHADOW_COLOR_CARD = 'rgba(0, 0, 0, 0.06)'; // Sombra para cards internos
const SHADOW_COLOR_SECTION = 'rgba(0, 0, 0, 0.1)'; // Sombra mais forte para a seção

// Componente de Item de Solicitação
const RequestItem: React.FC<{
  item: BookingType;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onDetails: (id: string) => void;
  // CORREÇÃO: clientName agora é string, não string | undefined
  onChat?: (clientId: string, clientName: string) => void;
  entryAnim: Animated.ValueXY; // Para animação de entrada individual
}> = ({ item, onAccept, onReject, onDetails, onChat, entryAnim }) => {
  const acceptTouchAnimation = useAnimatedTouch();
  const rejectTouchAnimation = useAnimatedTouch();
  const detailsTouchAnimation = useAnimatedTouch();
  const chatTouchAnimation = useAnimatedTouch();

  // Captura o cliente e o nome do cliente de forma explícita para garantir a tipagem
  let clientId: string | undefined;
  let clientName: string;

  if (item.client && item.client.id) {
    clientId = item.client.id;
    clientName = item.client.name || 'Cliente'; // Garante que clientName é sempre string
  } else {
    // Se o cliente ou o ID do cliente não existirem, definimos um nome padrão
    // clientId permanecerá undefined, o que fará com que a condição onChat && clientId seja falsa
    clientName = 'Cliente'; 
  }

  return (
    <Animated.View style={[
      styles.requestItem,
      {
        opacity: entryAnim.x,
        transform: [{ translateY: entryAnim.y }],
      },
    ]}>
      <View style={styles.requestItemPendingIndicator} />
      <View style={styles.requestItemHeader}>
        <View style={styles.clientAvatarPlaceholder}>
          <Ionicons name="person-outline" size={20} color={TEXT_MEDIUM} />
        </View>
        <Text style={styles.requestServiceName} numberOfLines={1}>{item.serviceSnapshot.name}</Text>
        <TouchableOpacity
          style={styles.acceptButtonCorner}
          onPress={() => onAccept && onAccept(item.id)}
          onPressIn={acceptTouchAnimation.onPressIn}
          onPressOut={acceptTouchAnimation.onPressOut}
          accessibilityRole="button"
          accessibilityLabel={`Aceitar solicitação de ${item.serviceSnapshot.name}`}
        >
          <Animated.View style={{ transform: [{ scale: acceptTouchAnimation.scaleAnim }] }}>
            <Ionicons name="checkmark-circle" size={32} color={SUCCESS_GREEN} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <Text style={styles.requestClientName}>Solicitado por: {clientName}</Text>
      
      {/* CORREÇÃO: Usando priceValueAtBooking em vez de price */}
      {item.serviceSnapshot.priceValueAtBooking !== undefined && ( 
        <Text style={styles.requestPrice}>
            Valor: R$ {item.serviceSnapshot.priceValueAtBooking.toFixed(2).replace('.', ',')}
        </Text>
      )}

      <View style={styles.requestInfoRow}>
        <Ionicons name="calendar-outline" size={16} color={TEXT_MUTED} style={styles.infoIcon} />
        <Text style={styles.requestInfoText}>
          {new Date(item.scheduledDateTime).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
        </Text>
        <Ionicons name="time-outline" size={16} color={TEXT_MUTED} style={styles.infoIcon} />
        <Text style={styles.requestInfoText}>
          {new Date(item.scheduledDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <View style={styles.requestInfoRow}>
        <Ionicons name="location-outline" size={16} color={TEXT_MUTED} style={styles.infoIcon} />
        <Text style={styles.requestInfoText} numberOfLines={1}>{item.address.street}, {item.address.number}</Text>
      </View>

      <View style={styles.requestActionsRow}>
        {/* Agora, onChat e clientId são verificados, e clientId e clientName são garantidamente strings */}
        {onChat && clientId && ( 
          <TouchableOpacity
            style={[styles.actionButtonBase, styles.chatButton]}
            onPress={() => onChat(clientId, clientName)} 
            onPressIn={chatTouchAnimation.onPressIn}
            onPressOut={chatTouchAnimation.onPressOut}
            accessibilityLabel={`Conversar com ${clientName}`}
          >
            <Animated.View style={[styles.actionButtonContent, { transform: [{ scale: chatTouchAnimation.scaleAnim }] }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={ICON_PRIMARY} />
            </Animated.View>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButtonBase, styles.rejectButton]}
          onPress={() => onReject && onReject(item.id)}
          onPressIn={rejectTouchAnimation.onPressIn}
          onPressOut={rejectTouchAnimation.onPressOut}
          accessibilityLabel={`Recusar solicitação de ${item.serviceSnapshot.name}`}
        >
          <Animated.View style={[styles.actionButtonContent, { transform: [{ scale: rejectTouchAnimation.scaleAnim }] }]}>
            <Ionicons name="close-circle-outline" size={20} color={WHITE} />
            <Text style={styles.actionButtonTextWhite}>Recusar</Text>
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButtonBase, styles.detailsButton]}
          onPress={() => onDetails(item.id)}
          onPressIn={detailsTouchAnimation.onPressIn}
          onPressOut={detailsTouchAnimation.onPressOut}
          accessibilityLabel={`Ver detalhes da solicitação de ${item.serviceSnapshot.name}`}
        >
          <Animated.View style={[styles.actionButtonContent, { transform: [{ scale: detailsTouchAnimation.scaleAnim }] }]}>
            <Ionicons name="eye-outline" size={20} color={ICON_PRIMARY} />
            <Text style={styles.actionButtonTextPrimary}>Detalhes</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Componente de Item de Serviço Confirmado
const ConfirmedServiceItem: React.FC<{
  item: BookingType;
  onPress: (id: string) => void;
  entryAnim: Animated.ValueXY; // Para animação de entrada individual
}> = ({ item, onPress, entryAnim }) => {
  const touchAnimation = useAnimatedTouch();

  return (
    <Animated.View style={{ opacity: entryAnim.x, transform: [{ translateY: entryAnim.y }] }}>
      <TouchableOpacity
        style={styles.serviceItem}
        onPress={() => onPress(item.id)}
        onPressIn={touchAnimation.onPressIn}
        onPressOut={touchAnimation.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalhes do serviço ${item.serviceSnapshot.name} com ${item.client?.name}`}
      >
        <Animated.View style={[styles.serviceItemContent, { transform: [{ scale: touchAnimation.scaleAnim }] }]}>
          <View style={styles.serviceItemIconWrapper}>
            {/* CORREÇÃO: Usando MaterialCommunityIcons para "calendar-check-outline" */}
            <MaterialCommunityIcons name="calendar-check-outline" size={28} color={ICON_PRIMARY} /> 
          </View>
          <View style={styles.serviceItemDetails}>
            <Text style={styles.serviceItemText} numberOfLines={1}>
              <Text style={{ fontWeight: 'bold' }}>{item.serviceSnapshot.name}</Text>
              {item.client?.name ? ` com ${item.client.name}` : ''}
            </Text>
            <Text style={styles.serviceItemTime}>
              {new Date(item.scheduledDateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}, {new Date(item.scheduledDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={24} color={TEXT_MUTED} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};


const ProviderOverviewSection: React.FC<ProviderOverviewSectionProps> = ({
  contentAnim,
  upcomingServices,
  onServicePress,
  onViewAllServicesPress,
  onViewAllMessagesPress,
  onAcceptRequest,
  onRejectRequest,
  onChatWithClient,
  unreadMessagesCount = 0,
}) => {
  const pendingRequests = upcomingServices.filter(s => s.status === 'pending_provider_confirmation');
  const confirmedUpcomingServices = upcomingServices.filter(s => s.status === 'confirmed');

  // Animações para itens da lista
  const animatedItems = useRef<Animated.ValueXY[]>([]).current;

  const createItemAnimation = (index: number) => {
    if (!animatedItems[index]) {
      animatedItems[index] = new Animated.ValueXY({ x: 0, y: 50 }); // Inicia com opacidade 0 e translação Y
    }
    return animatedItems[index];
  };

  React.useEffect(() => {
    const animations = upcomingServices.map((_, index) => {
      const itemAnim = createItemAnimation(index);
      return Animated.timing(itemAnim, {
        toValue: { x: 1, y: 0 }, // Opacidade 1, Translação Y 0
        duration: 300,
        useNativeDriver: true,
        easing: Platform.OS === 'ios' ? undefined : undefined, // Easing.out(Easing.ease) - se for usar reanimated
      });
    });
    Animated.stagger(100, animations).start();
  }, [upcomingServices.length]);


  const messageLinkTouchAnimation = useAnimatedTouch();

  const renderEmptyState = (message: string, iconName: keyof typeof Ionicons.glyphMap = "sad-outline") => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name={iconName} size={48} color={TEXT_MUTED} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  return (
    <Animated.View style={[styles.sectionContainer, { opacity: contentAnim, transform: [{translateY: contentAnim.interpolate({inputRange: [0,1], outputRange: [20,0]})}] }]}>
      <View style={styles.sectionHeaderWithIcon}>
        <MaterialCommunityIcons name="view-dashboard-variant-outline" size={26} color={TEXT_DARK} />
        <Text style={styles.sectionTitle}>Sua Agenda & Destaques</Text>
      </View>

      {/* Seção de Novas Solicitações */}
      {pendingRequests.length > 0 && (
        <View style={styles.subsectionWrapper}>
          <View style={styles.subsectionHeader}>
            <Text style={styles.subsectionTitle}>
                <Ionicons name="alert-circle-outline" size={20} color={WARNING_YELLOW} /> Novas Solicitações ({pendingRequests.length})
            </Text>
          </View>
          {/* Não usar FlatList aqui se já estamos animando toda a seção e os itens individualmente com stagger
              A menos que a lista seja muito longa e precise de virtualização. Para poucas, View + map é mais fácil de animar.
              Se for usar FlatList, a animação de stagger é feita de forma diferente.
              Para este exemplo, vamos assumir que pendingRequests não é excessivamente longa para o dashboard.
          */}
          {pendingRequests.map((item, index) => (
            <RequestItem
              key={item.id}
              item={item}
              onAccept={onAcceptRequest}
              onReject={onRejectRequest}
              onDetails={onServicePress}
              onChat={onChatWithClient}
              entryAnim={createItemAnimation(index)} // Passa a animação individual
            />
          ))}
        </View>
      )}

      {/* Próximos Serviços Confirmados */}
      <View style={styles.subsectionWrapper}>
        <View style={styles.subsectionHeader}>
          <Text style={styles.subsectionTitle}>
            <Ionicons name="checkmark-done-circle-outline" size={20} color={ICON_PRIMARY} /> Próximos Serviços
            </Text>
          {confirmedUpcomingServices.length > 2 && (
            <TouchableOpacity onPress={onViewAllServicesPress} accessibilityRole="button" accessibilityLabel="Ver todos os próximos serviços">
              <Text style={styles.viewAllText}>Ver Todos</Text>
            </TouchableOpacity>
          )}
        </View>
        {confirmedUpcomingServices.length > 0 ? (
          confirmedUpcomingServices.slice(0, 2).map((item, index) => ( // Mapeia os 2 primeiros
            <ConfirmedServiceItem
              key={item.id}
              item={item}
              onPress={onServicePress}
              entryAnim={createItemAnimation(pendingRequests.length + index)} // Continua a animação
            />
          ))
        ) : (
          renderEmptyState("Nenhum serviço confirmado agendado.", "calendar-clear-outline")
        )}
      </View>

      {/* Link para Mensagens */}
      <TouchableOpacity
        style={styles.messageLinkCard}
        onPress={onViewAllMessagesPress}
        onPressIn={messageLinkTouchAnimation.onPressIn}
        onPressOut={messageLinkTouchAnimation.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={unreadMessagesCount > 0 ? `Ir para mensagens, ${unreadMessagesCount} não lidas` : "Ir para mensagens"}
      >
        <Animated.View style={[styles.messageLinkContent, { transform: [{ scale: messageLinkTouchAnimation.scaleAnim }] }]}>
          <Ionicons name="chatbubbles-outline" size={28} color={ICON_PRIMARY} />
          <Text style={styles.messageLinkText}>Mensagens</Text>
          {unreadMessagesCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}</Text>
            </View>
          )}
          <Ionicons name="arrow-forward-outline" size={22} color={TEXT_MUTED} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: WHITE,
    borderRadius: 18, // Bordas mais arredondadas
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: SHADOW_COLOR_SECTION,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12, // Sombra mais sutil mas perceptível
        shadowRadius: 12,
      },
      android: {
        elevation: 12, // Elevação maior para destaque
      },
    }),
  },
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 22, // Título da seção maior
    fontWeight: '700', // Mais peso
    color: TEXT_DARK,
    textAlign: 'center',
    marginLeft: 8,
  },
  subsectionWrapper: {
    marginBottom: 25,
  },
  subsectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 18, // Títulos de subseção ligeiramente maiores
    fontWeight: '600',
    color: TEXT_DARK,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: ICON_PRIMARY,
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: BACKGROUND_ALT,
    borderRadius: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: 15,
    marginTop: 8,
  },

  // Estilos para Itens de Solicitação (RequestItem)
  requestItem: {
    backgroundColor: WHITE, // Fundo alternativo para destaque
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    position: 'relative',
    overflow: 'hidden', // Para o indicador
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_CARD, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 5 },
      android: { elevation: 4 },
    }),
  },
  requestItemPendingIndicator: { // Nova barrinha lateral para indicar pendência
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: WARNING_YELLOW,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  requestItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E9ECEF', // Cinza claro para placeholder
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  requestServiceName: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_DARK,
    flex: 1, // Para o text ellipsize funcionar
  },
  requestClientName: {
    fontSize: 14,
    color: TEXT_MEDIUM,
    marginBottom: 8,
  },
    requestPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: SUCCESS_GREEN, // Destaque para o preço
    marginBottom: 8,
  },
  requestInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoIcon: {
    marginRight: 6,
  },
  requestInfoText: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginRight: 12, // Espaço entre os itens de info na mesma linha
  },
  requestActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Alinha botões à direita
    marginTop: 15,
    gap: 10, // Espaçamento entre botões
  },
  actionButtonBase: { // Base para todos os botões de ação
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20, // Mais arredondado (pill-shape)
    minWidth: 60, // Para o botão de chat só com ícone
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonContent: { // Para animar o conteúdo do botão
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButton: {
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: ICON_PRIMARY,
    paddingHorizontal: 12, // Ajuste para apenas ícone
  },
  rejectButton: {
    backgroundColor: DANGER_RED,
  },
  detailsButton: {
    backgroundColor: BACKGROUND_ALT, // Um fundo leve para o botão de detalhes
    borderWidth: 1.5,
    borderColor: ICON_PRIMARY,
  },
  actionButtonTextWhite: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButtonTextPrimary: {
    color: ICON_PRIMARY,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  acceptButtonCorner: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4, // Área de toque
  },

  // Estilos para Próximos Serviços Confirmados (ConfirmedServiceItem)
  serviceItem: {
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 12, // Menos padding vertical que o request item
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_CARD, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  serviceItemContent:{ // Para animar o conteúdo
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceItemIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${ICON_PRIMARY}1A`, // Azul primário com baixa opacidade
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceItemDetails: {
    flex: 1,
  },
  serviceItemText: {
    fontSize: 15,
    color: TEXT_DARK,
    fontWeight: '500',
    marginBottom: 3,
  },
  serviceItemTime: {
    fontSize: 13,
    color: TEXT_MUTED,
  },

  // Estilo para o link de Mensagens (MessageLinkCard)
  messageLinkCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 15, // Espaço após a última subseção
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
      ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_CARD, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  messageLinkContent: { // Para animar o conteúdo
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageLinkText: {
    color: ICON_PRIMARY,
    fontSize: 17, // Maior para destaque
    fontWeight: '600', // Mais peso
    flex: 1,
    marginLeft: 12,
  },
  unreadBadge: {
    backgroundColor: DANGER_RED, // Mesmo vermelho dos alertas
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto', // Empurra para a direita antes do ícone de seta
    marginRight: 10,
  },
  unreadBadgeText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default ProviderOverviewSection;
