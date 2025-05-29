// LimpeJaApp/components/ServiceList.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import ServiceCard, { Prestador } from './ServiceCard'; // Importa o novo ServiceCard
import { useRouter } from 'expo-router';

// Dados Mockados para Prestadores (atualizados para corresponder aos detalhes da imagem)
const PRESTADORES_EXEMPLO: Prestador[] = [
  {
    id: 'service1',
    nome: 'Living Room Cleaning',
    especialidade: 'Living Room Cleaning',
    avaliacao: 4.8,
    numeroAvaliacoes: 130,
    preco: '$200 $250',
    imagemUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Exemplo de imagem
  },
  {
    id: 'service2',
    nome: 'Kitchen Cleaning',
    especialidade: 'Kitchen Cleaning',
    avaliacao: 4.9,
    numeroAvaliacoes: 130,
    preco: '$150 $180',
    imagemUrl: 'https://images.unsplash.com/photo-1600626391439-f9c314986796?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Exemplo de imagem
  },
  {
    id: 'service3',
    nome: 'Bathroom Cleaning',
    especialidade: 'Bathroom Cleaning',
    avaliacao: 4.7,
    numeroAvaliacoes: 130,
    preco: '$100 $120',
    imagemUrl: 'https://images.unsplash.com/photo-1588665971169-95240228795b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Exemplo de imagem
  },
];

export default function ServiceList() {
  const router = useRouter();

  const handleNavigateToServiceDetail = (prestador: Prestador) => {
    // Implemente a navegação para a tela de detalhes do serviço
    Alert.alert('Detalhes do Serviço', `Navegando para ${prestador.especialidade}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Best Services</Text>
        <TouchableOpacity onPress={() => Alert.alert('Ver Todos', 'Navegando para todos os serviços')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceScroll}>
        {PRESTADORES_EXEMPLO.map((item) => (
          <ServiceCard
            key={item.id}
            item={item}
            onPress={handleNavigateToServiceDetail}
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
  serviceScroll: {
    paddingHorizontal: 12, // Espaçamento interno para os cards do scroll
    paddingRight: 20, // Espaço no final do scroll
  },
});