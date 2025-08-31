import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { Dispatch, SetStateAction, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Easing
} from 'react-native';
import { BookingAddress } from '../../../../types/backend/bookings';
import { Icons3D } from '../../../../constants/icons3d'; // << ícones 3D (docCheck)

const SCREEN_WIDTH = Dimensions.get('window').width;

interface AddressSectionProps {
  address: BookingAddress;
  setAddress: Dispatch<SetStateAction<BookingAddress>>;
  shineAnim: Animated.Value;
  isLoading?: boolean;
  isInputMode?: boolean;
  onEditAddress?: () => void;
}

const AddressSection: React.FC<AddressSectionProps> = ({
  address,
  setAddress,
  shineAnim,
  isLoading,
  isInputMode,
  onEditAddress
}) => {
  const trackerIconPulseAnim = new Animated.Value(1);
  const msgShineAnim = new Animated.Value(0); // era dottedLineShineAnim

  useEffect(() => {
    // pulso dos ícones
    Animated.loop(
      Animated.sequence([
        Animated.timing(trackerIconPulseAnim, { toValue: 1.1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(trackerIconPulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // shimmer na mensagem
    Animated.loop(
      Animated.sequence([
        Animated.timing(msgShineAnim, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(msgShineAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const format1 = (addr: BookingAddress) => `${addr.street}, ${addr.number}`;
  const format2 = (addr: BookingAddress) => `${addr.neighborhood}, ${addr.city}/${addr.state} - ${addr.cep}`;

  if (isLoading) {
    return (
      <View style={s.skeleton}>
        <View style={s.skeletonIcon} />
        <View style={s.skeletonLine} />
      </View>
    );
  }

  if (isInputMode || !address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
    return (
      <View style={s.inputCard}>
        <Text style={s.inputTitle}>Informe o Endereço da Faxina</Text>
        {[
          { icon: 'location-outline', ph: 'Rua', key: 'street', keyboard: 'default' },
          { icon: 'home-outline', ph: 'Número', key: 'number', keyboard: 'numeric' },
          { icon: 'flag-outline', ph: 'Complemento (Opcional)', key: 'complement', keyboard: 'default' },
          { icon: 'map-outline', ph: 'Bairro', key: 'neighborhood', keyboard: 'default' },
        ].map((i) => (
          <View key={i.key} style={s.inputRow}>
            <Ionicons name={i.icon as any} size={20} color="#8BA0B5" style={{ marginRight: 10 }} />
            <TextInput
              placeholder={i.ph}
              placeholderTextColor="#8BA0B5"
              style={s.input}
              keyboardType={i.keyboard as any}
              value={(address as any)[i.key] || ''}
              onChangeText={(t) => setAddress({ ...address, [i.key]: t })}
            />
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[s.inputRow, { flex: 1 }]}>
            <Ionicons name="business-outline" size={20} color="#8BA0B5" style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Cidade"
              placeholderTextColor="#8BA0B5"
              style={s.input}
              value={address.city}
              onChangeText={(t) => setAddress({ ...address, city: t })}
            />
          </View>
          <View style={[s.inputRow, { width: 92 }]}>
            <Ionicons name="bookmark-outline" size={20} color="#8BA0B5" style={{ marginRight: 10 }} />
            <TextInput
              placeholder="UF"
              placeholderTextColor="#8BA0B5"
              style={s.input}
              value={address.state}
              onChangeText={(t) => setAddress({ ...address, state: t })}
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
        </View>
        <View style={s.inputRow}>
          <Ionicons name="mail-outline" size={20} color="#8BA0B5" style={{ marginRight: 10 }} />
          <TextInput
            placeholder="CEP"
            placeholderTextColor="#8BA0B5"
            style={s.input}
            keyboardType="numeric"
            maxLength={9}
            value={address.cep}
            onChangeText={(t) => setAddress({ ...address, cep: t })}
          />
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={s.card} onPress={onEditAddress}>
      {/* Trilho com ícone + mensagem + docCheck 3D */}
      <View style={s.track}>
        <Animated.Image
          source={require('../../../../assets/images/mascote-support.png')}
          style={[s.trackIcon, { transform: [{ scale: trackerIconPulseAnim }] }]}
          resizeMode="contain"
        />

        {/* Mensagem de segurança (substitui a linha pontilhada) */}
        <View style={s.safeMsgWrap}>
          <Text numberOfLines={2} style={s.safeMsgText}>
            Este prestador tem documentação rigorosa verificada para a sua segurança.
          </Text>

          {/* shimmer suave passando na mensagem */}
          <Animated.View
            pointerEvents="none"
            style={[
              s.safeMsgShine,
              {
                transform: [
                  {
                    translateX: msgShineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-SCREEN_WIDTH * 0.45, SCREEN_WIDTH * 0.45],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.55)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>

    
      </View>

      {/* Endereço */}
      <View style={s.row}>
        <Ionicons name="location-sharp" size={20} color="#2A72E7" style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={s.line1}>{format1(address)}</Text>
          <Text style={s.line2}>{format2(address)}</Text>
        </View>

        <TouchableOpacity onPress={onEditAddress} style={s.editBtn}>
          <Ionicons name="pencil-outline" size={15} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* brilho diagonal do card (efeito existente) */}
      <Animated.View style={[s.shine, { transform: [{ translateX: shineAnim }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: '#F0F6FF',
    borderRadius: 18,
    marginHorizontal: 26,
    padding: 14,
    marginTop: 12,
    overflow: 'hidden',
  },

  // trilho
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  trackIcon: {
    width: 72,
    height: 72,
    marginHorizontal: 0,
  },

  // mensagem de segurança (no lugar do pontilhado)
  safeMsgWrap: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 0,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: '#EAF3FF', // azul bem leve
    overflow: 'hidden',
    justifyContent: 'center',
  },
  safeMsgText: {
    fontSize: 11.2,
    color: '#4B6B8A',
    fontWeight: '400', // leve/fina e confortável
    lineHeight: 16,
    left: 10, 
  },
  safeMsgShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '85%',
  },

  // linha do endereço
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#CFE1FF',
  },
  line1: { fontSize: 14, fontWeight: '700', color: '#223243',paddingHorizontal: 10 },
  line2: { fontSize: 12, color: '#44596E', marginTop: 3, paddingHorizontal: 10 },
  editBtn: { padding: 8, borderRadius: 18, backgroundColor: '#2A72E7', right: 15, },

  // brilho do card
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: SCREEN_WIDTH * 0.3,
    transform: [{ skewX: '-20deg' }],
    overflow: 'hidden',
  },

  // skeleton / inputs
  skeleton: {
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 12,
    height: 96,
    backgroundColor: '#E9F0FA',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#D8E4F2', marginRight: 12 },
  skeletonLine: { height: 12, width: '70%', backgroundColor: '#D8E4F2', borderRadius: 6 },

  inputCard: { backgroundColor: '#FFFFFF', padding: 16, marginHorizontal: 16, borderRadius: 18, marginTop: 10, elevation: 4 },
  inputTitle: { fontSize: 16, fontWeight: '700', color: '#223243', textAlign: 'center', marginBottom: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F8FD',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5EEF9',
    height: 48,
  },
  input: { flex: 1, fontSize: 15, color: '#223243' },
});

export default AddressSection;
