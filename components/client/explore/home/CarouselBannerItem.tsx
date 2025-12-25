import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const bannerImages = [
  require('../../../../assets/images/banner6.png'),
  require('../../../../assets/images/banner4.png'),
  require('../../../../assets/images/banner3.png'),
];

interface CarouselBannerItemProps {
  title: string;
  discount: string;
  description: string;
  buttonText: string;
  badgeText: string;
  onPress: () => void;
}

const CarouselBannerItem: React.FC<CarouselBannerItemProps> = ({
  title,
  discount,
  description,
  buttonText,
  badgeText,
  onPress,
}) => {
  const [current, setCurrent] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  const zoom = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Transição de banners
  useEffect(() => {
    const loop = setInterval(() => {
      Animated.timing(fade, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setCurrent((prev) => (prev + 1) % bannerImages.length);
        fade.setValue(0);
      });
    }, 6000);
    return () => clearInterval(loop);
  }, []);

  // Ken Burns leve e fixo no eixo
  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(zoom, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(zoom, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };
    animate();
  }, []);

  const kenBurnsStyle = {
    transform: [
      { scale: zoom.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) },
      { translateX: zoom.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }) },
      { translateY: zoom.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
    ],
  };

  const next = (current + 1) % bannerImages.length;

  // Botão com leve spring
  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 8 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageWrapper}>
        {/* imagem atual */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            },
          ]}
        >
          <Animated.View style={[styles.imageLayer, kenBurnsStyle]}>
            <ImageBackground
              source={bannerImages[current]}
              style={styles.imageBg}
              imageStyle={styles.imageStyle}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.25)']}
                style={StyleSheet.absoluteFillObject}
              />
            </ImageBackground>
          </Animated.View>
        </Animated.View>

        {/* próxima imagem */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { opacity: fade },
          ]}
        >
          <Animated.View style={[styles.imageLayer, kenBurnsStyle]}>
            <ImageBackground
              source={bannerImages[next]}
              style={styles.imageBg}
              imageStyle={styles.imageStyle}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.25)']}
                style={StyleSheet.absoluteFillObject}
              />
            </ImageBackground>
          </Animated.View>
        </Animated.View>

        {/* conteúdo */}
        <View style={styles.content}>
          <View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.discount}>{discount}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
              style={styles.button}
              onPress={onPress}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
            >
              <Text style={styles.buttonText}>{buttonText}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: Platform.select({
  ios: Dimensions.get('window').width - 40,
  android: Dimensions.get('window').width - 55,
  default: Dimensions.get('window').width - 40,
}),
left: Platform.OS === 'android' ? 10 : 0,
    height: Platform.OS === 'android' ? 93 : 100,
    borderRadius: 14,
    marginTop: Platform.OS === 'android' ? 36 : 12,
    marginRight: Platform.OS === 'android' ? 36 : 12,
    overflow: 'hidden',
    marginHorizontal: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 0 },
    }),
  },
  imageWrapper: { flex: 1 },
  imageLayer: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBg: { flex: 1, width: '100%', height: '100%', justifyContent: 'center' },
  imageStyle: { resizeMode: 'cover' },
  content: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999, // deixa o pill perfeito
    // Ajuste fino: reduzir o padding à esquerda para evitar sensação de recuo
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start', // evita esticar em layouts flex
    marginBottom: 4,
  },
  badgeText: { fontSize: 8, fontWeight: '700', color: '#6488be' },
  title: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  discount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    backgroundColor: 'white',
    borderRadius: 18,
    paddingVertical: 5,
    paddingHorizontal: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 0 },
    }),
  },
  buttonText: { fontSize: 9, fontWeight: '700', color: '#5f7fff' },
});

export default CarouselBannerItem;
