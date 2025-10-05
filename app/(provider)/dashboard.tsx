// LimpeJaApp/app/(provider)/dashboard.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Easing, // CORREÃ‡ÃƒO: Import explÃ­cito para Easing
    AccessibilityInfo, // CORREÃ‡ÃƒO: Import explÃ­cito para AccessibilityInfo
} from 'react-native';
import * as Haptics from 'expo-haptics'; // CORREÃ‡ÃƒO: Import separado e correto para Haptics
import { useAuth } from '../../contexts/AuthContext';
import { PROVIDER_ROUTES } from '../../constants/routes'; // Importar PROVIDER_ROUTES

// Import NotificationUIService
import NotificationUIService from '../../services/notificationUIService'; // Added

// ImportaÃ§Ãµes dos serviÃ§os
import { getBookingsForUser, updateBookingStatus } from '../../services/bookingService';
import { getMyProviderDashboard } from '../../services/dashboardService';
import { getMyProviderEarnings } from '../../services/providerService';

// ImportaÃ§Ãµes das tipagens centralizadas
import { BookingDetails, BookingStatus } from '../../types/backend/bookings';
import { ProviderReview } from '../../types/backend/providers';
// CORREÃ‡ÃƒO: Usar a interface ProviderDashboard do arquivo de provedores,
// que Ã© mais completa e usada na lÃ³gica do componente.
// import { ProviderDashboard } from '../../types/backend/dashboard';
import { ProviderDashboard } from '../../types/backend/providers'; // Usar a interface correta

// ImportaÃ§Ãµes dos novos componentes
import AdvancedReviewsSection from '../../components/provider/dashboard/AdvancedReviewsSection';
import SmartInsightsSection from '../../components/provider/dashboard/SmartInsightsSection';
import ProviderNudgeContainer from '../../components/provider/ProviderNudgeContainer'; // Added

// CORREÃ‡ÃƒO: Adicionar import para SafeAreaInsets (para alinhamento do header no iOS)
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Hook para animaÃ§Ã£o de toque (reutilizÃ¡vel, refinado com haptics)
const useAnimatedTouch = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Haptic sutil premium iOS
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

// Hook para reduced motion (premium accessibility iOS)
const useReducedMotion = () => {
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false);

  useEffect(() => {
    const updateReducedMotion = async () => {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      setIsReducedMotionEnabled(enabled);
    };

    updateReducedMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReducedMotionEnabled
    );

    return () => subscription.remove();
  }, []);

  return isReducedMotionEnabled;
};

// Cores para o tema (ajustadas e expandidas para iOS clean)
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
const PRIMARY_LIGHT = '#EBF5FF';

// Spacing e Radii tokens (consistentes e clean) - CORREÃ‡ÃƒO: Adicionado 'md' ao Radii
const Spacing = {
  xs: 6,
  sm: 10,
  md: 15,
  lg: 20,
  xl: 28,
};

const Radii = {
  xl: 20,
  pill: 25,
  md: 12, // CORREÃ‡ÃƒO: Adicionado 'md' para resolver TS2339 em borderRadius: Radii.md
  sm: 10,
};

// Easing suave para animaÃ§Ãµes iOS
const easeOut = (value: any) => Easing.out(Easing.ease)(value);

// --- Componentes ReutilizÃ¡veis ---

