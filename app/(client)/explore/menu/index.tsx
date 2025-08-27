// LimpeJaApp/app/(client)/menu/index.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  SectionList,
  SectionListData,
  StatusBar,
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

// =================== THEME ===================
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

// =================== ÍCONES 3D ===================
const Icons3D = {
  profile: require('../../../../assets/images/3d/perfil.png'),
  ticket: require('../../../../assets/images/3d/ticket.png'),
  cashback: require('../../../../assets/images/3d/cashback.png'),
  ranking: require('../../../../assets/images/3d/crown.png'),
  missions: require('../../../../assets/images/3d/step1-card-profile.png'),
  referral: require('../../../../assets/images/3d/gift2.png'),
  metrics: require('../../../../assets/images/3d/uptrend.png'),
  support: require('../../../../assets/images/3d/support.png'),
  safety: require('../../../../assets/images/3d/security.png'),
  privacy: require('../../../../assets/images/3d/privacidade.png'),
} satisfies Record<string, ImageSourcePropType>;

type MenuItem = {
  key: string;
  title: string;
  subtitle?: string;
  icon: ImageSourcePropType;
  route: string | (() => void);
  testID?: string;
};

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
          width: 100,
          transform: [{ translateX }],
          opacity: 0.6,
        }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.7)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

// =================== ITEM DE LISTA ===================
function RowItem({
  item,
  onPress,
  theme,
  pressedBg,
}: {
  item: MenuItem;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>;
  pressedBg: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Haptics.selectionAsync()}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? pressedBg : 'transparent' }]}
      android_ripple={Platform.OS === 'android' ? { color: pressedBg } : undefined}
      hitSlop={8}
      testID={item.testID || `menu-item-${item.key}`}
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
  );
}

