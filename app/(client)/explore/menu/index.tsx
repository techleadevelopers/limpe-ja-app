import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import NavBar from '../../../../components/client/explore/home/NavBar';

import Colors from '../../../../constants/Colors';
import { getUserProfile } from '../../../../services/clientService';
import type { UserProfile } from '../../../../types/backend/users';

// =================== THEME ===================
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

const withAlpha = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const i = parseInt(f, 16);
  const r = (i >> 16) & 255, g = (i >> 8) & 255, b = i & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// =================== ÍCONES 3D ===================
const Icons3D = {
  profile: require('../../../../assets/images/3d/perfil.png'),
  ticket: require('../../../../assets/images/3d/ticket.png'),
  cashback: require('../../../../assets/images/3d/cashback.png'),
  champions2: require('../../../../assets/images/3d/champions2.png'),
  missions: require('../../../../assets/images/3d/step1-card-profile.png'),
  referral: require('../../../../assets/images/3d/gift2.png'),
  metrics: require('../../../../assets/images/3d/uptrend.png'),
  support: require('../../../../assets/images/3d/support.png'),
  safety: require('../../../../assets/images/3d/security.png'),
  privacy: require('../../../../assets/images/3d/privacidade.png'),
  bookService: require('../../../../assets/images/3d/button.png'),
} satisfies Record<string, ImageSourcePropType>;

const Icon3D = ({ src, size = 46, style }: { src: ImageSourcePropType; size?: number; style?: any }) => (
  <Image source={src} style={[{ width: size, height: size }, style]} resizeMode="contain" />
);

