// app/(client)/schedule-service/components/schedule/ServicePriceSummary.tsx
import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface ServicePriceSummaryProps {
  serviceName?: string;
  servicePrice?: number;
  serviceDescription?: string;
  fadeAnim: Animated.Value;
  slideUpAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

const ServicePriceSummary: React.FC<ServicePriceSummaryProps> = ({
  serviceName,
  servicePrice,
  serviceDescription,
  fadeAnim,
  slideUpAnim,
  scaleAnim,
}) => {
  const formattedPrice = servicePrice !== undefined && servicePrice !== null
    ? `R$ ${servicePrice.toFixed(2).replace('.', ',')}`
    : 'Preço não disponível';

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#E3F2FD', '#BBDEFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.iconContainer}>
            <Ionicons name="pricetag-outline" size={28} color="#2A72E7" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.serviceName}>{serviceName || 'Serviço Não Selecionado'}</Text>
            <Text style={styles.servicePrice}>{formattedPrice}</Text>
            {serviceDescription ? (
              <Text style={styles.serviceDescription} numberOfLines={2}>
                {serviceDescription}
              </Text>
            ) : (
              <Text style={styles.serviceDescriptionPlaceholder}>
                Nenhuma descrição disponível para este serviço.
              </Text>
            )}
          </View>
        </View>
        <View style={styles.bottomWave} />
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  gradientBackground: {
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1, // Ensure content is above the wave
  },
  iconContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 10,
    marginRight: 15,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  textContainer: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2A72E7',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  serviceDescriptionPlaceholder: {
    fontSize: 13,
    color: '#777',
    fontStyle: 'italic',
  },
  bottomWave: {
    position: 'absolute',
    bottom: -width * 0.1, // Adjust to control wave visibility
    left: 0,
    right: 0,
    height: width * 0.3, // Height of the wave section
    backgroundColor: 'rgba(255,255,255,0.3)', // A light, subtle wave
    borderRadius: width * 0.15, // Creates the curved effect
    transform: [{ scaleX: 1.5 }], // Stretch horizontally for a wider curve
    opacity: 0.6,
  },
});

export default ServicePriceSummary;