import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const SCREEN_WIDTH = Dimensions.get('window').width;

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
    <LinearGradient
      colors={['rgba(130, 180, 200, 0.8)', 'rgba(40, 80, 180, 0.8)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.calendarHeaderGradient}
    >
      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
      <TouchableOpacity onPress={routerBack} style={styles.headerIcon}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.monthArrow}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.monthYearText}>
          {MONTH_NAMES_PT[currentDisplayMonth.getMonth()]} {currentDisplayMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.monthArrow}>
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <View style={{ width: 24 }} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  calendarHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    paddingBottom: 15,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  headerIcon: { padding: 5, zIndex: 1 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', zIndex: 1 },
  monthArrow: { padding: 5 },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginHorizontal: 15,
  },
});

export default CalendarHeader;