// LimpeJaApp/app/(provider)/profile/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
  Alert,
  Easing,
  AccessibilityInfo,
  ActivityIndicator, // ADICIONADO: Import para ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../../hooks/useAuth';
import NotificationUIService from '../../../services/notificationUIService';

// ====== Design tokens (consistentes com o projeto - Premium iOS Clean) ======
const Colors = {
  primary: '#4A90E2',
  primaryDark: '#2A72E7',
  bgSoft: '#F0F7FF',
  surface: '#FFFFFF',
  border: '#E9ECEF',
  fieldBg: '#F8F9FA',
  text: '#212529',
  textMuted: '#6C757D',
  textSubtle: '#868E96',
  danger: '#D32F2F',
  success: '#2E7D32',
  shadow: 'rgba(0,0,0,0.08)',
};

const Radii = {
  xl: 24,
  pill: 28,
  md: 16,
  sm: 12,
};

const Spacing = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32, // ADICIONADO: xl: 32 para resolver o erro TS(2339) em Spacing.xl
};

const easeOut = Easing.out(Easing.ease);

// ====== Hook para Reduced Motion (premium accessibility iOS) ======
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

// ====== Hook para Animação de Toque (com haptics premium) ======
const useAnimatedTouch = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, friction: 5 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5, tension: 40 }).start();
  };
  return { scaleAnim, onPressIn, onPressOut };
};

// ====== Componente: AnimatedMenuItem (reutilizável, com animações e accessibility) ======
interface AnimatedMenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isReducedMotionEnabled: boolean;
  delay?: number;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  isDanger?: boolean; // Para itens como logout
}

