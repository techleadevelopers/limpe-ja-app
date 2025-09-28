import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ImageBackground, Dimensions, Easing, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Importa todas as imagens do seu diretório assets.
// Certifique-se de que os caminhos e nomes de arquivo estão corretos.
const allBannerImages = [
    require('../../../../assets/images/banner6.png'),
    require('../../../../assets/images/banner4.png'),
    require('../../../../assets/images/banner3.png'),
];

interface CarouselBannerItemProps {
    title: string;
    discount: string;
    description: string;
    buttonText: string;
    badgeText: string;
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
    // Estado para controlar o índice da imagem atual no carrossel
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    // Valor animado para controlar a opacidade da imagem que está entrando (next image)
    // 0: currentImageIndex é totalmente visível, 1: nextImageIndex é totalmente visível
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Animação para o botão
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;
    // Animação para o efeito de tremor/vibração no fundo
    const backgroundFloatAnim = useRef(new Animated.Value(0)).current;

    // Animações para o efeito Ken Burns (zoom e pan) - Corrigido para números puros
    const kenBurnsZoom = useRef(new Animated.Value(1)).current;
    const kenBurnsPanX = useRef(new Animated.Value(0)).current;
    const kenBurnsPanY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Inicia a animação de tremor/vibração do fundo com pausas
        Animated.loop(
            Animated.sequence([
                // Fase de Vibração (movimentos rápidos e sutis)
                Animated.timing(backgroundFloatAnim, {
                    toValue: 0.5, // Move ligeiramente para um lado
                    duration: 50, // Movimento rápido
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(backgroundFloatAnim, {
                    toValue: -0.5, // Move ligeiramente para o outro lado
                    duration: 50, // Movimento rápido
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(backgroundFloatAnim, {
                    toValue: 0, // Retorna ao centro
                    duration: 50, // Movimento rápido
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                // Fase de Pausa (banner parado)
                Animated.delay(4000), // Pausa de 4 segundos
            ])
        ).start();

        // Animação do carrossel de imagens (mantida inalterada)
        const interval = setInterval(() => {
            // Inicia a animação de fade-in para a próxima imagem
            Animated.timing(fadeAnim, {
                toValue: 1, // Aumenta a opacidade da próxima imagem para 1
                duration: 1000, // Duração da transição (1 segundo)
                easing: Easing.linear, // Transição suave e linear
                useNativeDriver: true,
            }).start(() => {
                // Após a animação de fade-in/out completar, atualiza o índice da imagem atual
                setCurrentImageIndex((prevIndex) => (prevIndex + 1) % allBannerImages.length);
                // Reseta o valor de fadeAnim para 0 imediatamente para o próximo ciclo
                // Isso faz com que a nova "currentImageIndex" comece com opacidade total (1)
                // e a nova "nextImageIndex" comece com opacidade zero (0), pronta para o próximo fade-in.
                fadeAnim.setValue(0);
            });
        }, 4000); // Tempo total por slide: 3 segundos de exibição + 1 segundo de transição

        // Ken Burns Effect - Corrigido: Interpola para números puros e usa useNativeDriver: false para imagens (evita erro no Fabric)
        const startKenBurns = () => {
            kenBurnsZoom.setValue(1);
            kenBurnsPanX.setValue(0);
            kenBurnsPanY.setValue(0);

            // Interpola os valores para garantir números puros no transform
            const zoomInterpolated = kenBurnsZoom.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.15], // Zoom de 15% como número
            });
            const panXInterpolated = kenBurnsPanX.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 15], // Pan horizontal como número
            });
            const panYInterpolated = kenBurnsPanY.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 10], // Pan vertical como número
            });

            Animated.parallel([
                Animated.timing(kenBurnsZoom, {
                    toValue: 1, // Use valores base para timing, mas interpolate no style
                    duration: 5000, // Duração do zoom
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false, // Fallback para imagens (evita erro de transform inválido)
                }),
                Animated.timing(kenBurnsPanX, {
                    toValue: 1,
                    duration: 5000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(kenBurnsPanY, {
                    toValue: 1,
                    duration: 5000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
            ]).start(() => {
                // Inverte a animação para o próximo ciclo (reset para 0)
                Animated.parallel([
                    Animated.timing(kenBurnsZoom, {
                        toValue: 0,
                        duration: 5000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(kenBurnsPanX, {
                        toValue: 0,
                        duration: 5000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(kenBurnsPanY, {
                        toValue: 0,
                        duration: 5000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                ]).start(() => startKenBurns()); // Loop infinito
            });
        };
        startKenBurns();

        // Função de limpeza para parar o intervalo quando o componente for desmontado
        return () => clearInterval(interval);
    }, []); // Array de dependências vazio para rodar uma vez na montagem do componente

    const onPressInButton = () => Animated.spring(buttonScaleAnim, { toValue: 0.95, useNativeDriver: true, friction: 5, tension: 80 }).start(); // Ajuste de fricção/tensão
    const onPressOutButton = () => Animated.spring(buttonScaleAnim, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }).start(); // Ajuste de fricção/tensão

    // Estilo animado para criar o efeito de tremor/vibração
    const animatedBackgroundStyle = {
        transform: [
            {
                translateX: backgroundFloatAnim.interpolate({
                    inputRange: [-0.5, 0, 0.5],
                    outputRange: [-0.5, 0, 0.5] // Muito sutil: meio pixel horizontal
                })
            },
            {
                translateY: backgroundFloatAnim.interpolate({
                    inputRange: [-0.5, 0, 0.5],
                    outputRange: [-0.5, 0, 0.5] // Muito sutil: meio pixel vertical
                })
            }
        ]
    };

    // Estilo animado para o efeito Ken Burns - Corrigido: Usa interpolate para números puros no transform
    const kenBurnsAnimatedStyle = {
        transform: [
            { scale: kenBurnsZoom.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }, // Garante número puro
            { translateX: kenBurnsPanX.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) }, // Número puro
            { translateY: kenBurnsPanY.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) }, // Número puro
        ],
    };

    // Calcula o índice da próxima imagem que irá aparecer
    const nextImageIndex = (currentImageIndex + 1) % allBannerImages.length;

    return (
        <TouchableOpacity onPress={onPress} style={styles.bannerOuterContainer} activeOpacity={0.9}>
            <Animated.View style={[styles.backgroundImageWrapper, animatedBackgroundStyle]}>
                {/* Imagem Atual (fade-out) */}
                <Animated.View style={[StyleSheet.absoluteFillObject, {
                    opacity: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0] // Quando fadeAnim vai de 0 a 1, a opacidade desta imagem vai de 1 a 0
                    })
                }]}>
                    <Animated.View style={[styles.backgroundImage, kenBurnsAnimatedStyle]}>
                        <ImageBackground
                            source={allBannerImages[currentImageIndex]}
                            style={styles.backgroundImageInner}
                            imageStyle={styles.imageStyle} // Apenas bordas aqui, sem transform (estático)
                        >
                            {/* Gradiente para escurecer a imagem e melhorar a legibilidade do texto */}
                            <LinearGradient
                                colors={['rgba(219, 211, 211, 0.43)', 'rgba(237, 229, 229, 0.31)', 'rgba(184, 183, 183, 0.4)']}
                                style={StyleSheet.absoluteFillObject}
                            />
                        </ImageBackground>
                    </Animated.View>
                </Animated.View>

                {/* Próxima Imagem (fade-in) */}
                <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}>
                    <Animated.View style={[styles.backgroundImage, kenBurnsAnimatedStyle]}>
                        <ImageBackground
                            source={allBannerImages[nextImageIndex]}
                            style={styles.backgroundImageInner}
                            imageStyle={styles.imageStyle} // Apenas bordas aqui, sem transform (estático)
                        >
                            {/* Gradiente para escurecer a imagem e melhorar a legibilidade do texto */}
                            <LinearGradient
                                colors={['rgba(219, 211, 211, 0.43)', 'rgba(237, 229, 229, 0.31)', 'rgba(184, 183, 183, 0.4)']}
                                style={StyleSheet.absoluteFillObject}
                            />
                        </ImageBackground>
                    </Animated.View>
                </Animated.View>

                {/* Conteúdo (sempre por cima das imagens) */}
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
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    bannerOuterContainer: {
        width: Dimensions.get('window').width - 50, // Alinhado com padding do FlatList (10 left + 20 right)
        height: 120,
        marginRight: 10,
        
        borderRadius: 22, // Arredondado premium
        marginHorizontal: 0, // Sem margins laterais para alinhamento perfeito
        overflow: 'hidden',
        // Sombras premium iOS (mais profundas e suaves)
        ...Platform.select({
            ios: {
                shadowColor: '#45484b56',
                shadowOffset: { width: -1, height: 2 }, // Offset vertical para "flutuar"
                shadowOpacity: 1.0, // Opacidade total para premium iOS
                shadowRadius: 8, // Blur suave como no iOS 17
            },
            android: {
                elevation: 8, // Compatível, mas menos blur
            },
        }),
    },
    backgroundImageWrapper: {
        flex: 1,
        overflow: 'hidden',
        borderRadius: 22, // Consistente com outer
        borderWidth: 0.5, // Borda sutil para definição
        borderColor: '#45484b56',
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Evita vazamentos em iOS
    },
    backgroundImageInner: {
        flex: 1,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageStyle: {
        borderRadius: 22, // Apenas bordas, sem transform (estático, corrige erro)
    },
    content: {
        ...StyleSheet.absoluteFillObject,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: 16, // Padding ajustado para alinhamento sem hacks
        paddingBottom: 16,
    },
    leftContent: {
        flex: 1,
        justifyContent: 'space-between',
        height: '100%',
        alignItems: 'flex-start', // Alinhamento à esquerda premium
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.9)', // Mais opaco para legibilidade iOS
        borderRadius: 5,
        paddingVertical: 2,
        paddingHorizontal: 6,
        marginBottom: 4, // Espaçamento sutil
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6692bdff',
    },
    title: {
        fontSize: 16, // Aumentado para premium
        fontWeight: 'bold',
        color: 'white',
        lineHeight: 22,
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.75)', // Sombra mais forte para contraste iOS
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    discount: {
        fontSize: 24, // Maior para destaque premium
        fontWeight: '900',
        color: 'white',
        marginBottom: 8,
        bottom: 5,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    description: {
        fontSize: 14, // Ajustado para legibilidade
        color: 'rgba(255, 255, 255, 0.9)', // Branco semi-transparente para premium
        marginTop: 'auto',
        lineHeight: 18,
    },
    button: {
        backgroundColor: 'white',
        borderRadius: 20,
        paddingVertical: 8, // Padding maior para touch iOS
        paddingHorizontal: 16,
        marginTop: 'auto',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    buttonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6973bfff',
        textAlign: 'center',
    },
});

export default CarouselBannerItem;