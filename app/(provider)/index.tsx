// app/(provider)/index.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  Platform,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

// Importações dos serviços
import { getMyProviderDashboard } from '../services/providerService';
import { getBookingsForUser, updateBookingStatus } from '../services/bookingService';
import { sendMessage } from '../services/chatService'; // Assuming you'll have a chatService

// Importações das tipagens centralizadas
// CORREÇÃO: Importar BookingDetails e BookingStatus
import { BookingDetails, BookingStatus } from '../types/backend/bookings';
import { ProviderDashboard, ProviderReview } from '../types/backend/providers';

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

// Cores para o tema (ajustadas e expandidas)
const WHITE = '#FFFFFF';
const BACKGROUND_ALT = '#F8F9FD';
const TEXT_DARK = '#1A2538';
const TEXT_MEDIUM = '#4A5568';
const TEXT_MUTED = '#7A8599';
const ICON_PRIMARY = '#007AFF';
const SUCCESS_GREEN = '#28a745';
const DANGER_RED = '#dc3545';
const WARNING_YELLOW = '#FFC107';
const BORDER_SUBTLE = 'rgba(0,0,0,0.08)';
const SHADOW_COLOR_CARD = 'rgba(0, 0, 0, 0.06)';
const SHADOW_COLOR_SECTION = 'rgba(0, 0, 0, 0.1)';

