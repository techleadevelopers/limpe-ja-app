// LimpeJaApp/app/(provider)/services/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { Link, Stack, useRouter } from 'expo-router';
// import { getProviderServices } from '../../../src/services/providerService'; // A ser criada
// import { ServiceRequestOrBooking } from '../../../src/types'; // A ser criada

export default function ProviderServicesScreen() {
  const router = useRouter();
  // const [services, setServices] = useState<ServiceRequestOrBooking[]>([]);
  const [services, setServices] = useState<any[]>([]); // Placeholder
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('requests'); // 'requests', 'upcoming', 'completed'

  useEffect(() => {
    // TODO: Chamar providerService para buscar serviços/solicitações com base no filtro
    // const fetchServices = async () => { /* ... */ };
    // fetchServices();
    console.log("Carregando serviços do provedor com filtro:", filter);
    // Simulação
    setTimeout(() => {
      if (filter === 'requests') {
        setServices([
          { id: 'req1', clientName: 'Cliente X', serviceType: 'Limpeza Padrão', requestedDate: '2025-06-12' },
        ]);
      } else if (filter === 'upcoming') {
        setServices([
          { id: 'serv1', clientName: 'Cliente Y', serviceType: 'Limpeza Pesada', scheduledDate: '2025-06-11' },
        ]);
      } else {
        setServices([]);
      }
      setIsLoading(false);
    }, 1000);
  }, [filter]);

  const renderServiceItem = ({ item }: { item: any /* ServiceRequestOrBooking */ }) => (
    <Link href={`/(provider)/services/${item.id}?type=${filter}`} style={styles.itemContainer}>
      <View>
        <Text style={styles.itemTitle}>{item.serviceType} para {item.clientName}</Text>
        <Text>Data: {item.requestedDate || item.scheduledDate}</Text>
      </View>
    </Link>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Meus Serviços' }} />
      <View style={styles.filterContainer}>
        <Button title="Solicitações" onPress={() => setFilter('requests')} disabled={filter === 'requests'} />
        <Button title="Próximos" onPress={() => setFilter('upcoming')} disabled={filter === 'upcoming'} />
        <Button title="Concluídos" onPress={() => setFilter('completed')} disabled={filter === 'completed'} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : services.length > 0 ? (
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id}
        />
      ) : (
        <Text style={styles.emptyText}>Nenhum item encontrado.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemContainer: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: 'white' },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
});