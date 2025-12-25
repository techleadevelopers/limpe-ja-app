// components/client/explore/provider/SideIcon.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Animated, Easing } from 'react-native';
import { Icons3D } from '../../../../constants/icons3d';
import { Platform } from 'react-native';

interface SideIconProps {
  showSecurity?: boolean;
  showFacialRecognition?: boolean;
  rating?: number;
  onPressSecurity?: () => void;
  onPressFacialRecognition?: () => void;
  onPressRating?: () => void;
}

/** Anel pulsante em loop infinito usando sequence+delay (compatível com native driver) */
const Ring: React.FC<{ delay: number; cycleDuration: number; size: number; color: string }> = ({
  delay,
  cycleDuration,
  size,
  color,
}) => {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    v.setValue(0);

    // Cada ciclo:
    // 1) espera "delay"
    // 2) anima 0 -> 1 em (cycleDuration - delay)
    // 3) reseta pra 0 (0ms) e recomeça
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, {
          toValue: 1,
          duration: Math.max(1, cycleDuration - delay),
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration: 0, // reset instantâneo, compatível com native driver
          useNativeDriver: true,
        }),
      ]),
      { resetBeforeIteration: true }
    );

    anim.start();
    return () => {
      anim.stop();
      v.stopAnimation();
      v.setValue(0);
    };
  }, [v, delay, cycleDuration]);

  // escala 0→1
  const scale = v.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // opacidade: aparece, fica e some no fim (últimos 25%)
  const opacity = v.interpolate({
    inputRange: [0, 0.75, 1],
    outputRange: [0, 1, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          opacity,
          transform: [
            { translateX: -size / 2 },
            { translateY: -size / 2 },
            { scale },
          ],
        },
      ]}
    />
  );
};

const SideIcon: React.FC<SideIconProps> = ({
  showSecurity = false,
  showFacialRecognition = false,
  rating,
  onPressSecurity,
  onPressFacialRecognition,
  onPressRating,
}) => {
  const iconSize = 60;
  const ringColor = '#87CEEB';
  const pulseCycleDuration = 2000; // 2s

  return (
    <View style={styles.container}>
      {showSecurity && (
      <TouchableOpacity
        style={styles.iconWrapper}
        onPress={onPressSecurity || (() => Alert.alert('Segurança 3D', 'Este provedor passou por verificação de segurança 3D.'))}
      >
        <View style={styles.pulsingIconContainer}>
          {/* <Image source={Icons3D.facial} style={styles.iconImage} /> */}
        </View>
      </TouchableOpacity>
      )}

    

     
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 50,
    bottom: '100%',
    zIndex: 10,
    alignItems: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 9,
  },
  pulsingIconContainer: {
    width: 68,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    top: '35%',
    left: '48%',
  },
  iconImage: {
    width: Platform.OS === 'android' ? 50 : 67,
    height: Platform.OS === 'android' ? 50 : 67,
    resizeMode: 'contain',
    position: 'absolute',
    zIndex: 1,
    top: Platform.OS === 'android' ? '49%' : '49%',
    left: Platform.OS === 'android' ? '49%' : '6%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  iconText: {
    fontSize: 10,
    color: '#201010ff',
    marginTop: 2,
    textAlign: 'center',
  },
});

export default SideIcon;
