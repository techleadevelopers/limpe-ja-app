// LimpeJaApp/components/BannerOferta.tsx
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// --- DEFINIÇÃO DA INTERFACE DE PROPS ATUALIZADA ---
// Esta interface define as propriedades que o componente BannerOferta espera receber.
export interface BannerOfertaProps {
  id: string; // ID da oferta, usado para navegação e identificação
  title: string; // Título principal da oferta
  description: string | null; // Descrição opcional da oferta
  imageUrl: string | null;   // URL da imagem do banner, se houver
  discountPercentage: number; // Percentual de desconto da oferta

  // Adicionamos a prop 'onPress' para permitir que o componente pai defina o que acontece ao clicar no banner
  onPress: () => void; 

  // Estas são propriedades opcionais que podem ser usadas para personalizar o visual do banner.
  // Elas têm valores padrão caso não sejam fornecidas pelo componente pai.
  bankName?: string; 
  bankPaymentText?: string;
  buttonText?: string;
  disclaimer?: string;
  badgeTitle?: string;
  badgeDates?: string;
}

// O componente BannerOferta agora aceita as props definidas na interface BannerOfertaProps.
const BannerOferta: React.FC<BannerOfertaProps> = ({ 
  id,
  title,
  description,
  imageUrl,
  discountPercentage,
  onPress, // Desestruturando a prop onPress
  // Definindo valores padrão para props opcionais, se não forem passadas
  bankName = "CASHON", 
  bankPaymentText = "Payments Bank",
  buttonText = "Avail offer",
  disclaimer = "*Application CashOn Payments Bank Visa Debit Card",
  badgeTitle = "MEGA BANK DAYS",
  badgeDates = "14th - 20th May",
}) => {
  // O hook useRouter é usado para navegação no Expo Router.
  const router = useRouter();

  // handleBannerPress foi removido ou adaptado para usar a prop 'onPress'
  // A lógica de navegação agora é controlada pela prop 'onPress' fornecida pelo componente pai.

  // Animação para o botão "Avail offer"
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const onPressInButton = () => Animated.spring(buttonScaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
  const onPressOutButton = () => Animated.spring(buttonScaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();

  return (
    <TouchableOpacity 
        style={styles.bannerOuterContainer} 
        onPress={onPress} // Usa a função 'onPress' passada como prop
        activeOpacity={0.9}
    >
      <View style={styles.bannerContainer}>
        {/* Lado Esquerdo do Banner: Informações da oferta */}
        <View style={styles.leftContent}>
          <View style={styles.bankLogoContainer}>
            <Text style={styles.bankName}>{bankName}</Text>
            <Text style={styles.bankPaymentText}>{bankPaymentText}</Text>
          </View>
          <Text style={styles.titleText}>{title}</Text> {/* Usa a prop 'title' */}
          
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }], alignSelf: 'flex-start' }}>
            <TouchableOpacity 
                style={styles.availButton} 
                onPress={onPress} // Usa a função 'onPress' passada como prop
                onPressIn={onPressInButton}
                onPressOut={onPressOutButton}
                activeOpacity={0.7}
            >
              <Text style={styles.availButtonText}>{buttonText}</Text> {/* Usa a prop 'buttonText' */}
              <Ionicons name="chevron-forward-outline" size={14} color="#0052B4" style={{marginLeft: 2}}/>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.disclaimerText}>{disclaimer}</Text> {/* Usa a prop 'disclaimer' */}
        </View>

        {/* Lado Direito do Banner: Badge com informações de data */}
        <View style={styles.rightContent}>
          <View style={styles.badgeContainer}>
            {/* Confetes (elementos decorativos visuais) */}
            <View style={[styles.confetti, styles.confetti1]} />
            <View style={[styles.confetti, styles.confetti2]} />
            <View style={[styles.confetti, styles.confetti3]} />
            <View style={[styles.confetti, styles.confetti4]} />

            <Ionicons name="calendar-outline" size={34} color="#007BFF" />
            <Text style={styles.badgeTitle}>{badgeTitle}</Text> {/* Usa a prop 'badgeTitle' */}
            <Text style={styles.badgeDates}>{badgeDates}</Text> {/* Usa a prop 'badgeDates' */}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- ESTILOS DO COMPONENTE ---
const styles = StyleSheet.create({
  bannerOuterContainer: {
    marginHorizontal: 15,
    marginTop: 22,
    borderRadius: 14, 
    shadowColor: '#003D7A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: '#0052B4', 
  },
  bannerContainer: {
    flexDirection: 'row',
    height: 144,
    borderRadius: 14, 
    overflow: 'hidden', 
    alignItems: 'center', 
    paddingHorizontal: 16,
  },
  leftContent: {
    flex: 1.3, 
    height: '100%',
    justifyContent: 'space-around', 
    paddingVertical: 9,
  },
  bankLogoContainer: {
    // Mantido conforme o design
  },
  bankName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bankPaymentText: {
    color: '#A8CCFF', 
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: -3,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    maxWidth: '95%', 
  },
  availButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  availButtonText: {
    color: '#0052B4', 
    fontSize: 12,
    fontWeight: 'bold',
  },
  disclaimerText: {
    color: '#A8CCFF', 
    fontSize: 7,
    marginTop: 4,
  },
  rightContent: {
    flex: 1, 
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', 
  },
  badgeContainer: {
    width: 104,
    height: 104,
    borderRadius: 16, 
    backgroundColor: '#FFFFFF', 
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  badgeTitle: {
    color: '#0052B4', 
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  badgeDates: {
    color: '#0052B4', 
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  confetti: { 
    position: 'absolute',
    width: 7,
    height: 12,
    borderRadius: 2,
  },
  confetti1: { 
    backgroundColor: '#34C759',
    top: 8,
    right: 4,
    transform: [{ rotate: '30deg' }],
  },
  confetti2: { 
    backgroundColor: '#FFCC00',
    bottom: 13,
    right: 8,
    transform: [{ rotate: '-40deg' }],
    width: 9,
    height: 9,
  },
  confetti3: { 
    backgroundColor: '#34C759',
    bottom: 22,
    left: 4,
    transform: [{ rotate: '20deg' }],
    width: 6,
    height: 11,
  },
  confetti4: { 
    backgroundColor: '#FFCC00',
    top: 13,
    left: 8,
    transform: [{ rotate: '-15deg' }],
  },
});

export default BannerOferta;