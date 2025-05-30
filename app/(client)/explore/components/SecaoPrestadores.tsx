import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View } from 'react-native'; // Adicionado StyleProp e TextStyle
import PrestadorCard from './PrestadorCard'; // Importa o PrestadorCard refatorado

// O TIPO PRESTADOR É EXPORTADO AQUI!
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
  descricaoCurta?: string; // Pode ser usado futuramente
  // Adicione isFavorito se for implementar a funcionalidade de favoritar
  // isFavorito?: boolean;
};

// Dados Mockados para Prestadores (mantidos conforme o original)
const PRESTADORES_EXEMPLO: Prestador[] = [
  {
    id: 'provider1',
    nome: 'Ana Oliveira',
    especialidade: 'Limpeza Residencial',
    avaliacao: 4.8,
    precoHora: 'R$ 60/h',
    distancia: '1.2 km',
    imagemUrl: 'https://randomuser.me/api/portraits/women/43.jpg',
    numeroAvaliacoes: 125,
    isVerificado: true,
    descricaoCurta: 'Profissional experiente e dedicada, limpeza detalhada.'
  },
  {
    id: 'provider2',
    nome: 'Carlos Silva',
    especialidade: 'Limpeza Comercial',
    avaliacao: 4.9,
    precoHora: 'R$ 75/h',
    distancia: '2.5 km',
    imagemUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    numeroAvaliacoes: 88,
    isVerificado: false,
    descricaoCurta: 'Alta qualidade para empresas, foco em resultados.'
  },
  {
    id: 'provider3',
    nome: 'Mariana Costa',
    especialidade: 'Limpeza Pós-obra',
    avaliacao: 4.7,
    precoHora: 'R$ 90/h',
    distancia: '800 m',
    imagemUrl: 'https://randomuser.me/api/portraits/women/55.jpg',
    numeroAvaliacoes: 55,
    isVerificado: true,
    descricaoCurta: 'Especialista em deixar tudo impecável após sua reforma.'
  },
  {
    id: 'provider4',
    nome: 'Rafael Lima',
    especialidade: 'Limpeza de Vidros e Fachadas',
    avaliacao: 4.6,
    precoHora: 'R$ 70/h',
    distancia: '3.1 km',
    imagemUrl: 'https://randomuser.me/api/portraits/men/47.jpg',
    numeroAvaliacoes: 30,
    isVerificado: true,
    descricaoCurta: 'Vidros limpos e brilhantes, com segurança e profissionalismo.'
  },
];

interface SecaoPrestadoresProps {
  titulo: string;
  data?: Prestador[]; // Tornar opcional para usar os mockados padrão
  onVerTudoPress?: () => void;
  titleColor?: string; // ADICIONADO: Propriedade opcional para a cor do título
}

const SecaoPrestadores: React.FC<SecaoPrestadoresProps> = ({
  titulo,
  data = PRESTADORES_EXEMPLO, // Usar os dados mockados padrão se não forem passados
  onVerTudoPress,
  titleColor, // ADICIONADO: Recebe a cor do título como propriedade
}) => {
  const router = useRouter();

  const handlePrestadorPress = (prestadorId: string) => {
    // Implemente a navegação para a tela de detalhes do prestador
    Alert.alert('Detalhes do Prestador', `Navegando para o prestador ${prestadorId}`);
    router.push(`/(client)/explore/${prestadorId}` as any);
  };

  // ADICIONADO: Cria um array de estilos para o título.
  // Ele começa com o estilo base de styles.sectionTitle.
  // Se titleColor for fornecido, um objeto de estilo com essa cor é adicionado,
  // o que sobrescreverá a cor definida em styles.sectionTitle.
  const tituloStyle: StyleProp<TextStyle> = [
    styles.sectionTitle, // Estilo base (incluindo a cor padrão '#000000')
    titleColor ? { color: titleColor } : {} // Aplica a cor da prop se existir
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* ADICIONADO: Usa o array de estilos 'tituloStyle' */}
        <Text style={tituloStyle}>{titulo}</Text>
        {onVerTudoPress && (
          <TouchableOpacity onPress={onVerTudoPress} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Ver Todos</Text>
            {/* Ícone com cor ajustada e observação sobre o tamanho */}
            <Ionicons name="arrow-forward-outline" size={10} color="#007BFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScrollContainer}>
        {data.length > 0 ? (
          data.map((item) => (
            <PrestadorCard key={item.id} item={item} onPress={handlePrestadorPress} />
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhum prestador disponível no momento.</Text>
        )}
      </ScrollView>
    </View>
  );
};

// O StyleSheet.create permanece EXATAMENTE como você forneceu.
// A cor em styles.sectionTitle.color ('#000000') servirá como fallback
// se a prop titleColor não for passada para o componente.
const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: '#F4F7FC', // Fundo azul claro para a seção (do seu código original)
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
    color: '#202633', // Preto para legibilidade em fundo claro (do seu código original, servirá como fallback)
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007BFF', // Azul primário do app (do seu código original)
    fontWeight: '600',
    marginRight: 4,
  },
  cardsScrollContainer: {
    paddingHorizontal: 20,
    paddingRight: 5,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#757575', // Cinza mais escuro para melhor contraste em fundo claro (do seu código original)
    marginTop: 20,
    paddingHorizontal: 15,
  },
});

export default SecaoPrestadores;
