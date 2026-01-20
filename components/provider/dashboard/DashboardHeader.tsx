// app/provider/components/dashboard/DashboardHeader.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DashboardHeaderProps {
  headerAnim: Animated.Value;
  onProfilePress: () => void;
  providerName?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  headerAnim,
  onProfilePress,
  providerName = 'Provedor',
}) => {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Bom dia');
    } else if (hour < 18) {
      setGreeting('Boa tarde');
    } else {
      setGreeting('Boa noite');
    }
  }, []);

  const photoReminderText =
    'Mantenha uma foto profissional com uniforme ou vassoura para reforçar confiança.';

  return (
    <Animated.View
      style={[
        styles.customHeader,
        {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
        },
      ]}
    >
      <LinearGradient
        colors={['#007AFF', '#005BBB'] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.headerContent}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>{greeting},</Text>
          <Text style={styles.providerNameText}>{providerName}!</Text>
          <Text style={styles.photoHintText}>{photoReminderText}</Text>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={onProfilePress}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel="Ver perfil"
          >
            <Ionicons name="person-circle-outline" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  customHeader: {
    paddingTop: Platform.OS === 'ios' ? 48 : 15,
    paddingBottom: 8,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  greetingContainer: {
    flex: 1,
    marginTop: 14,
  },
  greetingText: {
    fontSize: Platform.OS === 'android' ? 12 : 14,
    color: '#E0EFFF',
    fontWeight: 'normal',
  },
  providerNameText: {
    fontSize: Platform.OS === 'android' ? 15 : 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  photoHintText: {
    fontSize: 12,
    color: '#C8D9FF',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 10,
  },
});

export default DashboardHeader;
