// TimeSlotsSection.tsx (ajustado para espaçamento lateral uniforme entre slots, sem alterar UI)
import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import TimeSlotButton from './TimeSlotButton';
import { AppColors, AppShadows } from '../../../../constants/appStyles';

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
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  isPreference?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const numColumns = 3;

const CARD_MARGIN_TOTAL = 25 * 2; // Alinhado ao calendar: marginHorizontal=25 do card
const CARD_PADDING_TOTAL = 24 * 2; // Ajustado: paddingHorizontal=24 do card
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
}: TimeSlotsSectionProps) {
  const { t, i18n } = useTranslation();
  const [showUnavailable, setShowUnavailable] = React.useState(false);

  const dense = showUnavailable; // ao "ver todos", ativa layout compacto
  // ✅ AJUSTE: Gap reduzido para 8px no modo normal (uniforme como na imagem); 0 no dense com margem no item
  const currentGap = dense ? 0 : 8;
  // ✅ AJUSTE: Largura otimizada para ~80px por slot (como na imagem), considerando gutter e gaps
  const itemWidth = (SCREEN_WIDTH - HORIZONTAL_GUTTER - currentGap * (numColumns - 1)) / numColumns;

  const headerText = React.useMemo(() => {
    const base = title ?? (titleKey ? t(titleKey as any) : '');
    if (!date) return base;

    const d = new Date(date);
    if (isNaN(d.getTime())) return base;

    const locale = i18n?.language || 'pt-BR';
    const dateStr = d.toLocaleDateString(locale, { day: '2-digit', month: 'long' });
    return `${base} - ${dateStr}`;
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
      <Text style={styles.title} maxFontSizeMultiplier={1.2}>{headerText}</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={AppColors.primaryDark} style={{ marginVertical: 22 }} />
      ) : (displaySlotsInfo && displaySlotsInfo.length > 0) ? (
        <>
          {sections.map(section => (
            <View key={section.key} style={{ marginBottom: 6 }}>
              <Text style={styles.periodHeader}>{section.label}</Text>

              <FlatList
                data={section.data}
                keyExtractor={(item: SlotItem) => item.time}
                numColumns={numColumns}
                renderItem={({ item }: { item: SlotItem }) => (
                  <TimeSlotButton
                    time={item.time}
                    isSelected={selectedTime === item.time}
                    onPress={onTimeSelect}
                    isAvailable={item.isAvailable}
                    itemWidth={itemWidth}
                    isRecommended={item.isRecommended && dense}
                    dense={dense}
                    // ✅ AJUSTE: Margem lateral só no dense (gap=0); no normal, gap=8 cuida do espaçamento uniforme
                    noHorizontalMargin={!dense}
                  />
                )}
                // ✅ NOVO: getItemLayout para altura fixa (melhora performance em VirtualizedList)
                getItemLayout={(data, index) => ({
                  length: dense ? 40 : 44, // Altura aproximada do item (ajuste se necessário)
                  offset: (dense ? 40 : 44) * index,
                  index,
                })}
                // ✅ CORREÇÃO: Desabilita scroll interno para evitar conflitos com ScrollView pai
                scrollEnabled={false}
                columnWrapperStyle={{
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  gap: currentGap, // Gap uniforme entre slots (8px no normal, 0 no dense)
                }}
                contentContainerStyle={{
                  paddingVertical: dense ? 3 : 6,
                  paddingBottom: dense ? 8 : 12,
                  // ✅ AJUSTE: Padding lateral zero para alinhar slots à esquerda com espaçamento uniforme (como na imagem)
                  paddingLeft: 0,
                  paddingRight: 0,
                }}
                // ✅ NOVO: Componente para lista vazia (evita warnings)
                ListEmptyComponent={() => (
                  <Text style={styles.emptySlotText}>Nenhum horário disponível</Text>
                )}
                // ✅ CORREÇÃO: Adicionado para listas curtas (evita warnings de virtualização)
                ListFooterComponent={null}
                // ✅ OTIMIZAÇÃO: Ajustes para performance sem warnings em aninhamento
                initialNumToRender={12}
                maxToRenderPerBatch={12}
                windowSize={21} // Padrão RN para listas pequenas, evita buffer baixo
                removeClippedSubviews={false} // ✅ CORREÇÃO: Desabilitado para evitar clipping e warnings em FlatList aninhado
              />
            </View>
          ))}

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
    marginHorizontal: 25, // mesmo padrão do calendar
    backgroundColor: AppColors.white,
    borderRadius: 16, // igual ao Radii.md usado no calendar
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingVertical: 18,
    paddingBottom: 20,
    borderWidth: 0.9,
    borderColor: 'rgba(24, 79, 230, 0.09)', // mesma borda sutil do calendar
    ...Platform.select({
      ios: {
        shadowColor: '#45484b56',
        shadowOffset: { width: -1, height: 1 },
        shadowOpacity: 1.05,
        shadowRadius: 9,
      },
      android: { elevation: 6 },
    }),
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
    color: AppColors.errorRed,
    fontSize: 14,
    marginVertical: 16,
    fontWeight: '700',
  },
  // ✅ NOVO: Estilo para texto de lista vazia no FlatList
  emptySlotText: {
    textAlign: 'center',
    color: AppColors.textAuxiliary,
    fontSize: 14,
    paddingVertical: 20,
  },
});
