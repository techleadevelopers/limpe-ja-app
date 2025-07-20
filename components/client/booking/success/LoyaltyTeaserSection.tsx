// LimpeJaApp/app/(client)/bookings/components/success/LoyaltyTeaserSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface LoyaltyTeaserSectionProps {
    headerPrimaryColor: string; // Pode ser usado como base para um tom de azul no botão
}

export default function LoyaltyTeaserSection({ headerPrimaryColor }: LoyaltyTeaserSectionProps) {
    const gradientColors: [string, string] = ['#F0F8FF', '#E0F2FF'];
    const trophyColor = '#FFD700';
    const darkBlueButtonColor = '#2A72E7';
    const buttonGradientColors: [string, string] = ['#4A90E2', darkBlueButtonColor];

    return (
        <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loyaltyTeaserSection}
        >
            <Ionicons name="trophy-outline" size={35} color={trophyColor} style={styles.loyaltyIcon} /> {/* REDUZIDO: de 45 para 35 */}
            <Text style={styles.loyaltyTeaserTitle}>Seja um Cliente VIP!</Text>
            <Text style={styles.loyaltyTeaserText}>
                Quanto mais você agenda, mais benefícios exclusivos você desbloqueia.
                Deixe sua avaliação e comece a acumular pontos!
            </Text>
            <TouchableOpacity style={styles.learnMoreButton}>
                <LinearGradient
                    colors={buttonGradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.learnMoreButtonGradient}
                >
                    <Text style={styles.learnMoreButtonText}>Saiba Mais</Text>
                </LinearGradient>
            </TouchableOpacity>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    loyaltyTeaserSection: {
        borderRadius: 12, // REDUZIDO: de 16 para 12
        padding: 18, // REDUZIDO: de 25 para 18
        marginHorizontal: 15, // REDUZIDO: de 20 para 15
        marginTop: 20, // REDUZIDO: de 25 para 20
        alignItems: 'center',
        shadowColor: 'rgba(0, 50, 100, 0.2)',
        shadowOffset: { width: 0, height: 8 }, // REDUZIDO: de 10 para 8
        shadowOpacity: 0.12, // REDUZIDO: de 0.15 para 0.12
        shadowRadius: 15, // REDUZIDO: de 20 para 15
        elevation: 8, // REDUZIDO: de 10 para 8
        overflow: 'hidden',
        borderWidth: 0,
    },
    loyaltyIcon: {
        marginBottom: 10, // REDUZIDO: de 15 para 10
    },
    loyaltyTeaserTitle: {
        fontSize: 18, // REDUZIDO: de 22 para 18
        fontWeight: '800',
        color: '#222',
        marginBottom: 8, // REDUZIDO: de 10 para 8
        textAlign: 'center',
    },
    loyaltyTeaserText: {
        fontSize: 13, // REDUZIDO: de 15 para 13
        color: '#444',
        textAlign: 'center',
        lineHeight: 18, // REDUZIDO: de 22 para 18
        marginBottom: 15, // REDUZIDO: de 20 para 15
    },
    learnMoreButton: {
        borderRadius: 8, // REDUZIDO: de 10 para 8
        overflow: 'hidden',
        marginTop: 8, // REDUZIDO: de 10 para 8
        minWidth: 120, // REDUZIDO: de 150 para 120
    },
    learnMoreButtonGradient: {
        paddingVertical: 10, // REDUZIDO: de 14 para 10
        paddingHorizontal: 20, // REDUZIDO: de 25 para 20
        alignItems: 'center',
        justifyContent: 'center',
    },
    learnMoreButtonText: {
        color: '#FFFFFF',
        fontSize: 14, // REDUZIDO: de 16 para 14
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});