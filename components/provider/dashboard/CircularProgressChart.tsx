// app/provider/components/dashboard/CircularProgressChart.tsx
import React, { useRef, useEffect, useState } from 'react'; // Import useState
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BlurView } from 'expo-blur';

interface CircularProgressChartProps {
  progress: number; // 0 to 1 for 0-100%
  radius: number;
  strokeWidth: number;
  color: string;
  backgroundColor: string;
  value: Animated.Value; // ALTERADO: Agora aceita um Animated.Value
  label: string;
  onDetailPress?: () => void; // Adicionado para funcionalidade do botão "Detalhe"
}

// Cria um componente de Círculo animável para a barra de progresso
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CircularProgressChart: React.FC<CircularProgressChartProps> = ({
  progress,
  radius,
  strokeWidth,
  color,
  backgroundColor,
  value: animatedValueProp, // Renomeado para evitar conflito com variável de estado/local
  label,
  onDetailPress,
}) => {
  const animatedProgress = useRef(new Animated.Value(0)).current; // Para animar a barra de progresso em si
  const buttonScale = useRef(new Animated.Value(1)).current; // Para feedback de toque no botão

  // Estado para armazenar o valor formatado como string
  const [displayValue, setDisplayValue] = useState<string>(
    // Inicializa com o valor atual do Animated.Value formatado
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(animatedValueProp.__getValue() || 0)
  );

  // Efeito para animar a barra de progresso
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 800, // Duração da animação
      useNativeDriver: true, // Pode usar native driver para esta animação
    }).start();
  }, [progress, animatedProgress]);

  // Efeito para ouvir o animatedValueProp e atualizar displayValue
  useEffect(() => {
    const listenerId = animatedValueProp.addListener(({ value }) => {
      // Formata o número animado para string de moeda
      setDisplayValue(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value));
    });

    // Limpa o listener quando o componente é desmontado ou animatedValueProp muda
    return () => {
      animatedValueProp.removeListener(listenerId);
    };
  }, [animatedValueProp]); // Re-executa o efeito se o animatedValueProp em si mudar

  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const handlePressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: radius * 2, height: radius * 2 }}>
      <Svg width={radius * 2} height={radius * 2} viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
        <Circle
          stroke={backgroundColor}
          fill="transparent"
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          stroke={color}
          fill="transparent"
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset} // Usando o valor animado
          strokeLinecap="round"
          transform={`rotate(-90 ${radius} ${radius})`} // Inicia do topo
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <BlurView intensity={Platform.OS === 'ios' ? 15 : 40} tint="light" style={styles.chartOverlayContent}>
          <Text style={styles.chartValue}>{displayValue}</Text> {/* Usa a variável de estado aqui */}
          <Text style={styles.chartLabel}>{label}</Text>
          {onDetailPress && (
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.chartDetailButton}
                onPress={onDetailPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
              >
                <Text style={styles.chartDetailButtonText}>Detalhe</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </BlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartOverlayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999, // Um valor grande para garantir que seja um círculo perfeito
    overflow: 'hidden', // Para que a BlurView respeite o borderRadius
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', // Borda sutil para o efeito glassmorphic
  },
  chartValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  chartLabel: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.05)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
  },
  chartDetailButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 5,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,122,255,0.2)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 5 },
      android: { elevation: 5 },
    }),
  },
  chartDetailButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default CircularProgressChart;