import React, { Dispatch, SetStateAction } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Image } from 'react-native'; // <<<< Adicionado Image aqui
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { BookingAddress } from '../../../../types/backend/bookings'; // Import BookingAddress from your types

const SCREEN_WIDTH = Dimensions.get('window').width;

interface AddressSectionProps {
  address: BookingAddress; // Propriedade 'address'
  setAddress: Dispatch<SetStateAction<BookingAddress>>; // Propriedade 'setAddress'
  shineAnim: Animated.Value;
}

const AddressSection: React.FC<AddressSectionProps> = ({ address, setAddress, shineAnim }) => {
  const formatAddress = (addr: BookingAddress): string => {
    const { street, number, complement, neighborhood, city, state } = addr;
    let formatted = `${street}, ${number}`;
    if (complement) {
      formatted += ` - ${complement}`;
    }
    formatted += `, ${neighborhood}, ${city}/${state}`;
    return formatted;
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F0F0F0']} // Fundo light (branco para cinza claro)
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradientAddressSection}
    >
      <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.addressContent}>
        {/* <<<< CORREÇÃO AQUI: Substituído Ionicons por Image do asset >>>> */}
        <Image 
          source={require('../../../../../assets/images/icons/map.png')} // Caminho real do asset
          style={styles.mapIcon} // Estilo para a imagem do mapa
        />
        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
          {formatAddress(address)}
        </Text>
      </View>
      <Animated.View style={[styles.shineEffectContainer, { transform: [{ translateX: shineAnim }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shineGradient}
        />
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientAddressSection: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 15,
    marginTop: 8,
    marginBottom: 15,
    position: 'relative',

  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  // <<<< NOVO ESTILO PARA A IMAGEM DO MAPA >>>>
  mapIcon: {
    width: 18, // Ajuste o tamanho conforme necessário
    height: 18, // Ajuste o tamanho conforme necessário
    marginRight: 8,
   
  },
  addressText: {
    fontSize: 10,
    color: '#333333',
    fontWeight: '500',
    flexShrink: 1,
  },
  shineEffectContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: SCREEN_WIDTH * 0.3,
    transform: [{ skewX: '-20deg' }],
    overflow: 'hidden',
    zIndex: 0,
  },
  shineGradient: {
    height: '100%',
    width: '100%',
  },
});

export default AddressSection;