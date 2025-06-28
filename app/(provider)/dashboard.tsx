import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList, // Manter se necessário para listas que não sejam SCROLLVIEW
  Platform,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  Image, // Para avatar do provedor
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth'; // Importação do useAuth

// Importações dos serviços
import { getMyProviderDashboard } from '../services/providerService';
import { getBookingsForUser, updateBookingStatus } from '../services/bookingService';
import { sendMessage } from '../services/chatService'; // Assuming you'll have a chatService

// Importações das tipagens centralizadas
import { BookingDetails, BookingStatus } from '../types/backend/bookings';
import { ProviderDashboard, ProviderReview } from '../types/backend/providers'; // Importe ProviderReview aqui também, se ProviderDashboard o usa

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
      tension: 40,
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
const PRIMARY_LIGHT = '#EBF5FF'; // Um azul claro para fundos de botões/links

// --- Componentes Reutilizáveis (Move para arquivos separados se o projeto crescer) ---

// Componente: DashboardHeader (para saudação e avatar)
const DashboardHeader: React.FC<{
  providerName: string | undefined;
  avatarUrl: string | undefined | null;
  onProfilePress: () => void;
}> = ({ providerName, avatarUrl, onProfilePress }) => (
  <View style={headerStyles.headerContainer}>
    <View style={headerStyles.greetingContainer}>
      <Text style={headerStyles.greetingText}>Olá, <Text style={headerStyles.providerNameText}>{providerName || 'Provedor'}</Text>!</Text>
      <Text style={headerStyles.currentDateText}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
    </View>
    <TouchableOpacity onPress={onProfilePress} style={headerStyles.avatarButton}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={headerStyles.avatar} />
      ) : (
        <View style={headerStyles.avatarPlaceholder}>
          <Ionicons name="person" size={24} color={WHITE} />
        </View>
      )}
    </TouchableOpacity>
  </View>
);

const headerStyles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 20,
    backgroundColor: WHITE,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_SECTION, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 8 },
    }),
    marginBottom: 20,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 18,
    marginTop: 20,
    fontWeight: 'bold',
    color: TEXT_DARK,
  },
  providerNameText: {
    color: ICON_PRIMARY,
  },
  currentDateText: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 4,
  },
  avatarButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginLeft: 15,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    backgroundColor: ICON_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Componente: FinancialSummaryCard (resumo de ganhos)
const FinancialSummaryCard: React.FC<{
  totalEarnings: number | undefined;
  pendingWithdrawals: number | undefined;
  onViewEarnings: () => void;
}> = ({ totalEarnings, pendingWithdrawals, onViewEarnings }) => {
  const { scaleAnim, onPressIn, onPressOut } = useAnimatedTouch();

  const formattedTotalEarnings = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEarnings || 0);
  const formattedPendingWithdrawals = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingWithdrawals || 0);

  return (
    <View style={summaryStyles.summaryCard}>
      <Text style={summaryStyles.cardTitle}>Resumo Financeiro</Text>
      <View style={summaryStyles.metricsGrid}>
        <View style={summaryStyles.metricItem}>
          <Text style={summaryStyles.metricLabel}>Ganhos Totais</Text>
          <Text style={summaryStyles.metricValuePrimary}>{formattedTotalEarnings}</Text>
        </View>
        <View style={summaryStyles.metricItem}>
          <Text style={summaryStyles.metricLabel}>Saques Pendentes</Text>
          <Text style={summaryStyles.metricValueWarning}>{formattedPendingWithdrawals}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[summaryStyles.viewEarningsButton, { transform: [{ scale: scaleAnim }] }]}
        onPress={onViewEarnings}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityLabel="Ver todos os meus ganhos"
      >
        <Ionicons name="wallet-outline" size={20} color={WHITE} style={summaryStyles.buttonIcon} />
        <Text style={summaryStyles.viewEarningsButtonText}>Gerenciar Ganhos</Text>
        <Ionicons name="chevron-forward-outline" size={20} color={WHITE} />
      </TouchableOpacity>
    </View>
  );
};

const summaryStyles = StyleSheet.create({
  summaryCard: {
    backgroundColor: ICON_PRIMARY, // Usar cor primária para destaque
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_SECTION, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 10 },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 5,
  },
  metricValuePrimary: {
    fontSize: 22,
    fontWeight: 'bold',
    color: WHITE,
  },
  metricValueWarning: {
    fontSize: 22,
    fontWeight: 'bold',
    color: WARNING_YELLOW,
  },
  viewEarningsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingVertical: 12,
  },
  viewEarningsButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 10,
  },
  buttonIcon: {
    marginRight: 5,
  },
});

