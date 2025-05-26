// LimpeJaApp/app/(client)/ofertas/[ofertaId].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

// 1. Defina um tipo para sua Oferta (pode ir para src/types/offer.ts ou similar)
interface OfferDetails {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  terms?: string;
  discountPercentage?: number;
  originalPrice?: number;
  discountedPrice?: number;
  validUntil?: string;
}

// 2. Crie uma fonte de dados mockada (substitua por API no futuro)
const MOCK_OFFERS: OfferDetails[] = [
  {
    id: 'primeiraLimpeza30off', // Mesmo ID usado no BannerOferta
    title: '30% OFF na Primeira Limpeza!',
    description: 'Aproveite um super desconto para experimentar nossos serviços de limpeza residencial de alta qualidade. Deixe sua casa brilhando!',
    imageUrl: 'https://via.placeholder.com/600x300/87CEEB/1E3A5F?text=Super+Oferta+LimpeJ%C3%A1',
    terms: 'Válido apenas para novos clientes. Não acumulativo com outras promoções. Agendamento sujeito à disponibilidade.',
    discountPercentage: 30,
    validUntil: '2025-12-31',
  },
  {
    id: 'limpezaEscritorioTop',
    title: 'Pacote Limpeza Escritório Top',
    description: 'Mantenha seu ambiente de trabalho impecável com nosso pacote especial para escritórios.',
    imageUrl: 'https://via.placeholder.com/600x300/90EE90/006400?text=Limpeza+Escrit%C3%B3rio',
    terms: 'Contratos mensais ou quinzenais. Consulte condições.',
  },
  // Adicione mais ofertas mockadas se desejar
];

// Função mockada para buscar detalhes da oferta
const fetchOfferDetailsFromAPI = async (id: string): Promise<OfferDetails | undefined> => {
  console.log(`[DetalhesOfertaScreen] Buscando detalhes para oferta ID: ${id}`);
  // Simula uma chamada de API
  await new Promise(resolve => setTimeout(resolve, 700));
  const foundOffer = MOCK_OFFERS.find(offer => offer.id === id);
  if (!foundOffer) {
    // throw new Error("Oferta não encontrada"); // Para simular erro de API
  }
  return foundOffer;
};


export default function DetalhesOfertaScreen() {
  const { ofertaId } = useLocalSearchParams<{ ofertaId: string }>();
  
  // 3. Estados para dados da oferta, carregamento e erro
  const [offer, setOffer] = useState<OfferDetails | null | undefined>(undefined); // undefined para estado inicial antes da busca
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 4. useEffect para buscar os dados da oferta
  useEffect(() => {
    if (ofertaId) {
      setIsLoading(true);
      setError(null);
      setOffer(undefined); // Limpa a oferta anterior ao buscar uma nova

      fetchOfferDetailsFromAPI(ofertaId)
        .then(data => {
          if (data) {
            setOffer(data);
          } else {
            setOffer(null); // Indica que a oferta não foi encontrada
            setError(`Oferta com ID "${ofertaId}" não encontrada.`);
          }
        })
        .catch(err => {
          console.error("[DetalhesOfertaScreen] Erro ao buscar detalhes da oferta:", err);
          setError(err.message || "Não foi possível carregar os detalhes da oferta.");
          setOffer(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setError("ID da oferta não fornecido.");
      setIsLoading(false);
      setOffer(null);
    }
  }, [ofertaId]); // Re-executa se o ofertaId mudar

  // 5. Renderização condicional
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: "Carregando Oferta..." }} />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Carregando detalhes da oferta...</Text>
      </View>
    );
  }

  if (error || !offer) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: "Erro na Oferta" }} />
        <Text style={styles.errorText}>{error || `Oferta "${ofertaId}" não encontrada.`}</Text>
      </View>
    );
  }

  // Se chegou aqui, a oferta foi carregada com sucesso
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: offer.title || "Detalhes da Oferta" }} />
      
      {offer.imageUrl && (
        <Image source={{ uri: offer.imageUrl }} style={styles.offerImage} resizeMode="cover" />
      )}
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{offer.title}</Text>
        
        {offer.discountPercentage && (
            <Text style={styles.discountBadge}>{offer.discountPercentage}% OFF</Text>
        )}

        <Text style={styles.description}>{offer.description}</Text>

        {offer.terms && (
            <>
                <Text style={styles.subHeader}>Termos e Condições:</Text>
                <Text style={styles.terms}>{offer.terms}</Text>
            </>
        )}

        {offer.validUntil && (
            <Text style={styles.validUntil}>Válido até: {new Date(offer.validUntil).toLocaleDateString('pt-BR')}</Text>
        )}

        {/* TODO: Adicionar botão de ação, como "Agendar com esta oferta" */}
        {/* Este botão precisaria navegar para a tela de agendamento, passando o ID da oferta ou detalhes */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#f4f7fc',
  },
  offerImage: {
    width: '100%',
    height: 200, // Ajuste conforme necessário
    marginBottom: 0, // Para o conteúdo começar logo abaixo
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 10,
  },
  discountBadge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#E53935', // Um vermelho para destaque do desconto
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 15,
    overflow: 'hidden',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C3A5F',
    marginTop: 10,
    marginBottom: 5,
  },
  terms: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
    marginBottom: 15,
  },
  validUntil: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'gray',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  }
});