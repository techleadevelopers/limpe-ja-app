// LimpeJaApp/components/ProviderCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProviderDisplayInfo } from '../types/backend/providers';
import { formatDistance } from '../utils/formatters';
import { cacheBustAvatarUrl } from '../utils/avatar';

interface ProviderCardProps {
  provider: ProviderDisplayInfo;
  onPress: (providerId: string) => void;
  isVerified?: boolean; // TODO: backend should supply a canonical verified flag to avoid status checks here.
}

const formatNextAvailable = (iso?: string | null) => {
  if (!iso) return null;
  try {
    const dt = new Date(iso);
    const now = new Date();
    const isToday = dt.toDateString() === now.toDateString();
    const hours = dt.getHours().toString().padStart(2, '0');
    const mins = dt.getMinutes().toString().padStart(2, '0');
    return `${isToday ? 'Hoje' : 'Amanhã'} ${hours}:${mins}`;
  } catch {
    return null;
  }
};

const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onPress, isVerified = false }) => {
  const { t } = useTranslation();
  const avatarUri = cacheBustAvatarUrl(provider.avatarUrl, provider.updatedAt) ?? provider.avatarUrl;

  const minPrice = provider.providerServices && provider.providerServices.length > 0
    ? provider.providerServices.reduce((min, service) => {
        let currentServicePrice = 0;
        if (service.price && typeof service.price === 'object' && 'toNumber' in (service.price as any)) {
          currentServicePrice = (service.price as any).toNumber();
        } else if (typeof service.price === 'number') {
          currentServicePrice = service.price;
        }

        let pricePerRoomValue = 0;
        if (service.pricePerRoom && typeof service.pricePerRoom === 'object' && 'toNumber' in (service.pricePerRoom as any)) {
          pricePerRoomValue = (service.pricePerRoom as any).toNumber();
        } else if (typeof service.pricePerRoom === 'number') {
          pricePerRoomValue = service.pricePerRoom;
        }

        let pricePerSquareMeterValue = 0;
        if (service.pricePerSquareMeter && typeof service.pricePerSquareMeter === 'object' && 'toNumber' in (service.pricePerSquareMeter as any)) {
          pricePerSquareMeterValue = (service.pricePerSquareMeter as any).toNumber();
        } else if (typeof service.pricePerSquareMeter === 'number') {
          pricePerSquareMeterValue = service.pricePerSquareMeter;
        }

        const effectivePrice = currentServicePrice > 0 ? currentServicePrice :
          pricePerRoomValue > 0 ? pricePerRoomValue :
          pricePerSquareMeterValue > 0 ? pricePerSquareMeterValue : 0;

        return (effectivePrice > 0 && effectivePrice < min) ? effectivePrice : min;
      }, Infinity)
    : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(provider.id)}>
      <Image
        source={avatarUri ? { uri: avatarUri } : require('/assets/images/default-avatar.png')}
        style={styles.avatar}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{provider.fullName}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {provider.bio || t('provider.no_description', { defaultValue: 'Nenhuma descrição disponível.' })}
        </Text>
        <View style={styles.metaRow}>
          {isVerified && (
            <Ionicons name="shield-checkmark" size={12} color="#5da2ecff" />
          )}
          {typeof (provider as any).acceptanceRate === 'number' && (
            <>
              <Ionicons name="checkmark-done" size={12} color="#5da2ecff" />
              <Text style={styles.metaText}>{Math.round((provider as any).acceptanceRate)}%</Text>
            </>
          )}
          {typeof (provider as any).averageResponseTime === 'number' && (
            <>
              <Ionicons name="time-outline" size={12} color="#5da2ecff" />
              <Text style={styles.metaText}>{(provider as any).averageResponseTime} min</Text>
            </>
          )}
          {typeof (provider as any).distance === 'number' && (
            <>
              <Ionicons name="location-outline" size={12} color="#5da2ecff" />
              <Text style={styles.metaText}>
                {formatDistance((provider as any).distance) || ''}
              </Text>
            </>
          )}
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFC107" />
          <Text style={styles.ratingText}>
            {provider.averageRating !== undefined ? provider.averageRating.toFixed(1) : 'N/A'} ({provider.reviewCount !== undefined ? provider.reviewCount : 0} Avaliações)
          </Text>
        </View>
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>{t('pricing.from', { defaultValue: 'A partir de' })}</Text>
        {minPrice > 0 && minPrice !== Infinity ? (
          <Text style={styles.priceValue}>R$ {minPrice.toFixed(2).replace('.', ',')}</Text>
        ) : (
          <Text style={styles.priceValue}>R$ N/A</Text>
        )}
        {!!(provider as any).nextAvailable && (
          <Text style={styles.nextSlotChip}>{formatNextAvailable((provider as any).nextAvailable)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
    columnGap: 6,
    rowGap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#475569',
    marginLeft: 2,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  priceText: {
    fontSize: 12,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007BFF',
    marginTop: 2,
  },
  nextSlotChip: {
    marginTop: 6,
    backgroundColor: '#eaf2ff',
    color: '#1D4ED8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 11,
    alignSelf: 'flex-end',
  },
});

export default ProviderCard;
