// LimpeJaApp/app/(client)/explore/todos-prestadores-proximos.tsx
import { getCurrentPosition } from '../../../services/locationService';
import { getUserProfile } from '../../../services/clientService';
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
  const fetcher = React.useCallback(async () => {
    let city: string | undefined;
    let state: string | undefined;
    let fallbackCoords: { latitude: number; longitude: number } | null = null;

    try {
      const profile = await getUserProfile();
      const addr =
        profile?.clientDetails?.address ||
        profile?.providerDetails?.address ||
        profile?.address;
      city = typeof addr?.city === 'string' ? addr.city.trim().toLowerCase() : undefined;
      state = typeof addr?.state === 'string' ? addr.state.trim().toLowerCase() : undefined;
      if (typeof addr?.latitude === 'number' && typeof addr?.longitude === 'number') {
        fallbackCoords = { latitude: addr.latitude, longitude: addr.longitude };
      }
    } catch {
      // silencioso se o perfil falhar
    }

    const coords = await getCurrentPosition();
    const coordsToUse = coords || fallbackCoords;

    return getNearbyProviders({
      ...(coordsToUse ? { latitude: coordsToUse.latitude, longitude: coordsToUse.longitude } : {}),
      city,
      state,
      radius: 50,
    });
  }, []);


  return (
    <TodosPrestadoresProximosWrapped
      fetcher={fetcher}
      emptyMessage='Nenhum prestador próximo encontrado.'
      emptySubMessage='Tente ajustar sua localização ou verifique mais tarde.'
    />
  );
}
