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

const HEADER_HEIGHT_ADJUST = Platform.OS === 'ios' ? 90 : 60;

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({ onBackPress, headerTitle, fadeAnim, slideUpAnim }) => {
  return (
    <Animated.View style={[
      { paddingTop: HEADER_HEIGHT_ADJUST },
      { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }
    ]}>
      <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
        <Ionicons name="arrow-back" size={24} color="#435ee9ff" />
      </TouchableOpacity>
      <LinearGradient
        colors={['#4285F4', '#2A72E7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topHeaderGradient}
      >
        <Text style={styles.headerTitle}>{headerTitle}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  topHeaderGradient: {
    width: '38%',
    paddingTop: Platform.OS === 'ios' ? 25 : 43,
    paddingBottom: 15,
    bottom: 87,
    left: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    marginBottom: Platform.OS === 'ios' ? 0 : -70,
  },
  backButton: {
    position: 'absolute',
    left: 15,
    bottom: 95,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    zIndex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 15 : 13,
  },
});

export default ScheduleHeader;