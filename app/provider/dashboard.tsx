// LimpeJaApp/app/provider/dashboard.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics'; // CORREÇÃO: Import separado e correto para Haptics
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    AccessibilityInfo,
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    GestureResponderEvent,
    Image,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PROVIDER_ROUTES } from '../../constants/routes'; // Importar PROVIDER_ROUTES
import { useAuth } from '../../hooks/useAuth';
// Import NotificationUIService
import { toastUserError } from '../../_shared/errors/uiFeedback';
import ProviderNavBar from '../../components/provider/navigation/ProviderNavBar';
import { subscribeToProviderNotifications } from '../../services/notificationBus';
import NotificationUIService from '../../services/notificationUIService'; // Added
// Importações dos serviços
import { getBookingsForUser, updateBookingStatus } from '../../services/bookingService';
import { getMyProviderDashboard } from '../../services/dashboardService';
// Importações das tipagens centralizadas
import { BookingDetails, BookingStatus } from '../../types/backend/bookings';
// CORREÇÃO: Usar a interface ProviderDashboard do arquivo de provedores,
// que é mais completa e usada na lógica do componente.
// import { ProviderDashboard } from '../../types/backend/dashboard';
import ProviderNudgeContainer from '../../components/provider/ProviderNudgeContainer'; // Added
import { ProviderDashboard } from '../../types/backend/providers'; // Usar a interface correta
// CORREÇÃO: Adicionar import para SafeAreaInsets (para alinhamento do header no iOS)
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Hook para animação de toque (reutilizável, refinado com haptics)
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
const DANGER_RED = '#f1ebebff';
const WARNING_YELLOW = '#FFC107';
const BORDER_SUBTLE = 'rgba(0,0,0,0.08)';
const SHADOW_COLOR_CARD = 'rgba(0, 0, 0, 0.06)';
const SHADOW_COLOR_SECTION = 'rgba(0, 0, 0, 0.1)';
const PRIMARY_LIGHT = '#EBF5FF';

// Spacing e Radii tokens (consistentes e clean) - CORREÇÃO: Adicionado 'md' ao Radii
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
  md: 12, // CORREÇÃO: Adicionado 'md' para resolver TS2339 em borderRadius: Radii.md
  sm: 10,
};
const QA_PANEL_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_ENABLE_QA_PANEL === 'true';

// Easing suave para animações iOS
const easeOut = (value: any) => Easing.out(Easing.ease)(value);

// --- Componentes Reutilizáveis ---
// Componente: DashboardHeader (refinado com haptics e reduced motion) - CORREÇÃO: Adicionado useSafeAreaInsets para alinhamento iOS
const DashboardHeader: React.FC<{
  providerName: string | undefined;
  avatarUrl: string | undefined | null;
  onProfilePress: () => void;
  isReducedMotionEnabled: boolean; // Passado para animações
}> = ({ providerName, avatarUrl, onProfilePress, isReducedMotionEnabled }) => {
  const insets = useSafeAreaInsets(); // CORREÇÃO: Hook para calcular insets (top = status bar no iOS)
  const { scaleAnim, onPressIn, onPressOut } = useAnimatedTouch();
  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const duration = isReducedMotionEnabled ? 0 : 400;
    Animated.timing(headerAnim, { toValue: 1, duration, easing: easeOut, useNativeDriver: true }).start();
  }, [headerAnim, isReducedMotionEnabled]);
  // CORREÇÃO: Cálculo dinâmico do paddingTop: iOS usa insets.top + padding base (ex: 47px + 20px = 67px)
  // Android mantém padding fixo (20px, sem insets)
  const paddingTopValue = Platform.OS === 'ios'
    ? insets.top + 20 // insets.top cobre status bar/notch; 20px é padding base confortável
    : 20; // Padding fixo para Android (ajuste se quiser mais/menos)
  const androidPaddingTopValue = insets.top + 20;
  return (
    <Animated.View style={[
      headerStyles.headerContainer,
      {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        paddingTop: paddingTopValue // Aplicar o valor dinâmico aqui
      },
      Platform.OS === 'android' && { paddingTop: androidPaddingTopValue },
    ]}>
      <View style={headerStyles.greetingContainer}>
        <Text style={headerStyles.greetingText} testID="providerDashboardTitle">
          Olá, <Text style={headerStyles.providerNameText}>{providerName || 'Provedor'}</Text>!
        </Text>
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
    paddingVertical: Platform.OS === 'android' ? 8 : Spacing.lg,
    backgroundColor: WHITE,
    borderBottomLeftRadius: Radii.xl,
    bottom: Platform.OS === 'android' ? 15 : 0,
    borderBottomRightRadius: Radii.xl,
    ...Platform.select({
      ios: {
        shadowColor: SHADOW_COLOR_SECTION,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, // Suavizado para iOS clean
        shadowRadius: 6
      },
      android: { elevation: 0 },
    }),
    marginBottom: Platform.OS === 'android' ? 10 : Spacing.lg,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: Platform.OS === 'android' ? 17 : 18.8,
    fontWeight: 'bold',
    top: Platform.OS === 'android' ? 5 : 0,
    color: TEXT_DARK,
  },
  providerNameText: {
    color: TEXT_DARK,
  },
  currentDateText: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: Spacing.xs,
  },
  avatarButton: {
    width: 40.5,
    height: 40.5,
    borderRadius: 23.75,
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
    borderRadius: 23.75,
    backgroundColor: ICON_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Componente: FinancialSummaryCard (refinado com haptics e reduced motion)
// Componente: FinancialSummaryCard (compacto + expandível)
const FinancialSummaryCard: React.FC<{
  totalEarnings: number | undefined;
  pendingWithdrawals: number | undefined;
  onViewEarnings: () => void;
  animation: Animated.Value;
  isReducedMotionEnabled: boolean;
}> = ({ totalEarnings, pendingWithdrawals, onViewEarnings, animation, isReducedMotionEnabled }) => {
  const { scaleAnim, onPressIn, onPressOut } = useAnimatedTouch();

  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current; // 0 = fechado | 1 = aberto

  const formattedTotalEarnings = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEarnings || 0);
  const formattedPendingWithdrawals = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingWithdrawals || 0);

  const toggleExpand = () => {
    if (Platform.OS === 'ios') Haptics.selectionAsync();
    const next = !expanded;
    setExpanded(next);

    if (isReducedMotionEnabled) {
      expandAnim.setValue(next ? 1 : 0);
      return;
    }

    Animated.timing(expandAnim, {
      toValue: next ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // altura/opacidade
    }).start();
  };

  const detailsMaxHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120], // ajuste fino se quiser mais/menos
  });

  const detailsOpacity = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const chevronRotate = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View
      style={[
        summaryStyles.summaryCard,
        {
          opacity: animation,
          transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        },
      ]}
    >
      {/* Header clicável (compacto) */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={toggleExpand}
        accessibilityRole="button"
        accessibilityLabel="Seus ganhos"
        accessibilityHint={expanded ? 'Toque para recolher' : 'Toque para expandir'}
        accessibilityState={{ expanded }}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }} onTouchStart={onPressIn} onTouchEnd={onPressOut}>
          <View style={summaryStyles.headerRow}>
            <Text style={summaryStyles.cardTitle}>Seus Ganhos</Text>

            <View style={summaryStyles.chevronWrap}>
              <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                <Ionicons name="chevron-down" size={18} color={WHITE} />
              </Animated.View>
            </View>
          </View>

          {/* Métricas compactas (sempre visíveis) */}
          <View style={summaryStyles.metricsRowCompact}>
            <View style={summaryStyles.metricCompact}>
              <Text style={summaryStyles.metricLabel}>Ganhos Totais</Text>
              <Text style={summaryStyles.metricValuePrimary}>{formattedTotalEarnings}</Text>
            </View>

            <View style={summaryStyles.dividerV} />

            <View style={summaryStyles.metricCompact}>
              <Text style={summaryStyles.metricLabel}>Saques Pendentes</Text>
              <Text style={summaryStyles.metricValueWarning}>{formattedPendingWithdrawals}</Text>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Conteúdo expandido (CTA + extras) */}
      <Animated.View
        style={[
          summaryStyles.expandArea,
          {
            maxHeight: detailsMaxHeight,
            opacity: detailsOpacity,
          },
        ]}
      >
        <View style={summaryStyles.expandSpacer} />

        <TouchableOpacity
          style={summaryStyles.viewEarningsButton}
          onPress={() => {
            onViewEarnings();
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          accessibilityRole="button"
          accessibilityLabel="Gerenciar ganhos"
          accessibilityHint="Abrir detalhes de ganhos e saques"
        >
          <Ionicons name="wallet-outline" size={18} color={WHITE} style={summaryStyles.buttonIcon} />
          <Text style={summaryStyles.viewEarningsButtonText}>Gerenciar Ganhos</Text>
          <Ionicons name="chevron-forward-outline" size={18} color={WHITE} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const summaryStyles = StyleSheet.create({
  summaryCard: {
    backgroundColor: ICON_PRIMARY,
    borderRadius: Radii.xl,
    padding: 16,            // menor
    marginBottom: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: SHADOW_COLOR_SECTION,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: { elevation: 0 },
    }),
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: WHITE,
  },

  chevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  metricsRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  metricCompact: {
    flex: 1,
    alignItems: 'center',
  },

  dividerV: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 10,
  },

  metricLabel: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
    textAlign: 'center',
  },

  metricValuePrimary: {
    fontSize: 16.5,
    fontWeight: '800',
    color: WHITE,
    textAlign: 'center',
  },

  metricValueWarning: {
    fontSize: 16.5,
    fontWeight: '800',
    color: WARNING_YELLOW,
    textAlign: 'center',
  },

  expandArea: {
    overflow: 'hidden',
  },

  expandSpacer: {
    height: 12,
  },

  viewEarningsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: Radii.pill,
    paddingVertical: 10,
  },

  viewEarningsButtonText: {
    color: WHITE,
    fontSize: 15.5,
    fontWeight: '700',
    marginHorizontal: 8,
  },

  buttonIcon: {
    marginRight: Spacing.xs,
  },
});


