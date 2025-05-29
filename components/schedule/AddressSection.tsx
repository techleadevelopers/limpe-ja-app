import React from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface AddressSectionProps {
  userAddress: string;
  shineAnim: Animated.Value;
}

const AddressSection: React.FC<AddressSectionProps> = ({ userAddress, shineAnim }) => {
  return (
    <LinearGradient
      colors={['rgba(130, 180, 200, 0.8)', 'rgba(40, 80, 180, 0.8)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradientAddressSection}
    >
      <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.addressContent}>
        <Ionicons name="star" size={14} color="#FFD700" style={styles.addressStarIcon} />
        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">{userAddress}</Text>
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 12,
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  addressStarIcon: {
    marginRight: 8,
    textShadowColor: 'rgba(255, 223, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  addressText: {
    fontSize: 13,
    color: '#FFFFFF',
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