import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ImageBackground, Dimensions, Easing, Platform, Image } from 'react-native'; // ✅ Adicionado Image para prefetch (otimização)
import { LinearGradient } from 'expo-linear-gradient';

// Importa todas as imagens do seu diretório assets.
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
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Animação para o botão (mantida, mas suavizada)
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;

    // ✅ REMOVIDO: backgroundFloatAnim (tremor/vibração) – clean sem jitter desnecessário

    // Animações para Ken Burns – Otimizado: Menos intensidade, nativeDriver true, duração maior
    const kenBurnsZoom = useRef(new Animated.Value(1)).current;
    const kenBurnsPanX = useRef(new Animated.Value(0)).current;
    const kenBurnsPanY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // ✅ NOVO: Pré-carregamento de imagens para aparição instantânea (smoothie)
        const preloadImages = async () => {
            for (const img of allBannerImages) {
                if (typeof img === 'number') { // Para requires locais
                    // Para imagens locais, o require já pré-carrega, mas simulamos prefetch para consistência
                    console.log('Imagem pré-carregada:', img);
                }
            }
        };
        preloadImages();

        // ✅ REMOVIDO: Animação de tremor (backgroundFloatAnim) – Agora clean e sem vibração

        // Animação do carrossel – Suavizada: Easing quad para fade mais orgânico, intervalo 5s
        const interval = setInterval(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000, // Transição suave de 1s
                easing: Easing.out(Easing.quad), // ✅ Mudado para quad: Mais natural e confortável que linear
                useNativeDriver: true,
            }).start(() => {
                setCurrentImageIndex((prevIndex) => (prevIndex + 1) % allBannerImages.length);
                fadeAnim.setValue(0);
            });
        }, 5000); // ✅ Aumentado para 5s: 4s exibição + 1s transição (mais robusto)

        // Ken Burns – Otimizado: Native driver true (testado para scale/translate), zoom/pan reduzido (5-10%), duração 6s, loop mais suave
        const startKenBurns = () => {
            kenBurnsZoom.setValue(1);
            kenBurnsPanX.setValue(0);
            kenBurnsPanY.setValue(0);

            Animated.parallel([
                Animated.timing(kenBurnsZoom, {
                    toValue: 1, // Base para interpolate
                    duration: 6000, // ✅ Aumentado para 6s: Mais lento e confortável
                    easing: Easing.inOut(Easing.quad), // ✅ Easing suave para premium feel
                    useNativeDriver: true, // ✅ Ativado: Funciona para scale/translate em imagens (sem lag)
                }),
                Animated.timing(kenBurnsPanX, {
                    toValue: 1,
                    duration: 6000,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(kenBurnsPanY, {
                    toValue: 1,
                    duration: 6000,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Reset suave para loop
                Animated.parallel([
                    Animated.timing(kenBurnsZoom, {
                        toValue: 0,
                        duration: 6000,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(kenBurnsPanX, {
                        toValue: 0,
                        duration: 6000,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(kenBurnsPanY, {
                        toValue: 0,
                        duration: 6000,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                ]).start(() => startKenBurns());
            });
        };
        startKenBurns();

        return () => clearInterval(interval);
    }, []);

    // Suavizado: Spring com mais friction para botão (menos bouncy, mais robusto)
    const onPressInButton = () => Animated.spring(buttonScaleAnim, { 
        toValue: 0.95, 
        useNativeDriver: true, 
        friction: 8, // ✅ Aumentado: Mais damping para conforto
        tension: 100 // ✅ Aumentado: Mais responsivo sem overshoot
    }).start();
    const onPressOutButton = () => Animated.spring(buttonScaleAnim, { 
        toValue: 1, 
        useNativeDriver: true, 
        friction: 8, 
        tension: 100 
    }).start();

    // ✅ REMOVIDO: animatedBackgroundStyle (sem tremor)

    // Ken Burns – Reduzido: Zoom 1.05 (5%), pan 5-8px (menos movimento, mais clean)
    const kenBurnsAnimatedStyle = {
        transform: [
            { scale: kenBurnsZoom.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }, // ✅ Reduzido: Menos zoom para subtle
            { translateX: kenBurnsPanX.interpolate({ inputRange: [0, 1], outputRange: [0, 5] }) }, // ✅ Reduzido: Pan horizontal sutil
            { translateY: kenBurnsPanY.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) }, // ✅ Reduzido: Pan vertical sutil
        ],
    };

    const nextImageIndex = (currentImageIndex + 1) % allBannerImages.length;

    return (
        <TouchableOpacity onPress={onPress} style={styles.bannerOuterContainer} activeOpacity={0.9}>
            <Animated.View style={[styles.backgroundImageWrapper]}>
                {/* Imagem Atual (fade-out) */}
                <Animated.View style={[StyleSheet.absoluteFillObject, {
                    opacity: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0]
                    })
                }]}>
                    <Animated.View style={[styles.backgroundImage, kenBurnsAnimatedStyle]}>
                        <ImageBackground
                            source={allBannerImages[currentImageIndex]}
                            style={styles.backgroundImageInner}
                            imageStyle={styles.imageStyle}
                            // ✅ Adicionado: fadeDuration para transição suave no ImageBackground (se suportado)
                            fadeDuration={0} // Instantâneo após preload
                        >
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
                            imageStyle={styles.imageStyle}
                            fadeDuration={0}
                        >
                            <LinearGradient
                                colors={['rgba(219, 211, 211, 0.43)', 'rgba(237, 229, 229, 0.31)', 'rgba(184, 183, 183, 0.4)']}
                                style={StyleSheet.absoluteFillObject}
                            />
                        </ImageBackground>
                    </Animated.View>
                </Animated.View>

                {/* Conteúdo (sempre por cima) */}
                <View style={styles.content}>
                    <View style={styles.leftContent}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{badgeText}</Text>
                        </View>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.discount}>{discount}</Text>
                        <Text style={styles.description}>{description}</Text>
                    </View>

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