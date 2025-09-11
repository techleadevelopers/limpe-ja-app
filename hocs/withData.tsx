// hocs/withData.tsx
import React, { ComponentType, useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Importe AppColors do seu diretório de produção, conforme sua estrutura real
import { AppColors } from '../constants/appStyles'; 

// Define uma forma genérica de props que inclui nossas props de dados injetadas pelo HOC
interface WithDataProps {
  data: any; // Os dados fetched
  loading: boolean; // Estado de carregamento
  error: any; // Objeto de erro, se houver
  refetch: () => void; // Função para refetch dos dados
}

// Estilos básicos para os componentes de feedback (esqueleto, erro, vazio)
// Devem ser consistentes com o seu AppStyles.
const feedbackStyles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: AppColors.backgroundLight,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: AppColors.textAuxiliary,
  },
  errorText: {
    fontSize: 16,
    color: AppColors.errorRed,
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: AppColors.primaryInteractive,
    borderRadius: 8,
  },
  retryButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textBody,
    marginTop: 15,
    textAlign: 'center',
  },
  emptyStateSubText: {
    fontSize: 15,
    color: AppColors.textAuxiliary,
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

// Componente de Skeleton/Shimmer (Placeholder)
const ShimmerComponent = () => (
  <View style={[feedbackStyles.centered, { backgroundColor: AppColors.backgroundLight }]}>
    <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
    <Text style={feedbackStyles.loadingText}>Carregando...</Text>
  </View>
);

// Componente de Erro (Placeholder)
const ErrorComponent = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
  <View style={feedbackStyles.centered}>
    <Ionicons name="alert-circle-outline" size={64} color={AppColors.errorRed} />
    <Text style={feedbackStyles.errorText}>{message}</Text>
    <TouchableOpacity onPress={onRetry} style={feedbackStyles.retryButton}>
      <Text style={feedbackStyles.retryButtonText}>Tentar Novamente</Text>
    </TouchableOpacity>
  </View>
);

// Componente de Estado Vazio (Placeholder)
const EmptyStateComponent = ({ message, subMessage }: { message: string, subMessage?: string }) => (
  <View style={feedbackStyles.centered}>
    <Ionicons name="sad-outline" size={60} color={AppColors.mediumGray} />
    <Text style={feedbackStyles.emptyStateText}>{message}</Text>
    {subMessage && <Text style={feedbackStyles.emptyStateSubText}>{subMessage}</Text>}
  </View>
);

// O HOC withData
export function withData<P extends object>(
  WrappedComponent: ComponentType<P & WithDataProps> // O componente que será envolvido, com as props injetadas
) {
  // Define as props que o HOC espera receber ao ser instanciado
  type HOCSpecificProps = {
    fetcher: () => Promise<any>; // Função que busca os dados
    emptyMessage?: string; // Mensagem para estado vazio
    emptySubMessage?: string; // Sub-mensagem para estado vazio
  };

  // Retorna um novo componente funcional que fará o fetch e renderizará o WrappedComponent
  return function WithDataWrapper(props: Omit<P, keyof WithDataProps> & HOCSpecificProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<any>(null);

    const { fetcher, emptyMessage, emptySubMessage, ...rest } = props;

    const fetchData = async () => {
      setLoading(true);
      setError(null); // Limpa erros anteriores
      try {
        const result = await fetcher();
        setData(result);
      } catch (err: any) {
        console.error("Erro no HOC withData:", err);
        setError(err.response?.data?.message || err.message || "Erro desconhecido ao carregar dados.");
        // Você pode integrar seu Toast aqui se tiver um componente global
        // Ex: Toast.show({ type: 'error', text1: 'Erro', text2: 'Não foi possível carregar os dados.' });
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchData();
    }, [fetcher]); // Depende da função fetcher para recarregar

    // Renderiza o componente de Shimmer/Skeleton durante o carregamento
    if (loading) {
      return <ShimmerComponent />;
    }

    // Renderiza o componente de Erro
    if (error) {
      return <ErrorComponent message={error} onRetry={fetchData} />;
    }

    // Renderiza o componente de Estado Vazio se os dados estiverem vazios (e não for um erro)
    if (data === null || (Array.isArray(data) && data.length === 0)) {
        return <EmptyStateComponent message={emptyMessage || "Nenhum dado encontrado."} subMessage={emptySubMessage} />;
    }

    // Renderiza o WrappedComponent com os dados e as props injetadas
    return (
      <WrappedComponent
        {...(rest as P)} // Passa as props originais do componente
        data={data}
        loading={loading}
        error={error}
        refetch={fetchData}
      />
    );
  };
}