// LimpeJaApp/components/missions/MissionList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert, RefreshControl, ScrollView } from 'react-native';
import MissionItem from './MissionItem'; // <-- CORRIGIDO: Importa apenas MissionItem
import { Mission } from '../../types/backend/mission'; // <-- CORRIGIDO: Importa a interface Mission do arquivo de tipos
import { Ionicons } from '@expo/vector-icons'; // <-- ADICIONADO: Importação de Ionicons

// Simulação de uma função de API para buscar missões
const fetchMissionsApi = (): Promise<Mission[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const dummyMissions: Mission[] = [
        {
          id: 'm1',
          name: 'Primeira Limpeza!',
          description: 'Conclua seu primeiro agendamento de limpeza.',
          currentProgress: 0,
          targetValue: 1,
          rewardType: 'COUPON',
          rewardValue: 20,
          status: 'ACTIVE',
        },
        {
          id: 'm2',
          name: 'Cliente Fiel',
          description: 'Agende e conclua 3 limpezas.',
          currentProgress: 1,
          targetValue: 3,
          rewardType: 'POINTS',
          rewardValue: 100,
          status: 'ACTIVE',
        },
        {
          id: 'm3',
          name: 'Avalie um Serviço',
          description: 'Deixe uma avaliação para um serviço concluído.',
          currentProgress: 1,
          targetValue: 1,
          rewardType: 'POINTS',
          rewardValue: 50,
          status: 'COMPLETED', // Simula uma missão concluída mas não resgatada
        },
        {
          id: 'm4',
          name: 'Indique um Amigo',
          description: 'Seu amigo deve realizar o primeiro agendamento.',
          currentProgress: 0,
          targetValue: 1,
          rewardType: 'COUPON',
          rewardValue: 30,
          status: 'ACTIVE',
        },
        {
          id: 'm5',
          name: 'Super Cliente',
          description: 'Conclua 10 agendamentos.',
          currentProgress: 10,
          targetValue: 10,
          rewardType: 'POINTS',
          rewardValue: 500,
          status: 'CLAIMED', // Simula uma missão já resgatada
        },
        // Adicione mais missões aqui, se desejar
      ];
      resolve(dummyMissions);
    }, 1500); // Simula atraso de rede
  });
};

interface MissionListProps {
    onClaimMission: (missionId: string) => void;
    claimingMissionId: string | null;
}

const MissionList: React.FC<MissionListProps> = ({ onClaimMission, claimingMissionId }) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadMissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMissionsApi();
      setMissions(data);
    } catch (err: any) {
      setError('Falha ao carregar missões: ' + (err.message || 'Erro desconhecido'));
      Alert.alert('Erro', 'Não foi possível carregar as missões. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMissions();
  }, [loadMissions]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando missões...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ScrollView
        contentContainerStyle={styles.centered}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
        }
      >
        <Ionicons name="alert-circle-outline" size={50} color="#DC3545" />
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>Puxe para baixo para tentar novamente.</Text>
      </ScrollView>
    );
  }

  if (missions.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.centered}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
        }
      >
        <Ionicons name="flag-outline" size={50} color="#ADB5BD" />
        <Text style={styles.emptyText}>Nenhuma missão encontrada no momento.</Text>
        <Text style={styles.emptyHint}>Verifique novamente mais tarde!</Text>
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={missions}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <MissionItem
          mission={item}
          delay={index * 100} // Animação escalonada
          onClaim={onClaimMission}
          isClaiming={claimingMissionId === item.id}
        />
      )}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
      }
    />
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F8FF', // Mantendo o background-light-blue do seu app
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6C757D', // --text-medium
  },
  errorText: {
    fontSize: 18,
    color: '#D32F2F', // Vermelho para erro
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  errorHint: {
    fontSize: 14,
    color: '#888', // Cinza mais escuro
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#6C757D', // --text-medium
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 14,
    color: '#888', // Cinza mais escuro
    textAlign: 'center',
  },
  listContainer: {
    paddingVertical: 10,
    backgroundColor: '#F0F8FF', // Mantendo o background-light-blue
  },
});

export default MissionList;