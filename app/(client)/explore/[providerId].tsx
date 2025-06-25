// app/(client)/explore/[providerId].tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image // Necessário para ReviewCard
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Importações dos componentes necessários
import HeaderSection from './components/provider/HeaderSection';
import StarRating from './components/provider/StarRating';
import InfoChip from './components/provider/InfoChip';
import ActionButtons from './components/provider/ActionButtons';
import ReviewCard from './components/provider/ReviewCard';
import BookServiceButton from './components/provider/BookServiceButton';

// Importações de dados e estilos
// IMPORTANTE: Agora você pode importar VerificationStatus diretamente da interface de tipos.
import { ProviderDisplayInfo, ProviderReview, VerificationStatus } from '../../types/backend/providers';
import { styles } from './styles/providerStyles'; // ESTILOS IMPORTADOS AQUI!

// IMPORTAR O SERVIÇO REAL DO BACKEND
import { getProviderDetails } from '../../services/providerService';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProviderDetailsScreen() {
  const params = useLocalSearchParams<{ providerId: string }>();
  const providerId = params.providerId;
  const router = useRouter();

  const [provider, setProvider] = useState<ProviderDisplayInfo | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mainContentAnim = useRef(new Animated.Value(0)).current;
  const bookNowButtonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log("[ProviderDetailsScreen] useEffect - providerId recebido:", providerId);

    if (providerId && typeof providerId === 'string') {
      setIsLoading(true); setError(null); setProvider(undefined);
      mainContentAnim.setValue(0); bookNowButtonAnim.setValue(0);

      getProviderDetails(providerId)
        .then(data => {
          setProvider(data || null);
          if (!data) {
            setError(`Profissional com ID "${providerId}" não encontrado.`);
          } else {
            console.log("[ProviderDetailsScreen] Dados do provedor carregados:", data);
            console.log("[ProviderDetailsScreen] provider.providerServices:", data.providerServices);
            console.log("[ProviderDetailsScreen] provider.providerServices.length:", data.providerServices?.length);
            console.log("[ProviderDetailsScreen] provider.reviews:", data.reviews); // Adicionar log para reviews

            Animated.stagger(100, [
              Animated.timing(mainContentAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
              Animated.timing(bookNowButtonAnim, { toValue: 1, duration: 400, useNativeDriver: true })
            ]).start();
          }
        })
        .catch(err => {
          console.error("[ProviderDetailsScreen] Erro ao carregar detalhes do provedor:", err);
          setError(err.response?.data?.message || err.message || "Erro ao carregar os detalhes do profissional.");
          setProvider(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setError("ID do profissional inválido."); setIsLoading(false); setProvider(null);
    }
  }, [providerId]);

  if (isLoading) {
    return (
      <View style={styles.centeredFeedback}>
        <Stack.Screen options={{ title: "Carregando...", headerTransparent: true, headerTintColor: '#333' }} />
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !provider) {
    return (
      <View style={styles.centeredFeedback}>
        <Stack.Screen options={{ title: "Erro", headerTransparent: false, headerStyle: { backgroundColor: '#FFFFFF' }, headerTintColor: '#333' }} />
        <Ionicons name="warning-outline" size={48} color="#D32F2F" />
        <Text style={styles.errorText}>{error || `Profissional não encontrado.`}</Text>
        <TouchableOpacity style={styles.errorBackButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.errorBackButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const firstServicePrice = provider.providerServices && provider.providerServices.length > 0
    ? `R$ ${provider.providerServices[0].price.toFixed(2)}`
    : 'Preço não disponível';

  const firstProviderServiceOfferingId = provider.providerServices && provider.providerServices.length > 0
    ? provider.providerServices[0].id
    : undefined;

  console.log("[ProviderDetailsScreen] ID do serviço oferecido a ser passado para agendamento (firstProviderServiceOfferingId):", firstProviderServiceOfferingId);

  return (
    <View style={styles.screenContainer}>
      <Stack.Screen options={{ headerTransparent: true, title: '', headerLeft: () => null, headerRight: () => null }} />
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <HeaderSection provider={{ ...provider, avatarUrl: provider.avatarUrl || undefined }} onBackPress={() => router.back()} />

        <Animated.View style={[
          styles.contentArea,
          {
            opacity: mainContentAnim,
            transform: [{
              translateY: mainContentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] })
            }]
          }
        ]}>
          <View style={styles.providerInfoWhiteCard}>
            <Text style={styles.providerNameWhiteCard}>{provider.fullName}</Text>
            <View style={styles.locationContainerWhiteCard}>
              <Ionicons name="location-sharp" size={15} color="#666" />
              <Text style={styles.locationTextWhiteCard}>{provider.address?.city || 'N/A'}</Text>
            </View>
            <Text style={styles.priceTextWhiteCard}>{firstServicePrice}</Text>
          </View>

          <View style={styles.tabContentContainer}>
            <View style={styles.robustStarContainer}>
              <StarRating rating={provider.averageRating} size={15} color="#4A90E2" />
              <Text style={styles.robustReviewsText}>({provider.reviewCount} avaliações)</Text>
            </View>

            <View style={styles.infoChipsContainer}>
              {provider.yearsOfExperience !== undefined && (
                <InfoChip iconName="hourglass-outline" text={`${provider.yearsOfExperience}+ anos`} />
              )}
              {/* CORREÇÃO: Usar verificationStatus em vez de verified */}
              {provider.verificationStatus === VerificationStatus.APPROVED && ( // <--- CORREÇÃO AQUI
                <InfoChip iconName="shield-checkmark-outline" text="Verificado" />
              )}
            </View>

            <Text style={styles.sectionTitle}>Sobre {provider.fullName.split(' ')[0]}</Text>
            <Text style={styles.descriptionText}>{provider.bio || "Nenhuma descrição detalhada disponível."}</Text>

            <ActionButtons />

            <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Recomendações</Text>
            {provider.reviews && provider.reviews.length > 0 ? (
              provider.reviews.map((review: ProviderReview) => {
                // Acesso seguro e mapeamento para ReviewCard
                const transformedReview = {
                  id: review.id,
                  rating: review.rating,
                  comment: review.comment || '', // Garante que é string
                  createdAt: review.createdAt,
                  // Acesso seguro para client e user dentro de review
                  client: review.client ? { // Se client não for nulo
                    id: review.client.id,
                    fullName: review.client.fullName,
                    user: review.client.user ? { // Se user não for nulo
                      id: review.client.user.id,
                      avatarUrl: review.client.user.avatarUrl || undefined, // Avatar pode ser nulo/undefined
                    } : undefined, // user pode ser undefined
                  } : null, // client pode ser nulo
                  bookingId: review.bookingId,
                  providerId: review.providerId,
                };
                return <ReviewCard key={review.id} review={transformedReview} />;
              })
            ) : (
              <Text style={styles.noReviewsText}>Ainda não há avaliações para {provider.fullName.split(' ')[0]}.</Text>
            )}
            <TouchableOpacity style={styles.addReviewButton}>
              <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
              <Text style={styles.addReviewButtonText}>Deixar uma Avaliação</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      <BookServiceButton
        providerId={provider.id}
        serviceId={firstProviderServiceOfferingId}
        router={router}
        bookNowButtonAnim={bookNowButtonAnim}
      />
    </View>
  );
}