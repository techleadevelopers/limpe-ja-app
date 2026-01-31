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
  View,
} from 'react-native';
import { AppColors } from '../../../../constants/appStyles';
import TimeSlotButton from './TimeSlotButton';
import { TimeSlot } from '../../../../utils/timeSlots';
import { normalizeSlotLabel, getNowInBrazil, isSameDayInBrazil } from '../../../../utils/time';

interface SlotItem {
  time: string;
  isAvailable: boolean;
  fullISO: string;
  isRecommended?: boolean;
}

interface TimeSlotsSectionProps {
  titleKey?: string;
  title?: string;
  date?: Date | string | number;

  displaySlotsInfo: TimeSlot[];
  isLoading: boolean;

  selectedTime: string | null;
  onTimeSelect: (slotIso: string) => void;

  isPreference?: boolean;
  selectedSlots?: string[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const numColumns = 3;

const CARD_MARGIN_TOTAL = 25 * 2;
const CARD_PADDING_TOTAL = 24 * 2;
const HORIZONTAL_GUTTER = CARD_MARGIN_TOTAL + CARD_PADDING_TOTAL;

const toMinutes = (time: string) => {
  if (!time) return 0;
  const [hour, minute] = time.split(':').map(Number);
  const safeHour = Number.isFinite(hour) ? hour : 0;
  const safeMinute = Number.isFinite(minute) ? minute : 0;
  return safeHour * 60 + safeMinute;
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
  const { t } = useTranslation();

  const dense = false;
  const currentGap = dense ? 0 : 8;
  const itemWidth = (SCREEN_WIDTH - HORIZONTAL_GUTTER - currentGap * (numColumns - 1)) / numColumns;

  const headerText = React.useMemo(() => {
    return title ?? (titleKey ? t(titleKey as any) : '');
  }, [title, titleKey, t]);

  const selectedSlotsSet = React.useMemo(
    () => new Set(selectedSlots ?? []),
    [selectedSlots],
  );

  const handleSlotPress = React.useCallback(
    (slotIso: string, alreadySelected: boolean) => {
      if (alreadySelected) return;
      onTimeSelect(slotIso);
    },
    [onTimeSelect],
  );

  const renderSlotItem = React.useCallback(
    ({ item }: { item: SlotItem }) => {
      const isInMultiSelection = selectedSlotsSet.size > 0 && selectedSlotsSet.has(item.time);
      const isSlotSelected = isInMultiSelection || selectedTime === item.fullISO;

      return (
        <TimeSlotButton
          time={item.time}
          isSelected={isSlotSelected}
          onPress={() => handleSlotPress(item.fullISO, isSlotSelected)}
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

  const slotsToRender = React.useMemo(() => {
    if (!displaySlotsInfo) return [];

    const now = getNowInBrazil();
    const selectedDate = date ? new Date(date) : null;
    const isToday = selectedDate ? isSameDayInBrazil(selectedDate, now) : false;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return [...displaySlotsInfo]
      .map((slot) => ({
        ...slot,
        time: normalizeSlotLabel(slot.time),
      }))
      .filter((slot) => {
        if (!isToday) return true;
        const slotMinutes = toMinutes(slot.time);
        return slotMinutes >= currentMinutes;
      })
      .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
  }, [displaySlotsInfo, date]);

  const sections = React.useMemo(() => {
    if (!slotsToRender || slotsToRender.length === 0) return [];

    const grouped: Record<'morning' | 'afternoon', SlotItem[]> = {
      morning: [],
      afternoon: [],
    };

    slotsToRender.forEach((slot) => {
      const period = toMinutes(slot.time) < 12 * 60 ? 'morning' : 'afternoon';
      grouped[period].push(slot);
    });

    const mk = (key: 'morning' | 'afternoon', label: string) =>
      grouped[key].length ? [{ key, label, data: grouped[key] }] : [];

    return [
      ...mk('morning', t('common.morning', { defaultValue: 'Manhã' })),
      ...mk('afternoon', t('common.afternoon', { defaultValue: 'Tarde' })),
    ];
  }, [slotsToRender, t]);


  return (
    <View style={[styles.card, isPreference && { marginTop: 12 }]}>
      <Text style={styles.title} maxFontSizeMultiplier={1.2}>
        {headerText}
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={AppColors.primaryDark} style={{ marginVertical: 22 }} />
      ) : sections.length > 0 ? (
        <>
          {sections.map((section) => (
            <View key={section.key} style={{ marginBottom: 12 }}>
              <Text style={styles.periodHeader}>{section.label}</Text>
              <FlatList
                data={section.data}
                keyExtractor={(item: SlotItem) => item.fullISO}
                numColumns={numColumns}
                renderItem={renderSlotItem}
                scrollEnabled={false}
                columnWrapperStyle={{
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  gap: currentGap,
                }}
                contentContainerStyle={{
                  paddingVertical: dense ? 3 : 6,
                  paddingBottom: dense ? 8 : 12,
                }}
              />
            </View>
          ))}
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
  periodHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    color: AppColors.textAuxiliary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  empty: {
    textAlign: 'center',
    color: AppColors.errorRed,
    fontSize: 14,
    marginVertical: 16,
    fontWeight: '700',
  },
});
