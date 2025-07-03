// LimpeJaApp/components/BannerOferta.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, ImageBackground, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Certifique-se de ter instalado: expo install expo-linear-gradient

// --- DEFINIÇÃO DA INTERFACE DE PROPS ATUALIZADA ---
export interface BannerOfertaProps {
    id: string;
    title: string;
    description?: string | null; // Tornar opcional e nulo
    imageUrl?: string | null;   // Tornar opcional e nulo
    discountPercentage: number; // Ex: 20 para 20%

    onPress: () => void; // Ação ao clicar no banner

    // Props opcionais para personalização
    bankName?: string;
    bankPaymentText?: string;
    buttonText?: string;
    disclaimer?: string;
    badgeTitle?: string;
    badgeDates?: string;
    // Novas props para controle de estilo/efeito
    backgroundColorStart?: string; // Cor inicial do gradiente de fundo
    backgroundColorEnd?: string;   // Cor final do gradiente de fundo
}

const BannerOferta: React.FC<BannerOfertaProps> = ({ 
    id,
    title,
    description,
    imageUrl,
    discountPercentage,
    onPress,
    bankName = "LIMPEJÁ", // Nome da sua marca
    bankPaymentText = "Serviços de Qualidade", // Mensagem mais relevante
    buttonText = "Aproveitar Oferta", // Texto do botão mais atrativo
    disclaimer = "*Desconto aplicado no final do serviço. Consulte termos.", // Disclaimer ajustado
    badgeTitle = `IMPERDÍVEL`, // Título do badge ajustado
    badgeDates = `ECONOMIZE ${discountPercentage}%`, // Datas substituídas por percentual
    backgroundColorStart = '#007BFF', // Azul vibrante
    backgroundColorEnd = '#0052B4',   // Azul mais escuro para o gradiente
}) => {
    const router = useRouter();

    // Animação para o botão "Aproveitar oferta" e o banner completo
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;
    const bannerOpacityAnim = useRef(new Animated.Value(0)).current; // Animação de entrada
    const bannerTranslateYAnim = useRef(new Animated.Value(20)).current; // Animação de entrada

    useEffect(() => {
        Animated.parallel([
            Animated.timing(bannerOpacityAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(bannerTranslateYAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const onPressInButton = () => Animated.spring(buttonScaleAnim, { toValue: 0.95, useNativeDriver: true, friction: 7 }).start();
    const onPressOutButton = () => Animated.spring(buttonScaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();

    // Lógica para renderizar o fundo do banner
    const renderBackground = () => {
        if (imageUrl) {
            return (
                <ImageBackground source={{ uri: imageUrl }} style={styles.backgroundImage} imageStyle={styles.imageStyle}>
                    {/* Gradiente de overlay para melhorar a legibilidade do texto */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)']}
                        style={StyleSheet.absoluteFillObject}
                    />
                </ImageBackground>
            );
        }
        return (
            <LinearGradient
                colors={[backgroundColorStart, backgroundColorEnd]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
        );
    };

    return (
        <Animated.View 
            style={[
                styles.animatedContainer, 
                { opacity: bannerOpacityAnim, transform: [{ translateY: bannerTranslateYAnim }] }
            ]}
        >
            <TouchableOpacity 
                style={styles.bannerOuterContainer} 
                onPress={onPress} 
                activeOpacity={0.9}
            >
                <View style={styles.bannerContainer}>
                    {renderBackground()} {/* Renderiza a imagem ou o gradiente de fundo */}

                    {/* Lado Esquerdo do Banner: Informações da oferta */}
                    <View style={styles.leftContent}>
                        <View style={styles.bankLogoContainer}>
                            <Text style={styles.bankName}>{bankName}</Text>
                            <Text style={styles.bankPaymentText}>{bankPaymentText}</Text>
                        </View>
                        <Text style={styles.titleText}>{title}</Text>
                        
                        {description && ( // Renderiza descrição se existir
                            <Text style={styles.descriptionText}>{description}</Text>
                        )}

                        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }], alignSelf: 'flex-start', marginTop: 10 }}>
                            <TouchableOpacity 
                                style={styles.availButton} 
                                onPress={onPress} 
                                onPressIn={onPressInButton}
                                onPressOut={onPressOutButton}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.availButtonText}>{buttonText}</Text>
                                <Ionicons name="arrow-forward-sharp" size={16} color="#0052B4" style={{marginLeft: 6}}/>
                            </TouchableOpacity>
                        </Animated.View>
                        <Text style={styles.disclaimerText}>{disclaimer}</Text>
                    </View>

                    {/* Lado Direito do Banner: Badge com informações de desconto */}
                    <View style={styles.rightContent}>
                        <View style={styles.badgeContainer}>
                            {/* Confetes (elementos decorativos visuais, cores mais suaves) */}
                            <View style={[styles.confetti, styles.confetti1]} />
                            <View style={[styles.confetti, styles.confetti2]} />
                            <View style={[styles.confetti, styles.confetti3]} />
                            <View style={[styles.confetti, styles.confetti4]} />
                            
                            <Ionicons name="pricetag-outline" size={36} color="#007BFF" /> {/* Ícone mais relevante */}
                            <Text style={styles.badgeTitle}>{badgeTitle}</Text>
                            <Text style={styles.badgeDates}>{badgeDates}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// --- ESTILOS DO COMPONENTE ---
const styles = StyleSheet.create({
    animatedContainer: {
        // Estilos para a animação de entrada do banner
    },
    bannerOuterContainer: {
        marginHorizontal: 16,
        marginTop: 24, // Um pouco mais de margem superior
        borderRadius: 16, // Bordas mais suaves
        overflow: 'hidden', // Importante para o borderRadius e imagem
        // Sombras suaves para profundidade
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    bannerContainer: {
        flexDirection: 'row',
        minHeight: 160, // Aumentar um pouco a altura para mais espaço
        alignItems: 'center',
        paddingHorizontal: 20, // Aumentar padding horizontal
        position: 'relative', // Para posicionar o background
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageStyle: {
        borderRadius: 16, // Aplicar border radius na imagem também
    },
    leftContent: {
        flex: 1.5, // Mais espaço para o conteúdo esquerdo
        height: '100%',
        justifyContent: 'space-between', // Distribuir melhor o conteúdo
        paddingVertical: 15, // Aumentar padding vertical
        zIndex: 1, // Garantir que o conteúdo fique acima do background
    },
    bankLogoContainer: {
        // Mantido conforme o design
    },
    bankName: {
        color: '#FFFFFF',
        fontSize: 20, // Fonte um pouco maior
        fontWeight: '700', // Mais negrito
        textShadowColor: 'rgba(0,0,0,0.3)', // Sombra no texto para contraste
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    bankPaymentText: {
        color: 'rgba(255,255,255,0.7)', // Cor mais suave
        fontSize: 9,
        fontWeight: '600',
        letterSpacing: 0.8, // Mais espaçamento entre letras
        marginTop: -2,
    },
    titleText: {
        color: '#FFFFFF',
        fontSize: 18, // Aumentar tamanho
        fontWeight: '800', // Mais negrito para o título
        lineHeight: 24,
        maxWidth: '90%', // Ajustar largura máxima
        textShadowColor: 'rgba(0,0,0,0.4)', // Sombra para contraste
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    descriptionText: { // NOVO: Estilo para a descrição
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 5,
        maxWidth: '90%',
    },
    availButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20, // Mais arredondado
        paddingVertical: 9, // Mais padding
        paddingHorizontal: 18, // Mais padding
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
        // Sombra leve no botão
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    availButtonText: {
        color: '#0052B4',
        fontSize: 13,
        fontWeight: '700', // Mais negrito
    },
    disclaimerText: {
        color: 'rgba(255,255,255,0.6)', // Cor mais suave
        fontSize: 8,
        marginTop: 8, // Aumentar margem
        maxWidth: '95%',
    },
    rightContent: {
        flex: 0.7, // Menos espaço para o conteúdo direito
        alignItems: 'flex-end', // Alinhar o badge à direita
        justifyContent: 'center',
        paddingRight: 10, // Um pouco de padding para o badge não colar na borda
        zIndex: 1, // Garantir que o conteúdo fique acima do background
    },
    badgeContainer: {
        width: 110, // Aumentar o tamanho do badge
        height: 110,
        borderRadius: 20, // Mais arredondado
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        // Sombra mais pronunciada para o badge flutuar
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 15,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    badgeTitle: {
        color: '#0052B4',
        fontSize: 14, // Fonte maior
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
    },
    badgeDates: {
        color: '#0052B4',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 4,
    },
    confetti: {
        position: 'absolute',
        width: 8, // Ajustar tamanho
        height: 14, // Ajustar tamanho
        borderRadius: 3, // Ajustar arredondamento
    },
    // Ajustar posições e cores dos confetes para serem mais integrados
    confetti1: {
        backgroundColor: 'rgba(255,255,255,0.7)', // Mais suave
        top: 10,
        right: 8,
        transform: [{ rotate: '45deg' }],
    },
    confetti2: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        bottom: 15,
        right: 12,
        transform: [{ rotate: '-30deg' }],
        width: 10,
        height: 10,
    },
    confetti3: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        bottom: 25,
        left: 6,
        transform: [{ rotate: '25deg' }],
        width: 7,
        height: 12,
    },
    confetti4: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        top: 18,
        left: 10,
        transform: [{ rotate: '-20deg' }],
    },
});

export default BannerOferta;