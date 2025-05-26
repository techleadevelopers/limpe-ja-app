// LimpeJaApp/app/(client)/explore/index.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';

// Caminhos para os componentes
import HeaderSuperior from '../../../components/HeaderSuperior';
import SaudacaoContainer from '../../../components/SaudacaoContainer';
import SecaoContainer from '../../../components/SecaoContainer';
import BannerOferta from '../../../components/BannerOferta';
import SecaoPrestadores from '../../../components/SecaoPrestadores';
import NavBar from '../../../components/NavBar'; // <<<--- 1. IMPORTE SEU NAVBAR

// Tipos de dados (Categoria, Prestador)
type Categoria = {
  id: string;
  nome: string;
  icone: keyof typeof MaterialCommunityIcons.glyphMap;
};

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

// Dados Mockados (CATEGORIAS_EXEMPLO, PRESTADORES_EXEMPLO)
const CATEGORIAS_EXEMPLO: Categoria[] = [
  { id: '1', nome: 'Residencial', icone: 'home-outline' },
  { id: '2', nome: 'Comercial', icone: 'office-building-outline' },
  { id: '3', nome: 'Pós-obra', icone: 'broom' },
  { id: '4', nome: 'Vidros', icone: 'window-closed-variant' },
  { id: '5', nome: 'Jardim', icone: 'flower-tulip-outline' },
];

const PRESTADORES_EXEMPLO: Prestador[] = [
  { id: 'provider1', nome: 'Ana Oliveira', especialidade: 'Limpeza Residencial', avaliacao: 4.8, precoHora: 'R$ 60,00/hora', distancia: '1.2 km de distância', imagemUrl: 'https://via.placeholder.com/100/ADD8E6/1E3A5F?text=Ana+O.', numeroAvaliacoes: 125, isVerificado: true, descricaoCurta: 'Profissional experiente e dedicada.' },
  { id: 'provider2', nome: 'Carlos Silva', especialidade: 'Limpeza Comercial', avaliacao: 4.9, precoHora: 'R$ 75,00/hora', distancia: '2.5 km de distância', imagemUrl: 'https://via.placeholder.com/100/E0F7FA/00796B?text=Carlos+S.', numeroAvaliacoes: 88, isVerificado: false, descricaoCurta: 'Atendimento de alta qualidade para empresas.' },
  { id: 'provider3', nome: 'Mariana Costa', especialidade: 'Limpeza Pós-obra', avaliacao: 4.7, precoHora: 'R$ 90,00/hora', distancia: '800 m de distância', imagemUrl: 'https://via.placeholder.com/100/B3E5FC/01579B?text=Mariana+C.', numeroAvaliacoes: 55, isVerificado: true, descricaoCurta: 'Deixando tudo impecável após a sua obra.' },
];

export default function ExploreClientScreen() {
  const router = useRouter();
  // const [busca, setBusca] = useState('');

  const handleNavigateToServicosPorCategoria = (categoria: Categoria) => {
    router.push({
      pathname: '/(client)/explore/servicos-por-categoria',
      params: { categoriaId: categoria.id, categoriaNome: categoria.nome },
    });
  };

  const renderCategoriaCard = ({ item }: { item: Categoria }) => (
    <TouchableOpacity style={styles.categoriaCard} onPress={() => handleNavigateToServicosPorCategoria(item)}>
      <MaterialCommunityIcons name={item.icone} size={32} color="#007AFF" />
      <Text style={styles.categoriaTexto}>{item.nome}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}> {/* Container principal que ocupa toda a tela */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView
        style={styles.scrollViewArea} // Estilo para a área do ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Seus componentes de conteúdo */}
        <HeaderSuperior />
        <SaudacaoContainer /> 
        <SecaoContainer
          titulo="Categorias"
          onVerTudoPress={() => router.push('/(client)/explore/todas-categorias')}
          data={CATEGORIAS_EXEMPLO}
          renderItem={renderCategoriaCard}
          horizontal
        />
        <BannerOferta />
        <SecaoPrestadores
          titulo="Próximo de você"
          onVerTudoPress={() => router.push('/(client)/explore/todos-prestadores-proximos')}
          data={PRESTADORES_EXEMPLO}
        />
      </ScrollView>

      {/* 2. SEU NAVBAR ADICIONADO AQUI, FORA E ABAIXO DO SCROLLVIEW */}
      <NavBar /> 
      {/* O componente NavBar deve ter seus próprios estilos para definir altura,
          cor de fundo, e como ele se posiciona (geralmente ocupando a largura total
          e com uma altura fixa na parte inferior). */}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1, // Faz o container principal ocupar toda a tela
    backgroundColor: '#F4F7FC',
    // Se o NavBar não for posicionado de forma absoluta internamente,
    // e você quiser que ele fique fixo embaixo e o ScrollView ocupe o resto:
    // flexDirection: 'column', // (já é o padrão)
    // justifyContent: 'space-between', // Empurraria o NavBar para baixo se ele não tivesse altura definida
  },
  scrollViewArea: { // Área que o ScrollView ocupa
    flex: 1, // Permite que o ScrollView cresça e ocupe o espaço disponível acima do NavBar
  },
  scrollContentContainer: { // Conteúdo DENTRO do ScrollView
    paddingBottom: 80, // 3. AJUSTE ESTE VALOR!
                       // Deve ser um pouco MAIOR que a altura do seu NavBar.
                       // Ex: Se NavBar tem 60px de altura, use 70 ou 80 aqui.
                       // Isso evita que o último item do ScrollView fique escondido atrás do NavBar.
  },
  categoriaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    width: 105,
    height: 105,
    shadowColor: '#003D7A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  categoriaTexto: {
    fontSize: 13,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
});