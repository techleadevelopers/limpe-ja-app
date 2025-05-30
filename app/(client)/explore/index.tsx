import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  // Text, // Removido se não usado diretamente aqui
  // TouchableOpacity, // Removido se não usado diretamente aqui
  // Platform, // Removido se não usado diretamente aqui
  Animated,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

// Caminhos para os componentes (ajuste se sua estrutura for diferente)
import BannerOferta from '../ofertas/components/BannerOferta';
import HeaderSuperior from '../../../components/layout/HeaderSuperior';
import NavBar from '../../../components/layout/NavBar';
import CategoriaCard, { Categoria as TipoCategoria } from './components/CategoriaCard'; // Sua importação existente
import SecaoContainer from './components/SecaoContainer';
import SecaoPrestadores, { Prestador } from './components/SecaoPrestadores'; // Importa Prestador (com as alterações de fundo já feitas)

// CORRIGIDO: Definição de CATEGORIAS_EXEMPLO com a propriedade 'corFundo'
const COR_AZUL_CLARO_UNIFICADA = '#A0D2EB'; // Ou a cor azul claro que você decidiu

const CATEGORIAS_EXEMPLO: TipoCategoria[] = [
  { id: '1', nome: 'Residencial', icone: 'home-outline', corFundo: COR_AZUL_CLARO_UNIFICADA },
  { id: '2', nome: 'Comercial', icone: 'office-building-outline', corFundo: COR_AZUL_CLARO_UNIFICADA },
  { id: '3', nome: 'Pós-obra', icone: 'broom', corFundo: COR_AZUL_CLARO_UNIFICADA },
  { id: '4', nome: 'Vidros', icone: 'window-closed-variant', corFundo: COR_AZUL_CLARO_UNIFICADA },
  { id: '5', nome: 'Jardim', icone: 'flower-tulip-outline', corFundo: COR_AZUL_CLARO_UNIFICADA },
  { id: '6', nome: 'Passar Roupa', icone: 'iron-outline', corFundo: COR_AZUL_CLARO_UNIFICADA },
];

// Seus dados mockados PRESTADORES_EXEMPLO (mantidos como no seu código)
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

export default function ExploreClientScreen() {
  const router = useRouter();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const saudacaoAnim = useRef(new Animated.Value(0)).current;
  const categoriasAnim = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const prestadoresAnim = useRef(new Animated.Value(0)).current;
  const navBarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(saudacaoAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(categoriasAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(bannerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(prestadoresAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(navBarAnim, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
    ]).start();
  }, [headerAnim, saudacaoAnim, categoriasAnim, bannerAnim, prestadoresAnim, navBarAnim]);

  const handleNavigateToServicosPorCategoria = (categoria: TipoCategoria) => {
    router.push({
      pathname: '/(client)/explore/servicos-por-categoria',
      params: { categoriaId: categoria.id, categoriaNome: categoria.nome },
    } as any);
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scrollViewArea}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
          <HeaderSuperior />
        </Animated.View>

        <Animated.View style={{ opacity: saudacaoAnim, transform: [{ translateY: saudacaoAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
          {/* Seu componente de saudação ou conteúdo aqui, se houver */}
        </Animated.View>

        <Animated.View style={{ opacity: categoriasAnim, transform: [{ translateY: categoriasAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
          <SecaoContainer
            titulo="Categorias Populares"
            onVerTudoPress={() => router.push('/(client)/explore/todas-categorias' as any)}
            data={CATEGORIAS_EXEMPLO} // Agora CATEGORIAS_EXEMPLO está corretamente definido com corFundo
            renderItem={({ item }: { item: TipoCategoria }) => (
              <CategoriaCard
                item={item}
                onPress={handleNavigateToServicosPorCategoria}
              />
            )}
            horizontal
          />
        </Animated.View>

        <Animated.View style={{ opacity: bannerAnim, transform: [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
          <BannerOferta />
        </Animated.View>

        <Animated.View style={{ opacity: prestadoresAnim, transform: [{ translateY: prestadoresAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
          <SecaoPrestadores
            titulo="Profissionais por Perto"
            onVerTudoPress={() => router.push('/(client)/explore/todos-prestadores-proximos' as any)}
            data={PRESTADORES_EXEMPLO}
          />
        </Animated.View>
      </ScrollView>

      <Animated.View style={[styles.navBarContainer, { transform: [{ translateY: navBarAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }] }]}>
        <NavBar />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7FC', // Fundo principal da tela
  },
  scrollViewArea: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 90, // Garante espaço para a NavBar não sobrepor o último conteúdo
  },
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});