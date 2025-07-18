// components/OverviewContent.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
// IMPORTAÇÃO CORRIGIDA AQUI:
import { styles } from '../../../../app/(client)/explore/styles/providerStyles';
// CORREÇÃO: Importa os tipos corretos diretamente
import { ProviderDisplayInfo, ProviderReview } from '../../../../types/backend/providers';

import ActionButtons from './ActionButtons';
import InfoChip from './InfoChip';
import ReviewCard from './ReviewCard';
import StarRating from './StarRating';

interface OverviewContentProps {
  provider: ProviderDisplayInfo; // CORREÇÃO: Tipo para ProviderDisplayInfo
}

const OverviewContent: React.FC<OverviewContentProps> = ({ provider }) => {
  return (
    <View style={styles.tabContentContainer}>
      <View style={styles.robustStarContainer}>
        {/* CORREÇÃO: Acessar averageRating */}
        <StarRating rating={provider.averageRating} size={20} color="#4A90E2" />
        {/* CORREÇÃO: Acessar reviewCount */}
        <Text style={styles.robustReviewsText}>({provider.reviewCount} avaliações)</Text>
      </View>

      <View style={styles.infoChipsContainer}>
        {/* CORREÇÃO: Acessar yearsOfExperience */}
        {provider.yearsOfExperience !== undefined && (
          <InfoChip iconName="hourglass-outline" text={`${provider.yearsOfExperience}+ anos`} />
        )}
        {/* CORREÇÃO: Acessar verified */}
        {provider.verified && (
          <InfoChip iconName="shield-checkmark-outline" text="Verificado" />
        )}
      </View>

      {/* CORREÇÃO: Acessar fullName e bio */}
      <Text style={styles.sectionTitle}>Sobre {provider.fullName.split(' ')[0]}</Text>
      <Text style={styles.descriptionText}>{provider.bio || "Nenhuma descrição detalhada disponível."}</Text>

      <ActionButtons />

      <Text style={[styles.sectionTitle, { marginTop: 25 }]}>O que dizem os clientes</Text>
      {/* CORREÇÃO: Acessar reviews e tipar 'review' */}
      {provider.reviews && provider.reviews.length > 0 ? (
        provider.reviews.map((review: ProviderReview) => { // CORREÇÃO: Tipagem explícita
          // CORREÇÃO: Transformar o objeto review para garantir compatibilidade de tipos
          // Substituir 'null' por 'undefined' em avatarUrl e garantir comment como string
          const transformedReview = {
            ...review,
            comment: review.comment || '', // Garante que comment é string
            client: {
              ...review.client,
              user: {
                ...review.client.user,
                avatarUrl: review.client.user.avatarUrl || undefined // Transforma null em undefined
              }
            }
          };
          return <ReviewCard key={review.id} review={transformedReview} />;
        })
      ) : (
        // CORREÇÃO: Acessar fullName
        <Text style={styles.noReviewsText}>Ainda não há avaliações para {provider.fullName.split(' ')[0]}.</Text>
      )}
      <TouchableOpacity style={styles.addReviewButton}>
        <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
        <Text style={styles.addReviewButtonText}>Deixar uma Avaliação</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OverviewContent;