import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated, Easing, Platform } from 'react-native';

interface SecurityInfoSectionProps {
    successColor: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SecurityInfoSection({ successColor }: SecurityInfoSectionProps) {
    const blueBackgroundColor = 'rgba(196, 240, 255, 0.84)';
    const blueBorderColor = 'rgba(74, 144, 226, 0.3)';

    // Animações de entrada
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        const entryAnim = Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: 700, // Atraso para aparecer depois dos botões de ação imediata
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(translateYAnim, {
                toValue: 0,
                duration: 500,
                delay: 700,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 500,
                delay: 700,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]);
        entryAnim.start();

        return () => entryAnim.stop();
    }, []);

    return (
        <Animated.View
            style={[
                styles.securitySection,
                {
                    backgroundColor: blueBackgroundColor,
                    borderColor: blueBorderColor,
                    width: SCREEN_WIDTH * 0.9, // Alinhado centralizado premium
                    alignSelf: 'center',
                    opacity: fadeAnim,
                    transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
                    marginHorizontal: Platform.OS === 'ios' ? 10 : 5, // Cross-platform
                }
            ]}
        >
            <Image
                source={require('../../../../assets/images/safe-icon.png')}
                style={styles.securityImage}
            />
            <Text style={styles.securityTextHeader} maxFontSizeMultiplier={1.2}>Sua Segurança é Nossa Prioridade</Text>
            <Text style={styles.securityText} maxFontSizeMultiplier={1.2} numberOfLines={5}>
                Para sua tranquilidade, todos os nossos prestadores passam por um rigoroso processo de
                **verificação de antecedentes** e o serviço está coberto por **seguro**.
                Sua avaliação pós-serviço é fundamental para mantermos a qualidade e a segurança da comunidade.
                Em caso de qualquer problema ou disputa, entre em contato com nosso suporte imediatamente.
            </Text>
            <Text style={styles.securityTextSmall} maxFontSizeMultiplier={1.2}>
                Seu agendamento foi registrado com segurança em nosso sistema.
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    securitySection: {
        marginTop: 20,
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 2,
    },
    securityImage: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
        marginBottom: 8,
    },
    securityTextHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    securityText: {
        fontSize: 11,
        color: '#555',
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: 10,
    },
    securityTextSmall: {
        fontSize: 10,
        color: '#777',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});