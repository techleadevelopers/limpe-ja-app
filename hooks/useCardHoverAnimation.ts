import { useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Hook para gerenciar a animação de escala de "hover" do card.
 */
export const useCardHoverAnimation = () => {
    const hoverScaleAnim = useRef(new Animated.Value(1)).current; // 1: estado normal

    const onPressInCard = () => {
        Animated.spring(hoverScaleAnim, {
            toValue: 1.03, // Leve zoom de 3% ao "hover"
            useNativeDriver: true,
            friction: 5, // Mais "mola" para um efeito mais vivo
            tension: 100, // Retorno rápido
        }).start();
    };

    const onPressOutCard = () => {
        Animated.spring(hoverScaleAnim, {
            toValue: 1, // Retorna ao estado normal
            useNativeDriver: true,
            friction: 5,
            tension: 100,
        }).start();
    };

    return { hoverScaleAnim, onPressInCard, onPressOutCard };
};