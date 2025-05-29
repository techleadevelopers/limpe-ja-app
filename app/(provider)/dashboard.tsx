// LimpeJaApp/app/(provider)/dashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated, // Importar Animated para animações
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth'; // Ajuste o caminho se necessário
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Interface para os dados de resumo
interface SummaryData {
  upcomingServices: number;
  newRequests: number;
  weeklyEarnings: string;
  monthlyEarnings: string;
  totalClients: number;
}

// Mock de dados de resumo (simulando uma busca)
const fetchSummaryData = async (): Promise<SummaryData> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        upcomingServices: 3,
        newRequests: 2,
        weeklyEarnings: 'R$ 785,00',
        monthlyEarnings: 'R$ 2.540,00',
        totalClients: 18,
      });
    }, 800); // Simula um atraso de rede
  });
};

// Componente para cada Card de Resumo com animações
const AnimatedSummaryCard: React.FC<{
  title: string;
  value: string | number;
  iconName: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  onPress: () => void;
  delay: number; // Para animação escalonada
  iconType?: 'Ionicons' | 'MaterialCommunityIcons';
}> = ({ title, value, iconName, iconColor, onPress, delay, iconType = 'Ionicons' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  const onPressInCard = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const onPressOutCard = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  const IconComponent = iconType === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;

  return (
    <Animated.View
      style={[
        styles.summaryCardWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={styles.summaryCard}
        onPress={onPress}
        onPressIn={onPressInCard}
        onPressOut={onPressOutCard}
        activeOpacity={1} // Desativa o activeOpacity padrão
      >
        <View style={styles.cardHeader}>
          <IconComponent name={iconName as any} size={30} color={iconColor} />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <Text style={styles.cardValue}>{value}</Text>
        <Ionicons name="chevron-forward-outline" size={24} color="#C7C7CC" style={styles.cardArrow} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Componente para cada Botão de Ação Rápida com animações
const AnimatedQuickActionButton: React.FC<{
  label: string;
  iconName: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  delay: number;
  iconType?: 'Ionicons' | 'MaterialCommunityIcons';
}> = ({ label, iconName, onPress, delay, iconType = 'Ionicons' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  const onPressInButton = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const onPressOutButton = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  const IconComponent = iconType === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;

  return (
    <Animated.View
      style={[
        styles.quickActionButtonWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={onPress}
        onPressIn={onPressInButton}
        onPressOut={onPressOutButton}
        activeOpacity={1}
      >
        <IconComponent name={iconName as any} size={28} color="#007AFF" style={styles.quickActionButtonIcon} />
        <Text style={styles.quickActionButtonText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ProviderDashboardScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const welcomeAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current; // Para o conteúdo principal (cards e ações)

  useEffect(() => {
    // Animação de entrada do cabeçalho
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Animação de entrada do texto de boas-vindas
    Animated.timing(welcomeAnim, {
      toValue: 1,
      duration: 600,
      delay: 100,
      useNativeDriver: true,
    }).start();

    // Carregar dados de resumo
    setIsLoading(true);
    fetchSummaryData()
      .then(data => {
        setSummaryData(data);
        setIsLoading(false);
        // Animação de entrada do conteúdo principal
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 700,
          delay: 300, // Atraso para aparecer depois do cabeçalho e boas-vindas
          useNativeDriver: true,
        }).start();
      })
      .catch(err => {
        console.error("Erro ao buscar dados de resumo:", err);
        Alert.alert("Erro", "Não foi possível carregar os dados do painel.");
        setIsLoading(false);
      });
  }, [headerAnim, welcomeAnim, contentAnim]);

  const handleLogout = () => {
    Alert.alert(
      "Sair da Conta",
      "Tem certeza que deseja sair da sua conta LimpeJá?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          onPress: async () => {
            await signOut();
          },
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };

  if (isLoading || !summaryData) {
    return (
      <View style={styles.outerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        {/* Custom Header para o estado de loading */}
        <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
            <Text style={styles.headerTitle}>Meu Painel</Text>
            <View style={styles.headerActionIconPlaceholder} /> {/* Placeholder para alinhar */}
        </Animated.View>
        <View style={styles.centeredFeedback}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando seu painel...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <Text style={styles.headerTitle}>Meu Painel</Text>
          <TouchableOpacity 
              onPress={() => router.push('/(provider)/profile')}
              style={styles.headerActionIcon}
          >
              <Ionicons name="person-circle-outline" size={30} color="#FFFFFF" />
          </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Animated.View style={[styles.welcomeSection, { opacity: welcomeAnim, transform: [{ translateY: welcomeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.welcomeText}>Bem-vindo(a), {user?.name?.split(' ')[0] || 'Profissional'}!</Text>
            <Text style={styles.roleText}>Visão geral da sua atividade no LimpeJá.</Text>
        </Animated.View>

        <Animated.View style={[styles.summaryCardsContainer, { opacity: contentAnim }]}>
          <AnimatedSummaryCard
            title="Próximos Serviços"
            value={summaryData.upcomingServices}
            iconName="calendar-outline"
            iconColor="#007AFF"
            onPress={() => router.push('/(provider)/schedule')}
            delay={0}
          />
          <AnimatedSummaryCard
            title="Novas Solicitações"
            value={summaryData.newRequests}
            iconName="mail-outline"
            iconColor="#FF9800"
            onPress={() => router.push('/(provider)/services')}
            delay={100}
          />
          <AnimatedSummaryCard
            title="Ganhos da Semana"
            value={summaryData.weeklyEarnings}
            iconName="wallet-outline"
            iconColor="#4CAF50"
            onPress={() => Alert.alert("Em Breve", "Tela de ganhos detalhados em desenvolvimento!")} // router.push('/(provider)/earnings')
            delay={200}
          />
           <AnimatedSummaryCard
            title="Total de Clientes"
            value={summaryData.totalClients}
            iconName="people-outline"
            iconColor="#9C27B0"
            onPress={() => Alert.alert("Em Breve", "Tela de lista de clientes em desenvolvimento!")}
            delay={300}
          />
        </Animated.View>

        <Animated.View style={[styles.chartSection, { opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.sectionTitle}>Performance Financeira</Text>
            {/* Placeholder para um gráfico real */}
            <View style={styles.chartPlaceholder}>
                <MaterialCommunityIcons name="chart-line" size={60} color="#CED4DA" />
                <Text style={styles.chartPlaceholderText}>Gráfico de Ganhos Mensais (em breve)</Text>
                <Text style={styles.chartPlaceholderSubText}>Total do Mês: {summaryData.monthlyEarnings}</Text>
            </View>
            <TouchableOpacity style={styles.viewDetailsButton} onPress={() => Alert.alert("Em Breve", "Tela de relatórios financeiros detalhados!")}>
                <Text style={styles.viewDetailsButtonText}>Ver Relatórios Detalhados</Text>
                <Ionicons name="chevron-forward-outline" size={18} color="#007AFF" />
            </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.quickActionsContainer, { opacity: contentAnim }]}>
            <Text style={styles.sectionTitle}>Ações Rápidas</Text>
            <View style={styles.quickActionsGrid}>
                <AnimatedQuickActionButton
                    label="Gerenciar Disponibilidade"
                    iconName="time-outline"
                    onPress={() => router.push('/(provider)/schedule/manage-availability')}
                    delay={0}
                />
                <AnimatedQuickActionButton
                    label="Editar Meus Serviços"
                    iconName="briefcase-outline"
                    onPress={() => router.push('/(provider)/profile/edit-services')}
                    delay={50}
                />
                <AnimatedQuickActionButton
                    label="Configurações da Conta"
                    iconName="settings-outline"
                    onPress={() => router.push('/(common)/settings')}
                    delay={100}
                />
                <AnimatedQuickActionButton
                    label="Ajuda e Suporte"
                    iconName="help-circle-outline"
                    onPress={() => router.push('/(common)/help')}
                    delay={150}
                />
            </View>
        </Animated.View>

        <Animated.View style={[styles.logoutButtonContainer, { opacity: contentAnim }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#D32F2F" style={styles.logoutIcon} />
            <Text style={styles.logoutButtonText}>Sair da Conta</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Fundo geral mais suave
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 15,
    paddingBottom: 40, // Espaço no final para scroll
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6C757D',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF', // Cor primária do app
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20, // Ajuste para status bar iOS
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1, // Para o título ocupar o espaço e centralizar melhor
    textAlign: 'center',
  },
  headerActionIcon: {
    padding: 5, // Aumenta a área de toque
  },
  headerActionIconPlaceholder: { // Para alinhar o título no centro quando não há ícone
    width: 30, // Largura do ícone
    marginLeft: 15,
  },
  welcomeSection: {
    paddingVertical: 20,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 26, // Maior para destaque
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 16,
    color: '#6C757D',
  },
  summaryCardsContainer: {
    marginBottom: 20,
  },
  summaryCardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginLeft: 15,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginRight: 10,
  },
  cardArrow: {
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 15,
    marginTop: 20,
  },
  chartSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  chartPlaceholder: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: '#868E96',
    marginTop: 10,
  },
  chartPlaceholderSubText: {
    fontSize: 14,
    color: '#868E96',
    marginTop: 5,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  viewDetailsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 5,
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButtonWrapper: {
    width: '48%', // Quase metade para 2 colunas
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  quickActionButton: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionButtonIcon: {
    marginBottom: 8,
  },
  quickActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
  logoutButtonContainer: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
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