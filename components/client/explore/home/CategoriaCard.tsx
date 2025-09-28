import React, { useRef, useEffect, useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, Platform, Animated, Easing, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

interface ServiceDetailsDto {
  id: string;
  name: string;
  icon?: string;
}

interface CategoriaCardProps {
  item: ServiceDetailsDto;
}

const TINT_GRADIENT_START = 'rgba(230, 240, 255, 0.7)';
const TINT_GRADIENT_END = 'rgba(196, 197, 205, 0.23)';
const BLUR_INTENSITY = Platform.OS === 'ios' ? 20 : 40;
const BLUR_TINT = 'light';
const TEXT_COLOR = 'rgba(54, 57, 60, 0.62)';

// Sombra base (a opacidade real fica inline por plataforma)
const PRIMARY_SHADOW_COLOR = 'rgba(0, 0, 0, 0.5)';
const PRIMARY_SHADOW_OFFSET_HEIGHT = 6;
const PRIMARY_ELEVATION_ANDROID = 4; // mais suave (4–6)

// Bordas
const BORDER_COLOR_LIGHT = Platform.select({
  ios: 'rgba(255, 255, 255, 1.0)',
  android: 'rgba(255, 255, 255, 0.9)',
});
const BORDER_WIDTH = 1.5;

const CategoriaCard: React.FC<CategoriaCardProps> = ({ item }) => {
  const router = useRouter();
  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const floatAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  const [randomOffsetX] = useState(() => Math.random() * 12 - 6);
  const [randomDelay] = useState(() => Math.random() * 1000);

  useEffect(() => {
    const startFloatingAnimation = () => {
      floatAnimationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 2000,
            delay: randomDelay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      floatAnimationRef.current.start();
    };
    startFloatingAnimation();
    return () => {
      floatAnimationRef.current?.stop();
      floatAnim.setValue(0);
    };
  }, [floatAnim, randomDelay]);

  if (!item || typeof item.id !== 'string' || typeof item.name !== 'string') return null;

  const onPressInCard = () => {
    floatAnimationRef.current?.stop();
    floatAnim.setValue(0);
    Animated.spring(cardScaleAnim, { toValue: 0.95, useNativeDriver: true, friction: 5, tension: 80 }).start();
    Animated.spring(iconScaleAnim, { toValue: 1.1, useNativeDriver: true, friction: 5, tension: 80 }).start();
  };

  const onPressOutCard = () => {
    floatAnimationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2000, delay: randomDelay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    floatAnimationRef.current.start();
    Animated.spring(cardScaleAnim, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }).start();
    Animated.spring(iconScaleAnim, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }).start();
  };

  const handleCardPress = () => {
    router.push({ pathname: '/(client)/category/[categoryId]', params: { categoryId: item.id, categoryName: item.name } });
  };

  const getIconSource = (iconFileName?: string) => {
    if (!iconFileName) return require('../../../../assets/images/icons/residencial.png');
    const baseFileName = iconFileName.toLowerCase().replace(/\.png$/, '');
    try {
      switch (baseFileName) {
        case 'residencial': return require('../../../../assets/images/icons/residencial.png');
        case 'comercial': return require('../../../../assets/images/icons/comercial.png');
        case 'obra': return require('../../../../assets/images/icons/obra.png');
        case 'vidro': return require('../../../../assets/images/icons/vidro.png');
        case 'escritorio': return require('../../../../assets/images/icons/escritorio.png');
        case 'estofados': return require('../../../../assets/images/icons/estofados.png');
        case 'passadoria': return require('../../../../assets/images/icons/passadoria.png');
        default: return require('../../../../assets/images/icons/residencial.png');
      }
    } catch {
      return require('../../../../assets/images/icons/residencial.png');
    }
  };

  const imageSource = getIconSource(item.icon);

  return (
    <Animated.View
      style={[
        styles.cardContainerWrapper,
        {
          transform: [
            { scale: cardScaleAnim },
            { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
            { translateX: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, randomOffsetX] }) },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.touchableSurface,
          Platform.select({
            ios: {
              shadowColor: PRIMARY_SHADOW_COLOR,
              shadowOffset: { width: 0, height: PRIMARY_SHADOW_OFFSET_HEIGHT },
              shadowOpacity: 0.16,  // ainda mais suave (reduz “risco”)
              shadowRadius: 16,      // difusão maior
            },
            android: {
              elevation: PRIMARY_ELEVATION_ANDROID, // 4
            },
          }),
          { borderColor: BORDER_COLOR_LIGHT },
        ]}
        onPress={handleCardPress}
        onPressIn={onPressInCard}
        onPressOut={onPressOutCard}
        activeOpacity={0.9}
      >
        {/* Glass base */}
        <BlurView intensity={BLUR_INTENSITY} tint={BLUR_TINT} style={StyleSheet.absoluteFillObject} />

        {/* Fundo translúcido frio */}
        <LinearGradient colors={['#F9FBFF', '#E6F0FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />

        {/* Tinta sutil do conteúdo */}
        <LinearGradient colors={[TINT_GRADIENT_START, TINT_GRADIENT_END]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.contentOverlay}>
          {/* HALO lateral branco super sutil – dá “elevação de brilho” nas bordas e reduz o contraste com o fade do container */}
          {Platform.OS === 'ios' && (
            <>
              <LinearGradient
                colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.0)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.edgeGlowLeft}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.12)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.edgeGlowRight}
                pointerEvents="none"
              />
            </>
          )}

          <Animated.Image source={imageSource} style={[styles.iconImage, { transform: [{ scale: iconScaleAnim }] }]} />
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.categoriaTexto}>{item.name}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainerWrapper: {
    width:  48,
    height: 40 + 15,
    marginRight: 15,
    right: 14,
    borderRadius: 25,
    marginBottom: -4,
    marginTop: 12,
    alignItems: 'center',
  },
  touchableSurface: {
    width: '100%',
    height: 45,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: BORDER_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // translúcido premium
  },
  contentOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  // Halo lateral (4px) para “apagar” o risco com brilho branco suave no iOS
  edgeGlowLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  edgeGlowRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconImage: {
    width: 32,
    height: 30,
    resizeMode: 'contain',
    marginBottom: -2,
  },
  categoriaTexto: {
    fontSize: 8,
    color: TEXT_COLOR,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 7,
  },
});

export default CategoriaCard;