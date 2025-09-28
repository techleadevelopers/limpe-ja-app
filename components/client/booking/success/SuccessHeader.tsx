// LimpeJaApp/app/(client)/bookings/components/success/SuccessHeader.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Image, Animated, Easing, SafeAreaView } from 'react-native';
import { AppDurations } from '../../../../constants/appStyles'; // Importar AppDurations

interface SuccessHeaderProps {
    successColor: string;
    headerPrimaryColor: string;
    headerSecondaryColor: string;
}

export default function SuccessHeader({
    successColor,
    headerPrimaryColor,
    headerSecondaryColor,
}: SuccessHeaderProps) {
    const logoPulseAnim = useRef(new Animated.Value(1)).current;
    const logoRotateAnim = useRef(new Animated.Value(0)).current; // Mantido para possível uso futuro, mas não usado diretamente no transform atual

    useEffect(() => {
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(logoPulseAnim, {
                    toValue: 1.03,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(logoPulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        const rotateLoop = Animated.loop(
            Animated.timing(logoRotateAnim, {
                toValue: 1,
                duration: 15000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        pulseLoop.start();
        rotateLoop.start();

        return () => {
            pulseLoop.stop();
            rotateLoop.stop();
        };
    }, [logoPulseAnim, logoRotateAnim]);

    return (
        <SafeAreaView style={styles.safeAreaHeader}> {/* Fix: SafeAreaView para iOS notch/status bar */}
            <View style={styles.headerContainer}>
                <Animated.Image
                    source={require('../../../../assets/images/logo2.png')}
                    style={[
                        styles.logoImage,
                        {
                            transform: [
                                { scale: logoPulseAnim },
                            ]
                        }
                    ]}
                    resizeMode="contain"
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeAreaHeader: {
        flex: 0,
        backgroundColor: 'transparent', // Mantém transparência
    },
    headerContainer: {
        paddingTop: Platform.OS === 'ios' ? 20 : 50, // Fix: Reduzido para iOS (SafeAreaView cuida do resto), mas ainda centraliza
        paddingBottom: 10,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        maxWidth: '100%', // Fix: Previne overflow lateral
    },
    logoImage: {
        width: 150,
        height: 50,
        // Remover tamanho fixo se a imagem precisar ser responsiva
        // Se a imagem for um SVG ou puder ser escalada, usar flex ou porcentagem
        // Ex: width: '80%', height: undefined, aspectRatio: 3,
    },
});