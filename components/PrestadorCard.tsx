// /app/(tabs)/PrestadorCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface PrestadorCardProps {
  item: any; // Use o tipo Prestador aqui se estiver disponível
  navigation: any;
}

const PrestadorCard: React.FC<PrestadorCardProps> = ({ item, navigation }) => {
  return (
    <TouchableOpacity style={styles.prestadorCard} onPress={() => navigation.navigate('DetalhesPrestador', { prestador: item })}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imagemUrl }} style={styles.prestadorImagem} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.prestadorNome}>{item.nome}</Text>
        <Text style={styles.prestadorPreco}>{item.precoHora}</Text>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="briefcase-outline" size={14} color="#777" style={styles.icon} />
          <Text style={styles.prestadorEspecialidade}>{item.especialidade}</Text>
        </View>
        {item.distancia && (
          <View style={styles.detailRow}>
            <Ionicons name="location-sharp" size={14} color="#777" style={styles.icon} />
            <Text style={styles.prestadorDistancia}>{item.distancia}</Text>
          </View>
        )}
      </View>
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={14} color="#FFC107" />
        <Text style={styles.prestadorAvaliacao}>{item.avaliacao.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  prestadorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#003D7A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    width: 'auto',
  },
  imageContainer: {
    marginRight: 12,
  },
  prestadorImagem: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  prestadorNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  prestadorPreco: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  icon: {
    marginRight: 5,
  },
  prestadorEspecialidade: {
    fontSize: 12,
    color: '#777',
  },
  prestadorDistancia: {
    fontSize: 12,
    color: '#777',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  prestadorAvaliacao: {
    fontSize: 12,
    color: '#FFA000',
    marginLeft: 3,
    fontWeight: 'bold',
  },
});

export default PrestadorCard;