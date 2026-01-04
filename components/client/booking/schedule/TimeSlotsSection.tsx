// TimeSlotsSection.tsx - seção de horários, agora suportando seleção múltipla (contígua) sem alterar o layout base
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppColors } from '../../../../constants/appStyles';
import TimeSlotButton from './TimeSlotButton';

interface SlotItem {
  time: string;
  isAvailable: boolean;
  isRecommended?: boolean;
}

interface TimeSlotsSectionProps {
  titleKey?: string;
  title?: string;
  date?: Date | string | number;

  displaySlotsInfo: Array<{ time: string; isAvailable: boolean }>;
  isLoading: boolean;

  // Seleção "clássica" (um único horário) – mantida para compatibilidade
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;

  isPreference?: boolean;

  // NOVO: suporte a seleção múltipla (contígua)
  selectedSlots?: string[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const numColumns = 3;

const CARD_MARGIN_TOTAL = 25 * 2;
const CARD_PADDING_TOTAL = 24 * 2;
const HORIZONTAL_GUTTER = CARD_MARGIN_TOTAL + CARD_PADDING_TOTAL;

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
  selectedSlots,
}: TimeSlotsSectionProps) {
  const { t, i18n } = useTranslation();
  const [showUnavailable, setShowUnavailable] = React.useState(false);

  const dense = showUnavailable;
  const currentGap = dense ? 0 : 8;
  const itemWidth = (SCREEN_WIDTH - HORIZONTAL_GUTTER - currentGap * (numColumns - 1)) / numColumns;

  const headerText = React.useMemo(() => {
    return title ?? (titleKey ? t(titleKey as any) : '');
  }, [title, titleKey, t]);

  const headerDateText = React.useMemo(() => {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const locale = i18n?.language || 'pt-BR';
    return d.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, [date, i18n?.language]);

  const selectedSlotsSet = React.useMemo(
    () => new Set(selectedSlots ?? []),
    [selectedSlots],
  );

  const handleSlotPress = React.useCallback(
    (time: string, alreadySelected: boolean) => {
      if (alreadySelected) {
        return;
      }
      onTimeSelect(time);
    },
    [onTimeSelect],
  );

  const renderSlotItem = React.useCallback(
    ({ item }: { item: SlotItem }) => {
      const isInMultiSelection = selectedSlotsSet.size > 0 && selectedSlotsSet.has(item.time);
      const isSlotSelected = isInMultiSelection || selectedTime === item.time;

      return (
        <TimeSlotButton
          time={item.time}
          isSelected={isSlotSelected}
          onPress={() => handleSlotPress(item.time, isSlotSelected)}
          isAvailable={item.isAvailable}
          itemWidth={itemWidth}
          isRecommended={item.isRecommended && dense}
          dense={dense}
          noHorizontalMargin={!dense}
        />
      );
    },
    [selectedSlotsSet, selectedTime, handleSlotPress, dense, itemWidth],
  );

  const sections = React.useMemo(() => {
    const filtered = showUnavailable ? displaySlotsInfo : displaySlotsInfo.filter(s => s.isAvailable);
    const sorted = [...filtered].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));

    const isToday = date ? new Date(date).toDateString() === new Date().toDateString() : false;
    const now = new Date();
    const nowMins = toMinutes(
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    );
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

    const enriched: SlotItem[] = sorted.map((s: SlotItem, i: number) => ({
      ...s,
      isRecommended: nextIdx.has(i),
    }));

    const grouped: Record<'morning' | 'afternoon' | 'evening', SlotItem[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    enriched.forEach(item => grouped[getPeriod(item.time)].push(item));

    const mk = (k: 'morning' | 'afternoon' | 'evening', label: string) =>
      grouped[k].length ? [{ key: k, label, data: grouped[k] }] : [];

    return [
      ...mk('morning', t('common.morning', { defaultValue: 'Manhã' })),
      ...mk('afternoon', t('common.afternoon', { defaultValue: 'Tarde' })),
      ...mk('evening', t('common.evening', { defaultValue: 'Noite' })),
    ];
  }, [displaySlotsInfo, showUnavailable, date, t]);

  return (
    <View style={[styles.card, isPreference && { marginTop: 12 }]}>
      <Text style={styles.title} maxFontSizeMultiplier={1.2}>
        {headerText}
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={AppColors.primaryDark} style={{ marginVertical: 22 }} />
      ) : displaySlotsInfo && displaySlotsInfo.length > 0 ? (
        <>
          {sections.map(section => (
            <View key={section.key} style={{ marginBottom: 6 }}>
              <View style={styles.periodHeaderRow}>
                <Text style={styles.periodHeader}>{section.label}</Text>
                {!!headerDateText && (
                  <Text style={styles.periodDate}>{headerDateText}</Text>
                )}
              </View>

              <FlatList
                data={section.data}
                keyExtractor={(item: SlotItem) => item.time}
                numColumns={numColumns}
                renderItem={renderSlotItem}
                getItemLayout={(data, index) => ({
                  length: dense ? 40 : 44,
                  offset: (dense ? 40 : 44) * index,
                  index,
                })}
                scrollEnabled={false}
                columnWrapperStyle={{
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  gap: currentGap,
                }}
                contentContainerStyle={{
                  paddingVertical: dense ? 3 : 6,
                  paddingBottom: dense ? 8 : 12,
                  paddingLeft: 0,
                  paddingRight: 0,
                }}
                ListEmptyComponent={() => (
                  <Text style={styles.emptySlotText}>Nenhum horário disponível</Text>
                )}
                ListFooterComponent={null}
                initialNumToRender={12}
                maxToRenderPerBatch={12}
                windowSize={21}
                removeClippedSubviews={false}
              />
            </View>
          ))}

          <TouchableOpacity
            onPress={() => setShowUnavailable(v => !v)}
            style={[styles.toggleBtn, dense && { marginTop: 8 }]}
          >
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
    marginHorizontal: 25,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingVertical: 18,
    paddingBottom: 20,
    marginBottom: 39,
    borderWidth: Platform.OS === 'android' ? 0 : 0.9,
    borderColor: 'rgba(24, 79, 230, 0.09)',
    ...Platform.select({
      ios: {
        shadowColor: '#45484b56',
        shadowOffset: { width: -1, height: 1 },
        shadowOpacity: 1.05,
        shadowRadius: 9,
      },
      android: { elevation: 0 },
    }),
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.textBody,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 26,
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
  periodHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 6,
  },
  periodHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    color: AppColors.textAuxiliary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  periodDate: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textAuxiliary,
  },
  empty: {
    textAlign: 'center',
    color: AppColors.errorRed,
    fontSize: 14,
    marginVertical: 16,
    fontWeight: '700',
  },
  emptySlotText: {
    textAlign: 'center',
    color: AppColors.textAuxiliary,
    fontSize: 14,
    paddingVertical: 20,
  },
});
