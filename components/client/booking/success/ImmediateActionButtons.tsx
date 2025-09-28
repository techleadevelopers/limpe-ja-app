// LimpeJaApp/app/(client)/bookings/components/success/ImmediateActionButtons.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, AppShadows } from '../../../../constants/appStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ImmediateActionButtonsProps {
  onAddToCalendar: () => void;
  onContactProvider: () => void;
  headerPrimaryColor: string;
}

export default function ImmediateActionButtons({
  onAddToCalendar,
  onContactProvider,
  headerPrimaryColor,
}: ImmediateActionButtonsProps) {
  return (
    <View style={styles.actionButtonsContainerImmediate}>
      <TouchableOpacity
        style={styles.actionButtonImmediate}
        onPress={onAddToCalendar}
        activeOpacity={0.7} // Feedback tátil nativo, sem jitter
      >
        <Ionicons name="calendar-outline" size={20} color={AppColors.primaryInteractive} />
        <Text style={styles.actionButtonImmediateText} numberOfLines={1} maxFontSizeMultiplier={1.2}>Adicionar ao Calendário</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButtonImmediate, styles.actionButtonSpacing]} // Espaçamento fixo sem gap
        onPress={onContactProvider}
        activeOpacity={0.7}
      >
        <Ionicons name="chatbubbles-outline" size={20} color={AppColors.primaryInteractive} />
        <Text style={styles.actionButtonImmediateText} numberOfLines={1} maxFontSizeMultiplier={1.2}>Contatar Prestador</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtonsContainerImmediate: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', // Espaçamento uniforme, sem flutuação
    width: '100%',
    maxWidth: SCREEN_WIDTH - 32, // Fix: Ajuste para safe areas iOS, previne lateral scroll
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 16, // Fix: Padding fixo para evitar gaps laterais no iOS
  },
  actionButtonImmediate: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${AppColors.backgroundNeutral}50`,
    borderRadius: 10,
    paddingVertical: 12, // Touch target maior para conforto (44px+)
    marginHorizontal: 4, // Fix: Reduzido para caber no iOS sem overflow
    minHeight: 44, // HIG compliance
    ...AppShadows.small,
  },
  actionButtonSpacing: {
    marginLeft: 8, // Espaçamento fixo entre botões, sem wrap/gap (reduzido para iOS)
  },
  actionButtonImmediateText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.primaryInteractive,
    marginLeft: 8, // Alinhamento fixo do texto
    flexShrink: 1, // Evita overflow lateral
  },
});