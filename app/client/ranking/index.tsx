import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    FlatList,
    Image,
    ImageSourcePropType,
    Platform,
    RefreshControl,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

import Colors from '../../../constants/Colors';
import RankingService from '../../../services/rankingService';
import type { LeaderboardEntry, LeaderboardPeriod } from '../../../types/backend/ranking';

// seus componentes existentes
import { RankingBadge } from '../../../components/ranking/RankingBadge';
import RankingCard from '../../../components/ranking/RankingCard';
import { SLAResponseChip } from '../../../components/ranking/SLAResponseChip';

// ---------- 3D Icons ----------
const Icons3D = {
  crown: require('../../../assets/images/3d/crown.png'),
  trophy: require('../../../assets/images/3d/trophy-gold.png'),
  stats: require('../../../assets/images/3d/uptrend.png'),
} satisfies Record<string, ImageSourcePropType>;

const Icon3D = ({ src, size = 20, style }: { src: ImageSourcePropType; size?: number; style?: any }) => (
  <Image source={src} style={[{ width: size, height: size }, style]} resizeMode="contain" />
);

// ---------- Theming ----------
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const t = (Colors as any)[scheme] || (Colors as any).light;
  return t as typeof Colors.light;
}
const withAlpha = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const i = parseInt(f, 16);
  const r = (i >> 16) & 255, g = (i >> 8) & 255, b = i & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// ---------- Small UI helpers ----------
const DeltaPill = ({ delta }: { delta?: number }) => {
  if (delta === undefined || delta === 0) {
    return (
      <View style={[styles.deltaPill, { backgroundColor: withAlpha('#9CA3AF', 0.18) }]}>
        <Ionicons name="remove" size={12} color="#796b80ff" />
      </View>
    );
  }
  const up = delta > 0;
  return (
    <View
      style={[
        styles.deltaPill,
        { backgroundColor: up ? withAlpha('#059669', 0.16) : withAlpha('#DC2626', 0.16) },
      ]}
    >
      <Ionicons name={up ? 'arrow-up' : 'arrow-down'} size={12} color={up ? '#059669' : '#DC2626'} />
      <Text style={{ marginLeft: 4, color: up ? '#059669' : '#DC2626', fontWeight: '700', fontSize: 12 }}>
        {Math.abs(delta)}
      </Text>
    </View>
  );
};

