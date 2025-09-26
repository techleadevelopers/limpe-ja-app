import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import TimeSlotButton from './TimeSlotButton';
import { AppColors, AppShadows } from '../../../../constants/appStyles';

interface TimeSlotsSectionProps {
  /** Opcional: chave i18n (ex.: "schedule_service.available_times")  */
  titleKey?: string;
  /** Opcional: título já resolvido (tem prioridade sobre titleKey) */
  title?: string;
  /** Opcional: data que aparece ao lado do título */
  date?: Date | string | number;

  displaySlotsInfo: Array<{ time: string; isAvailable: boolean }>;
  isLoading: boolean;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  /** Usa apenas para a segunda seção (preferências) -- muda o espaçamento superior */
  isPreference?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const numColumns = 3;

const CARD_MARGIN_TOTAL = 30 * 2;
const CARD_PADDING_TOTAL = 30 * 4;
const HORIZONTAL_GUTTER = CARD_MARGIN_TOTAL + CARD_PADDING_TOTAL;

const itemGap = 10;
const itemWidth = (SCREEN_WIDTH - HORIZONTAL_GUTTER - itemGap * (numColumns - 1)) / numColumns;

// Altura estimada de um TimeSlotButton para getItemLayout
// Baseado em paddingVertical, fontSize e marginBottom do TimeSlotButton
const ESTIMATED_ITEM_HEIGHT = 4 + 12 + 10 + (2 * 2.5); // paddingVertical + fontSize + marginBottom + borderWidth (aprox)
const ITEM_TOTAL_HEIGHT = ESTIMATED_ITEM_HEIGHT + itemGap; // Altura do item + gap inferior

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

  const headerText = React.useMemo(() => {
    const base =
      title ??
      (titleKey ? t(titleKey as any) : '');

    if (!date) return base;

    // ✅ Correção: Validação da data para evitar "Invalid Date"
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      console.warn("Data inválida fornecida para TimeSlotsSection:", date);
      return base; // Retorna apenas o título base se a data for inválida
    }

    const locale = i18n?.language || 'pt-BR';
    const dateStr = d.toLocaleDateString(locale, { day: '2-digit', month: 'long' });
    return `${base} -- ${dateStr}`;
  }, [title, titleKey, date, t, i18n?.language]);

  return (
    <View style={[styles.card, isPreference && { marginTop: 12 }]}>
      <Text style={styles.title} maxFontSizeMultiplier={1.2}>{headerText}</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={AppColors.primaryDark} style={{ marginVertical: 22 }} />
      ) : displaySlotsInfo.length ? (
        <FlatList
          data={displaySlotsInfo}
          // ✅ Correção: keyExtractor usando 'time' como chave única.
          // Se 'item.time' não for globalmente único e a lista puder ser reordenada,
          // um 'id' único no objeto 'displaySlotsInfo' seria ideal.
          // Para esta estrutura, 'item.time' é assumido como único dentro da lista atual.
          keyExtractor={(item) => item.time}
          numColumns={numColumns}
          renderItem={({ item }) => (
            <TimeSlotButton
              time={item.time}
              isSelected={selectedTime === item.time}
              onPress={onTimeSelect}
              isAvailable={item.isAvailable}
              itemWidth={itemWidth}
            />
          )}
          columnWrapperStyle={{ justifyContent: 'flex-start', gap: itemGap, marginBottom: itemGap }}
          contentContainerStyle={{ paddingVertical: 6 }}
          // ✅ Otimização: Adicionado getItemLayout para melhorar a performance de rolagem
          getItemLayout={(data, index) => (
            { length: ITEM_TOTAL_HEIGHT, offset: ITEM_TOTAL_HEIGHT * index, index }
          )}
          // ✅ Otimização: initialNumToRender pode ser ajustado para o número de itens visíveis
          initialNumToRender={numColumns * 2} // Exemplo: 2 linhas visíveis inicialmente
          maxToRenderPerBatch={numColumns * 3} // Renderiza mais itens por batch
          windowSize={7} // Mantém 7 janelas de itens na memória
          removeClippedSubviews={true} // Ajuda a reduzir o uso de memória em listas longas
        />
      ) : (
        <Text style={styles.empty} maxFontSizeMultiplier={1.2}>{t('schedule_service.no_slots', 'Nenhum horário disponível para esta data.')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    marginHorizontal: 26,
    backgroundColor: AppColors.white,
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 22,
    ...AppShadows.medium,
    borderTopStartRadius: 28,
    borderBottomStartRadius: 28,
    borderTopEndRadius: 28,
    borderBottomEndRadius: 28,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Montserrat-Regular',
    color: AppColors.textBody,
    textAlign: 'center',
    marginBottom: 25,
    marginTop: 2,

  },
  empty: {
    textAlign: 'center',
    color: AppColors.textAuxiliary,
    fontSize: 13,
    marginVertical: 16,
    fontStyle: 'italic',

  },
});