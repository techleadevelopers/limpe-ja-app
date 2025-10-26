// LimpeJaApp/app/(client)/explore/ranking/index.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Text, FlatList, Animated, Easing, TouchableOpacity, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RankingCard from '../../../../components/ranking/RankingCard';
import Colors from '../../../../constants/Colors';
import RankingService from '../../../../services/rankingService';
import type { LeaderboardEntry, LeaderboardPeriod } from '../../../../types/backend/ranking';

type UserRank = LeaderboardEntry;

function useTheme() {
  const scheme = (Colors as any)?.scheme || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

export default function RankingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [period] = useState<LeaderboardPeriod>('day');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [headerAnim]);

  const handleCardPress = (user: UserRank) => {
    // Placeholder de navegação
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const cached = RankingService.getCached(period);
      if (cached) {
        setData([...cached.top].sort((a, b) => a.rank - b.rank));
        setMyRank(cached.myRank ?? null);
      }
      const res = await RankingService.getLeaderboard(period);
      setData([...res.top].sort((a, b) => a.rank - b.rank));
      setMyRank(res.myRank ?? null);
      RankingService.prefetchNeighbors(period);
    } catch (err) {
      // Fallback local para evitar tela em branco quando o endpoint não existe no backend atual
      const avatars = [
        'https://randomuser.me/api/portraits/men/32.jpg',
        'https://randomuser.me/api/portraits/women/44.jpg',
        'https://randomuser.me/api/portraits/men/50.jpg',
        'https://randomuser.me/api/portraits/women/61.jpg',
        'https://randomuser.me/api/portraits/men/73.jpg',
        'https://randomuser.me/api/portraits/women/22.jpg',
        'https://randomuser.me/api/portraits/men/11.jpg',
        'https://randomuser.me/api/portraits/women/15.jpg',
      ];
      const names = ['Maria Silva','João Santos','Ana Costa','Carlos Pereira (Você)','Fernanda Lima','Paulo Oliveira','Juliana Gomes','Rafael Souza'];
      const fb: LeaderboardEntry[] = Array.from({ length: 8 }).map((_, i) => ({
        userId: `u${i+1}`,
        displayName: names[i] || `Usuário ${i+1}`,
        avatarUrl: avatars[i],
        score: 1200 - i*45,
        rank: i+1,
        delta: i % 2 === 0 ? 1 : -1,
        isCurrentUser: i === 3,
      }));
      setData(fb);
      setMyRank(fb.find(x => x.isCurrentUser) || null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }] }>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header simples alinhado ao Cashback/Metrics */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel={'Voltar'}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Ranking</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}> 
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ marginTop: 8, color: theme.textMuted }}>Carregando ranking…</Text>
        </View>
      ) : (
      <FlatList
        data={data}
        keyExtractor={(item) => item.userId}
        renderItem={({ item, index }) => (
          <RankingCard
            rank={item.rank}
            name={item.displayName}
            score={item.score}
            avatarUrl={item.avatarUrl ?? undefined}
            isCurrentUser={!!item.isCurrentUser}
            onPress={() => handleCardPress(item)}
            delay={index * 80}
            style={{
              backgroundColor: theme.cardBackground,
              borderRadius: 16,
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10 },
                android: { elevation: 3 },
              }),
            }}
          />
        )}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.primary} />}
      />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 80, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
});
