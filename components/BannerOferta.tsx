// LimpeJaApp/components/BannerOferta.tsx
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Dados mockados para refletir a imagem image_2d9fd5.png
const ofertaBanner = {
  id: 'megaBankDaysMay',
  bankName: "CASHON",
  bankPaymentText: "Payments Bank",
  title: "CashOn Bank brings you exciting rewards",
  buttonText: "Avail offer",
  disclaimer: "*Application CashOn Payments Bank Visa Debit Card",
  badgeTitle: "MEGA BANK DAYS",
  badgeDates: "14th - 20th May",
};

const BannerOferta: React.FC = () => {
  const router = useRouter();

  const handleBannerPress = () => {
    console.log(`BannerOferta: Navegando para detalhes da oferta ID: ${ofertaBanner.id}`);
    router.push(`/(client)/ofertas/${ofertaBanner.id}` as any);
  };

  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const onPressInButton = () => Animated.spring(buttonScaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
  const onPressOutButton = () => Animated.spring(buttonScaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();

  return (
    <TouchableOpacity 
        style={styles.bannerOuterContainer} 
        onPress={handleBannerPress}
        activeOpacity={0.9}
    >
      <View style={styles.bannerContainer}>
        {/* Lado Esquerdo do Banner */}
        <View style={styles.leftContent}>
          <View style={styles.bankLogoContainer}>
            <Text style={styles.bankName}>{ofertaBanner.bankName}</Text>
            <Text style={styles.bankPaymentText}>{ofertaBanner.bankPaymentText}</Text>
          </View>
          <Text style={styles.titleText}>{ofertaBanner.title}</Text>
          
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }], alignSelf: 'flex-start' }}>
            <TouchableOpacity 
                style={styles.availButton} 
                onPress={handleBannerPress}
                onPressIn={onPressInButton}
                onPressOut={onPressOutButton}
                activeOpacity={0.7}
            >
              <Text style={styles.availButtonText}>{ofertaBanner.buttonText}</Text>
              <Ionicons name="chevron-forward-outline" size={14} color="#0052B4" style={{marginLeft: 2}}/>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.disclaimerText}>{ofertaBanner.disclaimer}</Text>
        </View>

        {/* Lado Direito do Banner (Badge) */}
        <View style={styles.rightContent}>
          <View style={styles.badgeContainer}>
            {/* Confetes (elementos decorativos) */}
            <View style={[styles.confetti, styles.confetti1]} />
            <View style={[styles.confetti, styles.confetti2]} />
            <View style={[styles.confetti, styles.confetti3]} />
            <View style={[styles.confetti, styles.confetti4]} />

            <Ionicons name="calendar-outline" size={34} color="#007BFF" />
            <Text style={styles.badgeTitle}>{ofertaBanner.badgeTitle}</Text>
            <Text style={styles.badgeDates}>{ofertaBanner.badgeDates}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bannerOuterContainer: {
    marginHorizontal: 15,
    marginTop: 22, // 25 * 0.9
    borderRadius: 14, 
    shadowColor: '#003D7A',
    shadowOffset: { width: 0, height: 4 }, // Mantido, a sombra é mais sobre percepção
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: '#0052B4', 
  },
  bannerContainer: {
    flexDirection: 'row',
    height: 144, // ALTURA REDUZIDA (160 * 0.9)
    borderRadius: 14, 
    overflow: 'hidden', 
    alignItems: 'center', 
    paddingHorizontal: 16, // 18 * 0.9
  },
  leftContent: {
    flex: 1.3, 
    height: '100%',
    justifyContent: 'space-around', 
    paddingVertical: 9, // 10 * 0.9
  },
  bankLogoContainer: {
    // Mantido
  },
  bankName: {
    color: '#FFFFFF',
    fontSize: 18, // 20 * 0.9
    fontWeight: 'bold',
    // fontFamily: 'SuaFonte-Bold',
  },
  bankPaymentText: {
    color: '#A8CCFF', 
    fontSize: 8, // 9 * 0.9
    fontWeight: '600',
    letterSpacing: 0.5, // Mantido
    // fontFamily: 'SuaFonte-SemiBold',
    marginTop: -3, // -4 * 0.9 (aproximado)
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 14, // 16 * 0.9
    fontWeight: '600',
    // fontFamily: 'SuaFonte-SemiBold',
    lineHeight: 20, // 22 * 0.9
    maxWidth: '95%', 
  },
  availButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // 18 * 0.9
    paddingVertical: 7, // 8 * 0.9
    paddingHorizontal: 14, // 15 * 0.9
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  availButtonText: {
    color: '#0052B4', 
    fontSize: 12, // 13 * 0.9
    fontWeight: 'bold',
    // fontFamily: 'SuaFonte-Bold',
  },
  disclaimerText: {
    color: '#A8CCFF', 
    fontSize: 7, // 8 * 0.9
    // fontFamily: 'SuaFonte-Regular',
    marginTop: 4, // 5 * 0.9
  },
  rightContent: {
    flex: 1, 
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', 
  },
  badgeContainer: {
    width: 104, // 115 * 0.9
    height: 104, // 115 * 0.9
    borderRadius: 16, // 18 * 0.9 
    backgroundColor: '#FFFFFF', 
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7, // 8 * 0.9
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 }, // Mantido
    shadowOpacity: 0.1, // Mantido
    shadowRadius: 5,    // Mantido
    elevation: 4,       // Mantido
  },
  badgeTitle: {
    color: '#0052B4', 
    fontSize: 13, // 15 * 0.9 (arredondado)
    fontWeight: 'bold',
    textAlign: 'center',
    // fontFamily: 'SuaFonte-Bold',
    marginTop: 4, // 5 * 0.9
    lineHeight: 16, // 18 * 0.9
  },
  badgeDates: {
    color: '#0052B4', 
    fontSize: 10, // 11 * 0.9
    fontWeight: '500',
    textAlign: 'center',
    // fontFamily: 'SuaFonte-Medium',
    marginTop: 2, // Mantido
  },
  // Confetes podem precisar de ajustes manuais de posição/tamanho se o badge mudou muito
  confetti: { 
    position: 'absolute',
    width: 7, // 8 * 0.9
    height: 12, // 14 * 0.9
    borderRadius: 2, // Mantido
  },
  confetti1: { 
    backgroundColor: '#34C759',
    top: 8, // Ajustado
    right: 4, // Ajustado
    transform: [{ rotate: '30deg' }],
  },
  confetti2: { 
    backgroundColor: '#FFCC00',
    bottom: 13, // Ajustado
    right: 8,  // Ajustado
    transform: [{ rotate: '-40deg' }],
    width: 9, // 10 * 0.9
    height: 9, // 10 * 0.9
  },
  confetti3: { 
    backgroundColor: '#34C759',
    bottom: 22, // Ajustado
    left: 4,    // Ajustado
    transform: [{ rotate: '20deg' }],
    width: 6,   // 7 * 0.9
    height: 11, // 12 * 0.9
  },
  confetti4: { 
    backgroundColor: '#FFCC00',
    top: 13, // Ajustado
    left: 8,  // Ajustado
    transform: [{ rotate: '-15deg' }],
  },
});

export default BannerOferta;