// ---------- Screen ----------
export default function RankingScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [period, setPeriod] = useState<LeaderboardPeriod>('day');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList<LeaderboardEntry>>(null);

  const top3 = useMemo(() => data.slice(0, 3), [data]);
  const rest = useMemo(() => data.slice(3), [data]);

  // Placeholder images for podium avatars
  const podiumAvatarPlaceholders = useMemo(() => [
    'https://randomuser.me/api/portraits/men/32.jpg', // Exemplo para 1º lugar
    'https://randomuser.me/api/portraits/women/44.jpg', // Exemplo para 2º lugar
    'https://randomuser.me/api/portraits/men/50.jpg',   // Exemplo para 3º lugar
    'https://randomuser.me/api/portraits/women/61.jpg',
    'https://randomuser.me/api/portraits/men/73.jpg',
    'https://randomuser.me/api/portraits/women/22.jpg',
    'https://randomuser.me/api/portraits/men/11.jpg',
  ], []);

  const load = useCallback(async (p: LeaderboardPeriod) => {
    try {
      setLoading(true);
      const cached = RankingService.getCached(p);
      if (cached) {
        // Certifica-se de que os dados são sempre ordenados por rank
        setData([...cached.top].sort((a, b) => a.rank - b.rank));
        setMyRank(cached.myRank ?? null);
      }
      const res = await RankingService.getLeaderboard(p);
      // Certifica-se de que os dados são sempre ordenados por rank
      setData([...res.top].sort((a, b) => a.rank - b.rank));
      setMyRank(res.myRank ?? null);
      // prefetch vizinhos
      RankingService.prefetchNeighbors(p);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    Animated.timing(heroAnim, { toValue: 1, delay: 100, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [headerAnim, heroAnim]);

  useEffect(() => { load(period); }, [period, load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(period);
  }, [load, period]);

  const jumpToMe = useCallback(() => {
    if (!myRank) return;
    const idx = data.findIndex(e => e.userId === myRank.userId);
    if (idx >= 0) listRef.current?.scrollToIndex({ index: Math.max(idx - 1, 0), animated: true });
  }, [data, myRank]);

  const shareMyRank = useCallback(async () => {
    if (!myRank) return;
    const msg = `Estou na posição ${myRank.rank} com ${myRank.score} pontos no ranking do LimpeJá!`;
    try {
      await Share.share({ message: msg });
    } catch { /* ignore */ }
  }, [myRank]);

  // ---------------- Header/Hero
  const sizes = { first: 92, others: 72 };

  const renderPodiumAvatar = (e: LeaderboardEntry, size: number, crown?: boolean) => {
    // Determina a fonte da imagem: avatarUrl se existir, senão um placeholder baseado no rank
    const avatarSource = e.avatarUrl
      ? { uri: e.avatarUrl }
      : { uri: podiumAvatarPlaceholders[e.rank - 1] || 'https://randomuser.me/api/portraits/lego/1.jpg' }; // Fallback

    return (
      <View style={{ alignItems: 'center' }}>
        <View style={[styles.avatarWrap, { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2, backgroundColor: withAlpha('#000', 0.08) }]}>
          <Image
            source={avatarSource}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              overflow: 'hidden',
              backgroundColor: theme.lightGrey, // Cor de fundo caso a imagem não carregue
              borderWidth: 2,
              borderColor: '#9b3ffdd3', // Cor da borda do avatar no pódio
            }}
            resizeMode="cover"
          />
        </View>
        {crown && (
          // Ícone 3D (coroa) no lugar do trophy linear
          <Icon3D src={Icons3D.crown} size={60} style={{ marginTop: -38, top: 25, marginBottom: 4 }} />
        )}
        {/* Alterado para azul */}
        <Text style={[styles.podiumScore, { color: '#9b3ffdd3' }]}>{e.score}</Text>
        {/* Alterado para azul com opacidade */}
        <Text style={[styles.podiumHandle, { color: withAlpha('#007BFF', 0.8) }]}>{e.handle || e.displayName}</Text>
      </View>
    );
  };

  const Tabs = () => (
    <View style={styles.tabs}>
      {[
        { key: 'day', label: 'Hoje' },
        { key: 'week', label: 'Esta Semana' },
        { key: 'month', label: 'Este Mês' },
      ].map(t => {
        const k = t.key as LeaderboardPeriod;
        const active = period === k;
        return (
          <TouchableOpacity
            key={k}
            onPress={() => setPeriod(k)}
            style={[styles.tabBtn, active && { backgroundColor: withAlpha('#FFF', 0.2) }]}
          >
            {/* Alterado para azul com opacidade */}
            <Text style={[styles.tabText, { color: withAlpha('#007BFF', 0.6), fontWeight: active ? '800' : '600' }]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const HeaderHero = () => (
    <Animated.View
      style={[
        styles.hero,
        {
          opacity: heroAnim,
          transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(173, 216, 230, 0.7)', 'rgba(74, 145, 226, 0.38)', 'rgba(173, 216, 230, 0.7)']} // Gradiente azul claro, azul, azul claro com opacidade
        start={{ x: 0, y: 0.5 }} // Início horizontal centralizado
        end={{ x: 1, y: 0.5 }}   // Fim horizontal centralizado
        style={styles.heroGrad}
      >
        {/* Marca d’água 3D sutil no canto superior direito */}
        <Image
          source={Icons3D.crown}
          style={{ position: 'absolute', right: 12, top: Platform.OS === 'ios' ? 16 : 8, width: 56, height: 56, opacity: 0.08 }}
          resizeMode="contain"
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Alterado para azul */}
          <Text style={[styles.heroTitle, { color: '#c933f2af' }]}>RANKING</Text>
          {/* 3D “stats” no lugar do stats-chart linear */}
          <Icon3D src={Icons3D.stats} size={20} />
        </View>

        <Tabs />

        <View style={styles.podium}>
          {top3[1] ? renderPodiumAvatar(top3[1], sizes.others, false) : <View style={{ width: sizes.others }} />}
          {top3[0] ? renderPodiumAvatar(top3[0], sizes.first, true) : <View style={{ width: sizes.first }} />}
          {top3[2] ? renderPodiumAvatar(top3[2], sizes.others, false) : <View style={{ width: sizes.others }} />}
        </View>

        {top3[0] && (
          <View style={styles.heroMetaRow}>
            {!!top3[0].slaResponseRate && !!top3[0].avgResponseMinutes && (
              <SLAResponseChip rate={top3[0].slaResponseRate!} avgResponseMin={top3[0].avgResponseMinutes!} />
            )}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {top3[0].badges?.map((b, i) => <RankingBadge key={`${b}-${i}`} type={b} />)}
            </View>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );

  // ---------------- List
  const ITEM_HEIGHT = 84; // altura aproximada do RankingCard para getItemLayout
  const keyExtractor = (it: LeaderboardEntry) => it.userId;

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
      <RankingCard
        rank={item.rank}
        name={item.displayName}
        score={item.score}
        avatarUrl={item.avatarUrl ?? undefined}
        isCurrentUser={!!item.isCurrentUser}
        delay={80 + index * 30}
        // Aplicar os estilos de glassmorphism aqui
        style={[
          styles.glassmorphismCard,
          // Garante que o fundo do RankingCard seja transparente para que o efeito glassmorphism seja visível
          { backgroundColor: 'transparent' }
        ]}
      />
      {/* delta pill sobreposto no canto superior direito do card */}
      <View style={styles.deltaOverlay}><DeltaPill delta={item.delta} /></View>
    </View>
  );

  // <- assinatura corrigida para ArrayLike
  const getItemLayout = (
    _data: ArrayLike<LeaderboardEntry> | null | undefined,
    index: number
  ) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 8, color: theme.textMuted }}>Carregando ranking…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Ranking', headerShown: false }} />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
            backgroundColor: '#ffffffff', // Fundo branco
            ...Platform.select({
              ios: { // Sombra robusta para iOS
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
              },
              android: { // Sombra robusta para Android
                elevation: 0,
              },
            }),
          },
        ]}
      >
        <TouchableOpacity hitSlop={10} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#000000" /> {/* Seta preta */}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#617df69f' }]}>Ranking</Text> {/* Título preto */}
        {/* 3D trophy no lugar do trophy linear */}
        <Icon3D src={Icons3D.trophy} size={20} />
      </Animated.View>

      {/* Lista com FlatList */}
      <FlatList
        ref={listRef}
        ListHeaderComponent={<HeaderHero />}
        data={rest}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      {/* Minha posição destacada (se estiver fora do top 3) */}
      {myRank && myRank.rank > 3 && (
        <View style={styles.myRankBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="person-circle" size={20} color="#FFF" />
            <Text style={styles.myRankText}>
              Você está em <Text style={{ fontWeight: '900' }}>#{myRank.rank}</Text> com {myRank.score} pontos
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={jumpToMe} style={styles.myRankBtn}>
              <Ionicons name="locate" size={14} color="#0A84FF" />
              <Text style={styles.myRankBtnText}>Pular para mim</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={shareMyRank} style={styles.myRankBtn}>
              <Ionicons name="share-social" size={14} color="#0A84FF" />
              <Text style={styles.myRankBtnText}>Compartilhar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 12,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontWeight: '800', letterSpacing: 0.6 }, // Cor definida inline

  hero: { margin: 16, paddingHorizontal: 25, marginBottom: 10, borderRadius: 24, overflow: 'hidden' },
  heroGrad: { padding: 16, borderRadius: 24 },
  heroTitle: {
    // color: '#FFF', // Removido para ser definido inline
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    opacity: 0.9
  },

  tabs: { flexDirection: 'row', gap: 8, marginTop: 10 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  tabText: {
    fontSize: 12,
    // color: '#FFF', // Removido para ser definido inline
  },

  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', marginTop: 18 },
  avatarWrap: { justifyContent: 'center', alignItems: 'center', borderRadius: 999 },

  podiumScore: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '800',
    // color: '#FFF' // Removido para ser definido inline
  },
  podiumHandle: {
    fontSize: 12,
    marginTop: 2,
    // color: withAlpha('#FFF', 0.8) // Removido para ser definido inline
  },

  heroMetaRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // delta pill
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  deltaOverlay: {
    position: 'absolute',
    top: 4,
    right: 22,
  },

  // “Minha posição” sticky bar
  myRankBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 0 },
    }),
  },
  myRankText: { color: '#FFF', marginLeft: 6 },
  myRankBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  myRankBtnText: { color: '#0A84FF', fontWeight: '800', fontSize: 12 },

  // Estilos Glassmorphism para o card
  glassmorphismCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // Fundo translúcido
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Borda translúcida
    borderRadius: 20, // Raio da borda do CSS original
    // Sombras para simular profundidade
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25, // Opacidade da sombra do CSS original
        shadowRadius: 10, // Raio da sombra ajustado para React Native (o 32px do CSS é muito grande)
      },
      android: {
        elevation: 0, // Elevação para Android para simular sombra
      },
    }),
  },
});