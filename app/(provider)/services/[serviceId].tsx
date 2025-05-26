// LimpeJaApp/app/(provider)/services/[serviceId].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
// import { getProviderServiceDetails, updateServiceStatus } from '../../../src/services/providerService';

export default function ProviderServiceDetailsScreen() {
  const { serviceId, type } = useLocalSearchParams<{ serviceId: string, type?: string }>(); // type pode ser 'request', 'upcoming', etc.
  const router = useRouter();
  const [serviceDetails, setServiceDetails] = useState<any | null>(null); // Placeholder
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (serviceId) {
      // TODO: Chamar providerService para buscar detalhes
      // const fetchDetails = async () => { /* ... */ };
      // fetchDetails();
      console.log("Carregando detalhes do serviço/solicitação:", serviceId, "Tipo:", type);
      // Simulação
      setTimeout(() => {
        setServiceDetails({
          id: serviceId,
          clientName: type === 'requests' ? 'Cliente X (Solicitação)' : 'Cliente Y (Agendado)',
          serviceType: 'Limpeza Padrão',
          date: type === 'requests' ? '2025-06-12' : '2025-06-11',
          time: '10:00 - 13:00',
          address: 'Rua Teste, 456',
          notes: 'Cliente informou que possui 2 cachorros pequenos.',
          status: type === 'requests' ? 'Pendente' : 'Confirmado',
          clientId: 'clientAbc123'
        });
        setIsLoading(false);
      }, 1000);
    }
  }, [serviceId, type]);

  const handleAcceptRequest = async () => {
    // TODO: Chamar providerService.updateServiceStatus(serviceId, 'accepted')
    Alert.alert("Sucesso (Simulado)", "Solicitação aceita!");
    setServiceDetails((prev: any) => ({ ...prev, status: 'Confirmado' }));
    // router.push('/(provider)/services'); // ou atualizar a lista
  };
  const handleDeclineRequest = async () => { /* ... */ };
  const handleMarkAsCompleted = async () => { /* ... */ };

  if (isLoading) return <ActivityIndicator size="large" style={styles.loader} />;
  if (!serviceDetails) return <View style={styles.container}><Text>Detalhes não encontrados.</Text></View>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Detalhes: ${serviceDetails.serviceType}` }} />
      <Text style={styles.title}>{serviceDetails.serviceType} para {serviceDetails.clientName}</Text>
      <Text style={styles.detailItem}>Data: {serviceDetails.date} às {serviceDetails.time}</Text>
      <Text style={styles.detailItem}>Endereço: {serviceDetails.address}</Text>
      <Text style={styles.detailItem}>Observações: {serviceDetails.notes}</Text>
      <Text style={styles.detailItem}>Status: {serviceDetails.status}</Text>

      <View style={styles.actionsContainer}>
        {serviceDetails.status === 'Pendente' && (
          <>
            <Button title="Aceitar Solicitação" onPress={handleAcceptRequest} color="green" />
            <Button title="Recusar Solicitação" onPress={handleDeclineRequest} color="orange" />
          </>
        )}
        {serviceDetails.status === 'Confirmado' && (
          <Button title="Marcar como Concluído" onPress={handleMarkAsCompleted} />
        )}
         <Button title="Contatar Cliente" onPress={() => router.push(`/(provider)/messages/${serviceDetails.clientId}?serviceId=${serviceId}`)} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  detailItem: { fontSize: 16, marginBottom: 10 },
  actionsContainer: { marginTop: 30, gap: 10 },
});