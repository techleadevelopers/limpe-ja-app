// components/OverviewContent.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View, Image } from 'react-native';
import { styles } from '../../../../styles/providerStyles';
import { VerificationStatus } from '../../../../types/backend/auth';
import { ProviderDisplayInfo, ProviderReview } from '../../../../types/backend/providers';

import ActionButtons from './ActionButtons';
import InfoChip from './InfoChip'; // Importa o InfoChip
import ReviewCard from './ReviewCard';
import StarRating from './StarRating';

interface OverviewContentProps {
  provider: ProviderDisplayInfo;
  providerMetrics: any;
}

const OverviewContent: React.FC<OverviewContentProps> = ({ provider, providerMetrics }) => {
  const { t } = useTranslation();
  const acceptanceLabel = t('metrics.acceptance_short', 'Aceita\u00e7\u00e3o');
  const responseLabel = t('metrics.response_short', 'Resposta');
  const minutesLabel = t('metrics.minutes_short', 'min');

  const rawAcceptance = providerMetrics?.acceptanceRate;
  const displayAcceptance =
    rawAcceptance !== undefined && rawAcceptance !== null
      ? Math.max(Number(rawAcceptance) || 0, 50)
      : undefined;

  const rawResponse =
    providerMetrics?.avgResponseTime ?? providerMetrics?.averageResponseTime;

  return (
    <View style={styles.tabContentContainer}>
      {/* O bloco robustStarContainer aqui está com estilos que parecem ser de um arquivo de estilos diferente (providerStyles.ts)
          e não é o mesmo que o cabeçalho principal, mas manteremos o tamanho 20. */}
      <View style={styles.robustStarContainer}>
        <StarRating rating={provider.averageRating} size={20} color="#4A90E2" />
        <Text style={styles.robustReviewsText}>({provider.reviewCount} {t('provider_details.reviews_count_short')})</Text>
      </View>

      {/* CORREÇÃO 5: Usando InfoChip com prop compact */}
      <View style={styles.infoChipsContainer}>
        {provider.yearsOfExperience !== undefined && provider.yearsOfExperience !== null && (
          <InfoChip
            iconName="hourglass-outline" // Usando ícone Ionicons (assumindo que o componente InfoChip foi atualizado para usar iconName)
            text={t('provider_details.years_experience', { count: provider.yearsOfExperience })}
            compact
          />
        )}
        {provider.verificationStatus === VerificationStatus.APPROVED && (
          <InfoChip
            iconName="shield-checkmark-outline" // Usando ícone Ionicons
            text={t('provider_details.verified')}
            compact
          />
        )}
        {displayAcceptance !== undefined && (
          <InfoChip
            iconName="checkmark-done-circle-outline" // Usando �cone Ionicons
            text={`${acceptanceLabel}: ${displayAcceptance}%`}
            compact
          />
        )}
        {rawResponse !== undefined && rawResponse !== null && (
          <InfoChip
            iconName="time-outline" // Usando �cone Ionicons
            text={`${responseLabel}: ${rawResponse} ${minutesLabel}`}
            compact
          />
        )}
      </View>

      <Text style={styles.sectionTitle}>{t('provider_details.about_provider', { providerName: provider.fullName.split(' ')[0] })}</Text>
      <Text style={styles.descriptionText}>{provider.bio || t("provider_details.no_description")}</Text>

      <ActionButtons />

      <Text style={[styles.sectionTitle, { marginTop: 25 }]}>{t("provider_details.what_clients_say")}</Text>
      {provider.reviews && provider.reviews.length > 0 ? (
        provider.reviews.map((review: ProviderReview) => {
          // Construir o objeto client com segurança para garantir que 'id' seja uma string
          const clientData = review.client ? {
            // Garante que 'id' é uma string. Se review.client.id for undefined/null, usa 'unknown-id'.
            id: review.client.id || 'unknown-id',
            fullName: review.client.fullName,
            user: review.client.user ? {
              id: review.client.user.id,
              avatarUrl: review.client.user.avatarUrl || undefined
            } : undefined,
          } : undefined;

          const transformedReview: ProviderReview = {
            ...review,
            comment: review.comment || '',
            client: clientData, // Atribui o objeto client construído com segurança
          };
          return <ReviewCard key={review.id} review={transformedReview} />;
        })
      ) : (
        <Text style={styles.noReviewsText}>{t('provider_details.no_reviews', { providerName: provider.fullName.split(' ')[0] })}</Text>
      )}
      <TouchableOpacity style={styles.addReviewButton}>
        <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
        <Text style={styles.addReviewButtonText}>{t('provider_details.add_review')}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OverviewContent;