// =================== SKELETON (SHIMMER) ===================
function Shimmer({ style, borderRadius = 12 }: { style?: any; borderRadius?: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-100, 300] });

  return (
    <View style={[{ overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius }, style]}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '100%',
          transform: [{ translateX }],
          opacity: 0.6,
        }}
      >
        <LinearGradient
          colors={['rgba(173, 216, 230, 0.7)', 'rgba(74, 145, 226, 0.38)', 'rgba(173, 216, 230, 0.7)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

// =================== MENU CATEGORIES ===================
interface MenuCategoryItem {
  key: string;
  title: string;
  icon: ImageSourcePropType;
  route: string;
}

const menuCategories: MenuCategoryItem[] = [
  { key: 'coupons', title: 'cupons', icon: Icons3D.ticket, route: '/(client)/coupons' },
  { key: 'missions', title: 'missões', icon: Icons3D.missions, route: '/(client)/missions' },
  { key: 'champions2', title: 'Ranking', icon: Icons3D.champions2, route: '/(client)/champions2' },
  { key: 'cashback', title: 'cashback', icon: Icons3D.cashback, route: '/(client)/wallet/cashback' },
  { key: 'referral', title: 'indicações', icon: Icons3D.referral, route: '/(client)/referrals' },
  { key: 'metrics', title: 'métricas', icon: Icons3D.metrics, route: '/(client)/metrics' },
  { key: 'support', title: 'suporte', icon: Icons3D.support, route: '/(common)/support' },
  { key: 'safety', title: 'segurança', icon: Icons3D.safety, route: '/(common)/safety' },
  { key: 'settings', title: 'ajustes', icon: Icons3D.privacy, route: '/(client)/settings' },
];

// =================== CATEGORY MINI CARD ===================
function CategoryMiniCard({ item, theme }: { item: MenuCategoryItem; theme: ReturnType<typeof useTheme> }) {
  const router = useRouter();
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(item.route as any);
  };

  const translateY = useRef(new Animated.Value(6)).current;
  const scale = useRef(new Animated.Value(0.995)).current;
  const shimmerProg = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (!v) {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();

        Animated.loop(
          Animated.sequence([
            Animated.timing(shimmerProg, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(shimmerProg, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ]),
          { iterations: -1 },
        ).start();
      } else {
        translateY.setValue(0);
        scale.setValue(1);
        shimmerProg.setValue(0);
      }
    });
  }, [translateY, scale, shimmerProg]);

  const shimmerTranslate = shimmerProg.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      style={({ pressed }) => [
        styles.categoryMiniCard,
        {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          transform: [{ scale: pressed ? 0.975 : 1 }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.cardAnimatedWrap,
          {
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 22,
              overflow: 'hidden',
              opacity: 0.12,
              backgroundColor: 'transparent',
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0.0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>

        <View style={styles.categoryContent}>
          <Icon3D src={item.icon} size={66} />
          <Text style={[styles.categoryMiniCardTitle, { color: theme.text }]} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// =================== SCREEN ===================
export default function ClientMenuScreen() {
  const router = useRouter();
  const theme = useTheme();
  const scheme = useColorScheme?.() || 'light';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const p = await getUserProfile();
        setProfile(p);
      } catch {
        setProfile(null);
      }
    })();
  }, []);

  useEffect(() => {
    const animations = [
      Animated.timing(headerFade, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(headerTranslate, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ];
    if (reduceMotion) {
      headerFade.setValue(1);
      headerTranslate.setValue(0);
    } else {
      Animated.parallel(animations).start();
    }
  }, [headerFade, headerTranslate, reduceMotion]);

  const userName =
    profile?.clientDetails?.fullName ||
    profile?.providerDetails?.fullName ||
    profile?.fullName ||
    'Cliente Indicador';
  const userEmail = profile?.email || 'indicador@teste.com';
  const avatarUri =
    profile?.avatarUrl ||
    profile?.clientDetails?.avatarUrl ||
    profile?.providerDetails?.avatarUrl;

  return (
    // Gradient como fundo FULL-BLEED cobrindo toda a tela
    <LinearGradient
      colors={['rgba(212,233,240,1)', 'rgba(74,119,226,0.18)', 'rgba(225,206,230,0)']}
      start={{ x: 0.12, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fullBackground}
    >
      <View style={styles.screenOverlay}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

        <Animated.View
          style={[
            styles.topHeader,
            {
              opacity: headerFade,
              transform: [{ translateY: headerFade.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 5, marginLeft: -5 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#4A5568" />
          </TouchableOpacity>
          <Text style={[styles.topHeaderTitle, { color: '#4A5568' }]}>Menu Principal</Text>
          <View style={{ width: 20 }} />
        </Animated.View>

        <View style={styles.mainContent}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Animated.View style={{ opacity: headerFade, transform: [{ translateY: headerTranslate }] }}>
              {/* Conteúdo do header sobre o gradiente de fundo (sem bordas no gradiente) */}
              <View style={styles.headerInner}>
                <View style={styles.profileBlock}>
                  <View style={[styles.avatarWrap, { backgroundColor: withAlpha('#FFF', 0.1) }]}>
                    {profile === null ? (
                      <Shimmer style={{ width: '100%', height: '100%', borderRadius: 43 }} borderRadius={43} />
                    ) : avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.avatar} />
                    ) : (
                      <Image source={Icons3D.profile} style={styles.avatar} />
                    )}
                  </View>

                  {profile === null ? (
                    <>
                      <Shimmer style={{ width: 160, height: 18, borderRadius: 6, marginTop: 6 }} />
                      <Shimmer style={{ width: 120, height: 14, borderRadius: 6, marginTop: 6 }} />
                    </>
                  ) : (
                    <>
                      <Text style={[styles.userName, { color: '#1158e683' }]} numberOfLines={1}>
                        {userName}
                      </Text>
                      <Text style={[styles.userEmail, { color: '#666666ff' }]} numberOfLines={1}>
                        {userEmail}
                      </Text>
                    </>
                  )}
                </View>

                <View style={styles.categoryMiniCardsGrid}>
                  {menuCategories.map((item) => (
                    <CategoryMiniCard key={item.key} item={item} theme={useTheme()} />
                  ))}
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </View>

        <View style={{ transform: [{ translateY: -(Dimensions.get('window').height * 0.02) }] }}>
          <NavBar />
        </View>
      </View>
    </LinearGradient>
  );
}

// =================== STYLES ===================
const styles = StyleSheet.create({
  fullBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  // overlay para posicionar conteúdo respeitando safe-area/padding interno
  screenOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  screen: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : 16,
    paddingBottom: 28,
  },

  // Header inner (conteúdo do cartão) — sem bordas no gradiente, apenas um container interno para posicionamento
  headerInner: {
    borderRadius: 34,
    overflow: 'hidden',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 0, // Mantém o gradiente ocupando toda a largura; o conteúdo usa padding interno do scrollView
    backgroundColor: 'transparent',
    // leve sombra interna/externa para separar conteúdo do fundo (não uma borda)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  topHeader: {
    paddingHorizontal: 26,
    marginBottom: 10,
    paddingTop: Platform.OS === 'ios' ? 59 : 20,
    paddingBottom: 12,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  topHeaderTitle: {
    fontWeight: '700',
    letterSpacing: 0.8,
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
  },

  profileBlock: { alignItems: 'center', paddingVertical: 8 },
  avatarWrap: {
    width: 69,
    height: 69,
    borderRadius: 43,
    overflow: 'hidden',
    marginBottom: 0,
    marginTop: 1,
  },
  avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  userName: { fontSize: 17, fontWeight: '700', marginTop: 6 },
  userEmail: { marginTop: 2, fontSize: 12, opacity: 0.8 },

  categoryMiniCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
  },

  categoryMiniCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 22,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  categoryMiniCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'lowercase',
  },

  cardAnimatedWrap: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  categoryContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },

  shimmer: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
});