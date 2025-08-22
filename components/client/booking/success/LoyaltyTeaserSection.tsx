// LimpeJaApp/app/(client)/bookings/components/success/LoyaltyTeaserSection.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface LoyaltyTeaserSectionProps {
    headerPrimaryColor: string;
}

export default function LoyaltyTeaserSection({ headerPrimaryColor }: LoyaltyTeaserSectionProps) {
    const gradientColors: [string, string] = ['#F0F8FF', '#E0F2FF'];
    const trophyColor = '#FFD700';
    const darkBlueButtonColor = '#2A72E7';
    const buttonGradientColors: [string, string] = ['#4A90E2', darkBlueButtonColor];

    // Animações de entrada
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    // Animação para o botão "Saiba Mais"
    const learnMoreButtonScaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: 800, // Atraso para aparecer depois da seção de segurança
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(translateYAnim, {
                toValue: 0,
                duration: 500,
                delay: 800,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 500,
                delay: 800,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const onPressInLearnMoreButton = () => {
        Animated.spring(learnMoreButtonScaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const onPressOutLearnMoreButton = () => {
        Animated.spring(learnMoreButtonScaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View
            style={[
                styles.loyaltyTeaserSection,
                { opacity: fadeAnim, transform: [{ translateY: translateYAnim }, { scale: scaleAnim }] },
            ]}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />
            <Ionicons name="trophy-outline" size={35} color={trophyColor} style={styles.loyaltyIcon} />
            <Text style={styles.loyaltyTeaserTitle}>Seja um Cliente VIP!</Text>
            <Text style={styles.loyaltyTeaserText}>
                Quanto mais você agenda, mais benefícios exclusivos você desbloqueia.
                Deixe sua avaliação e comece a acumular pontos!
            </Text>
            <TouchableOpacity
                style={[styles.learnMoreButton, { transform: [{ scale: learnMoreButtonScaleAnim }] }]}
                onPressIn={onPressInLearnMoreButton}
                onPressOut={onPressOutLearnMoreButton}
            >
                <LinearGradient
                    colors={buttonGradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.learnMoreButtonGradient}
                >
                    <Text style={styles.learnMoreButtonText}>Saiba Mais</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    loyaltyTeaserSection: {
        borderRadius: 12,
        padding: 18,
        marginHorizontal: 15,
        marginTop: 20,
        alignItems: 'center',
        shadowColor: 'rgba(0, 50, 100, 0.2)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 15,
        elevation: 8,
        overflow: 'hidden',
        borderWidth: 0,
    },
    loyaltyIcon: {
        marginBottom: 10,
    },
    loyaltyTeaserTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#222',
        marginBottom: 8,
        textAlign: 'center',
    },
    loyaltyTeaserText: {
        fontSize: 13,
        color: '#444',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 15,
    },
    learnMoreButton: {
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 8,
        minWidth: 120,
    },
    learnMoreButtonGradient: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    learnMoreButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});