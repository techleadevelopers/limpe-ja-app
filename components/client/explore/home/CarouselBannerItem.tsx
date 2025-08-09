// app/(client)/explore/components/CarouselBannerItem.tsx (Renomeado para algo como StaticBanner ou OfferBanner se for fixo)
// Mas mantendo o nome CarouselBannerItem para consistência com seu pedido atual.

import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ImageBackground, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Importa a imagem do seu diretório assets. Ajuste o caminho se for diferente.
// Certifique-se de que o React Native está configurado para lidar com imagens de assets.
const bannerImage = require('../../../../assets/images/banner.png'); // <-- O nome do arquivo e a extensão são CRUCIAIS // AJUSTE O CAMINHO CONFORME SEU PROJETO

interface CarouselBannerItemProps {
    title: string;
    discount: string;
    description: string;
    buttonText: string;
    badgeText: string;
    // Removendo background colors, pois agora teremos uma imagem
    onPress: () => void;
}

const CarouselBannerItem: React.FC<CarouselBannerItemProps> = ({
    title,
    discount,
    description,
    buttonText,
    badgeText,
    onPress,
}) => {
    // Animação para o botão
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;

    const onPressInButton = () => Animated.spring(buttonScaleAnim, { toValue: 0.95, useNativeDriver: true, friction: 7 }).start();
    const onPressOutButton = () => Animated.spring(buttonScaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();

    return (
        <TouchableOpacity onPress={onPress} style={styles.bannerOuterContainer} activeOpacity={0.9}>
            <ImageBackground
                source={bannerImage} // Usando a imagem local
                style={styles.backgroundImage}
                imageStyle={styles.imageStyle}
            >
                {/* Gradiente para escurecer a imagem e melhorar a legibilidade do texto */}
                <LinearGradient
                    colors={['rgba(219, 211, 211, 0.36)', 'rgba(56, 55, 55, 0)', 'rgba(184, 183, 183, 0.18)']} // Mais escuro para o texto branco
                    style={StyleSheet.absoluteFillObject}
                />

                <View style={styles.content}>
                    <View style={styles.leftContent}>
                        {/* Badge no topo esquerdo */}
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{badgeText}</Text>
                        </View>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.discount}>{discount}</Text>
                        <Text style={styles.description}>{description}</Text>
                    </View>

                    {/* Botão no canto inferior direito */}
                    <Animated.View style={{ transform: [{ scale: buttonScaleAnim }], alignSelf: 'flex-end', marginTop: 'auto' }}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={onPress}
                            onPressIn={onPressInButton}
                            onPressOut={onPressOutButton}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.buttonText}>{buttonText}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </ImageBackground>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    bannerOuterContainer: {
        width: Dimensions.get('window').width - (9 * 2), // Largura total da tela menos o padding horizontal do contentWrapper da index.tsx
        height: 165, // Altura fixa do banner
        borderRadius: 16,
        paddingLeft: 0,
        margin: 10,
        paddingRight: 0, // Mantido para espaçamento interno
        paddingTop: 16, // Padding superior para espaçamento
        paddingBottom: 16, // Padding inferior para espaçamento
        overflow: 'hidden',
        
        // Removido marginHorizontal, pois agora é um banner único dentro do padding do contentWrapper
        // Adicione marginBottom se quiser espaço abaixo deste banner na index.tsx
        marginBottom: -11, // Exemplo de margem inferior para espaçamento
        marginTop: -21, // Exemplo de margem superior para espaçamento
     
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        resizeMode: 'cover', // Garante que a imagem cubra a área
        justifyContent: 'center', // Centraliza o conteúdo verticalmente na imagem
        alignItems: 'center', // Centraliza o conteúdo horizontalmente na imagem
    },
    imageStyle: {
        borderRadius: 26, // Aplica o border radius na imagem também
    },
    content: {
        // Ocupa todo o espaço para que o flexbox funcione corretamente
        ...StyleSheet.absoluteFillObject, // Posiciona o conteúdo sobre a imagem
        padding: 20, // Padding interno do conteúdo
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Alinha o conteúdo principal ao topo
    },
    leftContent: {
        flex: 1,
        justifyContent: 'space-between', // Para espaçar o conteúdo do lado esquerdo (badge top, desc bottom)
        height: '100%', // Ocupa a altura total disponível
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 5,
        paddingVertical: 1,
        paddingHorizontal: 4,
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#333',
    },
    title: {
        fontSize: 17,
        fontWeight: 'bold',
        color: 'white',
        lineHeight: 22,
        marginBottom: 2,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    discount: {
        fontSize: 26,
        fontWeight: '900',
        color: 'white',
        marginBottom: 5,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    description: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 'auto', // Empurra a descrição para o final do leftContent
    },
    button: {
        backgroundColor: 'white',
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 14,
        marginTop: 'auto', // Empurra o botão para a parte inferior do seu container flex
    },
    buttonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#ff6b6b', // Cor do botão "Claim" da imagem
    },
});

export default CarouselBannerItem; // Mantendo o nome, mas agora é um banner único