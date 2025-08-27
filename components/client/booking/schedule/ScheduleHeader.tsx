import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ScheduleHeaderProps {
  onBackPress: () => void;
  headerTitle: string;
  fadeAnim: Animated.Value;
  slideUpAnim: Animated.Value;
}

const HEADER_TOP = Platform.OS === 'ios' ? 56 : 28;

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({ onBackPress, headerTitle, fadeAnim, slideUpAnim }) => {
  return (
    <Animated.View
      style={[
        { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
      ]}
    >
      {/* Barra superior em gradiente + borda inferior arredondada (mock-like) */}
      <LinearGradient
        colors={['#6AA8FF', '#4A7FF3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={{ height: HEADER_TOP }} />

        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBackPress} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          <Text numberOfLines={1} style={styles.headerTitle}>{headerTitle}</Text>

          <View style={styles.iconBtn}>
            <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
          </View>
        </View>

        {/* Abas arredondadas (decorativas — não quebram sua lógica) */}
        <View style={styles.tabsPill}>
          <View style={[styles.tabItem, styles.tabItemGhost]}>
            <Text style={styles.tabGhostText}>PONTOS</Text>
          </View>
          <View style={[styles.tabItem, styles.tabItemActive]}>
            <Text style={styles.tabActiveText}>ROUND TRIP</Text>
          </View>
          <View style={[styles.tabItem, styles.tabItemGhost]}>
            <Text style={styles.tabGhostText}>CUPONS</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  tabsPill: {
    marginTop: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 40,
    padding: 6,
    flexDirection: 'row',
    gap: 6,
  },
  tabItem: {
    borderRadius: 40,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tabItemActive: { backgroundColor: '#fff' },
  tabActiveText: {
    color: '#2A72E7',
    fontWeight: '700',
    fontSize: 12,
  },
  tabItemGhost: { backgroundColor: 'transparent' },
  tabGhostText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default ScheduleHeader;
