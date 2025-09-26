import { useEffect } from 'react';
import {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
    cancelAnimation,
} from 'react-native-reanimated';

/**
 * Hook para gerenciar a animação de tremor sutil no botão "plus".
 */
export const usePlusButtonTrembleAnimation = () => {
    const subtleTrembleValue = useSharedValue(0);

    useEffect(() => {
        const SHAKE_AMOUNT = 0.5; // 0.5 pixels para um movimento muito sutil
        const SHAKE_DURATION = 50; // 50ms para um movimento rápido

        subtleTrembleValue.value = withRepeat(
            withSequence(
                withTiming(SHAKE_AMOUNT, { duration: SHAKE_DURATION, easing: Easing.linear }),
                withTiming(-SHAKE_AMOUNT, { duration: SHAKE_DURATION, easing: Easing.linear }),
                withTiming(0, { duration: SHAKE_DURATION, easing: Easing.linear }),
                withTiming(0, { duration: 4000, easing: Easing.linear }) // Pausa de 4 segundos antes de repetir
            ),
            -1, // Repete indefinidamente
            false // Não inverte a sequência
        );

        return () => {
            cancelAnimation(subtleTrembleValue);
        };
    }, []);

    const subtleTrembleAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: subtleTrembleValue.value },
                { translateY: subtleTrembleValue.value },
            ],
        };
    });

    return { subtleTrembleAnimatedStyle };
};