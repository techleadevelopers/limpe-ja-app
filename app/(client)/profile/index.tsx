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
import { LinearGradient } from 'expo-linear-gradient';

/** ----------------------------------------------------------------
 *  3D ICONS (absolute paths, ready for Metro bundler)
 *  If you added the alias @3d, you can switch requires later.
 *  ---------------------------------------------------------------- */
const Icons3D = {
  calendar: require('/assets/images/3d/step2-book-calendar.png'),
  account: require('/assets/images/3d/perfil.png'),
  location: require('/assets/images/3d/location.png'),
  payments: require('/assets/images/3d/payments.png'),
  notifications: require('/assets/images/3d/notification.png'),
  safety: require('/assets/images/3d/security.png'),
  privacy: require('/assets/images/3d/privacidade.png'),
  metrics: require('/assets/images/3d/uptrend.png'),
  referrals: require('/assets/images/3d/gift.png'),
  loyalty: require('/assets/images/3d/rating.png'),
  terms: require('/assets/images/3d/policies.png'),
  policy: require('/assets/images/3d/doc-check.png'),
  support: require('/assets/images/3d/support.png'),
  trophy: require('/assets/images/3d/champions.png'),
} satisfies Record<string, ImageSourcePropType>;

/** ================================================================
 * Animated Menu Item (now supports 3D PNG icons)
 * ================================================================ */
