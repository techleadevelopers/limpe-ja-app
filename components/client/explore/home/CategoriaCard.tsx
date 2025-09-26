// LimpeJaApp/app/(client)/components/CategoriaCard.tsx
import React, { useRef, useEffect } from 'react'; // Adicionado useEffect
import { Text, TouchableOpacity, StyleSheet, Platform, Animated, View, Image, Easing } from 'react-native'; // Importado Easing
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router'; // Importar useRouter

interface ServiceDetailsDto {
  id: string;
  name: string;
  icon?: string;
}

interface CategoriaCardProps {
  item: ServiceDetailsDto;
  // A prop 'onPress' original foi removida/comentada,
  // pois a navegação agora será tratada internamente pelo componente.
  // onPress: (item: ServiceDetailsDto) => void;
}

const TINT_GRADIENT_START = 'rgba(230, 240, 255, 0.7)';
const TINT_GRADIENT_END = 'rgba(196, 197, 205, 0.23)';
const BLUR_INTENSITY = Platform.OS === 'ios' ? 20 : 40;
const BLUR_TINT = 'light';
const TEXT_COLOR = 'rgba(54, 57, 60, 0.62)';

const PRIMARY_SHADOW_COLOR = 'rgba(0, 50, 150, 0.26)';
const PRIMARY_SHADOW_OFFSET_HEIGHT = 4;
const PRIMARY_SHADOW_RADIUS = 5;
const PRIMARY_ELEVATION_ANDROID = 5;

const SECONDARY_SHADOW_COLOR = 'rgba(150, 27, 0, 0.08)';
const SECONDARY_SHADOW_OFFSET_HEIGHT = 1;
const SECONDARY_SHADOW_RADIUS = 2;
const SECONDARY_ELEVATION_ANDROID = 5;

const BORDER_COLOR_LIGHT = 'rgba(255, 255, 255, 0.9)';
const BORDER_WIDTH = 1.5;
const COR_AZUL_CLARO_UNIFICADA = '#A0D2EB';
const COR_PRIMARIA_ESCURA = '#d6605aff';
const COR_CINZA_FUNDO = '#e1403eff';
const COR_BORDA_SUAVE = '#c0b5ca92';