// Seção isolada: apenas "Atalhos do Dia"
const ShortcutsGrid: React.FC<{
  onViewAllServicesPress: () => void;
  onViewAllMessagesPress: () => void;
  onManageAvailability: () => void;
  onOpenRequests: () => void;
  onOpenUpcoming: () => void;
  onOpenCompleted: () => void;
  onOpenNotifications: () => void;
  onOpenReviews: () => void;
  onOpenEarnings: () => void;
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
  animation,
}) => {
  const a1 = useAnimatedTouch();
  const a2 = useAnimatedTouch();
  const a3 = useAnimatedTouch();
  const a4 = useAnimatedTouch();
  const a5 = useAnimatedTouch();
  const a6 = useAnimatedTouch();
  const a7 = useAnimatedTouch();
  const a8 = useAnimatedTouch();
  const a9 = useAnimatedTouch();
  const Item = ({ icon, label, anim, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; anim: ReturnType<typeof useAnimatedTouch>; onPress: () => void }) => (
    <TouchableOpacity
      style={[quickActionStyles.gridItem, { transform: [{ scale: anim.scaleAnim }] }]}
      onPress={onPress}
      onPressIn={anim.onPressIn}
      onPressOut={anim.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Toque para abrir.`}
      accessibilityHint={`Navegue para a seção de ${label.toLowerCase()}.`}
    >
      <Ionicons name={icon} size={27} color={ICON_PRIMARY} accessibilityHidden={true} />
      <Text style={[quickActionStyles.gridItemText, { display: 'flex' }]} numberOfLines={1}>{label}</Text>
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
      <Text style={[quickActionStyles.sectionTitle, { display: 'flex' }]}>Atalhos do Dia</Text>
      <View style={[quickActionStyles.grid, { display: 'flex' }]}>
        <Item icon="calendar-outline" label="Minha Agenda" anim={a1} onPress={onManageAvailability} />
        <Item icon="file-tray-outline" label="Solicitações" anim={a2} onPress={onOpenRequests} />
        <Item icon="calendar-outline" label="Próximos" anim={a3} onPress={onOpenUpcoming} />
        <Item icon="checkmark-done-outline" label="Concluídos" anim={a4} onPress={onOpenCompleted} />
        <Item icon="briefcase-outline" label="Meus Serviços" anim={a5} onPress={onViewAllServicesPress} />
        <Item icon="chatbubbles-outline" label="Mensagens" anim={a6} onPress={onViewAllMessagesPress} />
        <Item icon="notifications-outline" label="Notificações" anim={a7} onPress={onOpenNotifications} />
        <Item icon="analytics-outline" label="Avaliações" anim={a8} onPress={onOpenReviews} />
        <Item icon="wallet-outline" label="Ganhos" anim={a9} onPress={onOpenEarnings} />
      </View>
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
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 0 },
    }),
  },
  sectionTitle: {
    fontSize: Platform.OS === 'android' ? 15 : 20,
    fontWeight: 'bold',
    color: TEXT_DARK,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
  },
  quickChipsRow: {
    flexDirection: 'column',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  quickChipBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    paddingRight: Spacing.lg, // espaço para o botão +
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    ...Platform.select({
      ios: {
        shadowColor: SHADOW_COLOR_CARD,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: { elevation: 0 },
    }),
  },
  quickChipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
    marginLeft: Spacing.sm,
  },
  quickChipSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginLeft: Spacing.sm,
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
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: { elevation: 0 },
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
    marginTop: 20,
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
  plusButton: {
    marginLeft: 'auto',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: ICON_PRIMARY,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Componente de Item de Solicitação (RequestItem - refinado com haptics e clean spacing)
const RequestItem: React.FC<{
  item: BookingDetails;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onDetails: (id: string) => void;
  onChat?: (clientId: string, clientName: string) => void;
  entryAnim: Animated.Value;
  isReducedMotionEnabled: boolean;
  isUpdating?: boolean;
}> = ({ item, onAccept, onReject, onDetails, onChat, entryAnim, isReducedMotionEnabled, isUpdating }) => {
  const acceptTouchAnimation = useAnimatedTouch();
  const rejectTouchAnimation = useAnimatedTouch();
  const detailsTouchAnimation = useAnimatedTouch();
  const chatTouchAnimation = useAnimatedTouch();
  const clientId: string | undefined = item.clientId;
  const clientName: string = item.clientFullName || 'Cliente';
  // CORREÇÃO: Usar item.scheduledDate e item.scheduledTime
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
        <Text style={styles.requestServiceName} numberOfLines={1}>{item.serviceName}</Text>
        <Image
          source={require('../../assets/images/icon.png')}
          style={[styles.serviceLogo, { display: 'none' }]}
          resizeMode="contain"
        />
        {item.totalPrice != null && !isNaN(Number(item.totalPrice)) && (
          <Text style={styles.priceCornerText}>+ R$ {Number(item.totalPrice).toFixed(2).replace('.', ',')}</Text>
        )}
        {/* Aceitar removido do canto; passa a ser botão na barra inferior */}
      </View>
      <Text style={styles.requestClientName}>Cliente: {clientName}</Text>
      {false && item.totalPrice != null && !isNaN(Number(item.totalPrice)) && (
        <View style={styles.priceCornerRow}>
          <Text style={[styles.requestPrice, styles.priceHighlight, { color: ICON_PRIMARY }]}>+ R$ {Number(item.totalPrice).toFixed(2).replace('.', ',')}</Text>
        </View>
      )}
      <View style={styles.requestInfoRow}>
        <Ionicons name="calendar-outline" size={15} color={TEXT_MUTED} style={styles.infoIcon} accessibilityHidden={true} />
        <Text style={styles.requestInfoText}>
          {scheduledDate}, {scheduledTime}
        </Text>
      </View>
      <View style={styles.secondaryActionsRow}>
        <TouchableOpacity
          style={[
            styles.secondaryActionButton,
            clientId && onChat ? { marginRight: Spacing.sm } : null,
          ]}
          onPress={() => {
            if (!isReducedMotionEnabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onDetails(item.id);
          }}
          onPressIn={detailsTouchAnimation.onPressIn}
          onPressOut={detailsTouchAnimation.onPressOut}
          accessibilityRole="button"
          accessibilityLabel={`Ver detalhes do serviço ${item.serviceName}`}
        accessibilityHint="Abre a tela com todas as informações do agendamento."
        testID={`pendingRequest-${item.id}`}
        >
          <Animated.View style={[styles.secondaryActionContent, { transform: [{ scale: detailsTouchAnimation.scaleAnim }] }]}>
            <Ionicons name="eye-outline" size={18} color={ICON_PRIMARY} accessibilityHidden={true} />
            <Text style={styles.secondaryActionText}>Detalhes</Text>
          </Animated.View>
        </TouchableOpacity>
        {clientId && onChat && (
          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => {
              if (!isReducedMotionEnabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onChat(clientId, clientName);
            }}
            onPressIn={chatTouchAnimation.onPressIn}
            onPressOut={chatTouchAnimation.onPressOut}
            accessibilityRole="button"
            accessibilityLabel={`Conversar com ${clientName}`}
            accessibilityHint="Inicia o chat com o cliente."
          >
            <Animated.View style={[styles.secondaryActionContent, { transform: [{ scale: chatTouchAnimation.scaleAnim }] }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={ICON_PRIMARY} accessibilityHidden={true} />
              <Text style={styles.secondaryActionText}>Chat</Text>
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>
      {false && (<View style={styles.requestInfoRow}>
        <Text style={[styles.requestInfoText, { marginRight: Spacing.xs }]}>Endereço de Serviço:</Text>
        <Text style={styles.requestInfoText} numberOfLines={1}>{item.address?.street}, {item.address?.number}</Text>
      </View>)}
      <View style={styles.requestActionsRow}>
        <TouchableOpacity
          style={[styles.actionButtonBase, styles.rejectButton, isUpdating && { opacity: 0.6 }]}
          disabled={!!isUpdating}
          onPress={() => {
            if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onReject && onReject(item.id);
          }}
          onPressIn={rejectTouchAnimation.onPressIn}
          onPressOut={rejectTouchAnimation.onPressOut}
          accessibilityRole="button"
          accessibilityLabel={`Recusar solicitação de ${item.serviceName}`}
          accessibilityHint="Rejeite o agendamento."
        >
          <Animated.View style={[styles.actionButtonContent, { transform: [{ scale: rejectTouchAnimation.scaleAnim }] }]}>
            {isUpdating ? (
              <ActivityIndicator size={14} color={ICON_PRIMARY} />
            ) : (
              <>
                <Ionicons name="close" size={16} color={ICON_PRIMARY} accessibilityHidden={true} />
                <Text style={styles.actionButtonTextPrimary}>Rejeitar</Text>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButtonBase, styles.acceptButton, isUpdating && { opacity: 0.6 }]}
          disabled={!!isUpdating}
          onPress={() => {
            if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAccept && onAccept(item.id);
          }}
          onPressIn={acceptTouchAnimation.onPressIn}
          onPressOut={acceptTouchAnimation.onPressOut}
          accessibilityRole="button"
          accessibilityLabel={`Aceitar solicitação de ${item.serviceName}`}
          accessibilityHint="Confirme para aceitar o agendamento."
        >
          <Animated.View style={[styles.actionButtonContent, { transform: [{ scale: acceptTouchAnimation.scaleAnim }] }]}>
            {isUpdating ? (
              <ActivityIndicator size={14} color={WHITE} />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color={WHITE} accessibilityHidden={true} />
                <Text style={styles.actionButtonTextWhite}>Aceitar</Text>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Componente de Item de Serviço Confirmado (refinado com haptics)
const ConfirmedServiceItem: React.FC<{
  item: BookingDetails;
  onPress: (id: string) => void;
  entryAnim: Animated.Value;
  isReducedMotionEnabled: boolean;
}> = ({ item, onPress, entryAnim, isReducedMotionEnabled }) => {
  const touchAnimation = useAnimatedTouch();
  // CORREÇÃO: Usar item.scheduledDate e item.scheduledTime
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
        accessibilityLabel={`Ver detalhes do serviço ${item.serviceName} com ${item.clientFullName}`}
        accessibilityHint="Toque para ver detalhes do serviço confirmado."
        testID={`upcomingService-${item.id}`}
      >
        <Animated.View style={[styles.serviceItemContent, { transform: [{ scale: touchAnimation.scaleAnim }] }]}>
          <View style={styles.serviceItemIconWrapper}>
            <MaterialCommunityIcons name="calendar-check-outline" size={28} color={ICON_PRIMARY} accessibilityHidden={true} />
          </View>
          <View style={styles.serviceItemDetails}>
            <Text style={styles.serviceItemText} numberOfLines={1}>
              <Text style={{ fontWeight: 'bold' }}>{item.serviceName || 'Serviço Desconhecido'}</Text>
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
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  // Animated Values (otimizados para reduced motion)
  const financialSummaryAnim = useRef(new Animated.Value(0)).current;
  const quickActionsAnim = useRef(new Animated.Value(0)).current;
  const newRequestsAnim = useRef(new Animated.Value(0)).current;
  const upcomingServicesAnim = useRef(new Animated.Value(0)).current;
  const reviewsSectionAnim = useRef(new Animated.Value(0)).current;
  const logoutButtonAnim = useRef(new Animated.Value(0)).current;
  // Adicionado ref para verificar se o componente está montado
  const isMounted = useRef(true);
  // Ref para armazenar a animação composta do stagger
  const staggerAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isReducedMotionEnabled = useReducedMotion(); // Global reduced motion
  const newUpdatesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastServiceToastRef = useRef<number>(0);
  const NEW_UPDATE_DURATION_MS = 10 * 60 * 1000;
  const TOAST_DEBOUNCE_MS = 30 * 1000;
  const markNewUpdates = useCallback(() => {
    setHasNewUpdates(true);
    if (newUpdatesTimerRef.current) {
      clearTimeout(newUpdatesTimerRef.current);
    }
    newUpdatesTimerRef.current = setTimeout(() => {
      setHasNewUpdates(false);
      newUpdatesTimerRef.current = null;
    }, NEW_UPDATE_DURATION_MS);
  }, []);
  const clearNewUpdates = useCallback(() => {
    if (newUpdatesTimerRef.current) {
      clearTimeout(newUpdatesTimerRef.current);
      newUpdatesTimerRef.current = null;
    }
    setHasNewUpdates(false);
  }, []);
  const showNewServiceToast = useCallback(() => {
    const now = Date.now();
    if (now - lastServiceToastRef.current >= TOAST_DEBOUNCE_MS) {
      NotificationUIService.showInfo('Novo serviço confirmado', 'Atualização');
      lastServiceToastRef.current = now;
    }
  }, []);
  const fetchData = useCallback(async () => {
      if (__DEV__) {
        console.log("[DashboardScreen] fetchData: Iniciando busca de dados.");
      }
    if (isMounted.current) {
      setIsLoading(true);
      setError(null);
    }
    if (!user?.id) {
      console.warn("[DashboardScreen] fetchData: user.id não disponível. Abortando busca.");
      if (isMounted.current) {
        setError("ID do provedor não disponível para buscar dados.");
        setIsLoading(false);
        setIsRefreshing(false);
      }
      return;
    }
    if (__DEV__) {
      console.log(`[DashboardScreen] fetchData: Buscando dashboard para userId: ${user.id}`);
    }
    try {
      // CORRIGIDO: Chamar a função correta do serviço de dashboard
      const dashboard = await getMyProviderDashboard();
      if (!isMounted.current) return; // Verificar se o componente ainda está montado
      if (__DEV__) {
        console.log("[DashboardScreen] fetchData: Dados do dashboard recebidos.", dashboard);
        console.log("[DashboardScreen] REVIEWS NA DASHBOARD (AGORA COM 'reviews'):", dashboard.reviews);
      }
      setDashboardData(dashboard);
      // Buscar listas reais como no provider/index.tsx
      const pendingBookings = await getBookingsForUser(BookingStatus.PENDING);
      const confirmedBookings = await getBookingsForUser(BookingStatus.CONFIRMED);
      const toTs = (b: BookingDetails) => new Date(`${b.scheduledDate}T${b.scheduledTime}:00`).getTime();
      setPendingRequests([...pendingBookings].sort((a, b) => toTs(a) - toTs(b)));
      setUpcomingServices([...confirmedBookings].sort((a, b) => toTs(a) - toTs(b)));
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
        toastUserError(err, 'Erro ao carregar os dados do dashboard');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
      if (__DEV__) {
        console.log("[DashboardScreen] fetchData: Finalizado. isLoading:", false, "isRefreshing:", false);
      }
    }
  }, [user, financialSummaryAnim, quickActionsAnim, newRequestsAnim, upcomingServicesAnim, reviewsSectionAnim, logoutButtonAnim, isReducedMotionEnabled]);
  useEffect(() => {
    isMounted.current = true; // Componente montado
    if (__DEV__) {
      console.log("[DashboardScreen] useEffect: authLoading:", authLoading, "user.id:", user?.id);
    }
    if (!authLoading && user?.id) {
      fetchData();
    } else if (!authLoading && !user?.id) {
      if (isMounted.current) {
        setIsLoading(false);
        setError("Provedor não autenticado ou perfil não encontrado.");
      }
      console.warn("[DashboardScreen] useEffect: Usuário não autenticado ou ID não encontrado após authLoading.");
    }
    return () => {
      isMounted.current = false; // Componente desmontado
      // Parar a animação composta do stagger se ela estiver em andamento
      if (staggerAnimationRef.current) {
        staggerAnimationRef.current.stop();
      }
    };
  }, [authLoading, user, fetchData]);

  useEffect(() => {
    const unsubscribe = subscribeToProviderNotifications((kind) => {
      if (kind === 'bookingConfirmed' || kind === 'paymentConfirmed') {
        fetchData();
        markNewUpdates();
        showNewServiceToast();
      }
    });
    return unsubscribe;
  }, [fetchData, markNewUpdates, showNewServiceToast]);

  useEffect(() => {
    return () => {
      if (newUpdatesTimerRef.current) {
        clearTimeout(newUpdatesTimerRef.current);
      }
    };
  }, []);
  // ===== Header data normalization (avatar + name) injected from provider/index.tsx logic =====
  const sanitizeUrl = (v: any) => (typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined);
  const headerAvatarUrl =
    sanitizeUrl((dashboardData as any)?.avatarUrl) ||
    sanitizeUrl((dashboardData as any)?.profileImageUrl) ||
    sanitizeUrl((dashboardData as any)?.profilePhotoUrl) ||
    sanitizeUrl((dashboardData as any)?.user?.avatarUrl) ||
    sanitizeUrl((dashboardData as any)?.user?.profile?.avatarUrl) ||
    sanitizeUrl((dashboardData as any)?.provider?.avatarUrl) ||
    sanitizeUrl((dashboardData as any)?.userProfile?.avatarUrl) ||
    sanitizeUrl((dashboardData as any)?.userProfile?.providerDetails?.avatarUrl) ||
    sanitizeUrl(user?.avatarUrl) ||
    sanitizeUrl((user as any)?.userProfile?.avatarUrl) ||
    sanitizeUrl((user as any)?.providerDetails?.avatarUrl) ||
    sanitizeUrl((user as any)?.profileImageUrl) ||
    sanitizeUrl((user as any)?.profilePhotoUrl) ||
    sanitizeUrl((user as any)?.avatar) ||
    undefined;
  const headerProviderName = (dashboardData as any)?.fullName
    || (dashboardData as any)?.userProfile?.fullName
    || user?.fullName
    || undefined; // Removidas as dependências individuais das Animated.Value, pois a animação composta é controlada por staggerAnimationRef
  const onRefresh = useCallback(() => {
    if (__DEV__) {
      console.log("[DashboardScreen] onRefresh: Iniciando refresh.");
    }
    if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRefreshing(true);
    fetchData();
  }, [fetchData, isReducedMotionEnabled]);
  const handleViewAllServicesPress = () => {
    if (__DEV__) {
      console.log("[DashboardScreen] handleViewAllServicesPress: Navegando para todos os serviços.");
    }
    router.push(PROVIDER_ROUTES.SERVICES_LIST as any);
  };
  const handleViewAllMessagesPress = () => {
    if (__DEV__) {
      console.log("[DashboardScreen] handleViewAllMessagesPress: Navegando para a lista de mensagens.");
    }
    router.push(PROVIDER_ROUTES.MESSAGES_LIST as any);
  };
  // Handlers de navegação para Ações Rápidas novas
  const goRequests = () => {
    clearNewUpdates();
    router.push((PROVIDER_ROUTES.SERVICES_LIST + '?filter=requests') as any);
  };
  const goUpcoming = () => {
    clearNewUpdates();
    router.push((PROVIDER_ROUTES.SERVICES_LIST + '?filter=upcoming') as any);
  };
  const goCompleted = () => router.push((PROVIDER_ROUTES.SERVICES_LIST + '?filter=completed') as any);
  const goNotifications = () => router.push('/provider/notifications' as any);
  const goReviews = () => router.push(PROVIDER_ROUTES.REVIEWS as any); // CORRIGIDO: Usar a constante da rota
  const goEarnings = () => router.push(PROVIDER_ROUTES.EARNINGS as any);
  const goWithdraw = () => router.push(PROVIDER_ROUTES.WITHDRAW as any); // CORREÇÃO: Usar a constante da rota
  const handleAcceptRequest = async (bookingId: string) => {
    if (__DEV__) {
      console.log(`[DashboardScreen] handleAcceptRequest: Tentando aceitar agendamento ${bookingId}.`);
    }
    Alert.alert(
      'Aceitar Solicitação',
      `Tem certeza que deseja aceitar o agendamento ${bookingId}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => {
            if (__DEV__) {
              console.log('[DashboardScreen] Aceitar cancelado.');
            }
          },
        },
        {
          text: 'Aceitar',
          onPress: async () => {
            if (isMounted.current) {
              setUpdatingIds(prev => ({ ...prev, [bookingId]: true }));
            }
            try {
              await updateBookingStatus(bookingId, { status: BookingStatus.CONFIRMED });
              if (isMounted.current) {
                NotificationUIService.showSuccess('Agendamento aceito com sucesso!', 'Sucesso');
                if (__DEV__) {
                  console.log(`[DashboardScreen] Agendamento ${bookingId} aceito com sucesso.`);
                }
                fetchData();
              }
              } catch (error: any) {
                console.error('[DashboardScreen] Erro ao aceitar agendamento:', error.response?.data || error.message, error);
                if (isMounted.current) {
                  toastUserError(error, 'Erro ao aceitar o agendamento');
                }
              } finally {
              if (isMounted.current) {
                setUpdatingIds(prev => { const clone = { ...prev }; delete clone[bookingId]; return clone; });
              }
            }
          },
        },
      ]
    );
  };
  const handleRejectRequest = async (bookingId: string) => {
    if (__DEV__) {
      console.log(`[DashboardScreen] handleRejectRequest: Tentando rejeitar agendamento ${bookingId}.`);
    }
    Alert.alert(
      'Rejeitar Solicitação',
      `Tem certeza que deseja rejeitar o agendamento ${bookingId}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => {
            if (__DEV__) {
              console.log('[DashboardScreen] Rejeitar cancelado.');
            }
          },
        },
        {
          text: 'Rejeitar',
          onPress: async () => {
            if (isMounted.current) {
              setUpdatingIds(prev => ({ ...prev, [bookingId]: true }));
            }
            try {
              await updateBookingStatus(bookingId, { status: BookingStatus.REJECTED });
              if (isMounted.current) {
                NotificationUIService.showSuccess('Agendamento rejeitado com sucesso!', 'Sucesso');
                if (__DEV__) {
                  console.log(`[DashboardScreen] Agendamento ${bookingId} rejeitado com sucesso.`);
                }
                fetchData();
              }
              } catch (error: any) {
                console.error('[DashboardScreen] Erro ao rejeitar agendamento:', error.response?.data || error.message, error);
                if (isMounted.current) {
                  toastUserError(error, 'Erro ao rejeitar o agendamento');
                }
              } finally {
              if (isMounted.current) {
                setUpdatingIds(prev => { const clone = { ...prev }; delete clone[bookingId]; return clone; });
              }
            }
          },
        },
      ]
    );
  };
  const handleChatWithClient = (clientId: string, clientName: string) => {
    if (__DEV__) {
      console.log(`[DashboardScreen] handleChatWithClient: Iniciando chat com cliente ${clientName} (${clientId}).`);
    }
    router.push({ pathname: `/provider/messages/${clientId}`, params: { recipientName: clientName } } as any);
  };
  const handleLogout = async () => {
    if (__DEV__) {
      console.log("[Dashboard] Botão de Logout clicado: Iniciando logout direto.");
    }
    if (!isReducedMotionEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // CORREÇÃO: Usar notificationAsync e NotificationFeedbackType.Warning
    try {
      await logout();
      if (__DEV__) {
        console.log("[Dashboard] logout() concluído. O _layout.tsx deve redirecionar.");
      }
      AccessibilityInfo.announceForAccessibility('Logout realizado com sucesso. Redirecionando para tela inicial.');
    } catch (error) {
      console.error("[Dashboard] Erro ao fazer logout:", error);
      NotificationUIService.showError("Não foi possível sair da conta. Tente novamente ou verifique sua conexão.", "Erro ao Sair");
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
        <Stack.Screen options={{ title: "Carregando", headerTransparent: true, headerTintColor: '#333' }} />
        <ActivityIndicator size="large" color={ICON_PRIMARY} accessibilityLabel="Carregando dashboard" />
        <Text style={styles.loadingText}>Carregando dashboard…</Text>
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
          providerName={headerProviderName || dashboardData?.fullName}
          avatarUrl={headerAvatarUrl}
          onProfilePress={() => router.push('/provider/profile' as any)}
          isReducedMotionEnabled={isReducedMotionEnabled}
        />
        {/*QA_PANEL_ENABLED && (
          <TouchableOpacity
            style={styles.qaPanelButton}
            onPress={() => router.push('/dev-panel')}
            accessibilityRole="button"
            accessibilityLabel="Abrir painel QA"
          >
            <Text style={styles.qaPanelButtonText}>Painel QA</Text>
          </TouchableOpacity>
        )}*/}
        <FinancialSummaryCard
          totalEarnings={dashboardData?.totalEarnings}
          pendingWithdrawals={dashboardData?.pendingWithdrawals}
          onViewEarnings={() => router.push(PROVIDER_ROUTES.EARNINGS as any)}
          animation={financialSummaryAnim}
          isReducedMotionEnabled={isReducedMotionEnabled}
        />
        {/* Atalhos do Dia (grid) */}
        <ShortcutsGrid
          onViewAllServicesPress={handleViewAllServicesPress}
          onViewAllMessagesPress={handleViewAllMessagesPress}
          onManageAvailability={() => router.push('/provider/schedule/manage-availability' as any)}
          onOpenRequests={goRequests}
          onOpenUpcoming={goUpcoming}
          onOpenCompleted={goCompleted}
          onOpenNotifications={goNotifications}
          onOpenReviews={goReviews}
          onOpenEarnings={goEarnings}
          animation={quickActionsAnim}
          isReducedMotionEnabled={isReducedMotionEnabled}
        />
        {/** QuickActionsSection movido para abaixo das seções de solicitações */}
        <Animated.View style={[
          styles.subsectionWrapper,
          {
            opacity: newRequestsAnim,
            transform: [{ translateY: newRequestsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
          }
        ]}>
          <View style={styles.subsectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.subsectionTitle}>
                <Ionicons name="hourglass-outline" size={20} color={ICON_PRIMARY} accessibilityHidden={true} />{' '}Novas Solicitações
              </Text>
              {hasNewUpdates && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>Novo</Text>
                </View>
              )}
            </View>
            {pendingRequests.length > 2 && (
              <TouchableOpacity
                onPress={() => {
                  if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  clearNewUpdates();
                  router.push('/provider/schedule' as any);
                }}
                accessibilityRole="button"
                accessibilityLabel="Ver todas as solicitações"
                accessibilityHint="Navegue para ver todas as novas solicitações."
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
                onDetails={() => router.push(`/provider/active-booking/${item.id}` as any)}
                onChat={handleChatWithClient}
                entryAnim={new Animated.Value(1)} // Each item gets its own animation value
                isReducedMotionEnabled={isReducedMotionEnabled}
                isUpdating={!!updatingIds[item.id]}
              />
            ))
          ) : (
            renderEmptyState("Nenhuma nova solicitação de agendamento.", "checkmark-done-circle-outline")
          )}
        </Animated.View>
        <EditHoursSection animation={quickActionsAnim} onQuickWithdraw={goWithdraw} isReducedMotionEnabled={isReducedMotionEnabled} />
        <Animated.View style={[
          styles.subsectionWrapper,
          {
            opacity: upcomingServicesAnim,
            transform: [{ translateY: upcomingServicesAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
          }
        ]}>
          <View style={styles.subsectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.subsectionTitle}>
                <Ionicons name="checkmark-done-circle-outline" size={20} color={ICON_PRIMARY} accessibilityHidden={true} />{' '}Próximos Serviços
              </Text>
              {hasNewUpdates && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>Novo</Text>
                </View>
              )}
            </View>
            {upcomingServices.length > 2 && (
              <TouchableOpacity
                onPress={() => {
                  if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  clearNewUpdates();
                  router.push('/provider/schedule' as any);
                }}
                accessibilityRole="button"
                accessibilityLabel="Ver todos os próximos serviços"
                accessibilityHint="Navegue para ver todos os serviços confirmados."
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
                onPress={() => router.push(`/provider/active-booking/${item.id}` as any)}
                entryAnim={new Animated.Value(1)} // Each item gets its own animation value
                isReducedMotionEnabled={isReducedMotionEnabled}
              />
            ))
          ) : (
            renderEmptyState("Nenhum serviço confirmado agendado.", "calendar-clear-outline")
          )}
        </Animated.View>
        <Animated.View style={[
          {
            opacity: reviewsSectionAnim,
            transform: [{ translateY: reviewsSectionAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
          }
        ]}>
          <View style={{ backgroundColor: WHITE, borderRadius: Radii.md, padding: Spacing.md, ...Platform.select({ ios: { shadowColor: SHADOW_COLOR_CARD, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 5 }, android: { elevation: 0 } }) }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_DARK, marginBottom: Spacing.md }}>Meus Serviços</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => router.push('/provider/profile/edit-services' as any)}
                onPressIn={() => !isReducedMotionEnabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={{ flex: 1, marginRight: Spacing.sm, backgroundColor: PRIMARY_LIGHT, borderRadius: Radii.pill, paddingVertical: Spacing.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ICON_PRIMARY }}
                accessibilityRole="button"
                accessibilityLabel="Criar Serviço"
                accessibilityHint="Toque para cadastrar um novo serviço"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="add-circle-outline" size={20} color={ICON_PRIMARY} />
                  <Text style={{ color: ICON_PRIMARY, fontWeight: '700', marginLeft: 8 }}>Criar Serviço</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/provider/profile/edit-services' as any)}
                onPressIn={() => !isReducedMotionEnabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={{ flex: 1, marginLeft: Spacing.sm, backgroundColor: WHITE, borderRadius: Radii.pill, paddingVertical: Spacing.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER_SUBTLE }}
                accessibilityRole="button"
                accessibilityLabel="Editar Serviços"
                accessibilityHint="Toque para editar seus serviços"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="options-outline" size={20} color={TEXT_DARK} />
                  <Text style={{ color: TEXT_DARK, fontWeight: '700', marginLeft: 8 }}>Editar Serviços</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
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
            accessibilityHint="Toque para fazer logout da aplicação."
          >
            <Ionicons name="log-out-outline" size={24} color={WHITE} accessibilityHidden={true} />
            <Text style={styles.logoutButtonText}>Sair da Conta</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      <ProviderNavBar />
      
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
    borderRadius: Radii.md, // CORREÇÃO: Usar Radii.md (agora definido)
    ...Platform.select({
      ios: {
        shadowColor: SHADOW_COLOR_CARD,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
      },
      android: { elevation: 0 },
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
  qaPanelButton: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: ICON_PRIMARY,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: WHITE,
    marginBottom: Spacing.sm,
  },
  qaPanelButtonText: {
    color: ICON_PRIMARY,
    fontWeight: '600',
    fontSize: 13,
  },
  subsectionWrapper: {
    marginBottom: Spacing.lg,
    backgroundColor: WHITE,
    borderRadius: Radii.md, // CORREÇÃO: Usar Radii.md (agora definido)
    padding: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: SHADOW_COLOR_CARD,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08, // Suavizado para iOS clean
        shadowRadius: 5
      },
      android: { elevation: 0 },
    }),
  },
  subsectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'android' ? 0 : 0,
    gap: 6,
  },
  subsectionTitle: {
    fontSize: Platform.OS === 'android' ? 17 : 18,
    paddingHorizontal: Platform.OS === 'android' ? 0 : 0,
    fontWeight: Platform.OS === 'android' ? '700' : '600',
    color: TEXT_DARK,
    flexDirection: 'row',
    alignItems: 'center',
  },
  newBadge: {
    backgroundColor: '#ff5a5f',
    borderRadius: Radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  newBadgeText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: '700',
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
    borderRadius: Radii.md, // CORREÇÃO: Usar Radii.md (agora definido)
    marginTop: Spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: 15,
    paddingHorizontal: Platform.OS === 'android' ?  15 : 0,
    marginTop: Spacing.sm,
  },
  requestItem: {
    backgroundColor: WHITE,
    borderRadius: Radii.md, // CORREÇÃO: Usar Radii.md (agora definido)
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
      android: { elevation: 0 },
    }),
  },
  requestItemPendingIndicator: {
    // removido o risco lateral
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 0,
    backgroundColor: 'transparent',
    borderTopLeftRadius: Radii.md,
    borderBottomLeftRadius: Radii.md,
    display: 'none',
  },
  requestItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  clientAvatarPlaceholder: {
    width: 20, // ~10% menor
    height: 20, // ~10% menor
    borderRadius: 16,
    backgroundColor: `${ICON_PRIMARY}1A`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },
  requestServiceName: {
    fontSize: 15, // ~10% menor
    fontWeight: '700',
    color: TEXT_DARK,
    flex: 1,
    paddingRight: 23 + Spacing.sm, // reserva espaço para logo absoluta
  },
  serviceLogo: {
    width: 53,
    height: 53,
    position: 'absolute',
    right: Spacing.sm,
    top: 56,
    zIndex: 1,
    pointerEvents: 'none',
  },
  requestClientName: {
    fontSize: 13,
    color: TEXT_MEDIUM,
    marginBottom: Spacing.xs,
  },
  requestPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  priceCornerText: {
    position: 'absolute',
    right: Spacing.sm,
    top: 6,
    color: ICON_PRIMARY,
    fontWeight: '700',
    fontSize: 15.4, // +10%
  },
  // Preço destacado no canto (Novas Solicitações)
  priceCornerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  priceHighlight: {
    fontSize: 15.4, // +10% sobre 14
  },
  requestInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  secondaryActionButton: {
    flex: 1,
  },
  secondaryActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    paddingVertical: Spacing.xs,
    backgroundColor: BACKGROUND_ALT,
  },
  secondaryActionText: {
    marginLeft: Spacing.xs,
    color: ICON_PRIMARY,
    fontWeight: '600',
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
    justifyContent: 'flex-end', // Recusar ao lado do Aceitar, alinhados à direita
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  actionButtonBase: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.pill, // CORREÇÃO: Usar Radii.pill (já definido)
    minWidth: 90,
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
    // ~5% menor que o padrão
    minWidth: 85,
    paddingHorizontal: 9,
    paddingVertical: Spacing.xs,
  },
  detailsButton: {
    backgroundColor: WHITE, // Outline azul como no Próximos Serviços
    borderWidth: 1.5,
    borderColor: ICON_PRIMARY,
    paddingHorizontal: Spacing.sm,
  },
  actionButtonTextWhite: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  actionButtonTextPrimary: {
    color: ICON_PRIMARY,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  acceptButtonCorner: {
    display: 'none',
  },
  acceptButton: {
    backgroundColor: ICON_PRIMARY,
    paddingHorizontal: Spacing.sm,
  },
  serviceItem: {
    backgroundColor: WHITE,
    borderRadius: Radii.md, // CORREÇÃO: Usar Radii.md (agora definido)
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
      android: { elevation: 0 },
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
    borderRadius: Radii.md, // CORREÇÃO: Usar Radii.md (agora definido)
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
      android: { elevation: 0 },
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
    borderRadius: Radii.md, // CORREÇÃO: Usar Radii.md (agora definido)
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
      android: { elevation: 0 },
    }),
  },
  earningsLinkText: {
    color: SUCCESS_GREEN,
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    marginLeft: Spacing.sm,
  },
  // CORREÇÃO: Adicionados os estilos para o botão de logout (refinado com haptic)
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DANGER_RED,
    borderRadius: Radii.pill, // CORREÇÃO: Usar Radii.pill (já definido)
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
      android: { elevation: 0 },
    }),
  },
  logoutButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
});

// Seção isolada: apenas a parte "Edite seus horários" + Financeiro
const EditHoursSection: React.FC<{
  onQuickWithdraw: () => void;
  animation: Animated.Value;
  isReducedMotionEnabled: boolean;
}> = ({ onQuickWithdraw, animation, isReducedMotionEnabled }) => {
  const router = useRouter();
  const a9 = useAnimatedTouch();
  return (
    <Animated.View style={[
      quickActionStyles.sectionContainer,
      {
        opacity: animation,
        transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
      }
    ]}>
      <Text style={[quickActionStyles.sectionTitle, { fontSize: 18, marginTop: Spacing.lg, marginBottom: Spacing.md }]}>Edite seus horários</Text>
      <View style={quickActionStyles.quickChipsRow}>
        <TouchableOpacity
          style={quickActionStyles.quickChipBlock}
          onPress={() => { Haptics.selectionAsync(); router.push('/provider/schedule/manage-availability?preset=today-morning' as any); }}
          accessibilityRole="button"
          accessibilityLabel="Definir turno de hoje"
          accessibilityHint="Escolha entre manhã, tarde ou dia todo para definir sua disponibilidade."
        >
          <Ionicons name="briefcase-outline" size={20} color={ICON_PRIMARY} />
          <View>
            <Text style={quickActionStyles.quickChipTitle}>Definir turno de hoje</Text>
            <Text style={quickActionStyles.quickChipSubtitle}>Manhã, tarde ou dia todo</Text>
          </View>
          <TouchableOpacity
            onPress={(event: GestureResponderEvent) => {
              event.stopPropagation();
              Haptics.selectionAsync();
              router.push('/provider/schedule/manage-availability?preset=today-morning' as any);
            }}
            style={quickActionStyles.plusButton}
            accessibilityRole="button"
            accessibilityLabel="Adicionar"
          >
            <Ionicons name="add" size={16} color={ICON_PRIMARY} />
          </TouchableOpacity>
        </TouchableOpacity>
        <TouchableOpacity
          style={quickActionStyles.quickChipBlock}
          onPress={() => { Haptics.selectionAsync(); router.push('/provider/schedule/manage-availability?preset=tomorrow-afternoon' as any); }}
          accessibilityRole="button"
          accessibilityLabel="Agendar amanhã"
          accessibilityHint="Marque o próximo dia disponível."
        >
          <Ionicons name="calendar-outline" size={20} color={ICON_PRIMARY} />
          <View>
            <Text style={quickActionStyles.quickChipTitle}>Agendar amanhã</Text>
            <Text style={quickActionStyles.quickChipSubtitle}>Escolha seus horários</Text>
          </View>
          <TouchableOpacity
            onPress={(event: GestureResponderEvent) => {
              event.stopPropagation();
              Haptics.selectionAsync();
              router.push('/provider/schedule/manage-availability?preset=tomorrow-afternoon' as any);
            }}
            style={quickActionStyles.plusButton}
            accessibilityRole="button"
            accessibilityLabel="Adicionar"
          >
            <Ionicons name="add" size={16} color={ICON_PRIMARY} />
          </TouchableOpacity>
        </TouchableOpacity>
        <TouchableOpacity
          style={quickActionStyles.quickChipBlock}
          onPress={() => { Haptics.selectionAsync(); router.push('/provider/schedule/manage-availability?preset=block-today' as any); }}
          accessibilityRole="button"
          accessibilityLabel="Folga hoje"
          accessibilityHint="Tire um dia de descanso."
        >
          <Ionicons name="bed-outline" size={20} color={ICON_PRIMARY} />
          <View>
            <Text style={quickActionStyles.quickChipTitle}>Folga hoje</Text>
            <Text style={quickActionStyles.quickChipSubtitle}>Tire um dia de descanso</Text>
          </View>
          <TouchableOpacity
            onPress={(event: GestureResponderEvent) => {
              event.stopPropagation();
              Haptics.selectionAsync();
              router.push('/provider/schedule/manage-availability?preset=block-today' as any);
            }}
            style={quickActionStyles.plusButton}
            accessibilityRole="button"
            accessibilityLabel="Adicionar"
          >
            <Ionicons name="add" size={16} color={ICON_PRIMARY} />
          </TouchableOpacity>
        </TouchableOpacity>
        <TouchableOpacity
          style={quickActionStyles.quickChipBlock}
          onPress={() => { Haptics.selectionAsync(); router.push('/provider/schedule/manage-availability?preset=repeat-week' as any); }}
          accessibilityRole="button"
          accessibilityLabel="Copiar semana padrão"
          accessibilityHint="Replique os horários da última semana."
        >
          <Ionicons name="repeat-outline" size={20} color={ICON_PRIMARY} />
          <View>
            <Text style={quickActionStyles.quickChipTitle}>Copiar semana padrão</Text>
            <Text style={quickActionStyles.quickChipSubtitle}>Replique os horários da última semana</Text>
          </View>
          <TouchableOpacity
            onPress={(event: GestureResponderEvent) => {
              event.stopPropagation();
              Haptics.selectionAsync();
              router.push('/provider/schedule/manage-availability?preset=repeat-week' as any);
            }}
            style={quickActionStyles.plusButton}
            accessibilityRole="button"
            accessibilityLabel="Adicionar"
          >
            <Ionicons name="add" size={16} color={ICON_PRIMARY} />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={quickActionStyles.withdrawCta}
        onPress={onQuickWithdraw}
        onPressIn={a9.onPressIn}
        onPressOut={a9.onPressOut}
        accessibilityRole="button"
        accessibilityLabel="Saque Rápido"
        accessibilityHint="Solicite um saque rápido dos ganhos disponíveis."
      >
        <Animated.View style={{ transform: [{ scale: a9.scaleAnim }], flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="cash-outline" size={20} color={WHITE} accessibilityHidden={true} />
          <Text style={quickActionStyles.withdrawCtaText}>Saque Rápido</Text>
          <Ionicons name="chevron-forward-outline" size={18} color={WHITE} accessibilityHidden={true} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};
