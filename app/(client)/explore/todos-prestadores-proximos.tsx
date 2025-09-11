// LimpeJaApp/app/(client)/explore/todos-prestadores-proximos.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { withData } from '../../../hocs/withData'; // Importar o HOC (arquivo novo)
import { getNearbyProviders } from '../../../services/providerService'; // Importar seu serviço
import ProviderCard from '../../../components/ProviderCard'; // Importar seu componente de card
import { ProviderDisplayInfo } from '../../../types/backend/providers'; // Importar seu tipo
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../../constants/appStyles'; // Importar suas cores

// Definir a interface para as props que o HOC withData injetará
interface InjectedDataProps {
  data: ProviderDisplayInfo[];
  loading: boolean;
  error: any;
  refetch: () => void;
}

// Componente de Conteúdo que receberá as props injetadas pelo HOC
const TodosPrestadoresProximosContent: React.FC<InjectedDataProps> = ({ data, loading, error, refetch }) => {
  const router = useRouter();

  const handleProviderPress = (providerId: string) => {
    // FIX: Caminho correto para o perfil do provedor
    router.push({
      pathname: '/(client)/explore/[providerId]', // Caminho ajustado
      params: { providerId: providerId }
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Prestadores Próximos',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: AppColors.backgroundLight,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons name="arrow-back" size={24} color={AppColors.textBody} />
            </TouchableOpacity>
          ),
        }}
      />
      <Text style={styles.title}>Todos os Prestadores Próximos</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProviderCard
            provider={item}
            onPress={handleProviderPress} // Passa a função handleProviderPress
          />
        )}
        contentContainerStyle={styles.listContentContainer}
        onRefresh={refetch}
        refreshing={loading} // Use o estado de loading do HOC para o refreshing
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundLight,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: AppColors.textBody,
    marginTop: 10,
  },
  listContentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
});

// Componente Wrapper que usará o HOC e passará as props específicas do HOC
const TodosPrestadoresProximosWrapped = withData(TodosPrestadoresProximosContent);

export default function TodosPrestadoresProximosScreen() {
  // Aqui você pode obter a localização real do usuário e passá-la para getNearbyProviders
  // Por enquanto, usamos 0,0 como placeholders
  const fetcher = React.useCallback(() => getNearbyProviders(0, 0), []); // Substitua 0,0 por coordenadas reais

  return (
    <TodosPrestadoresProximosWrapped
      fetcher={fetcher}
      emptyMessage='Nenhum prestador próximo encontrado.'
      emptySubMessage='Tente ajustar sua localização ou verifique mais tarde.'
    />
  );
}