const CategoriaCard: React.FC<CategoriaCardProps> = ({ item }) => {
  const router = useRouter();
  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current; // Nova animação para o ícone
  // ✅ NOVO: Animação para o efeito de flutuação
  const floatAnim = useRef(new Animated.Value(0)).current;
  const floatAnimationRef = useRef<Animated.CompositeAnimation | null>(null); // Referência para controlar a animação

  // ✅ NOVO: Efeito para o Floating Card (flutuação contínua)
  useEffect(() => {
    // Gera um deslocamento horizontal aleatório para cada card
    // entre -3 e 3 unidades, para o efeito "lados diferentes"
    const randomOffsetX = (Math.random() * 6) - 3; // Valor entre -3 e 3
    const randomDelay = Math.random() * 1000; // Delay aleatório para dessincronizar

    const startFloatingAnimation = () => {
      floatAnimationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1, // Ponto 1 da animação (cima/direita ou esquerda)
            duration: 2000,
            delay: randomDelay, // Aplica o delay aqui
            easing: Easing.inOut(Easing.ease), // Easing suave
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0, // Ponto 2 da animação (volta ao centro)
            duration: 2000,
            easing: Easing.inOut(Easing.ease), // Easing suave
            useNativeDriver: true,
          }),
        ]),
      );
      floatAnimationRef.current.start();
    };

    startFloatingAnimation(); // Inicia a animação ao montar

    return () => {
      floatAnimationRef.current?.stop(); // Para a animação ao desmontar
      floatAnim.setValue(0); // Reseta a posição
    };
  }, [floatAnim]); // Dependência da animação

  if (!item || typeof item.id !== 'string' || typeof item.name !== 'string') {
    console.error('[CategoriaCard] ERRO: Item inválido ou incompleto:', item);
    return null;
  }

  if (__DEV__) {
    console.log('[CategoriaCard] Item recebido para renderização:', item);
  }

  const onPressInCard = () => {
    // ✅ NOVO: Para a animação de flutuação ao pressionar
    floatAnimationRef.current?.stop();
    floatAnim.setValue(0); // Reseta a posição para o centro

    Animated.spring(cardScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 5, // Mais "mola"
      tension: 80, // Retorno rápido
    }).start();
    Animated.spring(iconScaleAnim, { // Animação do ícone ao pressionar
      toValue: 1.1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutCard = () => {
    // ✅ NOVO: Reinicia a animação de flutuação ao soltar
    const randomOffsetX = (Math.random() * 6) - 3;
    const randomDelay = Math.random() * 1000;
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
      ]),
    );
    floatAnimationRef.current.start();


    Animated.spring(cardScaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
    Animated.spring(iconScaleAnim, { // Retorno da animação do ícone
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const handleCardPress = () => {
    router.push({
      pathname: '/(client)/category/[categoryId]', // Caminho da nova tela
      params: {
        categoryId: item.id,
        categoryName: item.name // Passa o ID e o nome da categoria como parâmetros
      },
    });
  };

  const getIconSource = (iconFileName?: string) => {
    if (!iconFileName) {
      console.warn('[CategoriaCard] Nenhum nome de ícone fornecido. Usando padrão.');
      return require('../../../../assets/images/icons/residencial.png');
    }

    // Remove a extensão .png se presente, para que o nome base corresponda aos casos do switch
    const baseFileName = iconFileName.toLowerCase().replace(/\.png$/, '');

    try {
      switch (baseFileName) { // Usa o nome base do arquivo aqui
        case 'residencial':
          return require('../../../../assets/images/icons/residencial.png');
        case 'comercial':
          return require('../../../../assets/images/icons/comercial.png');
        case 'obra':
          return require('../../../../assets/images/icons/obra.png');
        case 'vidro':
          return require('../../../../assets/images/icons/vidro.png');
        case 'escritorio':
          return require('../../../../assets/images/icons/escritorio.png');
        case 'estofados':
          return require('../../../../assets/images/icons/estofados.png');
        case 'passadoria':
          return require('../../../../assets/images/icons/passadoria.png');
        default:
          console.warn('[CategoriaCard] Ícone não mapeado:', iconFileName, '- usando padrão.');
          return require('../../../../assets/images/icons/residencial.png');
      }
    } catch (e) {
      console.error(`[CategoriaCard] ERRO ao carregar ícone '${iconFileName}':`, e);
      return require('../../../../assets/images/icons/residencial.png');
    }
  };

  const imageSource = getIconSource(item.icon);
  if (__DEV__) {
    console.log('[CategoriaCard] Source final da imagem:', imageSource);
  }

  return (
    // ✅ MODIFICADO: Adicionadas as transformações de flutuação
    <Animated.View style={[
      styles.cardContainerWrapper,
      {
        transform: [
          { scale: cardScaleAnim },
          {
            translateY: floatAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -3] // Move 3 unidades para cima
            })
          },
          {
            translateX: floatAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, (Math.random() * 5) - 6] // Move para um lado aleatório (entre -6 e 9)
            })
          }
        ]
      }
    ]}>

      <View style={styles.shadowLayerSecondary} />
      <View style={styles.shadowLayerPrimary} />

      <TouchableOpacity
        style={styles.touchableSurface}
        onPress={handleCardPress} // Chama a função de navegação interna
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
          <Animated.Image source={imageSource} style={[styles.iconImage, { transform: [{ scale: iconScaleAnim }] }]} />
        </LinearGradient>
      </TouchableOpacity>
      <Text style={styles.categoriaTexto}>{item.name}</Text>

    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainerWrapper: {
    width: 45,
    height: 43,
    marginRight: 18,
    borderRadius: 25,
    marginBottom: 9,
    marginTop: 12,


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
    width: 32,
    height: 30,
    resizeMode: 'contain',
    marginBottom: -2,
  },
  categoriaTexto: {
    fontSize: 9,
    color: TEXT_COLOR,

    fontWeight: '600',
    textAlign: 'center',
    marginTop: 7,
  },

});

export default CategoriaCard;