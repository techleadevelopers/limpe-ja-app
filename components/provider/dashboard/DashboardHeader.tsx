// app/provider/components/dashboard/DashboardHeader.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// Supondo que você tenha um hook useAuth para pegar o nome do provedor
// import { useAuth } from '../../../../contexts/AuthContext'; // Ajuste o caminho conforme necessário

interface DashboardHeaderProps {
  headerAnim: Animated.Value;
  onProfilePress: () => void;
  onNotificationsPress: () => void; // Nova prop para navegação de notificações
  providerName?: string; // Opcional, pode vir do useAuth ou props diretas
  notificationCount?: number; // Opcional, para badge de notificação
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  headerAnim,
  onProfilePress,
  onNotificationsPress,
  providerName = "Provedor", // Fallback se o nome não for passado
  notificationCount = 0,
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

  return (
    <Animated.View
      style={[
        styles.customHeader,
        { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }] },
      ]}
    >
      <LinearGradient
        colors={['#007AFF', '#005BBB'] as const} // Azul primário e um tom mais escuro
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }} // Gradiente diagonal sutil
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.headerContent}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>{greeting},</Text>
          <Text style={styles.providerNameText}>{providerName}!</Text>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={onNotificationsPress} style={styles.actionButton} accessibilityRole="button" accessibilityLabel="Ver notificações">
            <Ionicons name="notifications-outline" size={28} color="#FFFFFF" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onProfilePress} style={styles.actionButton} accessibilityRole="button" accessibilityLabel="Ver perfil">
            <Ionicons name="person-circle-outline" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  customHeader: {
    paddingTop: Platform.OS === 'ios' ? 90 : 30, // Ajuste para status bar
    paddingBottom: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  },
  greetingText: {
    fontSize: 14,
    color: '#E0EFFF', // Um branco azulado mais suave
    fontWeight: 'normal',
  },
  providerNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8, // Área de toque maior
    marginLeft: 10, // Espaçamento entre botões de ação
    position: 'relative', // Para o badge de notificação
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FF3B30', // Vermelho para destaque
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default DashboardHeader;