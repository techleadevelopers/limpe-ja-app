// app/(client)/bookings/components/schedule/TimeSlotButton.tsx
import React, { useRef, useEffect } from 'react'; // Importado useRef, useEffect
import { TouchableOpacity, Text, StyleSheet, View, ColorValue, Animated, Easing } from 'react-native'; // Adicionado ColorValue, Animated, Easing
import { LinearGradient } from 'expo-linear-gradient'; // Importe o LinearGradient

interface TimeSlotButtonProps {
    time: string;
    isSelected: boolean;
    onPress: (time: string) => void;
    isAvailable?: boolean;
    itemWidth?: number;
}

// Cores do gradiente para slots disponíveis (azul mais vibrante, nível Play Store)
// Ajustado para ser um pouco mais claro que o botão selecionado
const AVAILABLE_GRADIENT_COLORS: readonly [ColorValue, ColorValue] = [
    '#9BD6F7', // Um azul muito claro, quase pastel
    '#7CC0E7', // Um azul claro, ainda mais suave que o anterior
] as const;

const TimeSlotButton: React.FC<TimeSlotButtonProps> = ({
    time,
    isSelected,
    onPress,
    isAvailable = true,
    itemWidth,
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current; // Animação de pulso para slots disponíveis

    useEffect(() => {
        if (isAvailable && !isSelected) {
            // Inicia a animação de pulso para slots disponíveis e não selecionados
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.02,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation(); // Para a animação se não estiver disponível ou selecionado
            pulseAnim.setValue(1); // Reseta o valor
        }
    }, [isAvailable, isSelected, pulseAnim]);

    const handlePress = () => {
        if (isAvailable) {
            onPress(time);
        }
    };

    // Estilo base do botão sem background, para que o LinearGradient seja o fundo
    const buttonStyle = [
        styles.buttonBase,
        itemWidth ? { width: itemWidth, marginHorizontal: 3, marginBottom: 10 } : { margin: 5 },
    ];

    // Condição para aplicar o gradiente: disponível E não selecionado
    const shouldApplyGradient = isAvailable && !isSelected;

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={!isAvailable}
            style={
                // Se o slot estiver indisponível, aplique o estilo de indisponível (backgroundColor)
                // Se estiver selecionado, aplique o estilo de selecionado (backgroundColor)
                // Caso contrário (disponível e não selecionado), o LinearGradient será o fundo.
                !isAvailable
                    ? [buttonStyle, styles.buttonUnavailable]
                    : isSelected
                        ? [buttonStyle, styles.buttonSelected]
                        : [buttonStyle, { transform: [{ scale: pulseAnim }] }] // Aplica a animação de pulso
            }
        >
            {shouldApplyGradient && (
                <LinearGradient
                    colors={AVAILABLE_GRADIENT_COLORS}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientOverlay} // Ocupa todo o espaço do botão
                />
            )}
            <Text
                style={[
                    styles.textBase,
                    isSelected && styles.textSelected,
                    !isAvailable && styles.textUnavailable,
                    shouldApplyGradient && styles.textAvailableGradient // Nova cor de texto para o gradiente
                ]}
            >
                {time}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    buttonBase: {
        paddingVertical: 6,
        paddingHorizontal: 6,
        borderRadius: 6,
        // REMOVIDO: backgroundColor: '#F0F0F0', // Removido para permitir que o gradiente apareça
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 70,
        overflow: 'hidden', // Importante para que o gradiente respeite o borderRadius
        // Adicionando sombra sutil para os botões disponíveis com gradiente
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject, // Faz o gradiente preencher todo o TouchableOpacity
        borderRadius: 6, // Garante que o gradiente também tenha os cantos arredondados
    },
    buttonSelected: {
        backgroundColor: '#2A72E7', // Mantém o background azul para selecionado
        shadowColor: '#2A72E7', // Sombra para o botão selecionado
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonUnavailable: {
        backgroundColor: '#EAEAEA', // Cor de fundo mais clara para indisponível
        opacity: 0.6, // Reduz a opacidade para indisponível
        shadowColor: 'transparent', // Sem sombra para indisponível
        elevation: 0,
    },
    textBase: {
        fontSize: 11,
        color: '#333333', // Cor padrão para texto base
        fontWeight: '500',
    },
    textSelected: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    textUnavailable: {
        color: '#999999', // Cor de texto mais clara para indisponível
    },
    textAvailableGradient: {
        color: '#FFFFFF', // Cor do texto branco quando o gradiente está aplicado
        fontWeight: 'bold', // Para destacar o texto sobre o gradiente
    }
});

export default TimeSlotButton;