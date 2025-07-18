import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// CORREÇÃO: Importa a interface ProviderDisplayInfo do seu local comum e completo
import { ProviderDisplayInfo } from '../../../../types/backend/providers'; // AJUSTE O CAMINHO CONFORME A ESTRUTURA REAL DO SEU PROJETO

// REMOVIDO: A definição local da interface ProviderDisplayInfo foi removida daqui.
// Ela deve ser importada do arquivo de tipos centralizado.

interface SecaoPrestadoresProps {
  titulo: string;
  data: ProviderDisplayInfo[]; // Já estava como ProviderDisplayInfo[]
  onVerTudoPress: () => void;
  titleColor?: string;
  noDataText?: string; // Adicionado para exibir mensagem quando não há dados
  horizontal?: boolean; // Adicionada prop horizontal para ser consistente com SecaoContainer
  // NOVO: Adiciona a prop renderItem
 renderItem: ({ item, index }: { item: ProviderDisplayInfo; index: number }) => React.ReactElement | null;
}

const SecaoPrestadores: React.FC<SecaoPrestadoresProps> = ({
  titulo,
  data,
  onVerTudoPress,
  titleColor = '#202633',
  noDataText = 'Nenhum prestador disponível no momento.', // Default para o texto de não dados
  horizontal = false, // Default para false
  renderItem, // <-- DESESTRUTURADO AQUI!
}) => {
  // `router` e `handlePrestadorPress` não são mais necessários aqui se `renderItem` renderizar o `ProviderCard`
  // const router = useRouter(); // Comentado, pois não é usado
  // const handlePrestadorPress = useCallback((prestadorId: string) => { /* ... */ }, []); // Comentado, pois não é usado

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: titleColor }]}>{titulo}</Text>
        {onVerTudoPress && (
          <TouchableOpacity onPress={onVerTudoPress} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Ver Tudo <Ionicons name="arrow-forward" size={14} color="#007BFF" /></Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal={horizontal} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScrollContainer}>
        {data.length > 0 ? (
          data.map((item, index) => renderItem({ item, index })) // <-- USANDO renderItem AQUI!
        ) : (
          <Text style={styles.emptyText}>{noDataText}</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: '#F4F7FC',
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#202633',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
  },
  cardsScrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  emptyText: {
    flex: 1,
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    paddingHorizontal: 20,
  },
});

export default SecaoPrestadores;