// app/(client)/bookings/components/schedule/TimeSlotButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ColorValue } from 'react-native'; // Adicionado ColorValue
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
                        : buttonStyle // Estilo base sem cor de fundo, para o gradiente
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
        opacity: 0.8,
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
