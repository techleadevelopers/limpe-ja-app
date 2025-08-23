// LimpeJaApp/app/(client)/missions/index.tsx
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
  ActivityIndicator,
  RefreshControl, // <--- ADICIONE ESTA LINHA
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; // Importar i18n

import { getClientMissions, claimClientReward } from '../../../services/clientService';
import { ClientMission, ClientReward, MissionCategory } from '../../../types/backend/mission'; // Corrigido para 'missions'
import Toast from '../../../components/Toast'; // Importar o Toast

// Componente para exibir o progresso da missão com animação
const MissionProgressBar: React.FC<{ progress: number; goal: number; category: MissionCategory }> = ({ progress, goal, category }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();

  const progressPct = Math.min(100, (progress / goal) * 100);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPct,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progressPct]);

  const getCategoryColor = (cat: MissionCategory) => {
    switch (cat) {
      case 'FREQUENCY': return '#2196F3'; // Azul
      case 'VOLUME': return '#4CAF50';    // Verde
      case 'DIVERSITY': return '#FB8C00';  // Laranja
      default: return '#9E9E9E'; // Cinza padrão
    }
  };

  const backgroundColor = getCategoryColor(category);

  return (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarBackground, { borderColor: backgroundColor }]}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: backgroundColor,
            },
          ]}
        />
      </View>
      <Text style={styles.progressText}>{`${progress}/${goal}`}</Text>
    </View>
  );
};

// Componente para um card de missão individual
const MissionCard: React.FC<{
  mission: ClientMission;
  onClaim: (missionId: string) => Promise<void>;
  isClaiming: boolean;
}> = ({ mission, onClaim, isClaiming }) => {
  const { t } = useTranslation();
  const { scaleAnim, onPressIn, onPressOut } = useAnimatedTouch(); // Reutilizando hook de animação de toque

  const handleClaimPress = async () => {
    if (mission.claimable && !isClaiming) {
      await onClaim(mission.id);
    }
  };

  const getCategoryLabel = (cat: MissionCategory) => {
    switch (cat) {
      case 'FREQUENCY': return t('missions.category_frequency');
      case 'VOLUME': return t('missions.category_volume');
      case 'DIVERSITY': return t('missions.category_diversity');
      default: return '';
    }
  };

  const categoryColor = getCategoryColor(mission.category);

  return (
    <Animated.View style={[styles.missionCard, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.missionHeader, { borderLeftColor: categoryColor }]}>
        <Text style={styles.missionTitle}>{mission.title}</Text>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
          <Text style={styles.categoryBadgeText}>{getCategoryLabel(mission.category)}</Text>
        </View>
      </View>
      <Text style={styles.missionDescription}>{mission.description}</Text>
      <MissionProgressBar progress={mission.progress} goal={mission.goal} category={mission.category} />
      <View style={styles.missionFooter}>
        <Text style={styles.missionStatus}>
          {mission.completed ? t('missions.completed') : t('missions.in_progress')}
        </Text>
        {mission.claimable && (
          <TouchableOpacity
            style={[styles.claimButton, { opacity: isClaiming ? 0.6 : 1 }]}
            onPress={handleClaimPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={isClaiming}
          >
            {isClaiming ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.claimButtonText}>{t('missions.claim')}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

export default function ClientMissionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [missions, setMissions] = useState<ClientMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  const fetchMissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedMissions = await getClientMissions();
      setMissions(fetchedMissions);
    } catch (error: any) {
      console.error('Erro ao buscar missões do cliente:', error.response?.data || error.message);
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.response?.data?.message || t('common.network_error'),
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

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

    fetchMissions();
  }, [headerAnim, contentAnim, fetchMissions]);

  const handleClaimMission = async (missionId: string) => {
    setClaimingMissionId(missionId);
    try {
      const reward: ClientReward = await claimClientReward(missionId);
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('missions.claim_success', { value: reward.value }), // Ajuste conforme o tipo de recompensa
      });
      fetchMissions(); // Recarrega as missões para atualizar o status
    } catch (error: any) {
      console.error('Erro ao resgatar missão:', error.response?.data || error.message);
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.response?.data?.message || t('missions.claim_error'),
      });
    } finally {
      setClaimingMissionId(null);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchMissions();
  }, [fetchMissions]);

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centeredFeedback}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('missions.title')}</Text>
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
              tintColor="#007AFF"
              title={t('common.loading')}
              titleColor="#007AFF"
            />
          }
        >
          {missions.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="trophy-outline" size={60} color="#9E9E9E" />
              <Text style={styles.emptyStateText}>{t('missions.no_missions')}</Text>
            </View>
          ) : (
            missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onClaim={handleClaimMission}
                isClaiming={claimingMissionId === mission.id}
              />
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// Hook para animação de toque (reutilizável) - Duplicado aqui para evitar circular dependency
// Em um projeto real, seria um arquivo separado em `components/hooks`
const useAnimatedTouch = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 40,
    }).start();
  };
  return { scaleAnim, onPressIn, onPressOut };
};

const getCategoryColor = (cat: MissionCategory) => {
  switch (cat) {
    case 'FREQUENCY': return '#2196F3'; // Azul
    case 'VOLUME': return '#4CAF50';    // Verde
    case 'DIVERSITY': return '#FB8C00';  // Laranja
    default: return '#9E9E9E'; // Cinza padrão
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF', // --background-light-blue
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
  },
  loadingText: {
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
    paddingHorizontal: 15,
  },
  missionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingLeft: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3', // Default blue
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    backgroundColor: '#2196F3', // Default blue
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  missionDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
    borderWidth: 1,
    borderColor: '#9E9E9E', // Default gray
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  missionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  missionStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  claimButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});