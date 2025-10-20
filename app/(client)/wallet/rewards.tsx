import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { getLoyaltyRewards, LoyaltyRewardItem, redeemLoyaltyPoints } from '../../../services/loyaltyService';
import NotificationUIService from '../../../services/notificationUIService';
import { AnalyticsService } from '../../../services/analyticsService';
import Colors from '../../../constants/Colors';

function useTheme() {
  const scheme = (Colors as any)?.scheme || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

const PAGE_SIZE = 12;

export default function RewardsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [type, setType] = useState<string | undefined>(undefined);
  const [queryText, setQueryText] = useState<string>('');

  const query = useInfiniteQuery({
    queryKey: ['loyaltyRewards', { type, q: queryText }],
    initialPageParam: 0,
    queryFn: ({ pageParam = 0 }: { pageParam?: number }) => getLoyaltyRewards({ limit: PAGE_SIZE, offset: pageParam, type, q: queryText || undefined }),
    getNextPageParam: (lastPage, allPages) => {
      if (!Array.isArray(lastPage)) return undefined;
      const loaded = allPages.reduce((acc: number, p: any) => acc + (Array.isArray(p) ? p.length : 0), 0);
      return lastPage.length === PAGE_SIZE ? loaded : undefined;
    },
    staleTime: 60_000,
  });

  const data: LoyaltyRewardItem[] = useMemo(() => ((query.data?.pages || []) as LoyaltyRewardItem[][]).flat(), [query.data?.pages]);

  const filters = [
    { key: 'ALL', label: t('wallet.filter_all', { defaultValue: 'Todos' }), value: undefined },
    { key: 'COUPON', label: t('wallet.filter_coupons', { defaultValue: 'Cupons' }), value: 'COUPON' },
    { key: 'CASHBACK', label: t('wallet.filter_cashback', { defaultValue: 'Cashback' }), value: 'CASHBACK' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel={t('common.back', { defaultValue: 'Voltar' }) || 'Voltar'}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('wallet.rewards_all_title', { defaultValue: 'Recompensas' })}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={queryText}
          onChangeText={setQueryText}
          placeholder={t('wallet.search_placeholder', { defaultValue: 'Buscar recompensas...' }) as string}
          placeholderTextColor={theme.textMuted}
          returnKeyType="search"
          onSubmitEditing={() => { queryClient.removeQueries({ queryKey: ['loyaltyRewards'] }); query.refetch(); }}
        />
        {!!queryText && (
          <TouchableOpacity onPress={() => { setQueryText(''); queryClient.removeQueries({ queryKey: ['loyaltyRewards'] }); query.refetch(); }} accessibilityLabel={t('common.clear', { defaultValue: 'Limpar' }) as string}>
            <Ionicons name="close-circle" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            onPress={() => { 
              setType(f.value);
              queryClient.removeQueries({ queryKey: ['loyaltyRewards'] });
              query.refetch();
            }}
            style={[styles.filterChip, { borderColor: theme.primary, backgroundColor: f.value === type ? theme.primary : 'transparent' }]}
          >
            <Text style={{ color: f.value === type ? '#FFF' : theme.primary, fontWeight: '700' }}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {query.isLoading ? (
        <View style={styles.centered}> 
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          onEndReachedThreshold={0.2}
          onEndReached={() => { if (query.hasNextPage && !query.isFetchingNextPage) { query.fetchNextPage(); } }}
          ListFooterComponent={query.isFetchingNextPage ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : null}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rewardName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                {!!item.description && <Text style={[styles.rewardDesc, { color: theme.textMuted }]} numberOfLines={2}>{item.description}</Text>}
                <Text style={[styles.rewardCost, { color: theme.text }]}>{item.costPoints} pts</Text>
              </View>
              <TouchableOpacity
                style={[styles.redeemBtn, { backgroundColor: theme.primary }]}
                onPress={async () => {
                  try {
                    AnalyticsService.trackEvent('wallet_reward_redeem_tap', { rewardId: item.id, costPoints: item.costPoints });
                    const res = await redeemLoyaltyPoints({ rewardId: item.id, pointsToRedeem: item.costPoints });
                    if (res?.success) {
                      NotificationUIService.showSuccess(t('wallet.redeem_success', { defaultValue: 'Resgate concluído! Cupom gerado.' }), t('common.success', { defaultValue: 'Sucesso' }));
                      AnalyticsService.trackEvent('wallet_reward_redeem_success', { rewardId: item.id });
                    } else {
                      NotificationUIService.showError(t('wallet.redeem_error', { defaultValue: 'Não foi possível concluir o resgate.' }), t('common.error', { defaultValue: 'Erro' }));
                    }
                  } catch (err: any) {
                    const msg = err?.response?.data?.message || t('wallet.redeem_error', { defaultValue: 'Não foi possível concluir o resgate.' });
                    NotificationUIService.showError(msg, t('common.error', { defaultValue: 'Erro' }));
                  }
                }}
                accessibilityLabel={t('wallet.redeem', { defaultValue: 'Resgatar' }) || 'Resgatar'}
              >
                <Text style={styles.redeemBtnText}>{t('wallet.redeem', { defaultValue: 'Resgatar' })}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  card: { flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 12 },
  rewardName: { fontSize: 15, fontWeight: '800' },
  rewardDesc: { fontSize: 12, marginTop: 2 },
  rewardCost: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  redeemBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  redeemBtnText: { color: '#FFF', fontWeight: '800' },
});
