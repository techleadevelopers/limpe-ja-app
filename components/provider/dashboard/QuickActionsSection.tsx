import React from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import AnimatedQuickActionButton from './AnimatedQuickActionButton';

export interface QuickActionItem {
  label: string;
  iconName: string;
  onPress: () => void;
  iconType?: 'Ionicons' | 'MaterialCommunityIcons';
}

interface QuickActionsSectionProps {
  contentAnim: Animated.Value;
  actions: QuickActionItem[];
  isLoading: boolean;
}

const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({ contentAnim, actions, isLoading }) => {
  return (
    <Animated.View style={[styles.sectionContainer, { opacity: contentAnim }]}>
      <Text style={styles.sectionTitle}>Atalhos do Dia</Text>
      <View style={styles.actionsGrid}>
        {isLoading ? (
          <View style={styles.skeletonGrid}>
            {[...Array(4)].map((_, i) => (
              <View key={i} style={[styles.skeletonButton, { backgroundColor: '#E0E0E0' }]}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#CCCCCC',
                  }}
                />
                <View
                  style={{
                    width: '70%',
                    height: 16,
                    borderRadius: 4,
                    marginTop: 10,
                    backgroundColor: '#CCCCCC',
                  }}
                />
              </View>
            ))}
          </View>
        ) : (
          actions.map((action, index) => (
            <AnimatedQuickActionButton
              key={action.label}
              label={action.label}
              iconName={action.iconName}
              onPress={action.onPress}
              iconType={action.iconType}
              delay={index * 100}
            />
          ))
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  skeletonButton: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
});

export default QuickActionsSection;
