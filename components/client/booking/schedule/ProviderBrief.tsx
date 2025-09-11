import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef } from 'react'; // Importar useRef e useEffect
import { Image, StyleSheet, Text, View, Animated, Easing } from 'react-native'; // Importar Animated, Easing
import { VerificationStatus } from '../../../../types/backend/auth';
import { BookingAddress } from '../../../../types/backend/bookings';

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
  // Animação de pulso para o card
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLoading && provider) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.005, // Pulso muito sutil
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
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isLoading, provider, pulseAnim]);


  const renderStars = useCallback((rating?: number | null) => {
    const stars = [];
    const actualRating = rating ?? 0;
    const fullStars = Math.floor(actualRating);
    const hasHalfStar = actualRating % 1 !== 0; // Lógica de meia estrela do RecomendacaoCard

    for (let i = 0; i < 5; i++) {
      let iconName: keyof typeof Ionicons.glyphMap = 'star-outline';
      if (i < fullStars) iconName = 'star';
      else if (hasHalfStar && i === fullStars) iconName = 'star-half'; // Usando 'star-half'

      stars.push(
        <Ionicons
          key={i}
          name={iconName}
          size={11} // Tamanho do RecomendacaoCard
          color="#007AFF" // Cor do RecomendacaoCard
          style={styles.ratingStarIcon} // Estilo para espaçamento entre estrelas
        />
      );
    }
    return <View style={styles.ratingStarContainer}>{stars}</View>; // Estilo para o container das estrelas
  }, []);

  const chip = useCallback((icon: keyof typeof Ionicons.glyphMap, text: string, verified?: boolean) => (
    <View style={[styles.chip, verified && styles.chipOk]}>
      <Ionicons name={icon} size={12} color={verified ? 'rgba(6, 78, 212, 0.85)' : '#5C6B7A'} />
      <Text style={[styles.chipTxt, verified && styles.chipTxtOk]}>{text}</Text>
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
        <View style={styles.photoPlaceholder}><Ionicons name="person-circle-outline" size={30} color="#7E8EA1" /></View>
      )}

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Text style={styles.name}>{provider.fullName}</Text>
          {typeof provider.averageRating === 'number' && provider.averageRating > 0 ? (
            <View style={{ marginLeft: 8 }}>{renderStars(provider.averageRating)}</View>
          ) : (
            <Text style={styles.noRating}>Sem avaliação</Text>
          )}
        </View>
        <Text style={styles.service}>{specialty}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          {provider.verificationStatus === VerificationStatus.APPROVED && chip('shield-checkmark-outline', 'Verificado', true)}
          {typeof provider.yearsOfExperience === 'number' && provider.yearsOfExperience > 0 && chip('hourglass-outline', `${provider.yearsOfExperience}+ anos`)}
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
           
           // Propriedades de sombra mantidas exatamente como fornecidas
           shadowColor: '#45484b56', // Cor da sombra
           shadowOffset: { width: -1, height: 1 }, // Deslocamento vertical mais pronunciado
           shadowOpacity: 1.05, // Opacidade aumentada para robustezs
           shadowRadius: 9, // Raio de desfoque para conforto
           elevation: 6, // Elevação aumentada para robustez no Android
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

  // Novos estilos para as estrelas, copiados de RecomendacaoCard.tsx
  ratingStarContainer: {
    flexDirection: 'row',
    // marginBottom: 2 foi removido pois o View pai já controla o espaçamento vertical
  },
  ratingStarIcon: {
    marginRight: 1,
  },

  // skeletons
  skeleton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, marginHorizontal: 16, marginTop: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, height: 96 },
  skelImg: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E6EEF9', marginRight: 12 },
  skelLineLg: { height: 16, width: '80%', backgroundColor: '#E6EEF9', borderRadius: 6, marginBottom: 8 },
  skelLineSm: { height: 14, width: '60%', backgroundColor: '#E6EEF9', borderRadius: 6, marginBottom: 8 },
  skelChip: { height: 24, width: 80, backgroundColor: '#E6EEF9', borderRadius: 12 },
});