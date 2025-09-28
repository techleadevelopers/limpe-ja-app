import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef } from 'react';
import { Image, StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { VerificationStatus } from '../../../../types/backend/auth';
import { BookingAddress } from '../../../../types/backend/bookings';
import { AppColors } from '../../../../constants/appStyles';

interface ProviderDetails {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  cpf?: string | null;
  dateOfBirth?: string | null;
  address?: BookingAddress | null;
  createdAt?: string;
  updatedAt?: string;
  distance?: number | null;
  reviews?: any[];
  pixKey?: string | null;
  avatarUrl?: string | null;
  averageRating?: number | null;
  verificationStatus?: VerificationStatus;
  yearsOfExperience?: number | null;
  providerServices?: { service: { name: string; }; }[];
}

interface ProviderBriefProps {
  provider: ProviderDetails | null;
  serviceName?: string | string[];
  isLoading?: boolean;
}

export default function ProviderBrief({ provider, serviceName, isLoading }: ProviderBriefProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | undefined;
    if (!isLoading && provider) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.005,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }

    return () => {
      pulseLoop?.stop();
    };
  }, [isLoading, provider, pulseAnim]);

  const renderStars = useCallback((rating?: number | null) => {
    const stars = [];
    const actualRating = rating ?? 0;
    const fullStars = Math.floor(actualRating);
    const hasHalfStar = actualRating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      let iconName: keyof typeof Ionicons.glyphMap = 'star-outline';
      if (i < fullStars) iconName = 'star';
      else if (hasHalfStar && i === fullStars) iconName = 'star-half';

      stars.push(
        <Ionicons
          key={i}
          name={iconName}
          size={11}
          color={AppColors.primaryInteractive}
          style={styles.ratingStarIcon}
        />
      );
    }
    return <View style={styles.ratingStarContainer}>{stars}</View>;
  }, []);

  // ✅ FIX: Fallback para text (evita undefined em <Text>)
  const chip = useCallback((icon: keyof typeof Ionicons.glyphMap, text: string | number, verified?: boolean) => (
    <View style={[styles.chip, verified && styles.chipOk]}>
      <Ionicons name={icon} size={12} color={verified ? AppColors.primaryDark : AppColors.mediumGray} />
      <Text style={[styles.chipTxt, verified && styles.chipTxtOk]} maxFontSizeMultiplier={1.2}>
        {String(text || 'N/A')} {/* ✅ Garante string */}
      </Text>
    </View>
  ), []);

  const specialty = serviceName || (provider?.providerServices?.[0]?.service?.name ?? 'Serviço');

  if (isLoading || !provider) {
    return (
      <View style={styles.skeleton}>
        <View style={styles.skelImg} />
        <View style={{ flex: 1 }}>
          <View style={styles.skelLineLg} />
          <View style={styles.skelLineSm} />
          <View style={{ flexDirection: 'row', marginTop: 6, gap: 8 }}>
            <View style={styles.skelChip} /><View style={styles.skelChip} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: pulseAnim }] }]}>
      {provider.avatarUrl ? (
        <Image source={{ uri: provider.avatarUrl }} style={styles.photo} />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Ionicons name="person-circle-outline" size={30} color={AppColors.mediumGray} />
        </View> 
      )}

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Text style={styles.name} maxFontSizeMultiplier={1.2}>{provider.fullName}</Text>
          {typeof provider.averageRating === 'number' && provider.averageRating > 0 ? (
            <View style={{ marginLeft: 8 }}>{renderStars(provider.averageRating)}</View>
          ) : (
            <Text style={styles.noRating} maxFontSizeMultiplier={1.2}>Sem avaliação</Text>
          )}
        </View>
        <Text style={styles.service} maxFontSizeMultiplier={1.2}>{specialty}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          {provider.verificationStatus === VerificationStatus.APPROVED && chip('shield-checkmark-outline', 'Verificado', true)}
          {/* ✅ FIX: Verificação extra para yearsOfExperience */}
          {typeof provider.yearsOfExperience === 'number' && provider.yearsOfExperience > 0 
            ? chip('hourglass-outline', `${provider.yearsOfExperience}+ anos`, true)
            : null
          }
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginHorizontal: 29,
    marginTop: 14,
    borderTopStartRadius: 44,
    borderBottomStartRadius: 44,
    borderTopEndRadius: 44,
    borderBottomEndRadius: 44,
    shadowColor: '#45484b56',
    shadowOffset: { width: -1, height: 1 },
    shadowOpacity: 1.05,
    shadowRadius: 9,
    elevation: 6,
  },
  photo: { width: 58, height: 58, borderRadius: 29, marginRight: 10, borderWidth: 2, borderColor: '#E7F0FF' },
  photoPlaceholder: { width: 58, height: 58, borderRadius: 29, marginRight: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF4FF' },
  name: { fontSize: 14, fontWeight: '800', color: '#223243' },
  noRating: { fontSize: 10, color: '#8CA0B3', marginLeft: 6 },
  service: { fontSize: 12, color: '#6A7C90', marginBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F8', borderRadius: 16, paddingVertical: 4, paddingHorizontal: 10 },
  chipTxt: { fontSize: 10, color: '#5C6B7A', marginLeft: 6, fontWeight: '700' },
  chipOk: { backgroundColor: '#D6ECFF' },
  chipTxtOk: { color: '#2463D7' },
  ratingStarContainer: {
    flexDirection: 'row',
  },
  ratingStarIcon: {
    marginRight: 1,
  },
  skeleton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, marginHorizontal: 16, marginTop: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, height: 96 },
  skelImg: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E6EEF9', marginRight: 12 },
  skelLineLg: { height: 16, width: '80%', backgroundColor: '#E6EEF9', borderRadius: 6, marginBottom: 8 },
  skelLineSm: { height: 14, width: '60%', backgroundColor: '#E6EEF9', borderRadius: 6, marginBottom: 8 },
  skelChip: { height: 24, width: 80, backgroundColor: '#E6EEF9', borderRadius: 12 },
});