import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { getMyLoyaltyBalance, getMyLoyaltyHistory, getLoyaltyRewards, redeemLoyaltyPoints, LoyaltyHistoryItem, LoyaltyRewardItem } from '../../../services/loyaltyService';
import NotificationUIService from '../../../services/notificationUIService';
import { AnalyticsService } from '../../../services/analyticsService';
import Colors from '../../../constants/Colors';

function useTheme() {
  const scheme = (Colors as any)?.scheme || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

export default function CashbackScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();

  // Map backend history types to user-friendly labels
  const getHistoryTypeLabel = React.useCallback((type: string) => {
    switch (type) {
      case 'SERVICE_COMPLETED':
        return t('wallet.history.service_completed', { defaultValue: 'Agendamento Completo' });
      default:
        // Fallback: try i18n key or prettify the raw type
        const pretty = (type || '').replace(/_/g, ' ').trim();
        const key = `wallet.history.${(type || '').toLowerCase()}`;
        return t(key as any, { defaultValue: pretty });
    }
  }, [t]);

  const balQuery = useQuery({ queryKey: ['loyaltyBalance'], queryFn: getMyLoyaltyBalance, staleTime: 60000 });

  const histQuery = useQuery<LoyaltyHistoryItem[]>({
    queryKey: ['loyaltyHistory'],
    queryFn: getMyLoyaltyHistory,
    staleTime: 30_000,
    onError: (err: any) => {
      const msg = err?.response?.data?.message || t('common.network_error', { defaultValue: 'Erro de rede.' });
      NotificationUIService.showError(msg, t('common.error', { defaultValue: 'Erro' }));
    }
  });

  const PAGE_SIZE = 10;
  const rewardsQuery = useInfiniteQuery<LoyaltyRewardItem[]>({
    queryKey: ['loyaltyRewards'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getLoyaltyRewards({ limit: PAGE_SIZE, offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      if (!Array.isArray(lastPage)) return undefined;
      return lastPage.length === PAGE_SIZE ? allPages.reduce((acc, p) => acc + (Array.isArray(p) ? p.length : 0), 0) : undefined;
    },
    staleTime: 60000
  });

  const isLoading = balQuery.isLoading || histQuery.isLoading;
  const error = balQuery.isError || histQuery.isError;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel={t('common.back', { defaultValue: 'Voltar' }) || 'Voltar'}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('wallet.cashback_title', { defaultValue: 'Pontos e Cashback' })}</Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}> 
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ marginTop: 8, color: theme.textMuted }}>{t('common.loading', { defaultValue: 'Carregando...' })}</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={36} color={theme.primary} />
          <Text style={{ marginTop: 8, color: theme.text }}>{t('common.network_error', { defaultValue: 'Erro de rede.' })}</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={[styles.balanceCard, { backgroundColor: theme.cardBackground }]}> 
            <Text style={[styles.balanceLabel, { color: theme.textMuted }]}>{t('wallet.current_points', { defaultValue: 'Seus pontos' })}</Text>
            <Text style={[styles.balanceValue, { color: theme.text }]}>{balQuery.data?.currentPoints ?? 0}</Text>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              onPress={() => { AnalyticsService.trackEvent('wallet_use_points_tap'); router.push('/(client)/coupons'); }}
              accessibilityLabel={t('wallet.use_points', { defaultValue: 'Usar pontos' }) || 'Usar pontos'}
            >
              <Ionicons name="pricetag-outline" size={16} color="#FFF" />
              <Text style={styles.primaryBtnText}>{t('wallet.use_points', { defaultValue: 'Usar pontos' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: theme.primary }]}
              onPress={() => { AnalyticsService.trackEvent('wallet_earn_points_tap'); router.push('/(client)/missions'); }}
              accessibilityLabel={t('wallet.earn_points', { defaultValue: 'Ganhar pontos' }) || 'Ganhar pontos'}
            >
              <Ionicons name="trophy-outline" size={16} color={theme.primary} />
              <Text style={[styles.secondaryBtnText, { color: theme.primary }]}>{t('wallet.earn_points', { defaultValue: 'Ganhar pontos' })}</Text>
            </TouchableOpacity>
          </View>

          { Array.isArray(rewardsQuery.data) && rewardsQuery.data.length > 0 && (
            <>
              <Text style={[styles.listTitle, { color: theme.text }]}>{t('wallet.rewards_title', { defaultValue: 'Resgates disponíveis' })}</Text>
              <FlatList
                data={rewardsQuery.data}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 4 }}
                renderItem={({ item }) => (
                  <View style={[styles.rewardCard, { backgroundColor: theme.cardBackground }]}> 
                    <Text style={[styles.rewardName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.rewardDesc, { color: theme.textMuted }]} numberOfLines={2}>{item.description || ''}</Text>
                    <Text style={[styles.rewardCost, { color: theme.text }]}>{item.costPoints} pts</Text>
                    <TouchableOpacity
                      style={[styles.redeemBtn, { backgroundColor: theme.primary }]}
                      onPress={async () => {
                        try {
                          AnalyticsService.trackEvent('wallet_reward_redeem_tap', { rewardId: item.id, costPoints: item.costPoints });
                          const res = await redeemLoyaltyPoints({ rewardId: item.id, pointsToRedeem: item.costPoints });
                          if (res?.success) {
                            NotificationUIService.showSuccess(
                              t('wallet.redeem_success', { defaultValue: 'Resgate concluído! Cupom gerado.' }),
                              t('common.success', { defaultValue: 'Sucesso' })
                            );
                            AnalyticsService.trackEvent('wallet_reward_redeem_success', { rewardId: item.id });
                            balQuery.refetch();
                            histQuery.refetch();
                          } else {
                            NotificationUIService.showError(t('wallet.redeem_error', { defaultValue: 'Não foi possível concluir o resgate.' }), t('common.error', { defaultValue: 'Erro' }));
                          }
                        } catch (err) {
                          const msg = (err as any)?.response?.data?.message || t('wallet.redeem_error', { defaultValue: 'Não foi possível concluir o resgate.' });
                          NotificationUIService.showError(msg as string, t('common.error', { defaultValue: 'Erro' }));
                        }
                      }}
                      accessibilityLabel={t('wallet.redeem', { defaultValue: 'Resgatar' }) || 'Resgatar'}
                    >
                      <Text style={styles.redeemBtnText}>{t('wallet.redeem', { defaultValue: 'Resgatar' })}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </>
          )}
          <Text style={[styles.listTitle, { color: theme.text }]}>{t('wallet.recent_points', { defaultValue: 'MovimentaÃ§Ãµes recentes' })}</Text>
          <FlatList
            data={((histQuery.data ?? []) as LoyaltyHistoryItem[]).slice(0, 25)}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <View style={[styles.historyItem, { backgroundColor: theme.cardBackground }]}> 
                <View>
                  <Text style={[styles.historyType, { color: theme.text }]}>
                    {getHistoryTypeLabel(item.type)}
                  </Text>
                  <Text style={[styles.historyDate, { color: theme.textMuted }]}>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</Text>
                </View>
                <Text style={[styles.historyPoints, { color: theme.primary }]}>{item.points} pts</Text>
              </View>
            )}
            ListEmptyComponent={(
              <View style={styles.centered}> 
                <Text style={{ color: theme.textMuted }}>{t('wallet.no_history', { defaultValue: 'Nenhuma movimentaÃ§Ã£o por enquanto.' })}</Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 80, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: 16, paddingBottom: 16, marginTop: 20, },
  balanceCard: { borderRadius: 12, padding: 16, marginTop: 8, marginBottom: 16 },
  balanceLabel: { fontSize: 14, fontWeight: '600' },
  balanceValue: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  primaryBtnText: { color: '#FFF', fontWeight: '800' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
  secondaryBtnText: { fontWeight: '800' },
  listTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  rewardCard: { borderRadius: 12, padding: 16, marginRight: 12, width: 200, minHeight: 120, justifyContent: 'space-between' },
  historyItem: { borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyType: { fontSize: 14, fontWeight: '700' },
  historyDate: { fontSize: 12 },
  historyPoints: { fontSize: 16, fontWeight: '800' },
  rewardName: { fontSize: 14, fontWeight: '800' },
  rewardDesc: { fontSize: 12, marginTop: 4 },
  rewardCost: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  redeemBtn: { marginTop: 8, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  redeemBtnText: { color: '#FFF', fontWeight: '800' },
});










