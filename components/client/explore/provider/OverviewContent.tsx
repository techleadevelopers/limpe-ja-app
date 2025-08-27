// components/OverviewContent.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles } from '../../../../app/(client)/explore/styles/providerStyles';
import { ProviderDisplayInfo, ProviderReview } from '../../../../types/backend/providers';
import { VerificationStatus } from '../../../../types/backend/auth';

import ActionButtons from './ActionButtons';
import InfoChip from './InfoChip';
import ReviewCard from './ReviewCard';
import StarRating from './StarRating';

interface OverviewContentProps {
  provider: ProviderDisplayInfo;
  providerMetrics: any;
}

const OverviewContent: React.FC<OverviewContentProps> = ({ provider, providerMetrics }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.tabContentContainer}>
      <View style={styles.robustStarContainer}>
        <StarRating rating={provider.averageRating} size={20} color="#4A90E2" />
        <Text style={styles.robustReviewsText}>({provider.reviewCount} {t('provider_details.reviews_count_short')})</Text>
      </View>

      <View style={styles.infoChipsContainer}>
        {provider.yearsOfExperience !== undefined && provider.yearsOfExperience !== null && (
          <InfoChip
            icon3DName="experience"
            text={t('provider_details.years_experience', { count: provider.yearsOfExperience })}
          />
        )}
        {provider.verificationStatus === VerificationStatus.APPROVED && (
          <InfoChip
            icon3DName="facial"
            text={t('provider_details.verified')}
          />
        )}
        {providerMetrics?.acceptanceRate !== undefined && (
          <InfoChip
            icon3DName="check"
            text={`${t('metrics.acceptance_rate')}: ${providerMetrics.acceptanceRate}%`}
          />
        )}
        {providerMetrics?.avgResponseTime !== undefined && (
          <InfoChip
            icon3DName="time"
            text={`${t('metrics.avg_response_time')}: ${providerMetrics.avgResponseTime} ${t('metrics.minutes_short')}`}
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