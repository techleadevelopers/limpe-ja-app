// components/common/BottomSlideInCard.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View, Platform, ViewStyle } from 'react-native';

interface BottomSlideInCardProps {
    isVisible: boolean;
    children: React.ReactNode;
}

const { height: screenHeight } = Dimensions.get('window');

export const BottomSlideInCard: React.FC<BottomSlideInCardProps> = ({ isVisible, children }) => {
    const translateY = useRef(new Animated.Value(screenHeight)).current;

    useEffect(() => {
        if (isVisible) {
            Animated.spring(translateY, {
                toValue: 0, // Anima para a posição natural (alinhado na parte inferior)
                tension: 40,
                friction: 10,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(translateY, {
                toValue: screenHeight, // Anima para fora da tela (para baixo)
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [isVisible, translateY]);

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY }] },
                // Garante que o componente só ocupe espaço quando visível
                { display: isVisible ? 'flex' : 'none' }
            ]}
            pointerEvents={isVisible ? 'auto' : 'none'} // Habilita/desabilita interações com base na visibilidade
        >
            {children}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: Platform.select({ web: 'fixed', default: 'absolute' }) as ViewStyle['position'],
        bottom: 20, // Distância do fundo da tela
        left: 0,
        right: 0,
        alignItems: 'center', // Centraliza o conteúdo horizontalmente
        justifyContent: 'flex-end', // Alinha o conteúdo à parte inferior do contêiner
        zIndex: 9999, // Garante que ele fique acima da maioria dos outros elementos
        paddingHorizontal: 16, // Padding das bordas da tela
        pointerEvents: 'box-none' // Não bloqueia toques fora do conteúdo do card
    },
});