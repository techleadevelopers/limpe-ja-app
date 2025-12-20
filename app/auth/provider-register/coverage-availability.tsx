import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

import { AppColors } from '../../../constants/appStyles';
import { saveProviderSettings, bulkSetAvailability, TimeRange } from '../../../services/providerSettingsService';
import { AUTH_ROUTES } from '../../routes';

const MIN_KM = 1;
const MAX_KM = 60;

function formatDateLabel(d: Date) {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${days[d.getDay()]} ${dd}/${mm}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function CoverageAvailabilityStep() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const [radiusKm, setRadiusKm] = useState<number>(15);

  // Próximos 10 dias com toggles para manhã/tarde
  const upcoming = useMemo(() => {
    const base = new Date();
    return new Array(10).fill(null).map((_, idx) => addDays(base, idx));
  }, []);

  const [selected, setSelected] = useState<Record<string, { morning: boolean; afternoon: boolean }>>(() => {
    const initial: Record<string, { morning: boolean; afternoon: boolean }>= {};
    return initial;
  });

  const toggle = (dateKey: string, key: 'morning'|'afternoon') => {
    setSelected(prev => ({
      ...prev,
      [dateKey]: { morning: prev[dateKey]?.morning ?? false, afternoon: prev[dateKey]?.afternoon ?? false, [key]: !(prev[dateKey]?.[key] ?? false) },
    }));
    try { Haptics.selectionAsync(); } catch {}
  };

  const onMinus = () => { setRadiusKm(v => Math.max(MIN_KM, v - (v >= 20 ? 5 : 1))); try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {} };
  const onPlus = () => { setRadiusKm(v => Math.min(MAX_KM, v + (v >= 20 ? 5 : 1))); try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {} };

  const handleContinue = async () => {
    try {
      await saveProviderSettings({ serviceRadiusKm: radiusKm });

      // Monta payload de disponibilidades simples (manhã: 08-12, tarde: 14-18)
      const dates = Object.keys(selected)
        .filter(k => selected[k]?.morning || selected[k]?.afternoon)
        .map(k => {
          const ranges: TimeRange[] = [];
          if (selected[k]?.morning) ranges.push({ start: '08:00', end: '12:00' });
          if (selected[k]?.afternoon) ranges.push({ start: '14:00', end: '18:00' });
          return { date: k, ranges };
        });
      if (dates.length > 0) {
        await bulkSetAvailability({ dates });
      }

      Toast.show({ type: 'success', text1: 'Preferências salvas', text2: 'Você pode ajustar quando quiser nas configurações.' });

      // Próxima etapa do fluxo (padrão: VERIFY ACCOUNT)
      const defaultNextPath = AUTH_ROUTES.PROVIDER_VERIFY_ACCOUNT;
      const nextPath = typeof params?.next === 'string' && params.next ? params.next : defaultNextPath;
      router.push(nextPath);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Erro', text2: err?.message || 'Não foi possível salvar suas preferências.' });
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Cobertura e Agenda', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Onde e quando você atende?</Text>
        <Text style={styles.subtitle}>Ajuste seu raio de atendimento e marque horários disponíveis de forma rápida. Você poderá editar depois.</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Raio de atendimento (km)</Text>
          <View style={styles.rowCenter}>
            <Pressable style={[styles.stepper, styles.btn]} onPress={onMinus}>
              <Text style={styles.btnText}>-</Text>
            </Pressable>
            <Text style={styles.radiusValue}>{radiusKm} km</Text>
            <Pressable style={[styles.stepper, styles.btn]} onPress={onPlus}>
              <Text style={styles.btnText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.helper}>Dica: 10–15 km em áreas urbanas costuma funcionar bem.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Disponibilidades (próximos dias)</Text>
          {upcoming.map(d => {
            const key = d.toISOString().slice(0,10);
            const state = selected[key] ?? { morning: false, afternoon: false };
            return (
              <View key={key} style={styles.dayRow}>
                <Text style={styles.dayLabel}>{formatDateLabel(d)}</Text>
                <View style={styles.chipsRow}>
                  <Pressable onPress={() => toggle(key, 'morning')} style={[styles.chip, state.morning && styles.chipSelected]}>
                    <Text style={[styles.chipText, state.morning && styles.chipTextSelected]}>08–12</Text>
                  </Pressable>
                  <Pressable onPress={() => toggle(key, 'afternoon')} style={[styles.chip, state.afternoon && styles.chipSelected]}>
                    <Text style={[styles.chipText, state.afternoon && styles.chipTextSelected]}>14–18</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
          <Text style={styles.helper}>Você poderá detalhar horários depois nas configurações.</Text>
        </View>

        <Pressable style={styles.cta} onPress={handleContinue}>
          <Text style={styles.ctaText}>Continuar</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.backgroundLight },
  content: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: AppColors.textTitle, marginBottom: 12 },
  subtitle: { fontSize: 12, color: AppColors.textAuxiliary, marginBottom: 10 },
  card: { backgroundColor: AppColors.white, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: AppColors.borderNeutral },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: AppColors.textBody, marginBottom: 8 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepper: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.accentLight, borderWidth: 1, borderColor: AppColors.primaryInteractive + '55' },
  btn: { marginHorizontal: 12 },
  btnText: { color: AppColors.primaryInteractive, fontSize: 18, fontWeight: '800' },
  radiusValue: { fontSize: 16, fontWeight: '800', color: AppColors.textTitle },
  helper: { marginTop: 8, fontSize: 12, color: AppColors.textAuxiliary },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: AppColors.borderNeutral },
  dayLabel: { fontSize: 13, fontWeight: '600', color: AppColors.textBody },
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: AppColors.borderNeutral, backgroundColor: AppColors.white },
  chipSelected: { backgroundColor: AppColors.accentLight, borderColor: AppColors.primaryInteractive },
  chipText: { fontSize: 12, color: AppColors.mediumGray, fontWeight: '600' },
  chipTextSelected: { color: AppColors.primaryInteractive, fontWeight: '800' },
  cta: { backgroundColor: AppColors.primaryInteractive, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  ctaText: { color: AppColors.white, fontWeight: '800' },
});
