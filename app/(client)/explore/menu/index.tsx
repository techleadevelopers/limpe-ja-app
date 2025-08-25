// LimpeJaApp/app/(client)/menu/index.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import { getUserProfile } from '../../../../services/clientService';
import type { UserProfile } from '../../../../types/backend/users';

function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

// === ÍCONES 3D (caminho absoluto, conforme solicitado) ===
const Icons3D = {
  profile: require('/assets/images/3d/perfil.png'),
  ticket: require('/assets/images/3d/ticket.png'),
  cashback: require('/assets/images/3d/cashback.png'),
  ranking: require('/assets/images/3d/crown.png'),
  missions: require('/assets/images/3d/step1-card-profile.png'),
  referral: require('/assets/images/3d/gift2.png'),
  metrics: require('/assets/images/3d/uptrend.png'),
  support: require('/assets/images/3d/support.png'),
  safety: require('/assets/images/3d/security.png'),
  privacy: require('/assets/images/3d/privacidade.png'),
} satisfies Record<string, ImageSourcePropType>;

type MenuItem = {
  key: string;
  title: string;
  subtitle?: string;
  icon: ImageSourcePropType;
  route: string | (() => void);
};

export default function ClientMenuScreen() {
  const router = useRouter();
  const theme = useTheme();
  const scheme = useColorScheme?.() || 'light';

  // pressed background com fallback seguro
  const pressedBg =
    (Colors as any)[scheme]?.listItemPressed ||
    (scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)');

  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(18)).current;
  const listFade = useRef(new Animated.Value(0)).current;
  const listTranslate = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    (async () => {
      try {
        const p = await getUserProfile();
        setProfile(p);
      } catch {
        // mantém nulo e segue com placeholders
      }
    })();
  }, []);

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(headerTranslate, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(listFade, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(listTranslate, { toValue: 0, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();
  }, [headerFade, headerTranslate, listFade, listTranslate]);

  const userName =
    profile?.clientDetails?.fullName ||
    profile?.providerDetails?.fullName ||
    profile?.fullName ||
    'User';
  const userEmail = profile?.email || '—';

  const avatarUri =
    profile?.avatarUrl ||
    profile?.clientDetails?.avatarUrl ||
    profile?.providerDetails?.avatarUrl ||
    undefined;

  // Estatísticas (fallbacks seguros, sem quebrar a tipagem)
  const statActive =
    (profile as any)?.missions?.activeCount ??
    (profile?.clientDetails as any)?.metrics?.missions?.active ??
    0;

  const statPending =
    (profile as any)?.missions?.pendingCount ??
    (profile?.clientDetails as any)?.metrics?.missions?.pending ??
    0;

  const statDone =
    (profile as any)?.missions?.completedCount ??
    (profile?.clientDetails as any)?.metrics?.missions?.completed ??
    0;

  const menuItems: MenuItem[] = useMemo(
    () => [
      { key: 'coupons',  title: 'My Coupons',  subtitle: 'Discounts & promo codes', icon: Icons3D.ticket,   route: '/(client)/coupons' as const },
      { key: 'ranking',  title: 'Ranking',     subtitle: 'See the leaderboard',     icon: Icons3D.ranking,  route: '/(client)/ranking' as const },
      { key: 'missions', title: 'Missions',    subtitle: 'Finish tasks, earn rewards', icon: Icons3D.missions, route: '/(client)/missions' as const },
      { key: 'cashback', title: 'Cashback',    subtitle: 'Track your returns',      icon: Icons3D.cashback, route: '/(client)/wallet/cashback' as const },
      { key: 'referral', title: 'Referral',    subtitle: 'Invite friends, earn bonus', icon: Icons3D.referral, route: '/(client)/referrals' as const },
      { key: 'metrics',  title: 'My Metrics',  subtitle: 'Points, streaks & history', icon: Icons3D.metrics, route: '/(client)/metrics' as const },
      { key: 'support',  title: 'Support',     subtitle: 'Open a ticket or chat',   icon: Icons3D.support,  route: '/(common)/support' as const },
      { key: 'safety',   title: 'Safety',      subtitle: 'SOS & safety center',     icon: Icons3D.safety,   route: '/(common)/safety' as const },
      { key: 'settings', title: 'Settings',    subtitle: 'Privacy & preferences',   icon: Icons3D.privacy,  route: '/(client)/settings' as const },
    ],
    []
  );

  const handlePressItem = (item: MenuItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (typeof item.route === 'string') return (router.push as any)(item.route);
    item.route?.();
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header card */}
        <Animated.View style={{ opacity: headerFade, transform: [{ translateY: headerTranslate }] }}>
          <LinearGradient
            colors={[theme.primaryLight, theme.cardBackground]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerCard, { borderColor: theme.border }]}
          >
            <View style={styles.headerTopRow}>
              <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconButton}>
                <Ionicons name="chevron-back" size={22} color={theme.text} />
              </Pressable>
              <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
              <Pressable onPress={() => router.push('/(client)/profile' as any)} hitSlop={10} style={styles.iconButton}>
                <Ionicons name="settings-outline" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            <View style={styles.profileBlock}>
              <View style={styles.avatarWrap}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <Image source={Icons3D.profile} style={styles.avatar} />
                )}
              </View>
              <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{userName}</Text>
              <Text style={[styles.userEmail, { color: theme.textMuted }]} numberOfLines={1}>{userEmail}</Text>
            </View>

            {/* Stats pills */}
            <View style={styles.statsRow}>
              <StatPill label="Active"   value={statActive}  active theme={theme} onPress={() => router.push('/(client)/missions' as any)} />
              <StatPill label="Pending"  value={statPending}         theme={theme} onPress={() => router.push('/(client)/missions' as any)} />
              <StatPill label="Complete" value={statDone}            theme={theme} onPress={() => router.push('/(client)/missions' as any)} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Menu list */}
        <Animated.View style={{ opacity: listFade, transform: [{ translateY: listTranslate }] }}>
          <View style={[styles.listCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            {menuItems.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => handlePressItem(item)}
                onPressIn={() => Haptics.selectionAsync()}
                style={({ pressed }) => [styles.row, { backgroundColor: pressed ? pressedBg : 'transparent' }]}
              >
                <Image source={item.icon} style={styles.rowIcon} />
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>{item.title}</Text>
                  {!!item.subtitle && (
                    <Text style={[styles.rowSubtitle, { color: theme.textMuted }]} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StatPill({
  value,
  label,
  active,
  theme,
  onPress,
}: {
  value: number;
  label: string;
  active?: boolean;
  theme: ReturnType<typeof useTheme>;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statPill,
        {
          backgroundColor: active ? (theme.primaryLight || '#DCEBFF') : theme.cardBackground,
          borderColor: active ? (theme.primary || '#3B82F6') : theme.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text style={[styles.statValue, { color: active ? theme.primary : theme.text }]}>{String(value).padStart(2, '0')}</Text>
      <Text style={[styles.statLabel, { color: active ? theme.primary : theme.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: Platform.OS === 'ios' ? 52 : 24, paddingBottom: 28 },
  headerCard: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 16 },
  profileBlock: { alignItems: 'center', paddingVertical: 8 },
  avatarWrap: { width: 86, height: 86, borderRadius: 43, overflow: 'hidden', marginBottom: 10, backgroundColor: '#EEF3FF' },
  avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  userName: { fontSize: 18, fontWeight: '700' },
  userEmail: { marginTop: 2, fontSize: 12, opacity: 0.8 },
  statsRow: { marginTop: 14, flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  statPill: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '800', letterSpacing: 0.3, marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '600' },
  listCard: {
    marginTop: 18,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14 },
  rowIcon: { width: 30, height: 30, marginRight: 12, resizeMode: 'contain' },
  rowTextCol: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  rowSubtitle: { fontSize: 12 },
});
