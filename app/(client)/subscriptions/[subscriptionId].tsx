// LimpeJaApp/app/(client)/subscriptions/[subscriptionId].tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSubscriptionDetails, updateSubscription } from '../../../services/subscriptionService';
import { SubscriptionStatus, UpdateSubscriptionDto } from '../../../types/backend/subscriptions';

export default function SubscriptionDetailsScreen() {
  const { subscriptionId } = useLocalSearchParams();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ['subscriptionDetails', subscriptionId as string],
    queryFn: () => getSubscriptionDetails(subscriptionId as string),
    enabled: !!subscriptionId,
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: (data: UpdateSubscriptionDto) => updateSubscription(subscriptionId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionDetails', subscriptionId as string] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      Alert.alert('Sucesso', 'Assinatura atualizada com sucesso!');
    },
    onError: (err) => {
      Alert.alert('Erro', `Falha ao atualizar assinatura: ${err.message}`);
    },
  });

  const handleStatusChange = (status: SubscriptionStatus) => {
    Alert.alert(
      'Confirmar Ação',
      `Tem certeza que deseja ${status === SubscriptionStatus.PAUSED ? 'pausar' : 'cancelar'} esta assinatura?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          onPress: () => updateSubscriptionMutation.mutate({ status }),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Carregando detalhes da assinatura...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Erro ao carregar detalhes: {error.message}</Text>
      </View>
    );
  }

  if (!subscription) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Assinatura não encontrada.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Detalhes da Assinatura</Text>

      <View style={styles.detailCard}>
        <Text style={styles.label}>Serviço:</Text>
        <Text style={styles.value}>{subscription.providerService.name}</Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.label}>Provedor:</Text>
        <Text style={styles.value}>{subscription.provider.name}</Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{subscription.status}</Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.label}>Frequência:</Text>
        <Text style={styles.value}>{subscription.frequency}</Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.label}>Início:</Text>
        <Text style={styles.value}>{new Date(subscription.startDate).toLocaleDateString()}</Text>
      </View>

      {subscription.endDate && (
        <View style={styles.detailCard}>
          <Text style={styles.label}>Fim (Estimado):</Text>
          <Text style={styles.value}>{new Date(subscription.endDate).toLocaleDateString()}</Text>
        </View>
      )}

      <View style={styles.detailCard}>
        <Text style={styles.label}>Próximo Agendamento:</Text>
        <Text style={styles.value}>{new Date(subscription.nextGenerationDate).toLocaleDateString()}</Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.label}>Valor por Ciclo:</Text>
        <Text style={styles.value}>R$ {subscription.totalPrice.toFixed(2)}</Text>
      </View>

      <Text style={styles.subHeader}>Agendamentos Gerados</Text>
      {subscription.generatedBookings && subscription.generatedBookings.length > 0 ? (
        subscription.generatedBookings.map((booking) => (
          <View key={booking.id} style={styles.bookingCard}>
            <Text style={styles.bookingText}>Data: {new Date(booking.scheduledDate).toLocaleDateString()}</Text>
            <Text style={styles.bookingText}>Status: {booking.status}</Text>
            <TouchableOpacity onPress={() => router.push(`/bookings/${booking.id}`)}>
              <Text style={styles.viewBookingButton}>Ver Detalhes do Agendamento</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={styles.noBookingsText}>Nenhum agendamento gerado ainda.</Text>
      )}

      <View style={styles.buttonContainer}>
        {subscription.status === SubscriptionStatus.ACTIVE && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.pauseButton]}
              onPress={() => handleStatusChange(SubscriptionStatus.PAUSED)}
              disabled={updateSubscriptionMutation.isPending}
            >
              <Text style={styles.buttonText}>Pausar Assinatura</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleStatusChange(SubscriptionStatus.CANCELED)}
              disabled={updateSubscriptionMutation.isPending}
            >
              <Text style={styles.buttonText}>Cancelar Assinatura</Text>
            </TouchableOpacity>
          </>
        )}
        {subscription.status === SubscriptionStatus.PAUSED && (
          <TouchableOpacity
            style={[styles.actionButton, styles.resumeButton]}
            onPress={() => handleStatusChange(SubscriptionStatus.ACTIVE)}
            disabled={updateSubscriptionMutation.isPending}
          >
            <Text style={styles.buttonText}>Reativar Assinatura</Text>
          </TouchableOpacity>
        )}
      </View>
      {updateSubscriptionMutation.isPending && <ActivityIndicator size="small" color="#007bff" style={styles.spinner} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  subHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  detailCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  value: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1,
    textAlign: 'right',
  },
  bookingCard: {
    backgroundColor: '#e0f7fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#00bcd4',
  },
  bookingText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  viewBookingButton: {
    color: '#007bff',
    fontWeight: 'bold',
    marginTop: 5,
  },
  noBookingsText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 50,
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginVertical: 8,
    width: '80%',
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#ffc107',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  resumeButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spinner: {
    marginTop: 10,
  },
});