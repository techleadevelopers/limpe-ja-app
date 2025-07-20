// LimpeJaApp/app/(provider)/components/dashboard/GlassmorphicCard.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Certifique-se de que está instalado
import { LinearGradient } from 'expo-linear-gradient'; // Certifique-se de que está instalado
import { BlurView } from 'expo-blur'; // Certifique-se de que está instalado

// Definindo os tipos para as props do GlassmorphicCard
export interface GlassmorphicCardProps {
  title: string;
  value: string | number;
  iconName: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap; // Permite nomes de ícones de ambas as bibliotecas
  iconColor: string;
  delay: number; // Atraso para a animação de entrada
  iconType?: 'Ionicons' | 'MaterialCommunityIcons'; // Para especificar qual conjunto de ícones usar
  gradientColors: readonly [string, string, ...string[]]; // Cores para o gradiente de fundo
  reflectionOffset: Animated.AnimatedInterpolation<number>; // Valor interpolado para o efeito de reflexo
  isCurrency?: boolean; // Para formatar o valor como moeda
  onPress?: () => void; // Função opcional para quando o card é pressionado
}

const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
  title,
  value,
  iconName,
  iconColor,
  delay,
  iconType = 'Ionicons',
  gradientColors,
  reflectionOffset,
  isCurrency = false,
  onPress,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current; // Inicia 20 pixels abaixo para animar para cima
  const scaleAnim = useRef(new Animated.Value(1)).current; // Para animação de clique

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, // Move para a posição original (Y=0)
        duration: 500,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96, // Diminui um pouco o card
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1, // Retorna ao tamanho original
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const IconComponent = iconType === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;

  const formattedValue = isCurrency && typeof value === 'number'
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    : value;

  return (
    <Animated.View
      style={[
        styles.glassmorphicCardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.glassmorphicCardTouch}
        onPress={onPress} // Adiciona a função de clique se fornecida
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={onPress ? 0.8 : 1} // Opacidade ativa apenas se houver um onPress
        disabled={!onPress} // Desabilita o feedback de toque se não houver onPress
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glassmorphicGradient}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 25 : 60} // Intensidade do blur pode variar por plataforma
            tint="light" // 'light', 'dark', ou 'default'
            style={StyleSheet.absoluteFillObject} // Faz o BlurView cobrir todo o LinearGradient
          >
            <View style={styles.glassmorphicContent}>
              <View style={styles.glassmorphicHeader}>
                <IconComponent name={iconName as any} size={30} color={iconColor} />
                <Text style={styles.glassmorphicTitle}>{title}</Text>
              </View>
              <Text style={styles.glassmorphicValue}>{String(formattedValue)}</Text>
              {/* Overlay para o efeito de reflexo */}
              <Animated.View
                style={[
                  styles.reflectionOverlay,
                  {
                    transform: [{ translateY: reflectionOffset }],
                  },
                ]}
              />
            </View>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  glassmorphicCardWrapper: {
    flex: 1, // Para ocupar o espaço disponível se estiver em um container flex
    borderRadius: 15,
    overflow: 'hidden', // Essencial para que o BlurView e o LinearGradient respeitem o borderRadius
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 10, // Sombra para Android
      },
    }),
  },
  glassmorphicCardTouch: {
    flex: 1, // Para o TouchableOpacity preencher o wrapper
  },
  glassmorphicGradient: {
    flex: 1,
    padding: 20, // Espaçamento interno do conteúdo do card
    justifyContent: 'space-between', // Para empurrar o header para cima e o valor para baixo
  },
  glassmorphicContent: {
    flex: 1,
    justifyContent: 'space-between', // Alinha o header no topo e o valor abaixo
    position: 'relative', // Para o posicionamento absoluto do reflectionOverlay
    zIndex: 1, // Garante que o conteúdo fique acima do BlurView (se necessário, mas BlurView é o fundo)
    backgroundColor: 'transparent', // Garante que não haja cor de fundo inesperada
  },
  reflectionOverlay: {
    position: 'absolute',
    top: 0, // Cobre uma parte do card
    left: -50, // Começa fora da tela para deslizar sobre
    right: -50, // Termina fora da tela
    height: '60%', // Altura do reflexo
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Cor e opacidade do reflexo
    opacity: 0.7, // Opacidade geral do reflexo, pode ser ajustada
    borderRadius: 15, // Mantém a borda arredondada
    transform: [{ skewY: '-15deg' }], // Inclina o reflexo
    zIndex: 0, // Fica abaixo do conteúdo textual mas acima do fundo
  },
  glassmorphicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  glassmorphicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF', // Ajustar a cor do texto para melhor contraste com os gradientes
    marginLeft: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  glassmorphicValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF', // Ajustar a cor do texto
    marginTop: 10, // Espaço acima do valor
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
    alignSelf: 'flex-start', // Alinha o valor à esquerda
  },
});

export default GlassmorphicCard;