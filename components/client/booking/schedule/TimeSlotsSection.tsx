import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import TimeSlotButton from './TimeSlotButton';
import { AppColors, AppShadows } from '../../../../constants/appStyles'; // Importe AppColors e AppShadows

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

/**
 * Largura útil do card:
 * - margem horizontal: 30 (dos lados) => 60
 * - padding horizontal interno do card: 40 (dos lados) => 80
 * Efetivo: SCREEN_WIDTH - (60 + 80) = SCREEN_WIDTH - 140
 */
const CARD_MARGIN_TOTAL = 30 * 2; // Ajustado de 26 para 30
const CARD_PADDING_TOTAL = 30 * 4; // Ajustado de 34 para 40
const HORIZONTAL_GUTTER = CARD_MARGIN_TOTAL + CARD_PADDING_TOTAL; // Agora 140

const itemGap = 10; // Mantido
const itemWidth = (SCREEN_WIDTH - HORIZONTAL_GUTTER - itemGap * (numColumns - 1)) / numColumns;

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
    // Monta o título a partir do i18n, caindo para o que veio por props
    const base =
      title ??
      (titleKey ? t(titleKey as any) : '');

    // Formata a data em pt-BR (ou no locale atual do app)
    if (!date) return base;
    const d = new Date(date);
    const locale = i18n?.language || 'pt-BR';
    const dateStr = d.toLocaleDateString(locale, { day: '2-digit', month: 'long' });
    return `${base} -- ${dateStr}`;
  }, [title, titleKey, date, t, i18n?.language]);

  return (
    <View style={[styles.card, isPreference && { marginTop: 12 }]}>
      <Text style={styles.title}>{headerText}</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={AppColors.primaryDark} style={{ marginVertical: 22 }} />
      ) : displaySlotsInfo.length ? (
        <FlatList
          data={displaySlotsInfo}
          keyExtractor={(item, idx) => `${item.time}-${idx}`}
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
          // Mantém colunas alinhadas entre seções
          columnWrapperStyle={{ justifyContent: 'flex-start', gap: itemGap, marginBottom: itemGap }}
          contentContainerStyle={{ paddingVertical: 6 }}
        />
      ) : (
        <Text style={styles.empty}>{t('schedule_service.no_slots', 'Nenhum horário disponível para esta data.')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    marginHorizontal: 26, // Aumentado para diminuir o espaço útil e, consequentemente, o itemWidth
    backgroundColor: AppColors.white, // Usando AppColors
    borderRadius: 12, // Reduzido para combinar com o botão
    paddingHorizontal: 40, // Aumentado para diminuir o espaço útil e, consequentemente, o itemWidth
    paddingVertical: 22, // Reduzido para tornar o card mais compacto
    ...AppShadows.medium, // Usando AppShadows
        borderTopStartRadius: 28,
           borderBottomStartRadius: 28,
           borderTopEndRadius: 28,
           borderBottomEndRadius: 28,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Montserrat-Regular',
    color: AppColors.textBody, // Usando AppColors
    textAlign: 'center',
    marginBottom: 25, // Reduzido o espaçamento
    marginTop: 2,
    
  },
  empty: {
    textAlign: 'center',
    color: AppColors.textAuxiliary, // Usando AppColors
    fontSize: 13,
    marginVertical: 16,
    fontStyle: 'italic',
    
  },
});