const AnimatedMenuItem: React.FC<{
  label: string;
  onPress: () => void;
  delay: number;
  /** pass a 3D PNG for the icon */
  icon3d?: ImageSourcePropType;
  /** for the destructive item we’ll still use a vector icon */
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
        {/* Left icon: prefer 3D PNG; fallback to vector for destructive */}
        {icon3d ? (
          <Image source={icon3d} style={styles.menuItem3DIcon} resizeMode="contain" />
        ) : mciName ? (
          <MaterialCommunityIcons
            name={mciName as any}
            size={24}
            color={isDestructive ? '#D32F2F' : '#4682B4'}
            style={styles.menuItemIcon}
          />
        ) : ionName ? (
          <Ionicons
            name={ionName as any}
            size={24}
            color={isDestructive ? '#D32F2F' : '#4682B4'}
            style={styles.menuItemIcon}
          />
        ) : null}

        <Text style={[styles.menuItemText, isDestructive && styles.menuItemTextDestructive]}>
          {label}
        </Text>

        {showChevron && !isDestructive && (
          <Ionicons name="chevron-forward-outline" size={22} color="#C7C7CC" />
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
  const [pendingMissionsCount] = useState(3);

  // page animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const profileHeaderAnim = useRef(new Animated.Value(0)).current;
  const avatarScaleAnim = useRef(new Animated.Value(1)).current;
  const searchBarAnim = useRef(new Animated.Value(0)).current;
  const missionsCardAnim = useRef(new Animated.Value(0)).current;

  // subtle effects
  const missionIconPulseAnim = useRef(new Animated.Value(1)).current;
  const missionIconRotateAnim = useRef(new Animated.Value(0)).current;
  const searchReflectionAnim = useRef(new Animated.Value(0)).current;
  const missionsCardReflectionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(missionIconPulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(missionIconPulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(missionIconRotateAnim, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(searchReflectionAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(searchReflectionAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(missionsCardReflectionAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(missionsCardReflectionAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [missionIconPulseAnim, missionIconRotateAnim, searchReflectionAnim, missionsCardReflectionAnim]);

  const rotateInterpolate = missionIconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const searchReflectionTranslateX = searchReflectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-250, 250],
  });
  const searchReflectionOpacity = searchReflectionAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.5, 0.5, 0],
  });

  const missionsCardReflectionTranslateX = missionsCardReflectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 350],
  });
  const missionsCardReflectionOpacity = missionsCardReflectionAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.6, 0.6, 0],
  });

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
      Animated.timing(searchBarAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(missionsCardAnim, {
        toValue: 1,
        duration: 600,
        delay: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnim, profileHeaderAnim, searchBarAnim, missionsCardAnim]);

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

  const handleLogout = async () => {
    Alert.alert('Sair da Conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        onPress: async () => {
          try {
            await logout();
            router.replace('/(auth)/login' as any);
          } catch (error) {
            Alert.alert('Erro ao Sair', 'Não foi possível sair da conta. Por favor, tente novamente.');
          }
        },
      },
    ]);
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

  const userName = user.fullName || 'Aryan Vishwakarma';
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
            <Ionicons name="arrow-back" size={24} color="#2F4F4F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={styles.headerIconRightPlaceholder} />
        </View>
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContentContainer}>
        {/* Search bar with shimmer */}
        <Animated.View
          style={[
            styles.searchBarContainer,
            { opacity: searchBarAnim, transform: [{ translateY: searchBarAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
          ]}
        >
          <Ionicons name="search" size={20} color="#5e7694ff" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Pesquisar" placeholderTextColor="#2F4F4F" />
          <Animated.View
            style={[
              styles.reflectionOverlay,
              {
                transform: [{ translateX: searchReflectionTranslateX }, { skewX: '-20deg' }],
                opacity: searchReflectionOpacity,
                width: 80,
                height: '100%',
                borderRadius: 10,
              },
            ]}
          />
        </Animated.View>

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
                <Ionicons name="person-circle-outline" size={70} color="#ADB5BD" />
              </View>
            )}
            <View style={styles.editIconBadge}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.userInfoTextContainer}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userSlogan}>{userSlogan}</Text>
            <Text style={styles.userPointsText}>Pontos: {userPoints}</Text>
          </View>

          <TouchableOpacity onPress={() => handleWIP('QR Code')}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#6C757D" />
          </TouchableOpacity>
        </Animated.View>

        {/* Main menu using 3D blue icons */}
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
            label="Endereços"
            icon3d={Icons3D.location}
            onPress={() => handleWIP('Endereços')}
            delay={100}
            showChevron={false}
          />
          <AnimatedMenuItem
            label="Formas de Pagamento"
            icon3d={Icons3D.payments}
            onPress={() => handleWIP('Formas de Pagamento')}
            delay={150}
            showChevron={false}
          />
          <AnimatedMenuItem
            label="Notificações"
            icon3d={Icons3D.notifications}
            onPress={() => handleWIP('Notificações')}
            delay={200}
            showChevron={false}
          />
          <AnimatedMenuItem
            label="Segurança"
            icon3d={Icons3D.safety}
            onPress={() => router.push('/(common)/safety' as any)}
            delay={250}
            showChevron={false}
          />
          <AnimatedMenuItem
            label="Privacidade"
            icon3d={Icons3D.privacy}
            onPress={() => handleWIP('Privacidade')}
            delay={300}
            showChevron={false}
          />
          <AnimatedMenuItem
            label="Minhas Métricas"
            icon3d={Icons3D.metrics}
            onPress={() => router.push('/(client)/metrics' as any)}
            delay={350}
            showChevron={false}
          />
        </View>

        {/* Missions CTA card with 3D trophy */}
        <Animated.View
          style={[
            styles.missionsCard,
            { opacity: missionsCardAnim, transform: [{ translateY: missionsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.push('/(client)/missions' as any)}
            style={styles.missionsCardButton}
          >
            <LinearGradient
              colors={['#4A90E2', '#3A7ACC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.missionsCardGradient}
            >
              <Animated.View
                style={{
                  transform: [{ scale: missionIconPulseAnim }, { rotateY: rotateInterpolate }],
                }}
              >
                <Image
                  source={Icons3D.trophy}
                  style={{ width: 40, height: 40, marginRight: 15 }}
                  resizeMode="contain"
                />
              </Animated.View>

              <View style={styles.missionsCardTextContainer}>
                <Text style={styles.missionsCardTitle}>Suas Missões</Text>
                <Text style={styles.missionsCardSubtitle}>{pendingMissionsCount} Missões Pendentes</Text>
              </View>

              <Ionicons name="chevron-forward-outline" size={28} color="#FFFFFF" />

              <Animated.View
                style={[
                  styles.reflectionOverlay,
                  {
                    transform: [{ translateX: missionsCardReflectionTranslateX }, { skewX: '-20deg' }],
                    opacity: missionsCardReflectionOpacity,
                    width: 120,
                    height: '100%',
                    borderRadius: 12,
                  },
                ]}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom section */}
        <View className="bottomSection" style={styles.bottomSection}>
          <AnimatedMenuItem
            label="Indicações"
            icon3d={Icons3D.referrals}
            onPress={() => router.push('/(common)/referrals' as any)}
            delay={400}
            showChevron={false}
          />
          <AnimatedMenuItem
            label="Fidelidade"
            icon3d={Icons3D.loyalty}
            onPress={() => router.push('/(common)/loyalty' as any)}
            delay={450}
            showChevron={false}
          />
          <AnimatedMenuItem
            label="Termos de Serviço"
            icon3d={Icons3D.terms}
            onPress={() => router.push('/(common)/termos' as any)}
            delay={500}
            showChevron={false}
          />
          <AnimatedMenuItem
            label="Política de Privacidade"
            icon3d={Icons3D.policy}
            onPress={() => router.push('/(common)/privacidade' as any)}
            delay={550}
            showChevron={false}
          />
          <AnimatedMenuItem
            label="Suporte"
            icon3d={Icons3D.support}
            onPress={() => router.push('/(common)/help' as any)}
            delay={600}
            showChevron={false}
          />
          {/* destructive stays vector for clarity */}
          <AnimatedMenuItem
            label="Sair da Conta"
            ionName="log-out-outline"
            onPress={handleLogout}
            isDestructive
            delay={650}
            showChevron={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F8FF' },
  scrollView: { flex: 1 },
  scrollViewContentContainer: { paddingBottom: 40 },

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

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9ec2f1ff',
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    position: 'relative',
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
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#2F4F4F' },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 15,
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
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  userInfoTextContainer: { flex: 1 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#212529' },
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
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20 },
  menuItemDestructive: { backgroundColor: 'rgba(211, 47, 47, 0.05)' },
  menuItemIcon: { marginRight: 15 },
  menuItem3DIcon: { width: 26, height: 26, marginRight: 15 },
  menuItemText: { flex: 1, fontSize: 16, color: '#212529' },
  menuItemTextDestructive: { color: '#D32F2F', fontWeight: '600' },

  missionsCard: {
    marginHorizontal: 15,
    marginTop: 25,
    borderRadius: 12,
    overflow: 'hidden',
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
  missionsCardButton: { width: '100%' },
  missionsCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    position: 'relative',
  },
  missionsCardTextContainer: { flex: 1 },
  missionsCardTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  missionsCardSubtitle: { fontSize: 15, color: '#E0E0E0', marginTop: 4 },

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

  reflectionOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});
