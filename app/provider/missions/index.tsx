import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    claimMission,
    getMyMissions,
    MissionItem as MissionItemType,
} from '../../../services/missionService';

import MissionList from '../../../components/missions/MissionList';
import { MissionProgressSnack } from '../../../components/missions/MissionProgressSnack';
import Toast from '../../../components/Toast';

const AppColors = {
  background: '#FFFFFF',
  textBody: '#1A2538',
  primaryInteractive: '#007AFF',
};

export default function ProviderMissionsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<MissionItemType[]>([]);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      const data = await getMyMissions();
      setItems(data);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: t('common.error'), text2: err?.message || t('common.network_error') });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 640, delay: 80, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
    load();
  }, [headerAnim, contentAnim, load]);

  const handleClaim = useCallback(async (missionId: string) => {
    try {
      const res = await claimMission(missionId);
      let msg = t('missions.claim_success');
      if (res.rewardType === 'COUPON') msg = t('missions.claim_success_coupon');
      if (res.rewardType === 'POINTS') msg = t('missions.claim_success_points', { points: res.pointsGranted || 0 });
      Toast.show({ type: 'success', text1: t('common.success'), text2: msg });
      load();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: t('common.error'), text2: e?.message || t('missions.claim_error') });
    }
  }, [load, t]);

  const title = useMemo(() => 'Minhas Conquistas', []);

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: Platform.OS === 'ios' ? insets.top + 20 : 20 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? insets.top + 10 : 10 }]}>
      <Stack.Screen
        options={{
          title,
          headerShown: true,
          headerTitleAlign: 'center',
          headerTitleStyle: { fontFamily: 'Montserrat-SemiBold', fontSize: 20, color: AppColors.textBody },
          headerStyle: { backgroundColor: AppColors.background },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: AppColors.primaryInteractive,
        }}
      />

      <Animated.View style={{ opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        <MissionList items={items} onClaim={handleClaim} />
      </Animated.View>

      <MissionProgressSnack items={items} />

      <Animated.View style={[styles.fab, { opacity: headerAnim }]}>
        <Ionicons name="trophy-outline" size={20} color="#FFF" />
        <Text style={styles.fabText}>Desempenho</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#7A8599' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: '#6C5CE7',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 0,
  },
  fabText: { color: '#FFF', fontWeight: '700' },
});
