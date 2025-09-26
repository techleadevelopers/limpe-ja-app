import { useEffect } from 'react';
import {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';

/**
 * Hook para gerenciar a animação de reflexo no botão "plus".
 */
export const usePlusButtonReflectionAnimation = () => {
    const reflectionTranslateX = useSharedValue(-60); // Começa fora da tela à esquerda

    useEffect(() => {
        // A largura do botão é 42, a largura do reflexo é 60.
        // Então ele precisa se mover de -60 (começo fora da tela à esquerda) para 42 + 60 (fim fora da tela à direita)
        const buttonWidth = 42; // Baseado em styles.plusButton
        const reflectionWidth = 60; // Baseado em styles.reflectionOverlay
        const totalTravelDistance = buttonWidth + reflectionWidth;

        reflectionTranslateX.value = withRepeat(
            withTiming(totalTravelDistance, {
                duration: 1500,
                easing: Easing.linear
            }),
            -1, // Repete indefinidamente
            false // Não inverte a sequência
        );
    }, []);

    const animatedReflectionStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: reflectionTranslateX.value }],
        };
    });

    return { animatedReflectionStyle };
};