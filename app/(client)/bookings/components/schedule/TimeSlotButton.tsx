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

// Cores do gradiente (as mesmas que você usou no ProviderBrief)
const AVAILABLE_GRADIENT_COLORS: readonly [ColorValue, ColorValue, ColorValue] = [
    'rgba(173, 216, 230, 0.69)',      // Azul claro com baixa opacidade
    'rgba(65, 153, 225, 0.28)',   // Azul com média opacidade
    'rgba(133, 167, 231, 0.34)', // Azul claro com alta opacidade
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
                // Não precisa de `styles.buttonBase` aqui, pois o background será o gradiente ou as cores.
                !isAvailable
                    ? [buttonStyle, styles.buttonUnavailable]
                    : isSelected
                        ? [buttonStyle, styles.buttonSelected]
                        : buttonStyle // Estilo base sem cor de fundo
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
                    // Certifique-se de que o texto esteja acima do gradiente
                    shouldApplyGradient && { zIndex: 1, color: '#fff' } // Cor do texto sobre o gradiente
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
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject, // Faz o gradiente preencher todo o TouchableOpacity
        borderRadius: 6, // Garante que o gradiente também tenha os cantos arredondados
    },
    buttonSelected: {
        backgroundColor: '#2A72E7', // Mantém o background azul para selecionado
    },
    buttonUnavailable: {
        backgroundColor: '#EAEAEA', // Cor de fundo mais clara para indisponível
        opacity: 0.8,
    },
    textBase: {
        fontSize: 11,
        color: '#333333',
        fontWeight: '500',
    },
    textSelected: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    textUnavailable: {
        color: '#999999', // Cor de texto mais clara para indisponível
    },
});

export default TimeSlotButton;