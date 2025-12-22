// components/ProgressBar.tsx
import React from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProgressBarProps {
  progress: number; // valor entre 0 e 1
  label?: string;
}

export default function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <View style={styles.progressWrapper}>
      <View style={styles.progressOuter}>
        <Animated.View
          style={[
            styles.progressInner,
            { width: `${Math.min(Math.max(progress, 0), 1) * 100}%` },
          ]}
        />
      </View>
      {label && <Text style={styles.progressLabel}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  progressWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressOuter: {
    backgroundColor: '#E0E0E0',
    borderRadius: 100,
    paddingHorizontal: 5,
    height: 40,
    width: SCREEN_WIDTH - 40,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  progressInner: {
    height: 30,
    borderRadius: 100,
    backgroundColor: '#4facfe',
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  progressLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
});