// Componente: DashboardHeader (refinado com haptics e reduced motion) - CORREÃ‡ÃƒO: Adicionado useSafeAreaInsets para alinhamento iOS
const DashboardHeader: React.FC<{
  providerName: string | undefined;
  avatarUrl: string | undefined | null;
  onProfilePress: () => void;
  isReducedMotionEnabled: boolean; // Passado para animaÃ§Ãµes
}> = ({ providerName, avatarUrl, onProfilePress, isReducedMotionEnabled }) => {
  const insets = useSafeAreaInsets(); // CORREÃ‡ÃƒO: Hook para calcular insets (top = status bar no iOS)
  const { scaleAnim, onPressIn, onPressOut } = useAnimatedTouch();
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = isReducedMotionEnabled ? 0 : 400;
    Animated.timing(headerAnim, { toValue: 1, duration, easing: easeOut, useNativeDriver: true }).start();
  }, [isReducedMotionEnabled]);

  // CORREÃ‡ÃƒO: CÃ¡lculo dinÃ¢mico do paddingTop: iOS usa insets.top + padding base (ex: 47px + 20px = 67px)
  // Android mantÃ©m padding fixo (20px, sem insets)
  const paddingTopValue = Platform.OS === 'ios' 
    ? insets.top + 20  // insets.top cobre status bar/notch; 20px Ã© padding base confortÃ¡vel
    : 20;  // Padding fixo para Android (ajuste se quiser mais/menos)

  return (
    <Animated.View style={[
      headerStyles.headerContainer,
      { 
        opacity: headerAnim, 
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        paddingTop: paddingTopValue  // Aplicar o valor dinÃ¢mico aqui
      }
    ]}>
      <View style={headerStyles.greetingContainer}>
        <Text style={headerStyles.greetingText}>OlÃ¡, <Text style={headerStyles.providerNameText}>{providerName || 'Provedor'}</Text>!</Text>
        <Text style={headerStyles.currentDateText}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      </View>
      <TouchableOpacity 
        onPress={() => {
          onProfilePress();
        }} 
        style={[headerStyles.avatarButton, { transform: [{ scale: scaleAnim }] }]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel="Ir para o perfil"
        accessibilityHint="Toque para editar seu perfil."
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={headerStyles.avatar} defaultSource={require('../../assets/images/default-avatar.png')} />
        ) : (
          <View style={headerStyles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color={WHITE} accessibilityHidden={true} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const headerStyles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: WHITE,
    borderBottomLeftRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
    ...Platform.select({
      ios: { 
        shadowColor: SHADOW_COLOR_SECTION, 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1, // Suavizado para iOS clean
        shadowRadius: 6 
      },
      android: { elevation: 8 },
    }),
    marginBottom: Spacing.lg,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TEXT_DARK,
  },
  providerNameText: {
    color: ICON_PRIMARY,
  },
  currentDateText: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: Spacing.xs,
  },
  avatarButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginLeft: Spacing.sm,
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

// Componente: FinancialSummaryCard (refinado com haptics e reduced motion)
const FinancialSummaryCard: React.FC<{
  totalEarnings: number | undefined;
  pendingWithdrawals: number | undefined;
  onViewEarnings: () => void;
  animation: Animated.Value;
  isReducedMotionEnabled: boolean;
}> = ({ totalEarnings, pendingWithdrawals, onViewEarnings, animation, isReducedMotionEnabled }) => {
  const { scaleAnim, onPressIn, onPressOut } = useAnimatedTouch();

  const formattedTotalEarnings = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEarnings || 0);
  const formattedPendingWithdrawals = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingWithdrawals || 0);

  return (
    <Animated.View style={[
      summaryStyles.summaryCard,
      { 
        opacity: animation, 
        transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] 
      }
    ]}>
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
        onPress={() => {
          console.log("[DashboardScreen] BotÃ£o 'Gerenciar Ganhos' pressionado. Tentando navegar para ganhos.");
          onViewEarnings();
        }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel="Ver todos os meus ganhos"
        accessibilityHint="Navegue para a tela de ganhos para mais detalhes."
      >
        <Ionicons name="wallet-outline" size={20} color={WHITE} style={summaryStyles.buttonIcon} accessibilityHidden={true} />
        <Text style={summaryStyles.viewEarningsButtonText}>Gerenciar Ganhos</Text>
        <Ionicons name="chevron-forward-outline" size={20} color={WHITE} accessibilityHidden={true} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const summaryStyles = StyleSheet.create({
  summaryCard: {
    backgroundColor: ICON_PRIMARY,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: { 
        shadowColor: SHADOW_COLOR_SECTION, 
        shadowOffset: { width: 0, height: 6 }, 
        shadowOpacity: 0.1, // Suavizado para iOS
        shadowRadius: 10 
      },
      android: { elevation: 10 },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: Spacing.md,
    textAlign: 'center', // Clean centralizado
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)', // Suavizado para legibilidade
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  metricValuePrimary: {
    fontSize: 22,
    fontWeight: 'bold',
    color: WHITE,
    textAlign: 'center',
  },
  metricValueWarning: {
    fontSize: 22,
    fontWeight: 'bold',
    color: WARNING_YELLOW,
    textAlign: 'center',
  },
  viewEarningsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radii.pill,
    paddingVertical: Spacing.sm,
  },
  viewEarningsButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: Spacing.sm,
  },
  buttonIcon: {
    marginRight: Spacing.xs,
  },
});

