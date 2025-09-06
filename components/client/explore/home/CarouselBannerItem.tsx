import React, { useRef, useEffect, useState } from 'react'; // Importado useState
import { View, Text, StyleSheet, TouchableOpacity, Animated, ImageBackground, Dimensions, Easing, Platform } from 'react-native'; // Importado Platform
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

        // Função de limpeza para parar o intervalo quando o componente for desmontado
        return () => clearInterval(interval);
    }, []); // Array de dependências vazio para rodar uma vez na montagem do componente

    const onPressInButton = () => Animated.spring(buttonScaleAnim, { toValue: 0.95, useNativeDriver: true, friction: 7 }).start();
    const onPressOutButton = () => Animated.spring(buttonScaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();

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
                    <ImageBackground
                        source={allBannerImages[currentImageIndex]}
                        style={styles.backgroundImage}
                        imageStyle={styles.imageStyle}
                    >
                        {/* Gradiente para escurecer a imagem e melhorar a legibilidade do texto */}
                        <LinearGradient
                            colors={['rgba(219, 211, 211, 0.43)', 'rgba(237, 229, 229, 0.31)', 'rgba(184, 183, 183, 0.4)']}
                            style={StyleSheet.absoluteFillObject}
                        />
                    </ImageBackground>
                </Animated.View>

                {/* Próxima Imagem (fade-in) */}
                <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}>
                    <ImageBackground
                        source={allBannerImages[nextImageIndex]}
                        style={styles.backgroundImage}
                        imageStyle={styles.imageStyle}
                    >
                        {/* Gradiente para escurecer a imagem e melhorar a legibilidade do texto */}
                        <LinearGradient
                            colors={['rgba(219, 211, 211, 0.43)', 'rgba(237, 229, 229, 0.31)', 'rgba(184, 183, 183, 0.4)']}
                            style={StyleSheet.absoluteFillObject}
                        />
                    </ImageBackground>
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
        width: Dimensions.get('window').width - (30 * 2),
        height: 180,
        borderRadius: 16,
        paddingLeft: 0,
        margin: 20,
        paddingHorizontal: 0,
        paddingTop: 46,
        paddingBottom: 16,
        overflow: 'hidden',
        marginBottom: -11,
        marginTop: -38,
        // Sombras avançadas e modernas
        ...Platform.select({
            ios: {
                shadowColor: '#000', // Cor da sombra (preto)
                shadowOffset: { width: 0, height: 10 }, // Deslocamento da sombra (10px para baixo)
                shadowOpacity: 0.12, // Opacidade da sombra (12% visível, para ser suave)
                shadowRadius: 15, // Raio de desfoque da sombra (15px para um efeito bem difundido)
            },
            android: {
                elevation: 12, // Elevação para Android (simula a profundidade da sombra)
            },
        }),
    },
    backgroundImageWrapper: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageStyle: {
        borderRadius: 20,
    },
    content: {
        ...StyleSheet.absoluteFillObject,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    leftContent: {
        flex: 1,
        justifyContent: 'space-between',
        height: '100%',
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 5,
        paddingVertical: 1,
        paddingHorizontal: 4,
        marginBottom: 0,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6692bdff',
    },
    title: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
        lineHeight: 22,
        marginBottom: 2,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    discount: {
        fontSize: 17,
        fontWeight: '900',
        color: 'white',
        top: 8,
        marginBottom: 5,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    description: {
        fontSize: 12,
        color: 'rgba(44, 138, 231, 0.8)',
        marginTop: 'auto',
    },
    button: {
        backgroundColor: 'white',
        borderRadius: 20,
        paddingVertical: 2,
        paddingHorizontal: 10,
        marginTop: 'auto',
    },
    buttonText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6973bfff',
    },
});

export default CarouselBannerItem;