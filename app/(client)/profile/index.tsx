import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
  Easing,
  TextInput,
  ImageSourcePropType,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

/** ----------------------------------------------------------------
 *  3D ICONS (absolute paths, ready for Metro bundler)
 *  ---------------------------------------------------------------- */
const Icons3D = {
  calendar: require('../../../assets/images/3d/calender.png'),
  account: require('../../../assets/images/3d/perfil.png'),
  notifications: require('../../../assets/images/3d/notification.png'),
  safety: require('../../../assets/images/3d/security.png'),
  terms: require('../../../assets/images/3d/policies.png'),
  policy: require('../../../assets/images/3d/doc-check.png'),
  support: require('../../../assets/images/3d/support.png'),
} satisfies Record<string, ImageSourcePropType>;

/** ================================================================
 * Animated Menu Item (supports 3D PNG icons)
 * ================================================================ */
const AnimatedMenuItem: React.FC<{
  label: string;
  onPress: () => void;
  delay: number;
  icon3d?: ImageSourcePropType;
  ionName?: keyof typeof Ionicons.glyphMap;
  mciName?: keyof typeof MaterialCommunityIcons.glyphMap;
  isDestructive?: boolean;
  showChevron?: boolean;
}> = ({
  label,
  onPress,
  delay,
  icon3d,
  ionName,
  mciName,
  isDestructive,
  showChevron = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  const onPressInItem = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutItem = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.menuItemWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.menuItem, isDestructive && styles.menuItemDestructive]}
        onPress={onPress}
        onPressIn={onPressInItem}
        onPressOut={onPressOutItem}
        activeOpacity={0.7}
      >
        {icon3d ? (
          <Image source={icon3d} style={styles.menuItem3DIcon} resizeMode="contain" />
        ) : mciName ? (
          <MaterialCommunityIcons
            name={mciName as any}
            size={20} // Reduzido de 24 para 20
            color={isDestructive ? '#D32F2F' : '#4682B4'}
            style={styles.menuItemIcon}
          />
        ) : ionName ? (
          <Ionicons
            name={ionName as any}
            size={20} // Reduzido de 24 para 20
            color={isDestructive ? '#D32F2F' : '#4682B4'}
            style={styles.menuItemIcon}
          />
        ) : null}

        <Text style={[styles.menuItemText, isDestructive && styles.menuItemTextDestructive]}>
          {label}
        </Text>

        {showChevron && !isDestructive && (
          <Ionicons name="chevron-forward-outline" size={18} color="#C7C7CC" /> // Reduzido de 22 para 18
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ClientProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Simulated points/metrics
  const [userPoints] = useState(1250);

  // page animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const profileHeaderAnim = useRef(new Animated.Value(0)).current;
  const avatarScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(profileHeaderAnim, {
        toValue: 1,
        duration: 700,
        delay: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnim, profileHeaderAnim]);

  const onPressInAvatar = useCallback(() => {
    Animated.spring(avatarScaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  }, [avatarScaleAnim]);

  const onPressOutAvatar = useCallback(() => {
    Animated.spring(avatarScaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [avatarScaleAnim]);

  // Modificação aqui: Removido o Alert.alert de confirmação e todos os console.log/console.error para evitar erro no LogBox.
  // Se precisar debugar: if (__DEV__) console.log('[ClientProfileScreen] Logout executado');
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login' as any);
    } catch (error) {
      // Removido: console.error para evitar LogBox error. Mantenha só o Alert para UX.
      Alert.alert('Erro ao Sair', 'Não foi possível sair da conta. Por favor, tente novamente.');
    }
  };

  const handleWIP = (featureName: string) => {
    Alert.alert('Em Desenvolvimento', `A funcionalidade "${featureName}" será implementada em breve!`);
  };

  if (!user) {
    return (
      <View style={styles.centeredMessageContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.loadingText}>Usuário não encontrado. Por favor, faça login novamente.</Text>
        <TouchableOpacity
          style={styles.simpleButton}
          onPress={() => router.replace('/(auth)/login' as any)}
        >
          <Text style={styles.simpleButtonText}>Ir para Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const userName = user.fullName || 'Usuário';
  const userSlogan = 'Bio over here';
  const userAvatarUrl = user.avatarUrl;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <Animated.View
        style={[
          styles.customHeaderWrapper,
          { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
        ]}
      >
        <View style={styles.customHeader}>
          <TouchableOpacity style={styles.headerIconLeft} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#2F4F4F" /> {/* Reduzido de 24 para 20 */}
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={styles.headerIconRightPlaceholder} />
        </View>
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContentContainer}>
        {/* User header card */}
        <Animated.View
          style={[
            styles.profileHeader,
            { opacity: profileHeaderAnim, transform: [{ translateY: profileHeaderAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.push('/(client)/profile/edit' as any)}
            onPressIn={onPressInAvatar}
            onPressOut={onPressOutAvatar}
            style={[styles.avatarContainer, { transform: [{ scale: avatarScaleAnim }] }]}
          >
            {userAvatarUrl ? (
              <Image source={{ uri: userAvatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-circle-outline" size={50} color="#69abeeff" /> {/* Reduzido de 70 para 50 */}
              </View>
            )}
            <View style={styles.editIconBadge}>
              <Ionicons name="pencil" size={12} color="#fff" /> {/* Reduzido de 14 para 12 */}
            </View>
          </TouchableOpacity>

          <View style={styles.userInfoTextContainer}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userSlogan}>{userSlogan}</Text>
            <Text style={styles.userPointsText}>Pontos: {userPoints}</Text>
          </View>

          <TouchableOpacity onPress={() => handleWIP('QR Code')}>
            <MaterialCommunityIcons name="qrcode-scan" size={20} color="#6C757D" /> {/* Reduzido de 24 para 20 */}
          </TouchableOpacity>
        </Animated.View>

        {/* Menu essencial */}
        <View style={styles.menuSection}>
          <AnimatedMenuItem
            label="Meus Agendamentos"
            icon3d={Icons3D.calendar}
            onPress={() => router.push('/(client)/bookings' as any)}
            delay={0}
            showChevron={false}
          />
          <AnimatedMenuItem
            label="Conta"
            icon3d={Icons3D.account}
            onPress={() => router.push('/(client)/profile/edit' as any)}
            delay={50}
            showChevron={false}
          />
          <AnimatedMenuItem
            label="Notificações"
            icon3d={Icons3D.notifications}
            onPress={() => router.push('/(common)/notifications' as any)}
            delay={100}
            showChevron={false}
          />
          <AnimatedMenuItem
            label="Segurança"
            icon3d={Icons3D.safety}
            onPress={() => router.push('/(common)/safety' as any)}
            delay={150}
            showChevron={false}
          />
        </View>

        {/* Seção inferior (suporte/legal + sair) */}
        <View style={styles.bottomSection}>
          <AnimatedMenuItem
            label="Suporte"
            icon3d={Icons3D.support}
            onPress={() => router.push('/(common)/help' as any)}
            delay={200}
            showChevron={false}
          />
          <AnimatedMenuItem
            label="Termos de Serviço"
            icon3d={Icons3D.terms}
            onPress={() => router.push('/(common)/termos' as any)}
            delay={250}
            showChevron={false}
          />
          <AnimatedMenuItem
            label="Política de Privacidade"
            icon3d={Icons3D.policy}
            onPress={() => router.push('/(common)/privacidade' as any)}
            delay={300}
            showChevron={false}
          />
          <AnimatedMenuItem
            label="Sair da Conta"
            ionName="log-out-outline"
            onPress={handleLogout} 
            isDestructive
            delay={350}
            showChevron={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f2f2f2',
   },
  scrollView: { flex: 1 },
  scrollViewContentContainer: { paddingBottom: 40,  paddingHorizontal: 15, }, // Reduzido de 20 para 15

  centeredMessageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  simpleButton: { marginTop: 20, backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  simpleButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingText: { fontSize: 16, color: '#6C757D', marginBottom: 10 },

  customHeaderWrapper: {},
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: 'transparent',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2F4F4F', textAlign: 'center', flex: 1 },
  headerIconLeft: { padding: 5, zIndex: 1 },
  headerIconRightPlaceholder: { width: 34, zIndex: 1 },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15, // Reduzido de 20 para 15
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 15, // Reduzido de 20 para 15
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.08)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },

  avatarContainer: {
    position: 'relative',
    width: 60, // Reduzido de 80 para 60
    height: 60, // Reduzido de 80 para 60
    borderRadius: 30, // Ajustado para 60/2
    borderWidth: 3,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12, // Reduzido de 15 para 12
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.15)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarPlaceholder: { width: '100%', height: '100%', backgroundColor: '#E9ECEF', justifyContent: 'center', alignItems: 'center' },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A90E2',
    padding: 5, // Reduzido de 6 para 5
    borderRadius: 10, // Ajustado para menor
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  userInfoTextContainer: { flex: 1 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#739aeaff' },
  userSlogan: { fontSize: 14, color: '#6C757D', marginTop: 4, fontStyle: 'italic' },
  userPointsText: { fontSize: 14, fontWeight: 'bold', color: '#4CAF50', marginTop: 8 },

  menuSection: {
    marginTop: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 15,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.08)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  menuItemWrapper: {},
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15 }, // Reduzido padding de 15/20 para 12/15
  menuItemDestructive: { backgroundColor: 'rgba(211, 47, 47, 0.05)' },
  menuItemIcon: { marginRight: 12 }, // Reduzido de 15 para 12
  menuItem3DIcon: { width: 28, height: 28, marginRight: 12 }, // Reduzido de 36 para 28
  menuItemText: { flex: 1, fontSize: 16, color: '#212529' }, // Reduzido de 18 para 16
  menuItemTextDestructive: { color: '#D32F2F', fontWeight: '600' },

  bottomSection: {
    marginTop: 25,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 15,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.08)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
});