// LimpeJaApp/components/missions/MissionList.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert, RefreshControl, ScrollView, useColorScheme } from 'react-native';
import MissionItem from './MissionItem';
import { MissionItem as MissionItemType, MissionStatus } from '../../services/missionService';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors'; // Importa o arquivo de cores

// Hook para acessar as cores do tema atual
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

interface MissionListProps {
  missions: MissionItemType[];
  onClaimMission: (missionId: string) => void;
  claimingMissionId: string | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  asStaticList?: boolean; // Quando true, renderiza itens sem FlatList (para uso dentro de ScrollView)
}

const MissionList: React.FC<MissionListProps> = ({ missions, onClaimMission, claimingMissionId, onRefresh, isRefreshing, asStaticList }) => {
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme(); // Usa o hook de tema

  if (error) {
    if (asStaticList) {
      return (
        <View style={[styles.centered, { backgroundColor: theme.background }] }>
          <Ionicons name="alert-circle-outline" size={50} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <Text style={[styles.errorHint, { color: theme.textMuted }]}>Puxe para baixo para tentar novamente.</Text>
        </View>
      );
    }
    return (
      <ScrollView
        contentContainerStyle={[styles.centered, { backgroundColor: theme.background }]} // Usa a cor de fundo do tema
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme.primary]} />
        }
      >
        <Ionicons name="alert-circle-outline" size={50} color={theme.error} /> {/* Usa a cor de erro do tema */}
        <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text> {/* Usa a cor do texto do tema */}
        <Text style={[styles.errorHint, { color: theme.textMuted }]}>Puxe para baixo para tentar novamente.</Text> {/* Usa a cor do texto mudo do tema */}
      </ScrollView>
    );
  }

  if (missions.length === 0 && !isRefreshing) {
    if (asStaticList) {
      return (
        <View style={[styles.centered, { backgroundColor: theme.background }] }>
          <Ionicons name="trophy-outline" size={60} color={theme.textMuted} />
          <Text style={[styles.emptyText, { color: theme.text }]}>Nenhuma missão encontrada para esta categoria.</Text>
          <Text style={[styles.emptyHint, { color: theme.textMuted }]}>Verifique novamente mais tarde ou explore outras categorias!</Text>
        </View>
      );
    }
    return (
      <ScrollView
        contentContainerStyle={[styles.centered, { backgroundColor: theme.background }]} // Usa a cor de fundo do tema
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme.primary]} />
        }
      >
        <Ionicons name="trophy-outline" size={60} color={theme.textMuted} /> {/* Usa a cor do texto mudo do tema */}
        <Text style={[styles.emptyText, { color: theme.text }]}>Nenhuma missão encontrada para esta categoria.</Text> {/* Usa a cor do texto do tema */}
        <Text style={[styles.emptyHint, { color: theme.textMuted }]}>Verifique novamente mais tarde ou explore outras categorias!</Text> {/* Usa a cor do texto mudo do tema */}
      </ScrollView>
    );
  }

  if (asStaticList) {
    return (
      <View style={[styles.listContainer, { backgroundColor: theme.background }] }>
        {missions.map((item, index) => (
          <MissionItem
            key={item.mission.id}
            mission={item}
            delay={index * 100}
            onClaim={onClaimMission}
            isClaiming={claimingMissionId === item.mission.id}
          />
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={missions}
      keyExtractor={(item) => item.mission.id}
      renderItem={({ item, index }) => (
        <MissionItem
          mission={item}
          delay={index * 100}
          onClaim={onClaimMission}
          isClaiming={claimingMissionId === item.mission.id}
        />
      )}
      contentContainerStyle={[styles.listContainer, { backgroundColor: theme.background }]} // Usa a cor de fundo do tema
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme.primary]} />
      }
    />
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  errorHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContainer: {
    paddingVertical: 10,
  },
});

export default MissionList;