// Componente: QuickActionsSection (botões de ação rápida)
const QuickActionsSection: React.FC<{
  onViewAllServicesPress: () => void;
  onViewAllMessagesPress: () => void;
  onManageAvailability: () => void;
}> = ({ onViewAllServicesPress, onViewAllMessagesPress, onManageAvailability }) => {
  const { scaleAnim: s1, onPressIn: p1, onPressOut: o1 } = useAnimatedTouch();
  const { scaleAnim: s2, onPressIn: p2, onPressOut: o2 } = useAnimatedTouch();
  const { scaleAnim: s3, onPressIn: p3, onPressOut: o3 } = useAnimatedTouch();

  return (
    <View style={quickActionStyles.sectionContainer}>
      <Text style={quickActionStyles.sectionTitle}>Ações Rápidas</Text>
      <View style={quickActionStyles.grid}>
        <TouchableOpacity style={[quickActionStyles.gridItem, { transform: [{ scale: s1 }] }]}
          onPress={onManageAvailability} onPressIn={p1} onPressOut={o1}>
          <Ionicons name="calendar-outline" size={30} color={ICON_PRIMARY} />
          <Text style={quickActionStyles.gridItemText}>Minha Agenda</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[quickActionStyles.gridItem, { transform: [{ scale: s2 }] }]}
          onPress={onViewAllServicesPress} onPressIn={p2} onPressOut={o2}>
          <Ionicons name="briefcase-outline" size={30} color={ICON_PRIMARY} />
          <Text style={quickActionStyles.gridItemText}>Meus Serviços</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[quickActionStyles.gridItem, { transform: [{ scale: s3 }] }]}
          onPress={onViewAllMessagesPress} onPressIn={p3} onPressOut={o3}>
          <Ionicons name="chatbubbles-outline" size={30} color={ICON_PRIMARY} />
          <Text style={quickActionStyles.gridItemText}>Mensagens</Text>
        </TouchableOpacity>
        {/* Adicione mais ações rápidas conforme necessário, ex: "Meu Perfil", "Ajuda" */}
      </View>
    </View>
  );
};

const quickActionStyles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 20, // Manter ou ajustar este padding se o espaço lateral geral da caixa é o que te incomoda
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_SECTION, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 8 },
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_DARK,
    marginBottom: 15,
    textAlign: 'center',
  },
  grid: { // Este é o container dos seus botões
    flexDirection: 'row',
    flexWrap: 'wrap', // Manter wrap para caso haja mais de 3, eles quebrem a linha
    justifyContent: 'space-around', // ou 'space-between', 'center'
    width: '100%', // Isso significa 100% do 'sectionContainer' (que tem padding de 20)
  },
  gridItem: {
    // ATENÇÃO AQUI: Para 3 itens por linha, você PRECISA de uma largura menor.
    // 30% x 3 = 90%. Sobram 10% para gaps.
    width: '30%', // <--- MUDANÇA ESSENCIAL AQUI para 3 itens por linha!
    aspectRatio: 1, // Para manter quadrado
    backgroundColor: BACKGROUND_ALT,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15, // Espaçamento vertical entre as linhas
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_CARD, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  gridItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_DARK,
    marginTop: 8,
    textAlign: 'center',
  },
});


