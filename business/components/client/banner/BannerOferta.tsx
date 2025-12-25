// LimpeJaApp/components/BannerOfertaIndividual.tsx
// Este é o componente que renderiza UM ÚNICO BANNER
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { Animated, Dimensions, ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // Added Dimensions import

// --- DEFINIÇÃO DA INTERFACE DE PROPS ATUALIZADA ---
// Mantemos a mesma interface que você tinha para um único banner.
export interface BannerOfertaIndividualProps {
    id: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    discountPercentage: number;

    onPress: (id: string) => void; // Passa o ID da oferta ao clicar

    bankName?: string;
    bankPaymentText?: string;
    buttonText?: string;
    disclaimer?: string;
    badgeTitle?: string;
    badgeDates?: string;
    backgroundColorStart?: string;
    backgroundColorEnd?: string;
}

const BannerOfertaIndividual: React.FC<BannerOfertaIndividualProps> = ({ 
    id,
    title,
    description,
    imageUrl,
    discountPercentage,
    onPress,
    bankName = "LIMPEJÁ",
    bankPaymentText = "Serviços de Qualidade",
    buttonText = "Aproveitar Oferta",
    disclaimer = "*Desconto aplicado no final do serviço. Consulte termos.",
    badgeTitle = `IMPERDÍVEL`,
    badgeDates = `ECONOMIZE ${discountPercentage}%`,
    backgroundColorStart = '#007BFF', // Azul vibrante
    backgroundColorEnd = '#0052B4',   // Azul mais escuro
}) => {
    // Animação para o botão
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;
    
    // As animações de entrada do banner (opacityAnim, translateYAnim)
    // serão movidas para o componente pai (o Carrossel) para controlar a transição
    // de cada slide, ou removidas se a FlatList já lidar com isso.
    // Neste caso, vamos assumir que o FlatList faz a rolagem suave.

    const onPressInButton = () => Animated.spring(buttonScaleAnim, { toValue: 0.95, useNativeDriver: true, friction: 7 }).start();
    const onPressOutButton = () => Animated.spring(buttonScaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();

    // Lógica para renderizar o fundo do banner
    const renderBackground = () => {
        if (imageUrl) {
            return (
                <ImageBackground source={{ uri: imageUrl }} style={styles.backgroundImage} imageStyle={styles.imageStyle}>
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
        <TouchableOpacity 
            style={styles.bannerOuterContainer} // Este será o estilo do card individual dentro do carrossel
            onPress={() => onPress(id)} // Passa o ID da oferta
            activeOpacity={0.9}
        >
            <View style={styles.bannerContainer}>
                {renderBackground()}

                {/* Lado Esquerdo do Banner: Informações da oferta */}
                <View style={styles.leftContent}>
                    <View style={styles.bankLogoContainer}>
                        <Text style={styles.bankName}>{bankName}</Text>
                        <Text style={styles.bankPaymentText}>{bankPaymentText}</Text>
                    </View>
                    <Text style={styles.titleText}>{title}</Text>
                    
                    {description && (
                        <Text style={styles.descriptionText}>{description}</Text>
                    )}

                    <Animated.View style={{ transform: [{ scale: buttonScaleAnim }], alignSelf: 'flex-start', marginTop: 10 }}>
                        <TouchableOpacity 
                            style={styles.availButton} 
                            onPress={() => onPress(id)} 
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
                        <View style={[styles.confetti, styles.confetti1]} />
                        <View style={[styles.confetti, styles.confetti2]} />
                        <View style={[styles.confetti, styles.confetti3]} />
                        <View style={[styles.confetti, styles.confetti4]} />
                        
                        <Ionicons name="pricetag-outline" size={36} color="#007BFF" />
                        <Text style={styles.badgeTitle}>{badgeTitle}</Text>
                        <Text style={styles.badgeDates}>{badgeDates}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

// --- ESTILOS DO COMPONENTE (Mantenha a maioria dos estilos aqui) ---
const styles = StyleSheet.create({
    bannerOuterContainer: {
        // Estes estilos definirão o tamanho de cada slide no carrossel
        width: Platform.OS === 'ios' ? Dimensions.get('window').width - 32 : Dimensions.get('window').width - 40, // Largura total - margens
        marginHorizontal: 8, // Margem entre os slides
        borderRadius: 16,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 0,
            },
        }),
    },
    bannerContainer: {
        flexDirection: 'row',
        minHeight: 160,
        alignItems: 'center',
        paddingHorizontal: 20,
        position: 'relative',
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageStyle: {
        borderRadius: 16,
    },
    leftContent: {
        flex: 1.5,
        height: '100%',
        justifyContent: 'space-between',
        paddingVertical: 15,
        zIndex: 1,
    },
    bankLogoContainer: {},
    bankName: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    bankPaymentText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 9,
        fontWeight: '600',
        letterSpacing: 0.8,
        marginTop: -2,
    },
    titleText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 24,
        maxWidth: '90%',
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    descriptionText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 5,
        maxWidth: '90%',
    },
    availButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 9,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 0,
            },
        }),
    },
    availButtonText: {
        color: '#0052B4',
        fontSize: 13,
        fontWeight: '700',
    },
    disclaimerText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 8,
        marginTop: 8,
        maxWidth: '95%',
    },
    rightContent: {
        flex: 0.7,
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingRight: 10,
        zIndex: 1,
    },
    badgeContainer: {
        width: 110,
        height: 110,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 15,
            },
            android: {
                elevation: 0,
            },
        }),
    },
    badgeTitle: {
        color: '#0052B4',
        fontSize: 14,
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
        width: 8,
        height: 14,
        borderRadius: 3,
    },
    confetti1: {
        backgroundColor: 'rgba(255,255,255,0.7)',
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

export default BannerOfertaIndividual;