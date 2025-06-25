import React, { Dispatch, SetStateAction } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { BookingAddress } from '../../../../types/backend/bookings';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface AddressSectionProps {
  address: BookingAddress;
  setAddress: Dispatch<SetStateAction<BookingAddress>>;
  shineAnim: Animated.Value;
  isLoading?: boolean;
  isInputMode?: boolean;
  onEditAddress?: () => void; // Prop para a função de editar endereço
}

const AddressSection: React.FC<AddressSectionProps> = ({ address, setAddress, shineAnim, isLoading, isInputMode, onEditAddress }) => {

  const formatAddressLine1 = (addr: BookingAddress): string => {
    return `${addr.street}, ${addr.number}`;
  };

  const formatAddressLine2 = (addr: BookingAddress): string => {
    const { neighborhood, city, state, cep } = addr;
    return `${neighborhood}, ${city}/${state} - ${cep}`;
  };

  if (isLoading) {
    return (
      <View style={styles.addressBriefSkeleton}>
        <View style={styles.mapIconSkeleton} />
        <View style={styles.skeletonLineAddress} />
      </View>
    );
  }

  if (isInputMode || !address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
    return (
      <View style={styles.addressInputContainer}>
        {/* ... Campos de input ... */}
        <Text style={styles.addressInputTitle}>Informe o Endereço da Faxina</Text>
        <View style={styles.inputGroup}>
          <Ionicons name="location-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Rua"
            value={address.street}
            onChangeText={(text: string) => setAddress({ ...address, street: text })}
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.inputGroup}>
          <Ionicons name="home-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Número"
            value={address.number}
            onChangeText={(text: string) => setAddress({ ...address, number: text })}
            keyboardType="numeric"
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.inputGroup}>
          <Ionicons name="flag-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Complemento (Opcional)"
            value={address.complement || ''}
            onChangeText={(text: string) => setAddress({ ...address, complement: text })}
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.inputGroup}>
          <Ionicons name="map-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Bairro"
            value={address.neighborhood}
            onChangeText={(text: string) => setAddress({ ...address, neighborhood: text })}
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.inputRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Ionicons name="business-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.inputSmall}
              placeholder="Cidade"
              value={address.city}
              onChangeText={(text: string) => setAddress({ ...address, city: text })}
              placeholderTextColor="#888"
            />
          </View>
          <View style={{ width: 80 }}>
            <Ionicons name="bookmark-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.inputSmall}
              placeholder="Estado (Ex: SP)"
              value={address.state}
              onChangeText={(text: string) => setAddress({ ...address, state: text })}
              maxLength={2}
              autoCapitalize="characters"
              placeholderTextColor="#888"
            />
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="CEP"
            value={address.cep}
            onChangeText={(text: string) => setAddress({ ...address, cep: text })}
            keyboardType="numeric"
            maxLength={9}
            placeholderTextColor="#888"
          />
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.addressCard} onPress={onEditAddress}>
      <View style={styles.addressContent}>
        <Image
          source={require('../../../../../assets/images/icons/residencial.png')} // Ícone de localização
          style={styles.mapIcon}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.addressTextBold}>
            {formatAddressLine1(address)}
          </Text>
          <Text style={styles.addressTextNormal}>
            {formatAddressLine2(address)}
          </Text>
        </View>
        <TouchableOpacity onPress={onEditAddress} style={styles.editButton}>
          <Ionicons name="pencil-outline" size={22} color="#2A72E7" />
        </TouchableOpacity>
      </View>
      <Animated.View style={[styles.shineEffectContainer, { transform: [{ translateX: shineAnim }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shineGradient}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    justifyContent: 'space-between',
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    zIndex: 1,
  },
  mapIcon: {
    width: 28,
    height: 28,
    marginRight: 15,

  },
  addressTextBold: {
    fontSize: 16,
    color: '#333333',
    fontWeight: 'bold', // Estilo para a primeira linha (Rua e Número)
    flexShrink: 1,
  },
  addressTextNormal: {
    fontSize: 14,
    color: '#666666', // Estilo para a segunda linha (Centro, Cidade/Estado - CEP)
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
    borderRadius: 12,
  },
  shineGradient: {
    height: '100%',
    width: '100%',
  },
  editButton: {
    padding: 8,
  },

  // --- Estilos de Skeleton ---
  addressBriefSkeleton: {
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
    height: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  mapIconSkeleton: {
    width: 28,
    height: 28,
    marginRight: 15,
    backgroundColor: '#D0D0D0',
    borderRadius: 14,
  },
  skeletonLineAddress: {
    height: 18,
    width: '70%',
    backgroundColor: '#D0D0D0',
    borderRadius: 6,
  },

  // --- Estilos para os TextInputs ---
  addressInputContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  addressInputTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
    paddingLeft: 10,
  },
  inputSmall: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
    paddingLeft: 10,
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
});

export default AddressSection;