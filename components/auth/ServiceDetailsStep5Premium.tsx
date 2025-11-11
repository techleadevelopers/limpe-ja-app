import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';

type DayState = { morning: boolean; afternoon: boolean };

interface Props {
  radiusKm: number;
  setRadiusKm: (v: number) => void;
  selectedDays: Record<string, DayState>;
  toggleDay: (dateKey: string, period: 'morning' | 'afternoon') => void;
  upcoming: Date[];
}

export default function ServiceDetailsStep5Premium({
  radiusKm,
  setRadiusKm,
  selectedDays,
  toggleDay,
  upcoming,
}: Props) {
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: animatedValue,
        transform: [
          {
            translateY: animatedValue.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
          },
        ],
      }}
    >
      <LinearGradient colors={['#E0F2FE', '#F0F9FF']} style={styles.stageCard}>
        <Ionicons name="checkmark-circle" size={22} color="#3B82F6" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.stageTitle}>Etapa 5 de 5</Text>
          <Text style={styles.stageSubtitle}>Defina onde e quando você atende</Text>
        </View>
      </LinearGradient>

      <View style={styles.radiusContainer}>
        <Text style={styles.sectionTitle}>🗺️ Até onde você consegue atender?</Text>
        <View style={styles.sliderWrapper}>
          <Slider
            minimumValue={5}
            maximumValue={60}
            step={5}
            value={radiusKm}
            onValueChange={(v: number) => {
              setRadiusKm(v);
              try { Haptics.selectionAsync(); } catch {}
            }}
            minimumTrackTintColor="#3B82F6"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#3B82F6"
          />
          <View style={styles.radiusLabelWrap}>
            <Text style={styles.radiusLabel}>{radiusKm} km</Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.sectionTitle}>🕓 Quando você pode atender?</Text>
        {upcoming.map((d) => {
          const key = d.toISOString().slice(0, 10);
          const s = selectedDays[key] ?? { morning: false, afternoon: false };
          const dayLabel = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()];
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');

          return (
            <View key={key} style={styles.dayCard}>
              <Text style={styles.dayLabel}>{`${dayLabel} ${dd}/${mm}`}</Text>
              <View style={styles.slotsRow}>
                <TouchableOpacity
                  onPress={() => {
                    toggleDay(key, 'morning');
                    try { Haptics.selectionAsync(); } catch {}
                  }}
                  activeOpacity={0.8}
                  style={[styles.slotButton, s.morning && styles.slotButtonSelected]}
                >
                  <Ionicons
                    name="sunny-outline"
                    size={18}
                    color={s.morning ? '#fff' : '#3B82F6'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.slotLabel, s.morning && styles.slotLabelSelected]}>Manhã</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    toggleDay(key, 'afternoon');
                    try { Haptics.selectionAsync(); } catch {}
                  }}
                  activeOpacity={0.8}
                  style={[styles.slotButton, s.afternoon && styles.slotButtonSelected]}
                >
                  <Ionicons
                    name="partly-sunny-outline"
                    size={18}
                    color={s.afternoon ? '#fff' : '#3B82F6'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.slotLabel, s.afternoon && styles.slotLabelSelected]}>Tarde</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  stageTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  stageSubtitle: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  radiusContainer: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2A37',
    marginBottom: 10,
  },
  sliderWrapper: {
    position: 'relative',
  },
  radiusLabelWrap: {
    alignSelf: 'center',
    marginTop: 6,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  radiusLabel: {
    color: '#1E40AF',
    fontSize: 13,
    fontWeight: '600',
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 10,
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  slotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  slotButtonSelected: {
    backgroundColor: '#3B82F6',
    shadowOpacity: 0.2,
  },
  slotLabel: {
    color: '#1E3A8A',
    fontWeight: '600',
    fontSize: 13,
  },
  slotLabelSelected: {
    color: '#fff',
  },
});

