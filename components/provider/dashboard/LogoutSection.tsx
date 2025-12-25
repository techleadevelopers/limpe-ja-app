// app/provider/components/dashboard/LogoutSection.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface LogoutSectionProps {
  contentAnim: Animated.Value;
  onLogoutPress: () => void;
}

const LogoutSection: React.FC<LogoutSectionProps> = ({ contentAnim, onLogoutPress }) => {
  return (
    <Animated.View style={[styles.logoutButtonContainer, { opacity: contentAnim }]}>
      <TouchableOpacity style={styles.logoutButton} onPress={onLogoutPress}>
        <Ionicons name="log-out-outline" size={24} color="#D32F2F" style={styles.logoutIcon} />
        <Text style={styles.logoutButtonText}>Sair da Conta</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  logoutButtonContainer: {
    marginTop: 20,
    marginBottom: 20, // Adicionado para consistência com padding original do ScrollView
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 0 },
    }),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
});

export default LogoutSection;