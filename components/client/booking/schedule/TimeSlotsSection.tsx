import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import TimeSlotButton from './TimeSlotButton';
import { AppColors, AppShadows } from '../../../../constants/appStyles';

interface TimeSlotsSectionProps {
  titleKey?: string;
  title?: string;
  date?: Date | string | number;

  displaySlotsInfo: Array<{ time: string; isAvailable: boolean }>;
  isLoading: boolean;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  isPreference?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const numColumns = 3;

const CARD_MARGIN_TOTAL = 30 * 2;
const CARD_PADDING_TOTAL = 30 * 4;
const HORIZONTAL_GUTTER = CARD_MARGIN_TOTAL + CARD_PADDING_TOTAL;

// helpers
const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const getPeriod = (time: string) => {
  const mins = toMinutes(time);
  if (mins < 12 * 60) return 'morning';
  if (mins < 18 * 60) return 'afternoon';
  return 'evening';
};

export default function TimeSlotsSection({
  titleKey,
  title,
  date,
  displaySlotsInfo,
  isLoading,
  selectedTime,
  onTimeSelect,
  isPreference = false,
}: TimeSlotsSectionProps) {
  const { t, i18n } = useTranslation();
  const [showUnavailable, setShowUnavailable] = React.useState(false);

  const dense = showUnavailable;                   // ao "ver todos", ativa layout compacto
  const currentGap = dense ? 10 : 16;              // ↓ gap menor quando denso
  const itemWidth = (SCREEN_WIDTH - HORIZONTAL_GUTTER - currentGap * (numColumns - 1)) / numColumns;

  const headerText = React.useMemo(() => {
    const base = title ?? (titleKey ? t(titleKey as any) : '');
    if (!date) return base;

    const d = new Date(date);
    if (isNaN(d.getTime())) return base;

    const locale = i18n?.language || 'pt-BR';
    const dateStr = d.toLocaleDateString(locale, { day: '2-digit', month: 'long' });
    return `${base} — ${dateStr}`;
  }, [title, titleKey, date, t, i18n?.language]);

  const sections = React.useMemo(() => {
    const filtered = showUnavailable ? displaySlotsInfo : displaySlotsInfo.filter(s => s.isAvailable);
    const sorted = [...filtered].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));

    // recomendados: próximos 3 horários (se a data for hoje)
    const isToday = date ? new Date(date).toDateString() === new Date().toDateString() : false;
    const now = new Date();
    const nowMins = toMinutes(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    const nextIdx = new Set<number>();
    if (isToday) {
      let c = 0;
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].isAvailable && toMinutes(sorted[i].time) >= nowMins) {
          nextIdx.add(i);
          c++;
          if (c >= 3) break;
        }
      }
    }

    const enriched = sorted.map((s, i) => ({ ...s, isRecommended: nextIdx.has(i) }));

    const grouped: Record<'morning'|'afternoon'|'evening', typeof enriched> = { morning: [], afternoon: [], evening: [] };
    enriched.forEach(item => grouped[getPeriod(item.time)].push(item));

    const mk = (k: 'morning'|'afternoon'|'evening', label: string) =>
      grouped[k].length ? [{ key: k, label, data: grouped[k] as any }] : [];

    return [
      ...mk('morning', t('common.morning', { defaultValue: 'Manhã' })),
      ...mk('afternoon', t('common.afternoon', { defaultValue: 'Tarde' })),
      ...mk('evening', t('common.evening', { defaultValue: 'Noite' })),
    ];
  }, [displaySlotsInfo, showUnavailable, date, t]);

  return (
    <View style={[styles.card, isPreference && { marginTop: 12 }]}>
      <Text style={styles.title} maxFontSizeMultiplier={1.2}>{headerText}</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={AppColors.primaryDark} style={{ marginVertical: 22 }} />
      ) : sections.length ? (
        <>
          {sections.map(section => (
            <View key={section.key} style={{ marginBottom: 6 }}>
              <Text style={styles.periodHeader}>{section.label}</Text>

              <FlatList
                data={section.data}
                keyExtractor={(item) => item.time}
                numColumns={numColumns}
                renderItem={({ item }) => (
                  <TimeSlotButton
                    time={item.time}
                    isSelected={selectedTime === item.time}
                    onPress={onTimeSelect}
                    isAvailable={item.isAvailable}
                    itemWidth={itemWidth}
                    isRecommended={item.isRecommended}
                    dense={dense}                                // <— liga o modo compacto
                  />
                )}
                columnWrapperStyle={{
                  justifyContent: 'flex-start',
                  gap: currentGap,                               // <— gap dinâmico
                  marginBottom: currentGap,
                }}
                contentContainerStyle={{ paddingVertical: dense ? 2 : 4 }} // <— menos respiro vertical
                initialNumToRender={numColumns * 2}
                maxToRenderPerBatch={numColumns * 3}
                windowSize={7}
                removeClippedSubviews
              />
            </View>
          ))}

          {/* botão no rodapé do card */}
          <TouchableOpacity onPress={() => setShowUnavailable(v => !v)} style={[styles.toggleBtn, dense && { marginTop: 8 }]}>
            <Text style={styles.toggleText}>
              {showUnavailable
                ? t('schedule_service.hide_unavailable', { defaultValue: 'ocultar indisponíveis' })
                : t('schedule_service.show_unavailable', { defaultValue: 'ver todos' })}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.empty} maxFontSizeMultiplier={1.2}>
          {t('schedule_service.no_slots', 'Nenhum horário disponível para esta data.')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    marginHorizontal: 26,
    
    backgroundColor: AppColors.white,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 18,
    ...AppShadows.medium,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.textBody,
    textAlign: 'left',
    marginBottom: 12,
  },
  toggleBtn: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 14,
    
    
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.textAuxiliary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  periodHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    color: AppColors.textAuxiliary,
    marginBottom: 8,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  empty: {
    textAlign: 'center',
    color: AppColors.textAuxiliary,
    fontSize: 13,
    marginVertical: 16,
    fontStyle: 'italic',
    
  },
});
