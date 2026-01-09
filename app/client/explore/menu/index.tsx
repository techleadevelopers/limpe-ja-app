import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  profile: require('../../../../assets/images/3d/profile5.png'),
  ticket: require('../../../../assets/images/3d/ticket.png'),
  cashback: require('../../../../assets/images/3d/cashback3.png'),
  champions2: require('../../../../assets/images/3d/champp.png'),
  missions: require('../../../../assets/images/3d/missions8.png'),
  referral: require('../../../../assets/images/3d/gift2.png'),
  metrics: require('../../../../assets/images/3d/metrics.png'),
  support: require('../../../../assets/images/3d/support4.png'),
  safety: require('../../../../assets/images/3d/security2.png'),
  privacy: require('../../../../assets/images/3d/setting2.png'),
  bookService: require('../../../../assets/images/3d/button.png'),
} satisfies Record<string, ImageSourcePropType>;

const Icon3D = ({ src, size = 38, style }: { src: ImageSourcePropType; size?: number; style?: any }) => (
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
          colors={['#f2f2f2', 'rgba(74, 145, 226, 0.07)', '#f2f2f2']}
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
  { key: 'coupons', title: 'Cupons', icon: Icons3D.ticket, route: '/client/coupons' },
  { key: 'missions', title: 'Missões', icon: Icons3D.missions, route: '/client/missions' },
  { key: 'champions2', title: 'Ranking', icon: Icons3D.champions2, route: '/client/explore/ranking' },
  { key: 'cashback', title: 'Cashback', icon: Icons3D.cashback, route: '/client/wallet/cashback' },
  { key: 'referral', title: 'Indicações', icon: Icons3D.referral, route: '/client/referrals' },
  { key: 'metrics', title: 'Métricas', icon: Icons3D.metrics, route: '/client/metrics' },
  { key: 'support', title: 'Suporte', icon: Icons3D.support, route: '/common/support' },
  { key: 'safety', title: 'Segurança', icon: Icons3D.safety, route: '/client/explore/security' },
  { key: 'settings', title: 'Ajustes', icon: Icons3D.privacy, route: '/client/profile' },
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
  // Premium micro‑motion for icon
  const iconWave = useRef(new Animated.Value(Math.random())).current;

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

        Animated.loop(
          Animated.sequence([
            Animated.timing(iconWave, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(iconWave, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
          { iterations: -1 },
        ).start();
      } else {
        translateY.setValue(0);
        scale.setValue(1);
        shimmerProg.setValue(0);
        iconWave.setValue(0);
      }
    });
  }, [translateY, scale, shimmerProg, iconWave]);

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
              opacity: 0,
              backgroundColor: 'transparent',
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(24, 154, 224, 0.36)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0.0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>

        <View style={styles.categoryContent}>
          <Animated.View
            style={{
              transform: [
                { translateY: iconWave.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
                { scale: iconWave.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) },
                { rotate: iconWave.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-1.2deg', '0deg', '1.2deg'] }) },
              ],
            }}
          >
            <Icon3D src={item.icon} size={56} />
          </Animated.View>
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
    // Fundo sólido premium (sem gradiente)
    <View style={[styles.fullBackground, { backgroundColor: '#f2f2f2' }]}>
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
            style={{ padding: 5, marginLeft: -5, marginTop: Platform.OS === 'ios' ? 0 : 12 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.topHeaderTitle, { color: theme.text }]}>Para você</Text>
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
                      <CategoryMiniCard key={item.key} item={item} theme={theme} />
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
    </View>
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
        elevation: 0,
      },
    }),
  },

  topHeader: {
    paddingHorizontal: 26,
    marginBottom: 0,
    paddingTop: Platform.OS === 'ios' ? 59 : 20,
    paddingBottom: 12,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  topHeaderTitle: {
    fontWeight: '700',
    letterSpacing: Platform.OS === 'ios' ? 0.6 : 0.5,
    marginTop: Platform.OS === 'ios' ? 0 : 15,
    right: Platform.OS === 'ios' ? 0 : 4,
    flex: 1,
    textAlign: 'center',
    fontSize: Platform.OS === 'ios' ? 18 : 17,
  },

  profileBlock: { alignItems: 'center', paddingVertical: 8 },
  avatarWrap: {
    width: 59,
    height: 59,
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
    marginTop: 30,
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
        elevation: 0,
      },
    }),
  },
  categoryMiniCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'capitalize',
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

