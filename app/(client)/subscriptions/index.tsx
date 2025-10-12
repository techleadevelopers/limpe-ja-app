// LimpeJaApp/app/(client)/subscriptions/index.tsx
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getSubscriptionsForUser } from '../../../services/subscriptionService';
import { Subscription } from '../../../types/backend/subscriptions';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import NotificationUIService from '../../../services/notificationUIService';

export default function SubscriptionsListScreen() {
  const { data: subscriptions, isLoading, error } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: getSubscriptionsForUser,
  });

  if (isLoading) {
    return <Text style={styles.loadingText}>Carregando assinaturas...</Text>;
  }

  if (error) {
    NotificationUIService.showError((error as any)?.message || 'Não foi possível carregar suas assinaturas.', 'Erro');
  }

  const renderItem = ({ item }: { item: Subscription }) => (
    <TouchableOpacity
      style={styles.subscriptionCard}
      onPress={() => {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/subscriptions/${item.id}`);
      }}
    >
      <Text style={styles.cardTitle}>Assinatura de {item.providerService.name}</Text>
      <Text style={styles.cardText}>Status: {item.status}</Text>
      <Text style={styles.cardText}>Frequência: {item.frequency}</Text>
      <Text style={styles.cardText}>Próximo Agendamento: {new Date(item.nextGenerationDate).toLocaleDateString()}</Text>
      <Text style={styles.cardText}>Valor por ciclo: R$ {item.totalPrice.toFixed(2)}</Text>
      <Text style={styles.manageButton}>Gerenciar Assinatura</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Minhas Assinaturas</Text>
      {subscriptions && subscriptions.length > 0 ? (
        <FlatList
          data={subscriptions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <Text style={styles.noSubscriptionsText}>Você não possui assinaturas ativas.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: 'red',
  },
  subscriptionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#444',
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  manageButton: {
    marginTop: 10,
    color: '#007bff',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  listContent: {
    paddingBottom: 20,
  },
  noSubscriptionsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});
