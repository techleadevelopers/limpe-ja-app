// LimpeJaApp/components/missions/MissionItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Definição da interface para uma Missão
export interface Mission {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: string; // Ex: "YYYY-MM-DD"
  rewardPoints: number;
}

interface MissionItemProps {
  mission: Mission;
  onPress: (mission: Mission) => void;
}

const MissionItem: React.FC<MissionItemProps> = ({ mission, onPress }) => {
  const getStatusColor = (status: Mission['status']) => {
    switch (status) {
      case 'pending':
        return '#FFC107'; // Amarelo
      case 'in_progress':
        return '#007AFF'; // Azul
      case 'completed':
        return '#28A745'; // Verde
      case 'cancelled':
        return '#DC3545'; // Vermelho
      default:
        return '#6C757D'; // Cinza
    }
  };

  const getStatusIcon = (status: Mission['status']) => {
    switch (status) {
      case 'pending':
        return 'hourglass-outline';
      case 'in_progress':
        return 'play-circle-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'information-circle-outline';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(mission)}>
      <View style={styles.header}>
        <Ionicons name={getStatusIcon(mission.status)} size={24} color={getStatusColor(mission.status)} style={styles.icon} />
        <Text style={styles.title}>{mission.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(mission.status) }]}>
          <Text style={styles.statusText}>{mission.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.description} numberOfLines={2}>{mission.description}</Text>
      <View style={styles.footer}>
        <Text style={styles.dueDate}>Vence em: {mission.dueDate}</Text>
        <View style={styles.rewardContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rewardPoints}>{mission.rewardPoints} Pts</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 6,
    borderLeftColor: '#007AFF', // Cor de destaque
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10,
  },
  dueDate: {
    fontSize: 12,
    color: '#888',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBE6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  rewardPoints: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B8860B',
    marginLeft: 4,
  },
});

export default MissionItem;