// =================== PILL DE ESTATÍSTICA ===================
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
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [
        styles.statPill,
        {
          backgroundColor: active ? (theme.primaryLight || '#DCEBFF') : theme.cardBackground,
          borderColor: active ? (theme.primary || '#3B82F6') : theme.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      android_ripple={Platform.OS === 'android' ? { color: 'rgba(0,0,0,0.06)' } : undefined}
    >
      <Text style={[styles.statValue, { color: active ? theme.primary : theme.text }]}>
        {String(value).padStart(2, '0')}
      </Text>
      <Text style={[styles.statLabel, { color: active ? theme.primary : theme.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

// =================== TELA ===================
export default function ClientMenuScreen() {
  const router = useRouter();
  const theme = useTheme();
  const scheme = useColorScheme?.() || 'light';

  const pressedBg =
    (Colors as any)[scheme]?.listItemPressed ||
    (scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Animações de entrada respeitando "reduzir movimento"
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

  // Nome/email/avatar com fallbacks
  const userName =
    profile?.clientDetails?.fullName ||
    profile?.providerDetails?.fullName ||
    profile?.fullName ||
    'Cliente';
  const userEmail = profile?.email || '—';
  const avatarUri =
    profile?.avatarUrl ||
    profile?.clientDetails?.avatarUrl ||
    profile?.providerDetails?.avatarUrl;

  // Estatísticas (fallbacks)
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

  // ===== Seções (mais conforto cognitivo) =====
  const sections: Array<
    SectionListData<MenuItem, { title: string }>
  > = useMemo(
    () => [
      {
        title: 'Benefícios',
        data: [
          { key: 'coupons',  title: 'Meus Cupons',     subtitle: 'Descontos e promoções',          icon: Icons3D.ticket,   route: '/(client)/coupons' as const },
          { key: 'missions', title: 'Missões',         subtitle: 'Conclua tarefas e ganhe pontos', icon: Icons3D.missions, route: '/(client)/missions' as const },
          { key: 'ranking',  title: 'Ranking',         subtitle: 'Veja o quadro de líderes',       icon: Icons3D.ranking,  route: '/(client)/ranking' as const },
          { key: 'cashback', title: 'Cashback',        subtitle: 'Acompanhe seus retornos',        icon: Icons3D.cashback, route: '/(client)/wallet/cashback' as const },
          { key: 'referral', title: 'Indicações',      subtitle: 'Convide amigos e ganhe bônus',   icon: Icons3D.referral, route: '/(client)/referrals' as const },
          { key: 'metrics',  title: 'Minhas Métricas', subtitle: 'Pontos, streaks e histórico',    icon: Icons3D.metrics,  route: '/(client)/metrics' as const },
        ],
      },
      {
        title: 'Suporte & Segurança',
        data: [
          { key: 'support', title: 'Suporte',   subtitle: 'Abra um chamado ou chat',        icon: Icons3D.support, route: '/(common)/support' as const },
          { key: 'safety',  title: 'Segurança', subtitle: 'SOS e Central de Segurança',     icon: Icons3D.safety,  route: '/(common)/safety' as const },
        ],
      },
      {
        title: 'Preferências',
        data: [
          { key: 'settings', title: 'Configurações', subtitle: 'Privacidade e preferências', icon: Icons3D.privacy, route: '/(client)/settings' as const },
        ],
      },
    ],
    [],
  );

  const handlePress = (route: MenuItem['route']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (typeof route === 'string') return (router.push as any)(route);
    route?.();
  };

  // ===== Header do cartão (perfil + stats) =====
  const HeaderCard = (
    <Animated.View style={{ opacity: headerFade, transform: [{ translateY: headerTranslate }] }}>
      <LinearGradient
        colors={[theme.primaryLight, theme.cardBackground]}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerCard, { borderColor: theme.border }]}
      >
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={styles.iconButton}
            android_ripple={Platform.OS === 'android' ? { color: pressedBg, borderless: true } : undefined}
          >
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </Pressable>

          <Text style={[styles.title, { color: theme.text }]}>Menu</Text>

          <Pressable
            onPress={() => router.push('/(client)/profile' as any)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Ir para perfil"
            style={styles.iconButton}
            android_ripple={Platform.OS === 'android' ? { color: pressedBg, borderless: true } : undefined}
          >
            <Ionicons name="settings-outline" size={20} color={theme.textMuted} />
          </Pressable>
        </View>

        <View style={styles.profileBlock}>
          <View style={styles.avatarWrap}>
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
              <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
                {userName}
              </Text>
              <Text style={[styles.userEmail, { color: theme.textMuted }]} numberOfLines={1}>
                {userEmail}
              </Text>
            </>
          )}
        </View>

        <View style={styles.statsRow}>
          <StatPill
            label="Ativas"
            value={statActive}
            active
            theme={theme}
            onPress={() => router.push('/(client)/missions' as any)}
          />
          <StatPill
            label="Pendentes"
            value={statPending}
            theme={theme}
            onPress={() => router.push('/(client)/missions' as any)}
          />
          <StatPill
            label="Concluídas"
            value={statDone}
            theme={theme}
            onPress={() => router.push('/(client)/missions' as any)}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <SectionList
        sections={sections}
        keyExtractor={(it) => it.key}
        ListHeaderComponent={HeaderCard}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.sectionListContent}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.border }]} />}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeaderWrap]}>
            <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item, index, section }) => {
          const isFirst = index === 0;
          const isLast = index === section.data.length - 1;
          return (
            <View
              style={[
                styles.rowContainer,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                  borderTopLeftRadius: isFirst ? 16 : 0,
                  borderTopRightRadius: isFirst ? 16 : 0,
                  borderBottomLeftRadius: isLast ? 16 : 0,
                  borderBottomRightRadius: isLast ? 16 : 0,
                },
              ]}
            >
              <RowItem
                item={item}
                onPress={() => handlePress(item.route)}
                pressedBg={pressedBg}
                theme={theme}
              />
            </View>
          );
        }}
        SectionSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// =================== STYLES ===================
const styles = StyleSheet.create({
  screen: { flex: 1 },
  sectionListContent: { padding: 16, paddingTop: Platform.OS === 'ios' ? 52 : 24, paddingBottom: 28 },

  // Header
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
  avatarWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#EEF3FF',
  },
  avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  userName: { fontSize: 18, fontWeight: '700', marginTop: 6 },
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

  // Seções / Lista
  sectionHeaderWrap: { paddingHorizontal: 2, paddingVertical: 8 },
  sectionHeader: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  rowContainer: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 56, opacity: 0.6 },

  // Item
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14, // >= 48px de altura total com paddings -> conforto
    paddingHorizontal: 14,
    minHeight: 48,
  },
  rowIcon: { width: 30, height: 30, marginRight: 12, resizeMode: 'contain' },
  rowTextCol: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  rowSubtitle: { fontSize: 12 },
});
