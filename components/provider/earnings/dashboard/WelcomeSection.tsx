// app/(provider)/components/dashboard/WelcomeSection.tsx
import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';

interface WelcomeSectionProps {
  welcomeAnim: Animated.Value;
  userName?: string;
}

// Função auxiliar para obter a saudação baseada na hora do dia
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Bom dia';
  }
  if (hour < 18) {
    return 'Boa tarde';
  }
  return 'Boa noite';
};

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ welcomeAnim, userName }) => {
  const greeting = getGreeting(); // Obtém a saudação dinâmica

  return (
    <Animated.View
      style={[
        styles.welcomeSection,
        { opacity: welcomeAnim, transform: [{ translateY: welcomeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
      ]}
    >
      <Text style={styles.welcomeGreeting}>{greeting},</Text> {/* Saudação dinâmica */}
      <Text style={styles.welcomeText}>{userName || 'Profissional'}!</Text>
      <Text style={styles.roleText}>Visão geral da sua atividade no LimpeJá.</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  welcomeSection: {
    paddingVertical: 20,
    marginBottom: 10,
    // Garante que o texto se alinhe bem, talvez um padding horizontal se a tela não tiver
    paddingHorizontal: 15, // Adicionado para consistência de padding com outras seções
  },
  welcomeGreeting: {
    fontSize: 20,
    fontWeight: 'normal', // Mais suave que 'bold'
    color: '#6C757D', // Um tom de cinza mais suave para a saudação
    marginBottom: 2, // Espaço menor entre saudação e nome
  },
  welcomeText: {
    fontSize: 28, // Um pouco maior para destaque
    fontWeight: 'bold',
    color: '#212529', // Cor para bom contraste
    marginBottom: 5,
  },
  roleText: {
    fontSize: 16,
    color: '#868E96', // Um cinza mais claro para o texto secundário
  },
});

export default WelcomeSection;