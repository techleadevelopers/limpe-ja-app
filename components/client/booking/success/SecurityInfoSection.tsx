import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated, Easing, Platform, AccessibilityInfo } from 'react-native';
import { AppColors, AppShadows } from '../../../../constants/appStyles'; // ✅ NOVO: AppColors e AppShadows para consistência premium

interface SecurityInfoSectionProps {
    successColor: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SecurityInfoSection({ successColor }: SecurityInfoSectionProps) {
    // ✅ AJUSTADO: Cores premium com AppColors (tint azul sutil da marca)
    const blueBackgroundColor = AppColors.backgroundLight + 'CC'; // Transparente clean
    const blueBorderColor = AppColors.primaryInteractive + '20'; // Borda sutil

    // Animações de entrada
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    // ✅ NOVO: ReduceMotion para A11y (pula animações se ativado)
    const reduceMotionRef = useRef(false);
    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
            reduceMotionRef.current = enabled;
        });
    }, []);

    useEffect(() => {
        // ✅ A11y: Pula animação se reduceMotion
        if (reduceMotionRef.current) return;

        const entryAnim = Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: 600, // ✅ AJUSTADO: Delay 600ms para sequência suave (era 700)
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(translateYAnim, {
                toValue: 0,
                duration: 500,
                delay: 600,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 500,
                delay: 600,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]);
        entryAnim.start();

        return () => entryAnim.stop();
    }, [fadeAnim, translateYAnim, scaleAnim]);

    return (
        <Animated.View
            style={[
                styles.securitySection,
                {
                    backgroundColor: blueBackgroundColor,
                    borderColor: blueBorderColor,
                    width: SCREEN_WIDTH * 0.92, // ✅ AJUSTADO: 92% para mais respiro (era 90%)
                    alignSelf: 'center',
                    opacity: fadeAnim,
                    transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
                    marginHorizontal: Platform.OS === 'ios' ? 12 : 8, // ✅ AJUSTADO: Mais centralizado cross-platform
                }
            ]}
        >
            <Image
                source={require('../../../../assets/images/safe-icon.png')}
                style={styles.securityImage}
                accessible={false} // ✅ A11y: Ícone decorativo
            />
            <Text style={styles.securityTextHeader} maxFontSizeMultiplier={1.2}>Sua Segurança é Nossa Prioridade</Text>
            {/* ✅ AJUSTADO: Texto encurtado e clean (3 linhas max, sem ** para bold — use fontWeight) */}
            <Text style={styles.securityText} maxFontSizeMultiplier={1.2} numberOfLines={3}>
                Nossos prestadores passam por verificação rigorosa de antecedentes e serviços com seguro incluso. 
                Sua avaliação mantém a qualidade. Em disputas, contate o suporte imediatamente.
            </Text>
            <Text style={styles.securityTextSmall} maxFontSizeMultiplier={1.2}>
                Agendamento registrado com segurança.
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    securitySection: {
        marginTop: 16, // ✅ AJUSTADO: de 20 para 16px (gap padrão premium)
        padding: 16, // ✅ AJUSTADO: Padding uniforme 16px (era 15)
        borderRadius: 12, // ✅ AJUSTADO: Mais arredondado (era 10)
        borderWidth: 1,
        alignItems: 'center',
        // ✅ PREMIUM: Sombra iOS-like com AppShadows (suave, sem poluir Android)
        ...AppShadows.medium,
    },
    securityImage: {
        width: 100, // ✅ REDUZIDO: de 120 para 100px (mais clean, menos dominante)
        height: 100,
        resizeMode: 'contain',
        marginBottom: 8, // ✅ Mantido, mas com padding ajustado
    },
    securityTextHeader: {
        // ✅ PREMIUM: Montserrat-SemiBold, size 16px (era 14), cor textBody
        fontSize: 16,
        fontFamily: 'Montserrat-SemiBold',
        fontWeight: '600',
        color: AppColors.textBody,
        marginBottom: 8,
        textAlign: 'center',
    },
    securityText: {
        // ✅ PREMIUM: Montserrat-Regular, size 13px (era 11), cor textAuxiliary, lineHeight 18px para legibilidade
        fontSize: 13,
        fontFamily: 'Montserrat-Regular',
        color: AppColors.textAuxiliary,
        textAlign: 'center',
        lineHeight: 18, // ✅ AJUSTADO: Mais espaçado para leitura premium
        marginBottom: 8, // ✅ REDUZIDO: de 10 para 8px
    },
    securityTextSmall: {
        // ✅ PREMIUM: Montserrat-Regular, size 11px (era 10), cor textAuxiliary, italic sutil
        fontSize: 11,
        fontFamily: 'Montserrat-Regular',
        color: AppColors.textAuxiliary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});