// Componente de Item de Solicitação (RequestItem) - SEM ALTERAÇÕES NESTE TRECHO
const RequestItem: React.FC<{
  item: BookingDetails;
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

      {item.totalPrice !== undefined && (
        <Text style={styles.requestPrice}>
            Valor: R$ {item.totalPrice.toFixed(2).replace('.', ',')}
        </Text>
      )}

      <View style={styles.requestInfoRow}>
        <Ionicons name="calendar-outline" size={16} color={TEXT_MUTED} style={styles.infoIcon} />
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

// Componente de Item de Serviço Confirmado (ConfirmedServiceItem)
const ConfirmedServiceItem: React.FC<{
  item: BookingDetails;
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
  const { user, isLoading: authLoading, signOut } = useAuth(); // Destructuring signOut from useAuth

  const [dashboardData, setDashboardData] = useState<ProviderDashboard | null>(null);
  const [upcomingServices, setUpcomingServices] = useState<BookingDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const contentAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    console.log("[DashboardScreen] fetchData: Iniciando busca de dados.");
    setIsLoading(true);
    setError(null);
    if (!user?.id) {
        console.warn("[DashboardScreen] fetchData: user.id não disponível. Abortando busca.");
        setError("ID do provedor não disponível para buscar dados.");
        setIsLoading(false);
        setIsRefreshing(false);
        return;
    }
    console.log(`[DashboardScreen] fetchData: Buscando dashboard para userId: ${user.id}`);

    try {
      const dashboard = await getMyProviderDashboard();
      console.log("[DashboardScreen] fetchData: Dados do dashboard recebidos.", dashboard);
      // Log para verificar se 'reviews' está chegando
      console.log("[DashboardScreen] REVIEWS NA DASHBOARD (AGORA COM 'reviews'):", dashboard.reviews);

      setDashboardData(dashboard);

      // Mudar PENDING_PROVIDER_CONFIRMATION para PENDING
      const confirmedBookings = await getBookingsForUser(BookingStatus.CONFIRMED);
      console.log("[DashboardScreen] fetchData: Agendamentos confirmados recebidos.", confirmedBookings);

      setUpcomingServices([...confirmedBookings].sort((a,b) => {
        const dateA = new Date(a.scheduledDate + 'T' + a.scheduledTime);
        const dateB = new Date(b.scheduledDate + 'T' + b.scheduledTime);
        if (isNaN(dateA.getTime())) console.warn(`[DashboardScreen] Data inválida para agendamento ${a.id}: ${a.scheduledDate}T${a.scheduledTime}`);
        if (isNaN(dateB.getTime())) console.warn(`[DashboardScreen] Data inválida para agendamento ${b.id}: ${b.scheduledDate}T${b.scheduledTime}`);

        return dateA.getTime() - dateB.getTime();
      }));

      Animated.timing(contentAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    } catch (err: any) {
      console.error("[DashboardScreen] Erro ao buscar dados do dashboard do provedor:", err.response?.data || err.message, err);
      setError(err.response?.data?.message || "Não foi possível carregar os dados do dashboard.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      console.log("[DashboardScreen] fetchData: Finalizado. isLoading:", false, "isRefreshing:", false);
    }
  }, [user, contentAnim]);

  useEffect(() => {
    console.log("[DashboardScreen] useEffect: authLoading:", authLoading, "user.id:", user?.id);
    if (!authLoading && user?.id) {
      fetchData();
    } else if (!authLoading && !user?.id) {
        setIsLoading(false);
        setError("Provedor não autenticado ou perfil não encontrado.");
        console.warn("[DashboardScreen] useEffect: Usuário não autenticado ou ID não encontrado após authLoading.");
    }
  }, [authLoading, user, fetchData]);

  const onRefresh = useCallback(() => {
    console.log("[DashboardScreen] onRefresh: Iniciando refresh.");
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleServicePress = (id: string) => {
    console.log(`[DashboardScreen] handleServicePress: Navegando para detalhes do serviço ${id}.`);
    router.push(`/(provider)/services/${id}` as any);
  };

  const handleViewAllServicesPress = () => {
    console.log("[DashboardScreen] handleViewAllServicesPress: Navegando para todos os serviços.");
    router.push('/(provider)/services' as any);
  };

  const handleViewAllMessagesPress = () => {
    console.log("[DashboardScreen] handleViewAllMessagesPress: Navegando para a lista de mensagens.");
    router.push('/(provider)/messages' as any);
  };

  const handleAcceptRequest = async (bookingId: string) => {
    console.log(`[DashboardScreen] handleAcceptRequest: Tentando aceitar agendamento ${bookingId}.`);
    Alert.alert(
      "Aceitar Solicitação",
      `Tem certeza que deseja aceitar o agendamento ${bookingId}?`,
      [
        { text: "Cancelar", style: "cancel", onPress: () => console.log("[DashboardScreen] Aceitar cancelado.") },
        {
          text: "Aceitar",
          onPress: async () => {
            setIsLoading(true);
            try {
              await updateBookingStatus(bookingId, { status: BookingStatus.CONFIRMED });
              Alert.alert("Sucesso", "Agendamento aceito com sucesso!");
              console.log(`[DashboardScreen] Agendamento ${bookingId} aceito com sucesso.`);
              fetchData();
            } catch (error: any) {
              console.error("[DashboardScreen] Erro ao aceitar agendamento:", error.response?.data || error.message, error);
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
    console.log(`[DashboardScreen] handleRejectRequest: Tentando rejeitar agendamento ${bookingId}.`);
    Alert.alert(
      "Rejeitar Solicitação",
      `Tem certeza que deseja rejeitar o agendamento ${bookingId}?`,
      [
        { text: "Cancelar", style: "cancel", onPress: () => console.log("[DashboardScreen] Rejeitar cancelado.") },
        {
          text: "Rejeitar",
          onPress: async () => {
            setIsLoading(true);
            try {
              await updateBookingStatus(bookingId, { status: BookingStatus.REJECTED });
              Alert.alert("Sucesso", "Agendamento rejeitado com sucesso!");
              console.log(`[DashboardScreen] Agendamento ${bookingId} rejeitado com sucesso.`);
              fetchData();
            } catch (error: any) {
              console.error("[DashboardScreen] Erro ao rejeitar agendamento:", error.response?.data || error.message, error);
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
    console.log(`[DashboardScreen] handleChatWithClient: Iniciando chat com cliente ${clientName} (${clientId}).`);
    router.push({ pathname: '/(provider)/messages/[chatId]', params: { chatId: clientId, recipientName: clientName } } as any);
  };

  // --- FUNÇÃO DE LOGOUT ---
 const handleLogout = async () => {
    console.log("[Dashboard] handleLogout: Botão 'Sair da Conta' pressionado. (IGNORANDO ALERTA PARA TESTE)"); // Log 1

    try {
      // CHAME signOut() DIRETAMENTE AQUI PARA TESTE
      await signOut();
      console.log("[Dashboard] signOut() aparentemente concluído. (APÓS TESTE DIRETO)"); // Log 4 (será visto se não houver erro no signOut e antes do redirect)
    } catch (error) {
      console.error("[Dashboard] Erro ao fazer logout (APÓS TESTE DIRETO):", error); // Log 5
      Alert.alert("Erro", "Não foi possível sair da conta. Tente novamente."); // Mantenha este Alert para erros
    }

    // O BLOCO Alert.alert ORIGINAL FOI COMENTADO PARA ESTE TESTE:
    // Alert.alert(
    //   "Sair da Conta",
    //   "Tem certeza que deseja sair?",
    //   [
    //     { text: "Cancelar", style: "cancel", onPress: () => console.log("[Dashboard] Logout cancelado pelo usuário.") }, // Log 2
    //     {
    //       text: "Sair",
    //       onPress: async () => {
    //         console.log("[Dashboard] Confirmação de logout: 'Sair' pressionado."); // Log 3
    //         try {
    //           await signOut(); // Chama a função signOut do AuthContext
    //           console.log("[Dashboard] signOut() aparentemente concluído."); // Log 4 (será visto se não houver erro no signOut e antes do redirect)
    //         } catch (error) {
    //           console.error("[Dashboard] Erro ao fazer logout:", error); // Log 5
    //           Alert.alert("Erro", "Não foi possível sair da conta. Tente novamente.");
    //         }
    //       },
    //     },
    //   ]
    // );
  };
  // --- FIM DA FUNÇÃO DE LOGOUT ---

  const renderEmptyState = (message: string, iconName: keyof typeof Ionicons.glyphMap = "sad-outline") => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name={iconName} size={48} color={TEXT_MUTED} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: "Carregando...", headerTransparent: true, headerTintColor: '#333' }} />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: "Erro", headerTransparent: false, headerStyle: { backgroundColor: '#FFFFFF' }, headerTintColor: '#333' }} />
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
        {/* NOVO: Dashboard Header com nome do provedor e avatar */}
        <DashboardHeader
          providerName={dashboardData?.fullName}
          avatarUrl={user?.avatarUrl} // Assumindo que user.avatarUrl vem do AuthContext
          onProfilePress={() => router.push('/(provider)/profile' as any)}
        />

        {/* NOVO: Financial Summary Card */}
        <FinancialSummaryCard
          totalEarnings={dashboardData?.totalEarnings}
          pendingWithdrawals={dashboardData?.pendingWithdrawals}
          onViewEarnings={() => router.push('/(provider)/earnings' as any)}
        />

        {/* NOVO: Quick Actions Section */}
        <QuickActionsSection
          onViewAllServicesPress={handleViewAllServicesPress}
          onViewAllMessagesPress={handleViewAllMessagesPress}
          onManageAvailability={() => router.push('/(provider)/availability' as any)} // Assumindo uma rota de disponibilidade
        />

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
                entryAnim={new Animated.ValueXY({x:1,y:0})}
              />
            ))
          ) : (
            renderEmptyState("Nenhum serviço confirmado agendado.", "calendar-clear-outline")
          )}
        </View>

        {/* Seção de Reviews Recentes */}
        {dashboardData?.reviews && dashboardData.reviews.length > 0 ? ( /* Correção: 'reviews' em vez de 'recentReviews' */
            <View style={styles.subsectionWrapper}>
                <View style={styles.subsectionHeader}>
                    <Text style={styles.subsectionTitle}>
                        <Ionicons name="star-outline" size={20} color={WARNING_YELLOW} /> Avaliações Recentes
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/(provider)/reviews' as any)} accessibilityRole="button" accessibilityLabel="Ver todas as avaliações">
                        <Text style={styles.viewAllText}>Ver Todas</Text>
                    </TouchableOpacity>
                </View>
                {/* O slice(0, 2) pode ser opcional aqui se o backend já limita a 2 */}
                {dashboardData.reviews.slice(0, 2).map((review: ProviderReview, index: number) => ( /* Correção de 'any' para ProviderReview e number */
                    <View key={review.id} style={styles.reviewItem}>
                        <Text style={styles.reviewText}>"{review.comment || 'Sem comentário.'}"</Text>
                        {/* INÍCIO DA ALTERAÇÃO PARA ESTRELAS E NOME DO CLIENTE */}
                        <View style={styles.reviewRatingStarsAndName}> {/* <--- ESTILO ADICIONADO */}
                            <View style={styles.reviewStarsContainer}> {/* <--- ESTILO ADICIONADO */}
                                {Array.from({ length: review.rating }).map((_, i) => (
                                    <Ionicons key={i} name="star" size={16} color={ICON_PRIMARY} />
                                ))}
                            </View>
                            <Text style={styles.reviewClientName}>
                                {review.client?.fullName || 'Cliente Desconhecido'} {/* Acessa o fullName do client */}
                            </Text>
                        </View>
                        {/* FIM DA ALTERAÇÃO PARA ESTRELAS E NOME DO CLIENTE */}
                    </View>
                ))}
            </View>
        ) : ( // Parte do 'else' do ternário
            <View style={styles.subsectionWrapper}>
                <View style={styles.subsectionHeader}>
                    <Text style={styles.subsectionTitle}>
                        <Ionicons name="star-outline" size={20} color={WARNING_YELLOW} /> Avaliações Recentes
                    </Text>
                </View>
                {renderEmptyState("Nenhuma avaliação recente. Conclua mais serviços!", "star-half-outline")}
            </View>
        )}

        {/* --- BOTÃO DE LOGOUT ADICIONADO AQUI --- */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={WHITE} />
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>
        {/* --- FIM DO BOTÃO DE LOGOUT --- */}

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
    paddingTop: 0, // Ajuste para o novo cabeçalho flutuante
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
    backgroundColor: WHITE, // Fundo para a subseção para melhor visual
    borderRadius: 12,
    padding: 15,
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_CARD, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 5 },
      android: { elevation: 4 },
    }),
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
    marginTop: 10, // Adicionado espaçamento
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
  reviewRating: { // <--- ESTILO ORIGINAL - AGORA SERÁ USADO reviewRatingStarsAndName
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Este estava alinhando as estrelas e o nome à direita
  },
  // NOVOS ESTILOS: Adicionados para reposicionar as estrelas
  reviewRatingStarsAndName: { // <--- ESTILO ADICIONADO AQUI
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  reviewStarsContainer: { // <--- ESTILO ADICIONADO AQUI
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewClientName: {
    fontSize: 13,
    color: TEXT_MUTED,
    // Não precisa de marginLeft aqui se justify-content: 'space-between'
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
  // --- ESTILOS PARA O BOTÃO DE LOGOUT ---
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DANGER_RED,
    borderRadius: 25,
    paddingVertical: 8,
    marginTop: 30, // Espaçamento do conteúdo acima
    marginBottom: 20, // Espaçamento da parte inferior da tela
    width: '90%', // Ocupa uma boa largura
    alignSelf: 'center', // Centraliza o botão
    ...Platform.select({
      ios: { shadowColor: DANGER_RED, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
      android: { elevation: 6 },
    }),
  },
  logoutButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});