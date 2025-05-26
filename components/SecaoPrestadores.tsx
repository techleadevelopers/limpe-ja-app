// LimpeJaApp/components/SecaoPrestadores.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Importar useRouter

// Se você exportou 'Prestador' de explore/index.tsx ou de um types.ts, importe-o.
// Exemplo: import { Prestador } from '../app/(client)/explore/index';
// Para manter este exemplo autocontido, vou redefinir, mas o ideal é um tipo compartilhado.
export type Prestador = {
  id: string;
  nome: string;
  especialidade: string;
  avaliacao: number;
  precoHora: string;
  distancia?: string;
  imagemUrl: string;
  numeroAvaliacoes?: number;
  isVerificado?: boolean;
  descricaoCurta?: string;
};

interface SecaoPrestadoresProps {
  titulo: string;
  data: Prestador[];
  onVerTudoPress?: () => void; // Prop para o botão "Ver tudo"
}

const SecaoPrestadores: React.FC<SecaoPrestadoresProps> = ({ titulo, data, onVerTudoPress }) => {
  const router = useRouter(); // Usar o hook para navegação

  const handlePrestadorPress = (prestadorId: string) => {
    console.log(`[SecaoPrestadores] Navegando para o perfil do prestador ID: ${prestadorId}`);
    // Navega para a tela de detalhes do prestador.
    // O nome do arquivo dinâmico deve ser [providerId].tsx ou similar na pasta explore.
    router.push(`/(client)/explore/${prestadorId}`);
  };

  // Componente interno para renderizar cada card de prestador
  const RenderPrestadorCard = ({ item }: { item: Prestador }) => (
    <TouchableOpacity 
      style={styles.prestadorCardItem} 
      onPress={() => { // Adiciona o onPress aqui
        console.log(`[SecaoPrestadores] Card do prestador clicado: ${item.nome}, ID: ${item.id}`);
        handlePrestadorPress(item.id); // Chama a função de navegação com o ID do item
      }}
    >
      <Image source={{ uri: item.imagemUrl }} style={styles.prestadorImagemItem} />
      <View style={styles.prestadorInfoContainerItem}>
        <View style={styles.prestadorHeaderItem}>
          <Text style={styles.prestadorNomeItem} numberOfLines={1}>{item.nome}</Text>
          <View style={styles.ratingContainerItem}>
            <Ionicons name="star" size={14} color="#FFC107" style={styles.iconItem} />
            <Text style={styles.prestadorAvaliacaoItem}>{item.avaliacao.toFixed(1)}</Text>
            {item.numeroAvaliacoes !== undefined && (
              <Text style={styles.avaliacaoCountItem}>({item.numeroAvaliacoes})</Text>
            )}
          </View>
        </View>
        <Text style={styles.prestadorEspecialidadeItem} numberOfLines={1}>{item.especialidade}</Text>
        <Text style={styles.prestadorPrecoItem}>{item.precoHora}</Text>
        {item.descricaoCurta && (
          <Text style={styles.descricaoCurtaItem} numberOfLines={2}>{item.descricaoCurta}</Text>
        )}
        {item.distancia && (
          <View style={styles.distanceContainerItem}>
            <Ionicons name="location-sharp" size={13} color="#555" style={styles.iconItem} />
            <Text style={styles.prestadorDistanciaItem}>{item.distancia}</Text>
          </View>
        )}
        {item.isVerificado && (
          <View style={styles.verifiedBadgeItem}>
            <MaterialCommunityIcons name="shield-check-outline" size={14} color="#4CAF50" style={styles.iconItem} />
            <Text style={styles.verifiedTextItem}>Verificado</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.secaoContainer}>
      <View style={styles.secaoHeader}>
        <Text style={styles.secaoTitulo}>{titulo}</Text>
        {onVerTudoPress && (
          <TouchableOpacity onPress={onVerTudoPress}>
            <Text style={styles.verTudoTexto}>Ver tudo {'>'}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View>
        {data.map((prestador) => (
          // Cada card renderizado é um RenderPrestadorCardInterno
          // A key é importante para o React otimizar a renderização da lista
          <View key={prestador.id} style={styles.cardWrapper}>
            <RenderPrestadorCard item={prestador} />
          </View>
        ))}
      </View>
    </View>
  );
};

// Seus estilos (mantidos da sua versão, com pequenos ajustes nos comentários ou nomes se necessário)
const styles = StyleSheet.create({
  secaoContainer: { marginTop: 30, paddingHorizontal: 20 },
  secaoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  secaoTitulo: { fontSize: 20, fontWeight: 'bold', color: '#1C3A5F' }, // Ajustado fontWeight para string
  verTudoTexto: { fontSize: 15, color: '#007AFF', fontWeight: '600' },
  cardWrapper: { marginBottom: 15 },
  prestadorCardItem: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 15, shadowColor: '#003D7A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, flexDirection: 'row', alignItems: 'flex-start' },
  prestadorImagemItem: { width: 70, height: 70, borderRadius: 35, marginRight: 15 },
  prestadorInfoContainerItem: { flex: 1 },
  prestadorHeaderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  prestadorNomeItem: { fontSize: 17, fontWeight: 'bold', color: '#333', flexShrink: 1, marginRight: 5 },
  ratingContainerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5E1', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  iconItem: { marginRight: 3 },
  prestadorAvaliacaoItem: { fontSize: 13, color: '#FFA000', marginLeft: 3, fontWeight: 'bold' },
  avaliacaoCountItem: { fontSize: 11, color: '#777', marginLeft: 3 },
  prestadorEspecialidadeItem: { fontSize: 14, color: '#555', marginBottom: 4 },
  prestadorPrecoItem: { fontSize: 15, color: '#007AFF', fontWeight: '600', marginBottom: 6 }, // fontWeight '600'
  descricaoCurtaItem: { fontSize: 13, color: '#888', marginBottom: 6 },
  distanceContainerItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  prestadorDistanciaItem: { fontSize: 13, color: '#777' },
  verifiedBadgeItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F7FA', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 6, alignSelf: 'flex-start', marginTop: 6 },
  verifiedTextItem: { fontSize: 11, color: '#2E7D32', fontWeight: 'bold' },
});

export default SecaoPrestadores;