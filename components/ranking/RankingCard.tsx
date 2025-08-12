// LimpeJaApp/components/ranking/RankingCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RankingCardProps {
  rank: number;
  name: string;
  score: number;
  avatarUrl?: string | null;
  isCurrentUser?: boolean; // Para destacar o card do usuário logado
  onPress?: () => void; // Opcional, para permitir interatividade
}

const RankingCard: React.FC<RankingCardProps> = ({
  rank,
  name,
  score,
  avatarUrl,
  isCurrentUser = false,
  onPress,
}) => {
  const cardStyle = [
    styles.card,
    isCurrentUser ? styles.currentUserCard : styles.defaultCard,
  ];

  return (
    <TouchableOpacity style={cardStyle} onPress={onPress} disabled={!onPress}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{rank}°</Text>
      </View>
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person-circle-outline" size={40} color="#CED4DA" />
          </View>
        )}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.nameText} numberOfLines={1}>{name}</Text>
        <View style={styles.scoreContainer}>
          <Ionicons name="trophy" size={16} color="#FFD700" />
          <Text style={styles.scoreText}>{score} Pts</Text>
        </View>
      </View>
      {isCurrentUser && (
        <View style={styles.currentUserBadge}>
          <Ionicons name="star" size={18} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  defaultCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
  },
  currentUserCard: {
    backgroundColor: '#E6F0FF', // Um azul claro para destaque
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF', // Cor principal do app
    shadowColor: '#007AFF',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  currentUserBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    padding: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default RankingCard;