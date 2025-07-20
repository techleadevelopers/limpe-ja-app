// LimpeJaApp/components/DefaultBanner.tsx
// Este é o componente que renderiza um banner padrão com a mesma UI do BannerOfertaIndividual.

import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, ImageBackground, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// --- DEFINIÇÃO DA INTERFACE DE PROPS ---
// Simplificamos as props para um banner padrão
export interface DefaultBannerProps {
    onPress: () => void; // Ação ao clicar no banner
    // Você pode adicionar props opcionais aqui se quiser alguma customização mínima
    // Por exemplo: defaultTitle?: string; defaultDescription?: string;
}

const DefaultBanner: React.FC<DefaultBannerProps> = ({ 
    onPress,
}) => {
    // Animação para o botão (mantida para consistência visual)
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;
    
    const onPressInButton = () => Animated.spring(buttonScaleAnim, { toValue: 0.95, useNativeDriver: true, friction: 7 }).start();
    const onPressOutButton = () => Animated.spring(buttonScaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();

    // Valores padrão para o conteúdo do banner
    const defaultBankName = "LIMPEJÁ";
    const defaultBankPaymentText = "Qualidade e Confiança";
    const defaultTitle = "Seu Lar Brilhando!";
    const defaultDescription = "Agende serviços de limpeza e manutenção com os melhores profissionais.";
    const defaultButtonText = "Explorar Serviços";
    const defaultDisclaimer = "*Comece a transformar seu ambiente hoje mesmo!";
    const defaultBadgeTitle = "BEM-VINDO";
    const defaultBadgeDates = "Sempre aqui para você!";
    const defaultBackgroundColorStart = '#28a745'; // Verde para um visual de boas-vindas
    const defaultBackgroundColorEnd = '#218838';   // Verde mais escuro

    // O renderBackground aqui será sempre um LinearGradient, pois não temos imageUrl
    const renderBackground = () => {
        return (
            <LinearGradient
                colors={[defaultBackgroundColorStart, defaultBackgroundColorEnd]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
        );
    };

    return (
        <TouchableOpacity 
            style={styles.bannerOuterContainer}
            onPress={onPress} // Usa a função onPress passada por prop
            activeOpacity={0.9}
        >
            <View style={styles.bannerContainer}>
                {renderBackground()}

                {/* Lado Esquerdo do Banner: Informações padrão */}
                <View style={styles.leftContent}>
                    <View style={styles.bankLogoContainer}>
                        <Text style={styles.bankName}>{defaultBankName}</Text>
                        <Text style={styles.bankPaymentText}>{defaultBankPaymentText}</Text>
                    </View>
                    <Text style={styles.titleText}>{defaultTitle}</Text>
                    
                    <Text style={styles.descriptionText}>{defaultDescription}</Text>

                    <Animated.View style={{ transform: [{ scale: buttonScaleAnim }], alignSelf: 'flex-start', marginTop: 10 }}>
                        <TouchableOpacity 
                            style={styles.availButton} 
                            onPress={onPress} // Usa a função onPress passada por prop
                            onPressIn={onPressInButton}
                            onPressOut={onPressOutButton}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.availButtonText}>{defaultButtonText}</Text>
                            <Ionicons name="arrow-forward-sharp" size={16} color="#218838" style={{marginLeft: 6}}/> {/* Cor do ícone ajustada para combinar com o tema verde */}
                        </TouchableOpacity>
                    </Animated.View>
                    <Text style={styles.disclaimerText}>{defaultDisclaimer}</Text>
                </View>

                {/* Lado Direito do Banner: Badge com informações padrão */}
                <View style={styles.rightContent}>
                    <View style={styles.badgeContainer}>
                        <View style={[styles.confetti, styles.confetti1]} />
                        <View style={[styles.confetti, styles.confetti2]} />
                        <View style={[styles.confetti, styles.confetti3]} />
                        <View style={[styles.confetti, styles.confetti4]} />
                        
                        <Ionicons name="home-outline" size={36} color="#28a745" /> {/* Ícone ajustado para um tema de boas-vindas/casa */}
                        <Text style={styles.badgeTitle}>{defaultBadgeTitle}</Text>
                        <Text style={styles.badgeDates}>{defaultBadgeDates}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

// --- ESTILOS DO COMPONENTE (Copiados e ajustados do BannerOfertaIndividual) ---
const styles = StyleSheet.create({
    bannerOuterContainer: {
        width: Platform.OS === 'ios' ? Dimensions.get('window').width - 32 : Dimensions.get('window').width - 40,
        marginHorizontal: 8,
        borderRadius: 16,
        overflow: 'hidden',
        // Adicionando margem inferior para espaçamento na index.tsx
        marginBottom: 20, 
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
                elevation: 3,
            },
        }),
    },
    availButtonText: {
        color: '#218838', // Cor ajustada
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
                elevation: 12,
            },
        }),
    },
    badgeTitle: {
        color: '#28a745', // Cor ajustada
        fontSize: 14,
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
    },
    badgeDates: {
        color: '#28a745', // Cor ajustada
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

export default DefaultBanner;