// Componente de Item de Solicitação
const RequestItem: React.FC<{
  item: BookingDetails; // CORREÇÃO: Usar BookingDetails
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onDetails: (id: string) => void;
  onChat?: (clientId: string, clientName: string) => void;
  entryAnim: Animated.ValueXY;
}> = ({ item, onAccept, onReject, onDetails, onChat, entryAnim }) => {
  const acceptTouchAnimation = useAnimatedTouch();
  const rejectTouchAnimation = useAnimatedTouch();
  const detailsTouchAnimation = useAnimatedTouch();
  const chatTouchAnimation = useAnimatedTouch();

  // CORREÇÃO: Acessar clientFullName e clientId diretamente de item
  const clientId: string | undefined = item.clientId;
  const clientName: string = item.clientFullName || 'Cliente';


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
        {/* CORREÇÃO: Acessar serviceName */}
        <Text style={styles.requestServiceName} numberOfLines={1}>{item.serviceName}</Text>
        <TouchableOpacity
          style={styles.acceptButtonCorner}
          onPress={() => onAccept && onAccept(item.id)}
          onPressIn={acceptTouchAnimation.onPressIn}
          onPressOut={acceptTouchAnimation.onPressOut}
          accessibilityRole="button"
          accessibilityLabel={`Aceitar solicitação de ${item.serviceName}`}
        >
          <Animated.View style={{ transform: [{ scale: acceptTouchAnimation.scaleAnim }] }}>
            <Ionicons name="checkmark-circle" size={32} color={SUCCESS_GREEN} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <Text style={styles.requestClientName}>Solicitado por: {clientName}</Text>

      {/* CORREÇÃO: Acessar totalPrice */}
      {item.totalPrice !== undefined && (
        <Text style={styles.requestPrice}>
            Valor: R$ {item.totalPrice.toFixed(2).replace('.', ',')}
        </Text>
      )}

      <View style={styles.requestInfoRow}>
        <Ionicons name="calendar-outline" size={16} color={TEXT_MUTED} style={styles.infoIcon} />
        {/* CORREÇÃO: Usar scheduledDate e scheduledTime */}
        <Text style={styles.requestInfoText}>
          {new Date(item.scheduledDate).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
        </Text>
        <Ionicons name="time-outline" size={16} color={TEXT_MUTED} style={styles.infoIcon} />
        <Text style={styles.requestInfoText}>
          {item.scheduledTime}
        </Text>
      </View>
      <View style={styles.requestInfoRow}>
        <Ionicons name="location-outline" size={16} color={TEXT_MUTED} style={styles.infoIcon} />
        {/* CORREÇÃO: Acessar address?.street e address?.number */}
        <Text style={styles.requestInfoText} numberOfLines={1}>{item.address?.street}, {item.address?.number}</Text>
      </View>

      <View style={styles.requestActionsRow}>
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
          accessibilityLabel={`Recusar solicitação de ${item.serviceName}`}
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
          accessibilityLabel={`Ver detalhes da solicitação de ${item.serviceName}`}
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
  item: BookingDetails; // CORREÇÃO: Usar BookingDetails
  onPress: (id: string) => void;
  entryAnim: Animated.ValueXY;
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
        accessibilityLabel={`Ver detalhes do serviço ${item.serviceName} com ${item.clientFullName}`}
      >
        <Animated.View style={[styles.serviceItemContent, { transform: [{ scale: touchAnimation.scaleAnim }] }]}>
          <View style={styles.serviceItemIconWrapper}>
            <MaterialCommunityIcons name="calendar-check-outline" size={28} color={ICON_PRIMARY} />
          </View>
          <View style={styles.serviceItemDetails}>
            <Text style={styles.serviceItemText} numberOfLines={1}>
              <Text style={{ fontWeight: 'bold' }}>{item.serviceName}</Text>
              {item.clientFullName ? ` com ${item.clientFullName}` : ''}
            </Text>
            <Text style={styles.serviceItemTime}>
              {new Date(item.scheduledDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}, {item.scheduledTime}
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={24} color={TEXT_MUTED} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Componente principal do Dashboard do Provedor
export default function ProviderDashboardScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [dashboardData, setDashboardData] = useState<ProviderDashboard | null>(null);
  const [upcomingServices, setUpcomingServices] = useState<BookingDetails[]>([]); // CORREÇÃO: Usar BookingDetails
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animação para o conteúdo principal do dashboard
  const contentAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!user?.id) {
        setError("ID do provedor não disponível para buscar dados.");
        setIsLoading(false);
        setIsRefreshing(false);
        return;
    }

    try {
      const dashboard = await getMyProviderDashboard();
      setDashboardData(dashboard);

      // Buscar agendamentos futuros (GET /bookings/me?status=PENDING_PROVIDER_CONFIRMATION,CONFIRMED)
      // Ajuste para buscar múltiplos status ou um endpoint específico de "próximos serviços"
      // CORREÇÃO: Usar BookingStatus.PENDING_PROVIDER_CONFIRMATION e BookingStatus.CONFIRMED
      const pendingBookings = await getBookingsForUser(BookingStatus.PENDING_PROVIDER_CONFIRMATION);
      const confirmedBookings = await getBookingsForUser(BookingStatus.CONFIRMED);
      setUpcomingServices([...pendingBookings, ...confirmedBookings].sort((a,b) => new Date(a.scheduledDate + 'T' + a.scheduledTime).getTime() - new Date(b.scheduledDate + 'T' + b.scheduledTime).getTime()));


      Animated.timing(contentAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    } catch (err: any) {
      console.error("Erro ao buscar dados do dashboard do provedor:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Não foi possível carregar os dados do dashboard.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, contentAnim]);

  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchData();
    } else if (!authLoading && !user?.id) {
        setIsLoading(false);
        setError("Provedor não autenticado ou perfil não encontrado.");
    }
  }, [authLoading, user, fetchData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Funções de ação que serão passadas para RequestItem
  const handleServicePress = (id: string) => {
    router.push(`/(provider)/services/${id}` as any); // Exemplo de rota para detalhes do agendamento
  };

  const handleViewAllServicesPress = () => {
    router.push('/(provider)/services' as any); // Exemplo de rota para todos os agendamentos
  };

  const handleViewAllMessagesPress = () => {
    router.push('/(provider)/messages' as any); // Exemplo de rota para a lista de chats
  };

  const handleAcceptRequest = async (bookingId: string) => {
    Alert.alert(
      "Aceitar Solicitação",
      `Tem certeza que deseja aceitar o agendamento ${bookingId}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aceitar",
          onPress: async () => {
            setIsLoading(true);
            try {
              // CORREÇÃO: Usar BookingStatus.CONFIRMED
              await updateBookingStatus(bookingId, { status: BookingStatus.CONFIRMED });
              Alert.alert("Sucesso", "Agendamento aceito com sucesso!");
              fetchData(); // Recarrega os dados para atualizar a lista
            } catch (error: any) {
              console.error("Erro ao aceitar agendamento:", error.response?.data || error.message);
              Alert.alert("Erro", error.response?.data?.message || "Não foi possível aceitar o agendamento.");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectRequest = async (bookingId: string) => {
    Alert.alert(
      "Rejeitar Solicitação",
      `Tem certeza que deseja rejeitar o agendamento ${bookingId}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rejeitar",
          onPress: async () => {
            setIsLoading(true);
            try {
              // CORREÇÃO: Usar BookingStatus.REJECTED
              await updateBookingStatus(bookingId, { status: BookingStatus.REJECTED });
              Alert.alert("Sucesso", "Agendamento rejeitado com sucesso!");
              fetchData(); // Recarrega os dados para atualizar a lista
            } catch (error: any) {
              console.error("Erro ao rejeitar agendamento:", error.response?.data || error.message);
              Alert.alert("Erro", error.response?.data?.message || "Não foi possível rejeitar o agendamento.");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleChatWithClient = (clientId: string, clientName: string) => {
    router.push({ pathname: '/(provider)/messages/[chatId]', params: { chatId: clientId, recipientName: clientName } } as any);
  };

  const renderEmptyState = (message: string, iconName: keyof typeof Ionicons.glyphMap = "sad-outline") => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name={iconName} size={48} color={TEXT_MUTED} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchData} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={ <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#007AFF" /> }
      >
        <Animated.View style={[styles.sectionContainer, { opacity: contentAnim, transform: [{translateY: contentAnim.interpolate({inputRange: [0,1], outputRange: [20,0]})}] }]}>
          <View style={styles.sectionHeaderWithIcon}>
            <MaterialCommunityIcons name="view-dashboard-variant-outline" size={26} color={TEXT_DARK} />
            <Text style={styles.sectionTitle}>Sua Agenda & Destaques</Text>
          </View>

          {/* Seção de Novas Solicitações */}
          {upcomingServices.filter(s => s.status === BookingStatus.PENDING_PROVIDER_CONFIRMATION).length > 0 && (
            <View style={styles.subsectionWrapper}>
              <View style={styles.subsectionHeader}>
                <Text style={styles.subsectionTitle}>
                    <Ionicons name="alert-circle-outline" size={20} color={WARNING_YELLOW} /> Novas Solicitações ({upcomingServices.filter(s => s.status === BookingStatus.PENDING_PROVIDER_CONFIRMATION).length})
                </Text>
              </View>
              {upcomingServices.filter(s => s.status === BookingStatus.PENDING_PROVIDER_CONFIRMATION).map((item, index) => (
                <RequestItem
                  key={item.id}
                  item={item}
                  onAccept={handleAcceptRequest}
                  onReject={handleRejectRequest}
                  onDetails={handleServicePress}
                  onChat={handleChatWithClient}
                  entryAnim={new Animated.ValueXY({x:1,y:0})} // Simple animation for items already loaded with section
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
              {upcomingServices.filter(s => s.status === BookingStatus.CONFIRMED).length > 2 && (
                <TouchableOpacity onPress={handleViewAllServicesPress} accessibilityRole="button" accessibilityLabel="Ver todos os próximos serviços">
                  <Text style={styles.viewAllText}>Ver Todos</Text>
                </TouchableOpacity>
              )}
            </View>
            {upcomingServices.filter(s => s.status === BookingStatus.CONFIRMED).length > 0 ? (
              upcomingServices.filter(s => s.status === BookingStatus.CONFIRMED).slice(0, 2).map((item, index) => (
                <ConfirmedServiceItem
                  key={item.id}
                  item={item}
                  onPress={handleServicePress}
                  entryAnim={new Animated.ValueXY({x:1,y:0})} // Simple animation for items already loaded with section
                />
              ))
            ) : (
              renderEmptyState("Nenhum serviço confirmado agendado.", "calendar-clear-outline")
            )}
          </View>

          {/* Link para Mensagens */}
          <TouchableOpacity
            style={styles.messageLinkCard}
            onPress={handleViewAllMessagesPress}
            accessibilityRole="button"
            accessibilityLabel={dashboardData?.unreadMessagesCount && dashboardData.unreadMessagesCount > 0 ? `Ir para mensagens, ${dashboardData.unreadMessagesCount} não lidas` : "Ir para mensagens"}
          >
            <Animated.View style={styles.messageLinkContent}>
              <Ionicons name="chatbubbles-outline" size={28} color={ICON_PRIMARY} />
              <Text style={styles.messageLinkText}>Mensagens</Text>
              {dashboardData?.unreadMessagesCount && dashboardData.unreadMessagesCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{dashboardData.unreadMessagesCount > 9 ? '9+' : dashboardData.unreadMessagesCount}</Text>
                </View>
              )}
              <Ionicons name="arrow-forward-outline" size={22} color={TEXT_MUTED} />
            </Animated.View>
          </TouchableOpacity>

            {/* Seção de Reviews Recentes (NOVA) */}
            {dashboardData?.recentReviews && dashboardData.recentReviews.length > 0 && (
                <View style={styles.subsectionWrapper}>
                    <View style={styles.subsectionHeader}>
                        <Text style={styles.subsectionTitle}>
                            <Ionicons name="star-outline" size={20} color={WARNING_YELLOW} /> Avaliações Recentes
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/(provider)/reviews' as any)} accessibilityRole="button" accessibilityLabel="Ver todas as avaliações">
                            <Text style={styles.viewAllText}>Ver Todas</Text>
                        </TouchableOpacity>
                    </View>
                    {dashboardData.recentReviews.slice(0, 2).map((review, index) => ( // Mostra as 2 últimas
                        <View key={review.id} style={styles.reviewItem}>
                            <Text style={styles.reviewText}>"{review.comment || 'Sem comentário.'}"</Text>
                            <View style={styles.reviewRating}>
                                {Array.from({ length: review.rating }).map((_, i) => (
                                    <Ionicons key={i} name="star" size={16} color={WARNING_YELLOW} />
                                ))}
                                <Text style={styles.reviewClientName}> - {review.client.fullName}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

        </Animated.View>

        {/* Outras seções do dashboard podem vir aqui (ex: um link para a tela de ganhos) */}
        <TouchableOpacity
            style={styles.earningsLinkCard}
            onPress={() => router.push('/(provider)/earnings' as any)}
        >
            <Ionicons name="cash-outline" size={28} color={SUCCESS_GREEN} />
            <Text style={styles.earningsLinkText}>Ver Meus Ganhos</Text>
            <Ionicons name="arrow-forward-outline" size={22} color={TEXT_MUTED} />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6C757D',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 15,
    paddingBottom: 40,
  },
  sectionContainer: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: SHADOW_COLOR_SECTION,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
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
    fontSize: 22,
    fontWeight: '700',
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
    fontSize: 18,
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
  requestItem: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_CARD, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 5 },
      android: { elevation: 4 },
    }),
  },
  requestItemPendingIndicator: {
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
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  requestServiceName: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_DARK,
    flex: 1,
  },
  requestClientName: {
    fontSize: 14,
    color: TEXT_MEDIUM,
    marginBottom: 8,
  },
    requestPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: SUCCESS_GREEN,
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
    marginRight: 12,
  },
  requestActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    gap: 10,
  },
  actionButtonBase: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButton: {
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: ICON_PRIMARY,
    paddingHorizontal: 12,
  },
  rejectButton: {
    backgroundColor: DANGER_RED,
  },
  detailsButton: {
    backgroundColor: BACKGROUND_ALT,
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
    padding: 4,
  },
  serviceItem: {
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_CARD, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  serviceItemContent:{
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceItemIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${ICON_PRIMARY}1A`,
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
  messageLinkCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 15,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
      ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_CARD, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  messageLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageLinkText: {
    color: ICON_PRIMARY,
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  unreadBadge: {
    backgroundColor: DANGER_RED,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
    marginRight: 10,
  },
  unreadBadgeText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: 'bold',
  },
  reviewItem: {
    backgroundColor: BACKGROUND_ALT,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },
  reviewText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: TEXT_MEDIUM,
    marginBottom: 8,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  reviewClientName: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginLeft: 5,
  },
  earningsLinkCard: {
      backgroundColor: WHITE,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginTop: 20,
      borderWidth: 1,
      borderColor: BORDER_SUBTLE,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
  },
  earningsLinkText: {
      color: SUCCESS_GREEN,
      fontSize: 17,
      fontWeight: '600',
      flex: 1,
      marginLeft: 12,
  },
});