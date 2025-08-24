// LimpeJaApp/app/(client)/home/missions.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Easing,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator, // Adicionado para o loading inicial
  RefreshControl,    // Adicionado para o refresh
  useColorScheme,    // Adicionado para theming
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MissionList from '../../../components/missions/MissionList';
import { claimMission, getMyMissions, MissionItem as MissionItemType, MissionAudience } from '../../../services/missionService';
import Toast from '../../../components/Toast'; // Assumindo que você tem um componente Toast
import Colors from '../../../constants/Colors'; // Importa o arquivo de cores

// Hook para acessar as cores do tema atual (copiado de index.tsx)
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

export default function MissionsScreen() {
  const router = useRouter();
  const theme = useTheme(); // Usa o hook de tema

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  // Estados para o carregamento e dados das missões
  const [allMissions, setAllMissions] = useState<MissionItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);

  // Função para carregar todas as missões (copiado de index.tsx)
  const loadMissions = useCallback(async () => {
    setIsRefreshing(true); // Indica que o refresh está ativo
    try {
      const fetchedMissions = await getMyMissions(MissionAudience.CLIENT); // Usa o enum MissionAudience
      setAllMissions(fetchedMissions);
    } catch (error: any) {
      console.error('Erro ao buscar missões do cliente:', error.response?.data || error.message);
      Toast.show({
        type: 'error',
        text1: 'Erro', // Usar t('common.error') se i18n estiver disponível aqui
        text2: error.response?.data?.message || 'Não foi possível carregar as missões.',
      });
    } finally {
      setIsLoading(false); // Define loading para false no final do fetch inicial
      setIsRefreshing(false); // Define refreshing para false no final do fetch (seja inicial ou refresh)
    }
  }, []); // Sem dependências para evitar loop

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 700,
        delay: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    loadMissions(); // Carrega missões na montagem inicial
  }, [headerAnim, contentAnim, loadMissions]);

  const handleClaimMission = async (missionId: string) => {
    try {
      setClaimingMissionId(missionId);
      const response = await claimMission(missionId);

      if (response.ok) {
        // Adapte a mensagem de sucesso conforme a resposta do claimMission (se tiver RewardType, etc.)
        Alert.alert('Sucesso!', 'Recompensa resgatada com sucesso!');
        loadMissions(); // Recarrega as missões para atualizar o status
      } else {
        Alert.alert('Erro', response.reason || 'Não foi possível resgatar a recompensa.');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Não foi possível resgatar a recompensa.';
      Alert.alert('Erro', msg);
      console.error('[missions] claim error:', err);
    } finally {
      setClaimingMissionId(null);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadMissions();
  }, [loadMissions]);

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.centeredFeedback, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>Carregando missões...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header customizado */}
      <Animated.View
        style={[
          styles.customHeader,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
            backgroundColor: theme.primary, // Usa cor do tema
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color={theme.textLight} /> {/* Usa cor do tema */}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textLight }]}>Minhas Missões</Text> {/* Usa cor do tema */}
        <View style={styles.headerActionIconPlaceholder} />
      </Animated.View>

      {/* Conteúdo */}
      <Animated.View
        style={[
          styles.animatedContentWrapper,
          {
            opacity: contentAnim,
            transform: [
              {
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContentContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              title="Carregando..."
              titleColor={theme.primary}
            />
          }
        >
          <MissionList
            // key={reloadKey} // Não é mais necessário, o re-render ocorre com a mudança de 'missions'
            missions={allMissions} // <-- CORREÇÃO: Passa as missões carregadas
            onClaimMission={handleClaimMission}
            claimingMissionId={claimingMissionId}
            onRefresh={onRefresh}       // <-- CORREÇÃO: Passa a função de refresh
            isRefreshing={isRefreshing} // <-- CORREÇÃO: Passa o estado de refresh
          />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF', // --background-light-blue
  },
  centeredFeedback: { // Adicionado para o loading inicial
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
  },
  loadingText: { // Adicionado para o loading inicial
    marginTop: 10,
    fontSize: 16,
    color: '#6C757D',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#223355', // --primary-dark-blue
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerBackButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerActionIconPlaceholder: {
    width: 24,
    marginLeft: 15,
  },
  animatedContentWrapper: {
    flex: 1,
  },
  scrollViewContentContainer: {
    flexGrow: 1,
    paddingVertical: 10,
  },
});