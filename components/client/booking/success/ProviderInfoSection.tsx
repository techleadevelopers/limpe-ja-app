// LimpeJaApp/app/(client)/bookings/components/success/ProviderInfoSection.tsx
import React, { useEffect, useRef } from 'react';
import { Image, StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { renderStars } from '../../../../utils/ui-helpers';

interface ProviderInfoSectionProps {
  providerAvatarUrl?: string | null;
  providerFullName: string;
  providerRating?: number;
}

export default function ProviderInfoSection({
  providerAvatarUrl,
  providerFullName,
  providerRating,
}: ProviderInfoSectionProps) {
  const starSize = 15;
  const starColor = '#87CEEB';

  // Animações de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.providerHeaderSection,
        { opacity: fadeAnim, transform: [{ translateY: translateYAnim }, { scale: scaleAnim }] },
      ]}
    >
      <Image
        source={providerAvatarUrl ? { uri: providerAvatarUrl } : require('../../../../assets/images/default-avatar.png')}
        style={styles.providerAvatar}
      />
      <View style={styles.providerHeaderText}>
        <Text style={styles.providerNameText}>{providerFullName}</Text>
        <Text style={styles.providerRoleText}>Prestador(a) de Serviço</Text>
      </View>
      {renderStars(providerRating, starSize, starColor, starColor)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  providerHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    paddingHorizontal: 5,
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
    borderWidth: 3,
    borderColor: '#E0E0E0',
  },
  providerHeaderText: {
    flex: 1,
  },
  providerNameText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  providerRoleText: {
    fontSize: 12,
    color: '#666',
  },
});