// LimpeJaApp/app/(provider)/profile/edit-services.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
// import { getProviderOfferedServices, updateProviderServices } from '../../../src/services/providerService';

interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  price: string; // Pode ser 'por hora', 'fixo', etc.
  priceValue?: number;
  duration?: string; // ex: '2 horas', 'varia'
}

export default function EditProviderServicesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Estados para adicionar/editar serviço
  const [isEditing, setIsEditing] = useState<ServiceOffering | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('');


  useEffect(() => {
    // TODO: Carregar serviços oferecidos pelo provedor
    // const fetchServices = async () => { /* ... */ }
    // fetchServices();
    // Simulação
    setServices([
      { id: 's1', name: 'Limpeza Padrão Residencial', description: 'Limpeza de rotina para casas e apartamentos.', price: 'R$ 60/hora', duration: 'Mín. 2 horas' },
      { id: 's2', name: 'Limpeza Pesada', description: 'Limpeza profunda, ideal para pós-festa ou mudança.', price: 'R$ 90/hora', duration: 'Mín. 3 horas' },
    ]);
  }, []);

  const handleSaveServices = async () => {
    // TODO: Chamar providerService para salvar todas as alterações nos serviços
    // await updateProviderServices(services);
    Alert.alert("Sucesso (Simulado)", "Serviços atualizados!");
    // router.back();
  };

  const handleAddOrUpdateService = () => {
    if (!serviceName || !servicePrice) {
      Alert.alert("Erro", "Nome e preço do serviço são obrigatórios.");
      return;
    }
    if (isEditing) {
      setServices(prev => prev.map(s => s.id === isEditing.id ? { ...isEditing, name: serviceName, description: serviceDesc, price: servicePrice } : s));
    } else {
      setServices(prev => [...prev, { id: String(Date.now()), name: serviceName, description: serviceDesc, price: servicePrice }]);
    }
    // Limpar formulário
    setIsEditing(null);
    setServiceName('');
    setServiceDesc('');
    setServicePrice('');
  };

  const startEdit = (service: ServiceOffering) => {
    setIsEditing(service);
    setServiceName(service.name);
    setServiceDesc(service.description);
    setServicePrice(service.price);
  };

  const deleteService = (serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
  };


  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Editar Meus Serviços' }} />
      <Text style={styles.title}>Meus Serviços Oferecidos</Text>

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>{isEditing ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</Text>
        <TextInput style={styles.input} placeholder="Nome do Serviço (ex: Limpeza Padrão)" value={serviceName} onChangeText={setServiceName} />
        <TextInput style={styles.input} placeholder="Descrição (opcional)" value={serviceDesc} onChangeText={setServiceDesc} multiline />
        <TextInput style={styles.input} placeholder="Preço (ex: R$ 50/hora, R$ 200 fixo)" value={servicePrice} onChangeText={setServicePrice} />
        <Button title={isEditing ? "Atualizar Serviço" : "Adicionar Serviço"} onPress={handleAddOrUpdateService} />
        {isEditing && <Button title="Cancelar Edição" onPress={() => { setIsEditing(null); setServiceName(''); setServiceDesc(''); setServicePrice(''); }} color="gray" />}
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.serviceItem}>
            <View>
              <Text style={styles.serviceName}>{item.name}</Text>
              <Text>{item.description}</Text>
              <Text>Preço: {item.price}</Text>
            </View>
            <View style={styles.serviceActions}>
              <Button title="Editar" onPress={() => startEdit(item)} />
              <Button title="Excluir" onPress={() => deleteService(item.id)} color="red" />
            </View>
          </View>
        )}
        ListHeaderComponent={<Text style={styles.listHeader}>Serviços Cadastrados:</Text>}
      />
      <View style={styles.saveButtonContainer}>
        <Button title="Salvar Todas as Alterações nos Serviços" onPress={handleSaveServices} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  formContainer: { marginBottom: 20, padding: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 5 },
  formTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4, marginBottom: 10 },
  listHeader: { fontSize: 18, fontWeight: '600', marginTop: 10, marginBottom: 5 },
  serviceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  serviceName: { fontSize: 16, fontWeight: 'bold' },
  serviceActions: { flexDirection: 'row', gap: 5},
  saveButtonContainer: { marginTop: 20, marginBottom: 10 },
});