const AnimatedMenuItem: React.FC<AnimatedMenuItemProps> = ({
  icon,
  label,
  onPress,
  isReducedMotionEnabled,
  delay = 0,
  rightIcon = 'chevron-forward',
  isDanger = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const { scaleAnim, onPressIn, onPressOut } = useAnimatedTouch();

  useEffect(() => {
    const duration = isReducedMotionEnabled ? 0 : 400;
    const animDelay = isReducedMotionEnabled ? 0 : delay;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration, delay: animDelay, easing: easeOut, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration, delay: animDelay, easing: easeOut, useNativeDriver: true }),
    ]).start();
  }, [isReducedMotionEnabled, delay]);

  const itemColor = isDanger ? Colors.danger : Colors.primary;
  const bgColor = isDanger ? '#FFF5F5' : Colors.fieldBg;

  return (
    <Animated.View
      style={[
        styles.menuItemWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
        { backgroundColor: bgColor },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Toque para acessar esta seção.`}
      accessibilityHint={`Navegue para ${label.toLowerCase()}.`}
    >
      <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.92}
      >
        <Ionicons name={icon} size={24} color={itemColor} style={styles.menuItemIcon} accessibilityHidden={true} />
        <View style={styles.menuItemTextContainer}>
          <Text style={styles.menuItemLabel}>{label}</Text>
        </View>
        <Ionicons name={rightIcon} size={20} color={Colors.textMuted} accessibilityHidden={true} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ====== Componente Principal: ProviderProfileScreen ======
export default function ProviderProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isReducedMotionEnabled = useReducedMotion();

  const [isLogoutConfirming, setIsLogoutConfirming] = useState(false);

  // Animações (otimizadas para reduced motion)
  const headerAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;
  const logoutAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = isReducedMotionEnabled ? 0 : 500;
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration, easing: easeOut, useNativeDriver: true }),
      Animated.timing(menuAnim, { toValue: 1, duration: 600, delay: 100, easing: easeOut, useNativeDriver: true }),
      Animated.timing(logoutAnim, { toValue: 1, duration: 600, delay: 200, easing: easeOut, useNativeDriver: true }),
    ]).start();
  }, [isReducedMotionEnabled]);

  const handleLogout = async () => {
    if (isReducedMotionEnabled) {
      // Sem haptic em reduced motion
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setIsLogoutConfirming(true);
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair? Você precisará fazer login novamente para acessar sua conta.',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => setIsLogoutConfirming(false) },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              NotificationUIService.showInfo('Você saiu da conta com sucesso.', 'Logout');
              AccessibilityInfo.announceForAccessibility('Logout realizado. Redirecionando para tela inicial.');
              router.replace('/welcome');
            } catch (error) {
              console.error('Erro no logout:', error);
              NotificationUIService.showError('Erro ao sair da conta. Tente novamente.', 'Erro');
              setIsLogoutConfirming(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleMenuPress = (route: string, label: string) => {
    if (!isReducedMotionEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    AccessibilityInfo.announceForAccessibility(`Navegando para ${label.toLowerCase()}.`);
    router.push(route as any);
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Animado com Avatar */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => handleMenuPress('/(provider)/profile/edit', 'Editar Perfil')}
          accessibilityRole="button"
          accessibilityLabel="Editar foto de perfil"
          accessibilityHint="Toque para alterar sua foto de perfil."
        >
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color={Colors.primary} />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user.fullName || 'Nome do Provedor'}</Text>
          <Text style={styles.profileRole}>Profissional de Limpeza</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => handleMenuPress('/(provider)/profile/edit', 'Editar Perfil')}
          >
            <Text style={styles.editProfileButtonText}>Editar Perfil</Text>
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Menu Principal Animado */}
      <Animated.ScrollView
        style={styles.menuScroll}
        contentContainerStyle={styles.menuContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.menuSection,
            {
              opacity: menuAnim,
              transform: [{ translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Conta e Perfil</Text>
          <AnimatedMenuItem
            icon="person-outline"
            label="Editar Perfil"
            onPress={() => handleMenuPress('/(provider)/profile/edit', 'Editar Perfil')}
            isReducedMotionEnabled={isReducedMotionEnabled}
            delay={0}
          />
          <AnimatedMenuItem
            icon="id-card-outline"
            label="Verificação de Conta"
            onPress={() => handleMenuPress('/(provider)/profile/verify', 'Verificação de Conta')}
            isReducedMotionEnabled={isReducedMotionEnabled}
            delay={100}
          />
          <AnimatedMenuItem
            icon="briefcase-outline"
            label="Meus Serviços Oferecidos"
            onPress={() => handleMenuPress('/(provider)/profile/edit-services', 'Editar Serviços')}
            isReducedMotionEnabled={isReducedMotionEnabled}
            delay={200}
          />
          <AnimatedMenuItem
            icon="time-outline"
            label="Gerenciar Disponibilidade"
            onPress={() => handleMenuPress('/(provider)/schedule/manage-availability', 'Disponibilidade')}
            isReducedMotionEnabled={isReducedMotionEnabled}
            delay={300}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.menuSection,
            {
              opacity: menuAnim,
              transform: [{ translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Atividades e Relatórios</Text>
          <AnimatedMenuItem
            icon="star-outline"
            label="Minhas Avaliações"
            onPress={() => handleMenuPress('/(provider)/profile/reviews', 'Avaliações')}
            isReducedMotionEnabled={isReducedMotionEnabled}
            delay={400}
          />
          <AnimatedMenuItem
            icon="wallet-outline"
            label="Meus Ganhos"
            onPress={() => handleMenuPress('/(provider)/earnings', 'Ganhos')}
            isReducedMotionEnabled={isReducedMotionEnabled}
            delay={500}
          />
          <AnimatedMenuItem
            icon="trending-up-outline"
            label="Relatórios e Métricas"
            onPress={() => handleMenuPress('/(provider)/profile/metrics', 'Métricas')}
            isReducedMotionEnabled={isReducedMotionEnabled}
            delay={600}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.menuSection,
            {
              opacity: menuAnim,
              transform: [{ translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Configurações e Suporte</Text>
          <AnimatedMenuItem
            icon="notifications-outline"
            label="Notificações"
            onPress={() => handleMenuPress('/(common)/settings/notifications', 'Notificações')}
            isReducedMotionEnabled={isReducedMotionEnabled}
            delay={700}
          />
          <AnimatedMenuItem
            icon="card-outline"
            label="Dados Bancários"
            onPress={() => handleMenuPress('/(provider)/profile/bank-details', 'Dados Bancários')}
            isReducedMotionEnabled={isReducedMotionEnabled}
            delay={800}
          />
          <AnimatedMenuItem
            icon="help-circle-outline"
            label="Ajuda e Suporte"
            onPress={() => handleMenuPress('/(common)/help', 'Ajuda')}
            isReducedMotionEnabled={isReducedMotionEnabled}
            delay={900}
          />
          <AnimatedMenuItem
            icon="document-text-outline"
            label="Termos e Privacidade"
            onPress={() => handleMenuPress('/(common)/termos', 'Termos')}
            isReducedMotionEnabled={isReducedMotionEnabled}
            delay={1000}
          />
        </Animated.View>
      </Animated.ScrollView>

      {/* Botão de Logout Animado (no final, com confirmação haptic) */}
      <Animated.View
        style={[
          styles.logoutSection,
          {
            opacity: logoutAnim,
            transform: [{ translateY: logoutAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLogoutConfirming}
          accessibilityRole="button"
          accessibilityLabel="Sair da Conta"
          accessibilityHint="Toque para fazer logout da aplicação. Isso encerrará sua sessão atual."
        >
          <Ionicons name="log-out-outline" size={24} color={Colors.danger} />
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ====== Styles (Premium iOS Clean, com spacing confortável e shadows sutis) ======
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSoft,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgSoft,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: 17,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  avatarContainer: {
    marginRight: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.fieldBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'System',
  },
  profileRole: {
    fontSize: 16,
    color: Colors.primary,
    marginBottom: Spacing.xs,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  profileEmail: {
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editProfileButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginRight: Spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  menuSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'System',
  },
  menuItemWrapper: {
    marginBottom: Spacing.sm,
    borderRadius: Radii.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  menuItemIcon: {
    marginRight: Spacing.lg,
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  logoutSection: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl, // CORRIGIDO: Usar Spacing.xl (agora definido)
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.danger,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  logoutButtonText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
});