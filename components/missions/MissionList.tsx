// LimpeJaApp/components/missions/MissionList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert, RefreshControl, ScrollView } from 'react-native'; // <--- ADICIONADO ScrollView AQUI
import MissionItem, { Mission } from './MissionItem'; // Importa MissionItem e a interface Mission

// Simulação de uma função de API para buscar missões
const fetchMissionsApi = (): Promise<Mission[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const dummyMissions: Mission[] = [
        {
          id: '1',
          title: 'Limpeza Residencial Completa',
          description: 'Limpeza profunda de casa com 3 quartos, 2 banheiros, sala e cozinha. Inclui janelas e armários.',
          status: 'pending',
          dueDate: '2025-08-15',
          rewardPoints: 150,
        },
        {
          id: '2',
          title: 'Organização de Escritório',
          description: 'Organização de documentos, mesas e prateleiras em um pequeno escritório comercial.',
          status: 'in_progress',
          dueDate: '2025-08-12',
          rewardPoints: 100,
        },
        {
          id: '3',
          title: 'Limpeza Pós-Obra',
          description: 'Remoção de resíduos de construção e limpeza geral após reforma de apartamento.',
          status: 'completed',
          dueDate: '2025-08-08',
          rewardPoints: 200,
        },
        {
          id: '4',
          title: 'Lavagem de Estofados',
          description: 'Lavagem a seco de sofá de 3 lugares e duas poltronas.',
          status: 'pending',
          dueDate: '2025-08-20',
          rewardPoints: 120,
        },
        {
          id: '5',
          title: 'Limpeza de Condomínio',
          description: 'Limpeza de áreas comuns de um pequeno condomínio (hall, escadas, salão de festas).',
          status: 'cancelled',
          dueDate: '2025-08-10',
          rewardPoints: 180,
        },
      ];
      resolve(dummyMissions);
    }, 1500); // Simula atraso de rede
  });
};

const MissionList: React.FC = () => {
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

  const handleMissionPress = (mission: Mission) => {
    Alert.alert(
      mission.title,
      `Status: ${mission.status.replace('_', ' ').toUpperCase()}\nVence em: ${mission.dueDate}\nRecompensa: ${mission.rewardPoints} Pts\n\n${mission.description}`,
      [{ text: 'OK' }]
    );
    // Aqui você poderia navegar para uma tela de detalhes da missão
    // Ex: navigation.navigate('MissionDetails', { missionId: mission.id });
  };

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
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>Puxe para baixo para tentar novamente.</Text>
      </View>
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
        <Text style={styles.emptyText}>Nenhuma missão encontrada no momento.</Text>
        <Text style={styles.emptyHint}>Verifique novamente mais tarde!</Text>
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={missions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MissionItem mission={item} onPress={handleMissionPress} />}
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
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 18,
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorHint: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyHint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  listContainer: {
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
  },
});

export default MissionList;