import React, { useRef } from 'react';
import { Text, TouchableOpacity, StyleSheet, Platform, Animated, View, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface ServiceDetailsDto {
  id: string;
  name: string;
  icon?: string;
}

interface CategoriaCardProps {
  item: ServiceDetailsDto;
  onPress: (item: ServiceDetailsDto) => void;
}

const TINT_GRADIENT_START = 'rgba(230, 240, 255, 0.7)';
const TINT_GRADIENT_END = 'rgba(210, 230, 255, 0.9)';
const BLUR_INTENSITY = Platform.OS === 'ios' ? 20 : 40;
const BLUR_TINT = 'light';
const TEXT_COLOR = 'rgba(0, 123, 255, 0.62)';

const PRIMARY_SHADOW_COLOR = 'rgba(0, 50, 150, 0.2)';
const PRIMARY_SHADOW_OFFSET_HEIGHT = 5;
const PRIMARY_SHADOW_RADIUS = 8;
const PRIMARY_ELEVATION_ANDROID = 5;

const SECONDARY_SHADOW_COLOR = 'rgba(0, 50, 150, 0.08)';
const SECONDARY_SHADOW_OFFSET_HEIGHT = 15;
const SECONDARY_SHADOW_RADIUS = 20;
const SECONDARY_ELEVATION_ANDROID = 10;

const BORDER_COLOR_LIGHT = 'rgba(255, 255, 255, 0.9)';
const BORDER_WIDTH = 1.5;

const CategoriaCard: React.FC<CategoriaCardProps> = ({ item, onPress }) => {
  const cardScaleAnim = useRef(new Animated.Value(1)).current;

  if (!item || typeof item.id !== 'string' || typeof item.name !== 'string') {
    console.error('[CategoriaCard] ERRO: Item inválido ou incompleto:', item);
    return null;
  }

  if (__DEV__) {
    console.log('[CategoriaCard] Item recebido para renderização:', item);
  }

  const onPressInCard = () => {
    Animated.spring(cardScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutCard = () => {
    Animated.spring(cardScaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const getIconSource = (iconFileName?: string) => {
    if (!iconFileName) {
      console.warn('[CategoriaCard] Nenhum nome de ícone fornecido. Usando padrão.');
      return require('../../../../../assets/images/icons/residencial.png');
    }

    const lowerCaseFileName = iconFileName.toLowerCase();

    try {
      switch (lowerCaseFileName) {
        case 'residencial.png':
          return require('../../../../../assets/images/icons/residencial.png');
        case 'comercial.png':
          return require('../../../../../assets/images/icons/comercial.png');
        case 'obra.png':
          return require('../../../../../assets/images/icons/obra.png');
        case 'vidro.png':
          return require('../../../../../assets/images/icons/vidro.png');
        case 'escritorio.png':
          return require('../../../../../assets/images/icons/escritorio.png');
        case 'estofados.png':
          return require('../../../../../assets/images/icons/estofados.png');
        case 'passadoria.png':
          return require('../../../../../assets/images/icons/passadoria.png');
        default:
          console.warn('[CategoriaCard] Ícone não mapeado:', iconFileName, '- usando padrão.');
          return require('../../../../../assets/images/icons/residencial.png');
      }
    } catch (e) {
      console.error(`[CategoriaCard] ERRO ao carregar ícone '${iconFileName}':`, e);
      return require('../../../../../assets/images/icons/residencial.png');
    }
  };

  const imageSource = getIconSource(item.icon);
  if (__DEV__) {
    console.log('[CategoriaCard] Source final da imagem:', imageSource);
  }

  return (
    <Animated.View style={[styles.cardContainerWrapper, { transform: [{ scale: cardScaleAnim }] }]}>
      <View style={styles.shadowLayerSecondary} />
      <View style={styles.shadowLayerPrimary} />

      <TouchableOpacity
        style={styles.touchableSurface}
        onPress={() => onPress(item)}
        onPressIn={onPressInCard}
        onPressOut={onPressOutCard}
        activeOpacity={0.9}
      >
        <BlurView
          intensity={BLUR_INTENSITY}
          tint={BLUR_TINT}
          style={StyleSheet.absoluteFillObject}
        />

        <LinearGradient
          colors={[TINT_GRADIENT_START, TINT_GRADIENT_END]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentOverlay}
        >
          <Image source={imageSource} style={styles.iconImage} />
          <Text style={styles.categoriaTexto}>{item.name}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainerWrapper: {
    width: 70,
    height: 70,
    marginRight: 5,
    marginBottom: 6,
    
  },
  shadowLayerPrimary: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 15,
    shadowColor: PRIMARY_SHADOW_COLOR,
    shadowOffset: { width: 0, height: PRIMARY_SHADOW_OFFSET_HEIGHT },
    shadowOpacity: 1,
    shadowRadius: PRIMARY_SHADOW_RADIUS,
    elevation: PRIMARY_ELEVATION_ANDROID,
  },
  shadowLayerSecondary: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 15,
    shadowColor: SECONDARY_SHADOW_COLOR,
    shadowOffset: { width: 0, height: SECONDARY_SHADOW_OFFSET_HEIGHT },
    shadowOpacity: 1,
    shadowRadius: SECONDARY_SHADOW_RADIUS,
    elevation: SECONDARY_ELEVATION_ANDROID,
  },
  touchableSurface: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_COLOR_LIGHT,
  },
  contentOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  iconImage: {
    width: 45,
    height: 45,
    resizeMode: 'contain',
    marginBottom: -2,
  },
  categoriaTexto: {
    fontSize: 10,
    color: TEXT_COLOR,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CategoriaCard;
