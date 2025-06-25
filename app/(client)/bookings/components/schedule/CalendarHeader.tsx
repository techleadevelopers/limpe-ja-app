import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalendarHeaderProps {
  currentDisplayMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  routerBack: () => void;
  MONTH_NAMES_PT: string[];
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDisplayMonth,
  onPrevMonth,
  onNextMonth,
  routerBack,
  MONTH_NAMES_PT,
}) => {
  return (
    <View style={styles.container}>
      {/* Botão de voltar */}
      <TouchableOpacity onPress={routerBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color="#2A72E7" />
      </TouchableOpacity>

      {/* Título centralizado */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.monthArrow}>
          <Ionicons name="chevron-back" size={20} color="#2A72E7" />
        </TouchableOpacity>

        <Text style={styles.monthText}>
          {MONTH_NAMES_PT[currentDisplayMonth.getMonth()]} {currentDisplayMonth.getFullYear()}
        </Text>

        <TouchableOpacity onPress={onNextMonth} style={styles.monthArrow}>
          <Ionicons name="chevron-forward" size={20} color="#2A72E7" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
  },
  monthSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // esse é o segredo
    marginLeft: -24, // compensa o espaço do botão de voltar
  },
  monthArrow: {
    padding: 5,
  },
  monthText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2A72E7',
    marginHorizontal: 12,
  },
});

export default CalendarHeader;