// Componente: QuickActionsSection (refinado com grid clean, haptics e reduced motion)
const QuickActionsSection: React.FC<{
  onViewAllServicesPress: () => void;
  onViewAllMessagesPress: () => void;
  onManageAvailability: () => void;
  onOpenRequests: () => void;
  onOpenUpcoming: () => void;
  onOpenCompleted: () => void;
  onOpenNotifications: () => void;
  onOpenReviews: () => void;
  onOpenEarnings: () => void;
  onQuickWithdraw: () => void;
  animation: Animated.Value;
  isReducedMotionEnabled: boolean;
}> = ({
  onViewAllServicesPress,
  onViewAllMessagesPress,
  onManageAvailability,
  onOpenRequests,
  onOpenUpcoming,
  onOpenCompleted,
  onOpenNotifications,
  onOpenReviews,
  onOpenEarnings,
  onQuickWithdraw,
  animation,
  isReducedMotionEnabled,
}) => {
  // Cria instÃ¢ncias de animaÃ§Ã£o para cada item (atÃ© 9)
  const mk = () => useAnimatedTouch();
  const a1 = mk(), a2 = mk(), a3 = mk(), a4 = mk(), a5 = mk(), a6 = mk(), a7 = mk(), a8 = mk(), a9 = mk();

  const Item = ({
    icon,
    label,
    anim,
    onPress,
  }: { icon: keyof typeof Ionicons.glyphMap; label: string; anim: ReturnType<typeof useAnimatedTouch>; onPress: () => void }) => (
    <TouchableOpacity 
      style={[quickActionStyles.gridItem, { transform: [{ scale: anim.scaleAnim }] }]}
      onPress={onPress} 
      onPressIn={anim.onPressIn} 
      onPressOut={anim.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Toque para abrir.`.replace(' ', ' ')}
      accessibilityHint={`Navegue para a seÃ§Ã£o de ${label.toLowerCase()}.`}
    >
      <Ionicons name={icon} size={30} color={ICON_PRIMARY} accessibilityHidden={true} />
      <Text style={quickActionStyles.gridItemText} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[
      quickActionStyles.sectionContainer,
      { 
        opacity: animation, 
        transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] 
      }
    ]}>
      <Text style={quickActionStyles.sectionTitle}>AÃ§Ãµes RÃ¡pidas</Text>
      <View style={quickActionStyles.grid}>
        <Item icon="calendar-outline" label="Minha Agenda" anim={a1} onPress={onManageAvailability} />
        <Item icon="file-tray-outline" label="SolicitaÃ§Ãµes" anim={a2} onPress={onOpenRequests} />
        <Item icon="calendar-outline" label="PrÃ³ximos" anim={a3} onPress={onOpenUpcoming} />
        <Item icon="checkmark-done-outline" label="ConcluÃ­dos" anim={a4} onPress={onOpenCompleted} />
        <Item icon="briefcase-outline" label="Meus ServiÃ§os" anim={a5} onPress={onViewAllServicesPress} />
        <Item icon="chatbubbles-outline" label="Mensagens" anim={a6} onPress={onViewAllMessagesPress} />
        <Item icon="notifications-outline" label="NotificaÃ§Ãµes" anim={a7} onPress={onOpenNotifications} />
        {/* BOTÃƒO CORRETO PARA REVIEWS */}
        <Item icon="analytics-outline" label="AvaliaÃ§Ãµes" anim={a8} onPress={onOpenReviews} />
        <Item icon="wallet-outline" label="Ganhos" anim={a9} onPress={onOpenEarnings} />
      </View>

      {/* Linha separada com destaque para saque rÃ¡pido (com haptic) */}
      <TouchableOpacity
        style={quickActionStyles.withdrawCta}
        onPress={onQuickWithdraw}
        onPressIn={a9.onPressIn}
        onPressOut={a9.onPressOut}
        accessibilityRole="button"
        accessibilityLabel="Saque RÃ¡pido"
        accessibilityHint="Solicite um saque rÃ¡pido dos ganhos disponÃ­veis."
      >
        <Animated.View style={{ transform: [{ scale: a9.scaleAnim }], flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="cash-outline" size={22} color={WHITE} accessibilityHidden={true} />
          <Text style={quickActionStyles.withdrawCtaText}>Saque RÃ¡pido</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={WHITE} accessibilityHidden={true} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const quickActionStyles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: WHITE,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: { 
        shadowColor: SHADOW_COLOR_SECTION, 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1, // Suavizado
        shadowRadius: 6 
      },
      android: { elevation: 8 },
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_DARK,
    marginBottom: Spacing.md,
    textAlign: 'center', // Clean centralizado
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
  },
  gridItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: BACKGROUND_ALT,
    borderRadius: Radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    ...Platform.select({
      ios: { 
        shadowColor: SHADOW_COLOR_CARD, 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, // Suavizado para iOS
        shadowRadius: 3 
      },
      android: { elevation: 2 },
    }),
  },
  gridItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_DARK,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  withdrawCta: {
    marginTop: Spacing.sm,
    backgroundColor: ICON_PRIMARY,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawCtaText: {
    color: WHITE,
    fontWeight: '700',
    marginHorizontal: Spacing.sm,
    fontSize: 15,
  },
});

// Componente de Item de SolicitaÃ§Ã£o (RequestItem - refinado com haptics e clean spacing)
const RequestItem: React.FC<{
  item: BookingDetails;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onDetails: (id: string) => void;
  onChat?: (clientId: string, clientName: string) => void;
  entryAnim: Animated.Value;
  isReducedMotionEnabled: boolean;
}> = ({ item, onAccept, onReject, onDetails, onChat, entryAnim, isReducedMotionEnabled }) => {
  const acceptTouchAnimation = useAnimatedTouch();
  const rejectTouchAnimation = useAnimatedTouch();
  const detailsTouchAnimation = useAnimatedTouch();
  const chatTouchAnimation = useAnimatedTouch();

  const clientId: string | undefined = item.clientId;
  const clientName: string = item.clientFullName || 'Cliente';

  // CORREÃ‡ÃƒO: Usar item.scheduledDate e item.scheduledTime
  const combinedDateTimeString = `${item.scheduledDate}T${item.scheduledTime}:00`;
  const scheduledDate = new Date(combinedDateTimeString).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  const scheduledTime = new Date(combinedDateTimeString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View style={[
      styles.requestItem,
      {
        opacity: entryAnim,
        transform: [{ translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      },
    ]}>
      <View style={styles.requestItemPendingIndicator} />
      <View style={styles.requestItemHeader}>
        <View style={styles.clientAvatarPlaceholder}>
          <Ionicons name="person-outline" size={20} color={TEXT_MEDIUM} accessibilityHidden={true} />
        </View>
        <Text style={styles.requestServiceName} numberOfLines={1}>{item.serviceName}</Text>
        <TouchableOpacity
          style={styles.acceptButtonCorner}
          onPress={() => {
            if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // CORREÃ‡ÃƒO: Usar ImpactFeedbackStyle.Medium para sucesso
            onAccept && onAccept(item.id);
          }}
          onPressIn={acceptTouchAnimation.onPressIn}
          onPressOut={acceptTouchAnimation.onPressOut}
          accessibilityRole="button"
          accessibilityLabel={`Aceitar solicitaÃ§Ã£o de ${item.serviceName}`}
          accessibilityHint="Confirme para aceitar o agendamento."
        >
          <Animated.View style={{ transform: [{ scale: acceptTouchAnimation.scaleAnim }] }}>
            <Ionicons name="checkmark-circle" size={32} color={SUCCESS_GREEN} accessibilityHidden={true} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <Text style={styles.requestClientName}>Solicitado por: {clientName}</Text>

      {item.totalPrice != null && !isNaN(Number(item.totalPrice)) ? (
        <Text style={styles.requestPrice}>
            Valor: R$ {Number(item.totalPrice).toFixed(2).replace('.', ',')}
        </Text>
      ) : (
        <Text style={styles.requestPrice}>Valor: N/A</Text>
      )}
      <View style={styles.requestInfoRow}>
        <Ionicons name="calendar-outline" size={16} color={TEXT_MUTED} style={styles.infoIcon} accessibilityHidden={true} />
        <Text style={styles.requestInfoText}>
          {scheduledDate}
        </Text>
        <Ionicons name="time-outline" size={16} color={TEXT_MUTED} style={styles.infoIcon} accessibilityHidden={true} />
        <Text style={styles.requestInfoText}>
          {scheduledTime}
        </Text>
      </View>
      <View style={styles.requestInfoRow}>
        <Ionicons name="location-outline" size={16} color={TEXT_MUTED} style={styles.infoIcon} accessibilityHidden={true} />
        <Text style={styles.requestInfoText} numberOfLines={1}>{item.address?.street}, {item.address?.number}</Text>
      </View>

      <View style={styles.requestActionsRow}>
        {onChat && clientId && (
          <TouchableOpacity
            style={[styles.actionButtonBase, styles.chatButton]}
            onPress={() => {
              if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChat(clientId, clientName);
            }}
            onPressIn={chatTouchAnimation.onPressIn}
            onPressOut={chatTouchAnimation.onPressOut}
            accessibilityRole="button"
            accessibilityLabel={`Conversar com ${clientName}`}
            accessibilityHint="Inicie um chat com o cliente."
          >
            <Animated.View style={[styles.actionButtonContent, { transform: [{ scale: chatTouchAnimation.scaleAnim }] }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={ICON_PRIMARY} accessibilityHidden={true} />
            </Animated.View>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButtonBase, styles.rejectButton]}
          onPress={() => {
            if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onReject && onReject(item.id);
          }}
          onPressIn={rejectTouchAnimation.onPressIn}
          onPressOut={rejectTouchAnimation.onPressOut}
          accessibilityRole="button"
          accessibilityLabel={`Recusar solicitaÃ§Ã£o de ${item.serviceName}`}
          accessibilityHint="Rejeite o agendamento."
        >
          <Animated.View style={[styles.actionButtonContent, { transform: [{ scale: rejectTouchAnimation.scaleAnim }] }]}>
            <Ionicons name="close-circle-outline" size={20} color={WHITE} accessibilityHidden={true} />
            <Text style={styles.actionButtonTextWhite}>Recusar</Text>
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButtonBase, styles.detailsButton]}
          onPress={() => {
            if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDetails(item.id);
          }}
          onPressIn={detailsTouchAnimation.onPressIn}
          onPressOut={detailsTouchAnimation.onPressOut}
          accessibilityRole="button"
          accessibilityLabel={`Ver detalhes da solicitaÃ§Ã£o de ${item.serviceName}`}
          accessibilityHint="Veja mais informaÃ§Ãµes sobre o agendamento."
        >
          <Animated.View style={[styles.actionButtonContent, { transform: [{ scale: detailsTouchAnimation.scaleAnim }] }]}>
            <Ionicons name="eye-outline" size={20} color={ICON_PRIMARY} accessibilityHidden={true} />
            <Text style={styles.actionButtonTextPrimary}>Detalhes</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Componente de Item de ServiÃ§o Confirmado (refinado com haptics)
const ConfirmedServiceItem: React.FC<{
  item: BookingDetails;
  onPress: (id: string) => void;
  entryAnim: Animated.Value;
  isReducedMotionEnabled: boolean;
}> = ({ item, onPress, entryAnim, isReducedMotionEnabled }) => {
  const touchAnimation = useAnimatedTouch();

  // CORREÃ‡ÃƒO: Usar item.scheduledDate e item.scheduledTime
  const combinedDateTimeString = `${item.scheduledDate}T${item.scheduledTime}:00`;
  const scheduledDate = new Date(combinedDateTimeString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const scheduledTime = new Date(combinedDateTimeString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View style={{ 
      opacity: entryAnim, 
      transform: [{ translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] 
    }}>
      <TouchableOpacity
        style={styles.serviceItem}
        onPress={() => {
          if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(item.id);
        }}
        onPressIn={touchAnimation.onPressIn}
        onPressOut={touchAnimation.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalhes do serviÃ§o ${item.serviceName} com ${item.clientFullName}`}
        accessibilityHint="Toque para ver detalhes do serviÃ§o confirmado."
      >
        <Animated.View style={[styles.serviceItemContent, { transform: [{ scale: touchAnimation.scaleAnim }] }]}>
          <View style={styles.serviceItemIconWrapper}>
            <MaterialCommunityIcons name="calendar-check-outline" size={28} color={ICON_PRIMARY} accessibilityHidden={true} />
          </View>
          <View style={styles.serviceItemDetails}>
            <Text style={styles.serviceItemText} numberOfLines={1}>
              <Text style={{ fontWeight: 'bold' }}>{item.serviceName || 'ServiÃ§o Desconhecido'}</Text>
              {item.clientFullName ? ` com ${item.clientFullName}` : ''}
            </Text>
            <Text style={styles.serviceItemTime}>
              {scheduledDate}, {scheduledTime}
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={24} color={TEXT_MUTED} accessibilityHidden={true} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Componente principal do Dashboard do Provedor (refinado com reduced motion global e haptics)
export default function ProviderDashboardScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth(); // Corrigido: usando logout em vez de signOut

  const [dashboardData, setDashboardData] = useState<ProviderDashboard | null>(null);
  const [pendingRequests, setPendingRequests] = useState<BookingDetails[]>([]);
  const [upcomingServices, setUpcomingServices] = useState<BookingDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animated Values (otimizados para reduced motion)
  const financialSummaryAnim = useRef(new Animated.Value(0)).current;
  const quickActionsAnim = useRef(new Animated.Value(0)).current;
  const newRequestsAnim = useRef(new Animated.Value(0)).current;
  const upcomingServicesAnim = useRef(new Animated.Value(0)).current;
  const reviewsSectionAnim = useRef(new Animated.Value(0)).current;
  const logoutButtonAnim = useRef(new Animated.Value(0)).current;

  // Adicionado ref para verificar se o componente estÃ¡ montado
  const isMounted = useRef(true);
  // Ref para armazenar a animaÃ§Ã£o composta do stagger
  const staggerAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  const isReducedMotionEnabled = useReducedMotion(); // Global reduced motion

  const fetchData = useCallback(async () => {
    console.log("[DashboardScreen] fetchData: Iniciando busca de dados.");
    if (isMounted.current) {
      setIsLoading(true);
      setError(null);
    }
    if (!user?.id) {
      console.warn("[DashboardScreen] fetchData: user.id nÃ£o disponÃ­vel. Abortando busca.");
      if (isMounted.current) {
        setError("ID do provedor nÃ£o disponÃ­vel para buscar dados.");
        setIsLoading(false);
        setIsRefreshing(false);
      }
      return;
    }
    console.log(`[DashboardScreen] fetchData: Buscando dashboard para userId: ${user.id}`);

    try {
      // CORRIGIDO: Chamar a funÃ§Ã£o correta do serviÃ§o de dashboard
      const dashboard = await getMyProviderDashboard();
      if (!isMounted.current) return; // Verificar se o componente ainda estÃ¡ montado

      console.log("[DashboardScreen] fetchData: Dados do dashboard recebidos.", dashboard);
      console.log("[DashboardScreen] REVIEWS NA DASHBOARD (AGORA COM 'reviews'):", dashboard.reviews);

      setDashboardData(dashboard);

      // Usar os dados recebidos do dashboard para popular os estados
      setPendingRequests(dashboard.upcomingBookings.filter(b => b.status === BookingStatus.PENDING));
      setUpcomingServices(dashboard.upcomingBookings.filter(b => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.IN_PROGRESS));

      // Animate sections in stagger (respeitando reduced motion)
      const animationDuration = isReducedMotionEnabled ? 0 : 300;
      const staggerDelay = isReducedMotionEnabled ? 0 : 100;
      const animationSequence = Animated.stagger(staggerDelay, [
        Animated.timing(financialSummaryAnim, { toValue: 1, duration: animationDuration, useNativeDriver: true }),
        Animated.timing(quickActionsAnim, { toValue: 1, duration: animationDuration, useNativeDriver: true }),
        Animated.timing(newRequestsAnim, { toValue: 1, duration: animationDuration, useNativeDriver: true }),
        Animated.timing(upcomingServicesAnim, { toValue: 1, duration: animationDuration, useNativeDriver: true }),
        Animated.timing(reviewsSectionAnim, { toValue: 1, duration: animationDuration, useNativeDriver: true }),
        Animated.timing(logoutButtonAnim, { toValue: 1, duration: animationDuration, useNativeDriver: true }),
      ]);
      staggerAnimationRef.current = animationSequence;
      animationSequence.start();

    } catch (err: any) {
      console.error("[DashboardScreen] Erro ao buscar dados do dashboard do provedor:", err.response?.data || err.message, err);
      if (isMounted.current) {
        NotificationUIService.showError(err.response?.data?.message || "NÃ£o foi possÃ­vel carregar os dados do dashboard.", "Erro");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
      console.log("[DashboardScreen] fetchData: Finalizado. isLoading:", false, "isRefreshing:", false);
    }
  }, [user, financialSummaryAnim, quickActionsAnim, newRequestsAnim, upcomingServicesAnim, reviewsSectionAnim, logoutButtonAnim, isReducedMotionEnabled]);

  useEffect(() => {
    isMounted.current = true; // Componente montado

    console.log("[DashboardScreen] useEffect: authLoading:", authLoading, "user.id:", user?.id);
    if (!authLoading && user?.id) {
      fetchData();
    } else if (!authLoading && !user?.id) {
      if (isMounted.current) {
        setIsLoading(false);
        setError("Provedor nÃ£o autenticado ou perfil nÃ£o encontrado.");
      }
      console.warn("[DashboardScreen] useEffect: UsuÃ¡rio nÃ£o autenticado ou ID nÃ£o encontrado apÃ³s authLoading.");
    }

    return () => {
      isMounted.current = false; // Componente desmontado
      // Parar a animaÃ§Ã£o composta do stagger se ela estiver em andamento
      if (staggerAnimationRef.current) {
        staggerAnimationRef.current.stop();
      }
    };
  }, [authLoading, user, fetchData]); // Removidas as dependÃªncias individuais das Animated.Value, pois a animaÃ§Ã£o composta Ã© controlada por staggerAnimationRef

  const onRefresh = useCallback(() => {
    console.log("[DashboardScreen] onRefresh: Iniciando refresh.");
    if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRefreshing(true);
    fetchData();
  }, [fetchData, isReducedMotionEnabled]);

  const handleServicePress = (id: string) => {
    console.log(`[DashboardScreen] handleServicePress: Navegando para detalhes do serviÃ§o ${id}.`);
    router.push(`/(provider)/services/${id}` as any);
  };

  const handleViewAllServicesPress = () => {
    console.log("[DashboardScreen] handleViewAllServicesPress: Navegando para todos os serviÃ§os.");
    router.push('/(provider)/services' as any);
  };

  const handleViewAllMessagesPress = () => {
    console.log("[DashboardScreen] handleViewAllMessagesPress: Navegando para a lista de mensagens.");
    router.push('/(provider)/messages' as any);
  };

  // Handlers de navegaÃ§Ã£o para AÃ§Ãµes RÃ¡pidas novas
  const goRequests = () => router.push('/(provider)/services?filter=requests' as any);
  const goUpcoming = () => router.push('/(provider)/services?filter=upcoming' as any);
  const goCompleted = () => router.push('/(provider)/services?filter=completed' as any);
  const goNotifications = () => router.push('/(provider)/notifications' as any);
  const goReviews = () => router.push(PROVIDER_ROUTES.REVIEWS as any); // CORRIGIDO: Usar a constante da rota
  const goEarnings = () => router.push('/(provider)/earnings' as any);
  const goWithdraw = () => router.push(PROVIDER_ROUTES.WITHDRAW as any); // CORREÃ‡ÃƒO: Usar a constante da rota

  const handleAcceptRequest = async (bookingId: string) => {
    console.log(`[DashboardScreen] handleAcceptRequest: Tentando aceitar agendamento ${bookingId}.`);
    Alert.alert( // Kept Alert for confirmation, not for error/success feedback
      "Aceitar SolicitaÃ§Ã£o",
      `Tem certeza que deseja aceitar o agendamento ${bookingId}?`,
      [
        { text: "Cancelar", style: "cancel", onPress: () => console.log("[DashboardScreen] Aceitar cancelado.") },
        {
          text: "Aceitar",
          onPress: async () => {
            if (isMounted.current) {
              setIsLoading(true);
            }
            try {
              await updateBookingStatus(bookingId, { status: BookingStatus.CONFIRMED });
              if (isMounted.current) {
                NotificationUIService.showSuccess("Agendamento aceito com sucesso!", "Sucesso");
                console.log(`[DashboardScreen] Agendamento ${bookingId} aceito com sucesso.`);
                fetchData();
              }
            } catch (error: any) {
              console.error("[DashboardScreen] Erro ao aceitar agendamento:", error.response?.data || error.message, error);
              if (isMounted.current) {
                NotificationUIService.showError(error.response?.data?.message || "NÃ£o foi possÃ­vel aceitar o agendamento.", "Erro");
              }
            } finally {
              if (isMounted.current) {
                setIsLoading(false);
              }
            }
          },
        },
      ]
    );
  };

  const handleRejectRequest = async (bookingId: string) => {
    console.log(`[DashboardScreen] handleRejectRequest: Tentando rejeitar agendamento ${bookingId}.`);
    Alert.alert( // Kept Alert for confirmation
      "Rejeitar SolicitaÃ§Ã£o",
      `Tem certeza que deseja rejeitar o agendamento ${bookingId}?`,
      [
        { text: "Cancelar", style: "cancel", onPress: () => console.log("[DashboardScreen] Rejeitar cancelado.") },
        {
          text: "Rejeitar",
          onPress: async () => {
            if (isMounted.current) {
              setIsLoading(true);
            }
            try {
              await updateBookingStatus(bookingId, { status: BookingStatus.REJECTED });
              if (isMounted.current) {
                NotificationUIService.showSuccess("Agendamento rejeitado com sucesso!", "Sucesso");
                console.log(`[DashboardScreen] Agendamento ${bookingId} rejeitado com sucesso.`);
                fetchData();
              }
            } catch (error: any) {
              console.error("[DashboardScreen] Erro ao rejeitar agendamento:", error.response?.data || error.message, error);
              if (isMounted.current) {
                NotificationUIService.showError(error.response?.data?.message || "NÃ£o foi possÃ­vel rejeitar o agendamento.", "Erro");
              }
            } finally {
              if (isMounted.current) {
                setIsLoading(false);
              }
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

  const handleLogout = async () => {
    console.log("[Dashboard] BotÃ£o de Logout clicado: Iniciando logout direto.");
    if (!isReducedMotionEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // CORREÃ‡ÃƒO: Usar notificationAsync e NotificationFeedbackType.Warning
    try {
      await logout();
      console.log("[Dashboard] logout() concluÃ­do. O _layout.tsx deve redirecionar.");
      AccessibilityInfo.announceForAccessibility('Logout realizado com sucesso. Redirecionando para tela inicial.');
    } catch (error) {
      console.error("[Dashboard] Erro ao fazer logout:", error);
      NotificationUIService.showError("NÃ£o foi possÃ­vel sair da conta. Tente novamente ou verifique sua conexÃ£o.", "Erro ao Sair");
    }
  };

  const renderEmptyState = (message: string, iconName: keyof typeof Ionicons.glyphMap = "sad-outline") => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name={iconName} size={48} color={TEXT_MUTED} accessibilityHidden={true} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: "Carregando...", headerTransparent: true, headerTintColor: '#333' }} />
        <ActivityIndicator size="large" color={ICON_PRIMARY} accessibilityLabel="Carregando dashboard" />
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: "Erro", headerTransparent: false, headerStyle: { backgroundColor: '#FFFFFF' }, headerTintColor: '#333' }} />
        <Ionicons name="alert-circle-outline" size={48} color={DANGER_RED} accessibilityHidden={true} />
        <Text style={styles.errorText} accessibilityLiveRegion="polite">{error}</Text>
        <TouchableOpacity 
          onPress={() => {
            if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            fetchData();
          }} 
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel="Tentar Novamente"
          accessibilityHint="Toque para recarregar os dados do dashboard."
        >
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={ICON_PRIMARY}
            accessibilityLabel="Atualizar dashboard"
          />
        }
        keyboardShouldPersistTaps="handled" // Premium UX para iOS
      >
        <DashboardHeader
          providerName={dashboardData?.fullName}
          avatarUrl={user?.avatarUrl}
          onProfilePress={() => router.push('/(provider)/profile' as any)}
          isReducedMotionEnabled={isReducedMotionEnabled}
        />
        <FinancialSummaryCard
          totalEarnings={dashboardData?.totalEarnings}
          pendingWithdrawals={dashboardData?.pendingWithdrawals}
          onViewEarnings={() => router.push('/(provider)/earnings' as any)}
          animation={financialSummaryAnim}
          isReducedMotionEnabled={isReducedMotionEnabled}
        />
        <QuickActionsSection
          onViewAllServicesPress={handleViewAllServicesPress}
          onViewAllMessagesPress={handleViewAllMessagesPress}
          onManageAvailability={() => router.push('/(provider)/schedule/manage-availability' as any)}

          onOpenRequests={goRequests}
          onOpenUpcoming={goUpcoming}
          onOpenCompleted={goCompleted}
          onOpenNotifications={goNotifications}
          onOpenReviews={goReviews}
          onOpenEarnings={goEarnings}
          onQuickWithdraw={goWithdraw}
          animation={quickActionsAnim}
          isReducedMotionEnabled={isReducedMotionEnabled}
        />
        <Animated.View style={[
          styles.subsectionWrapper,
          { 
            opacity: newRequestsAnim, 
            transform: [{ translateY: newRequestsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] 
          }
        ]}>
          <View style={styles.subsectionHeader}>
            <Text style={styles.subsectionTitle}>
              <Ionicons name="hourglass-outline" size={20} color={WARNING_YELLOW} accessibilityHidden={true} />{' '}Novas SolicitaÃ§Ãµes
            </Text>
            {pendingRequests.length > 2 && (
              <TouchableOpacity 
                onPress={() => {
                  if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(provider)/schedule' as any);
                }} 
                accessibilityRole="button" 
                accessibilityLabel="Ver todas as solicitaÃ§Ãµes"
                accessibilityHint="Navegue para ver todas as novas solicitaÃ§Ãµes."
              >
                <Text style={styles.viewAllText}>Ver Todas</Text>
              </TouchableOpacity>
            )}
          </View>
          {pendingRequests.length > 0 ? (
            pendingRequests.slice(0, 2).map((item, index) => (
              <RequestItem
                key={item.id}
                item={item}
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
                onDetails={() => router.push(`/(provider)/bookings/${item.id}` as any)}
                onChat={handleChatWithClient}
                entryAnim={new Animated.Value(1)} // Each item gets its own animation value
                isReducedMotionEnabled={isReducedMotionEnabled}
              />
            ))
          ) : (
            renderEmptyState("Nenhuma nova solicitaÃ§Ã£o de agendamento.", "checkmark-done-circle-outline")
          )}
        </Animated.View>
        <Animated.View style={[
          styles.subsectionWrapper,
          { 
            opacity: upcomingServicesAnim, 
            transform: [{ translateY: upcomingServicesAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] 
          }
        ]}>
          <View style={styles.subsectionHeader}>
            <Text style={styles.subsectionTitle}>
              <Ionicons name="checkmark-done-circle-outline" size={20} color={ICON_PRIMARY} accessibilityHidden={true} />{' '}PrÃ³ximos ServiÃ§os
            </Text>
            {upcomingServices.length > 2 && (
              <TouchableOpacity 
                onPress={() => {
                  if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(provider)/schedule' as any);
                }} 
                accessibilityRole="button" 
                accessibilityLabel="Ver todos os prÃ³ximos serviÃ§os"
                accessibilityHint="Navegue para ver todos os serviÃ§os confirmados."
              >
                <Text style={styles.viewAllText}>Ver Todas</Text>
              </TouchableOpacity>
            )}
          </View>
          {upcomingServices.length > 0 ? (
            upcomingServices.slice(0, 2).map((item, index) => (
              <ConfirmedServiceItem
                key={item.id}
                item={item}
                onPress={() => router.push(`/(provider)/bookings/${item.id}` as any)}
                entryAnim={new Animated.Value(1)} // Each item gets its own animation value
                isReducedMotionEnabled={isReducedMotionEnabled}
              />
            ))
          ) : (
            renderEmptyState("Nenhum serviÃ§o confirmado agendado.", "calendar-clear-outline")
          )}
        </Animated.View>
        <Animated.View style={[
          { 
            opacity: reviewsSectionAnim, 
            transform: [{ translateY: reviewsSectionAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] 
          }
        ]}>
          <AdvancedReviewsSection
            reviews={dashboardData?.reviews}
            providerId={user?.id}
            onViewAllReviews={() => router.push('/(provider)/reviews' as any)}
          />
        </Animated.View>
        <Animated.View style={[
          { 
            opacity: logoutButtonAnim, 
            transform: [{ translateY: logoutButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] 
          }
        ]}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Sair da Conta"
            accessibilityHint="Toque para fazer logout da aplicaÃ§Ã£o."
          >
            <Ionicons name="log-out-outline" size={24} color={WHITE} accessibilityHidden={true} />
            <Text style={styles.logoutButtonText}>Sair da Conta</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      <ProviderNudgeContainer /> {/* Added ProviderNudgeContainer */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_ALT,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BACKGROUND_ALT,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: 16,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BACKGROUND_ALT,
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: DANGER_RED,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: ICON_PRIMARY,
    borderRadius: Radii.md, // CORREÃ‡ÃƒO: Usar Radii.md (agora definido)
    ...Platform.select({
      ios: { 
        shadowColor: SHADOW_COLOR_CARD, 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 4 
      },
      android: { elevation: 3 },
    }),
  },
  retryButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: Spacing.md,
    paddingTop: 0,
    paddingBottom: Spacing.xl,
  },
  subsectionWrapper: {
    marginBottom: Spacing.lg,
    backgroundColor: WHITE,
    borderRadius: Radii.md, // CORREÃ‡ÃƒO: Usar Radii.md (agora definido)
    padding: Spacing.md,
    ...Platform.select({
      ios: { 
        shadowColor: SHADOW_COLOR_CARD, 
        shadowOffset: { width: 0, height: 3 }, 
        shadowOpacity: 0.08, // Suavizado para iOS clean
        shadowRadius: 5 
      },
      android: { elevation: 4 },
    }),
  },
  subsectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
    paddingVertical: Spacing.lg,
    backgroundColor: BACKGROUND_ALT,
    borderRadius: Radii.md, // CORREÃ‡ÃƒO: Usar Radii.md (agora definido)
    marginTop: Spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: 15,
    marginTop: Spacing.sm,
  },
  requestItem: {
    backgroundColor: WHITE,
    borderRadius: Radii.md, // CORREÃ‡ÃƒO: Usar Radii.md (agora definido)
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: { 
        shadowColor: SHADOW_COLOR_CARD, 
        shadowOffset: { width: 0, height: 3 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 5 
      },
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
    borderTopLeftRadius: Radii.md, // CORREÃ‡ÃƒO: Usar Radii.md (agora definido)
    borderBottomLeftRadius: Radii.md, // CORREÃ‡ÃƒO: Usar Radii.md (agora definido)
  },
  requestItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  clientAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
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
    marginBottom: Spacing.xs,
  },
  requestPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: SUCCESS_GREEN,
    marginBottom: Spacing.xs,
  },
  requestInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  infoIcon: {
    marginRight: Spacing.xs,
  },
  requestInfoText: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginRight: Spacing.md,
  },
  requestActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  actionButtonBase: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.pill, // CORREÃ‡ÃƒO: Usar Radii.pill (jÃ¡ definido)
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
    paddingHorizontal: Spacing.sm,
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
    marginLeft: Spacing.xs,
  },
  actionButtonTextPrimary: {
    color: ICON_PRIMARY,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  acceptButtonCorner: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 1,
    padding: Spacing.xs,
  },
  serviceItem: {
    backgroundColor: WHITE,
    borderRadius: Radii.md, // CORREÃ‡ÃƒO: Usar Radii.md (agora definido)
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    ...Platform.select({
      ios: { 
        shadowColor: SHADOW_COLOR_CARD, 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.08, 
        shadowRadius: 4 
      },
      android: { elevation: 3 },
    }),
  },
  serviceItemContent: {
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
    marginRight: Spacing.sm,
  },
  serviceItemDetails: {
    flex: 1,
  },
  serviceItemText: {
    fontSize: 15,
    color: TEXT_DARK,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  serviceItemTime: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  messageLinkCard: {
    backgroundColor: WHITE,
    borderRadius: Radii.md, // CORREÃ‡ÃƒO: Usar Radii.md (agora definido)
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    ...Platform.select({
      ios: { 
        shadowColor: SHADOW_COLOR_CARD, 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.08, 
        shadowRadius: 4 
      },
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
    marginLeft: Spacing.sm,
  },
  unreadBadge: {
    backgroundColor: DANGER_RED,
    borderRadius: 10,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
    marginRight: Spacing.sm,
  },
  unreadBadgeText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: 'bold',
  },
  reviewItem: {
    backgroundColor: BACKGROUND_ALT,
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },
  reviewText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: TEXT_MEDIUM,
    marginBottom: Spacing.xs,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  reviewRatingStarsAndName: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  reviewStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewClientName: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  earningsLinkCard: {
      backgroundColor: WHITE,
      borderRadius: Radii.md, // CORREÃ‡ÃƒO: Usar Radii.md (agora definido)
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      marginTop: Spacing.lg,
      borderWidth: 1,
      borderColor: BORDER_SUBTLE,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...Platform.select({
        ios: { 
          shadowColor: SHADOW_COLOR_CARD, 
          shadowOffset: { width: 0, height: 2 }, 
          shadowOpacity: 0.08, 
          shadowRadius: 4 
        },
        android: { elevation: 3 },
      }),
  },
  earningsLinkText: {
      color: SUCCESS_GREEN,
      fontSize: 17,
      fontWeight: '600',
      flex: 1,
      marginLeft: Spacing.sm,
  },
  // CORREÃ‡ÃƒO: Adicionados os estilos para o botÃ£o de logout (refinado com haptic)
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DANGER_RED,
    borderRadius: Radii.pill, // CORREÃ‡ÃƒO: Usar Radii.pill (jÃ¡ definido)
    paddingVertical: Spacing.sm,
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.md,
    ...Platform.select({
      ios: { 
        shadowColor: SHADOW_COLOR_CARD, 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 4 
      },
      android: { elevation: 3 },
    }),
  },
  logoutButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
});
