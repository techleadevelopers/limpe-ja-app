// LimpeJaApp/components/CategoryGrid.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import CategoriaCard, { Categoria } from './CategoriaCard'; // Importa o CategoriaCard modificado
import { useRouter } from 'expo-router';

// Dados Mockados para Categorias (atualizados para corresponder aos ícones e cores da imagem)
const CATEGORIAS_EXEMPLO: Categoria[] = [
  { id: '1', nome: 'Carpenter', icone: 'hammer-outline', backgroundColor: '#FFF0E5', iconColor: '#FF7000' }, // Laranja
  { id: '2', nome: 'Cleaner', icone: 'bucket-outline', backgroundColor: '#E0F7FA', iconColor: '#00BCD4' }, // Ciano
  { id: '3', nome: 'Painter', icone: 'brush-outline', backgroundColor: '#E8F5E9', iconColor: '#4CAF50' }, // Verde
  { id: '4', nome: 'Electrician', icone: 'flash-outline', backgroundColor: '#FFFDE7', iconColor: '#FFEB3B' }, // Amarelo
  { id: '5', nome: 'Men\'s Salon', icone: 'cut-outline', backgroundColor: '#F3E5F5', iconColor: '#9C27B0' }, // Roxo (usando cut-outline para tesoura)
  { id: '6', nome: 'AC Repair', icone: 'snow-outline', backgroundColor: '#E3F2FD', iconColor: '#2196F3' }, // Azul
  { id: '7', nome: 'Plumber', icone: 'water-outline', backgroundColor: '#E0F2F7', iconColor: '#009688' }, // Verde-azulado
  { id: '8', nome: 'Beauty', icone: 'rose-outline', backgroundColor: '#FCE4EC', iconColor: '#E91E63' }, // Rosa
];

export default function CategoryGrid() {
  const router = useRouter();

  const handleNavigateToServicosPorCategoria = (categoria: Categoria) => {
    // Implemente a navegação para a tela de serviços por categoria
    Alert.alert('Navegar para', `Serviços de ${categoria.nome}`);
    router.push({
      pathname: '/(client)/explore/servicos-por-categoria',
      params: { categoriaId: categoria.id, categoriaNome: categoria.nome },
    } as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Categories</Text>
        <TouchableOpacity onPress={() => router.push('/(client)/explore/todas-categorias' as any)}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        {CATEGORIAS_EXEMPLO.map((item) => (
          <CategoriaCard
            key={item.id}
            item={item}
            onPress={handleNavigateToServicosPorCategoria}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    // paddingHorizontal: 20, // Removido para que o ScrollView possa ter padding interno
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20, // Adicionado para alinhar o título
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  seeAllText: {
    color: '#007BFF',
    fontWeight: '600',
    fontSize: 14,
  },
  categoryScroll: {
    paddingHorizontal: 12, // Espaçamento interno para os cards do scroll
    paddingRight: 20, // Espaço no final do scroll
  },
});