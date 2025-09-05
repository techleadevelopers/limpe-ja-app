// LimpeJaApp/app/(client)/bookings/components/success/SuccessHeader.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Image, Animated, Easing } from 'react-native';

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
    // Animações para o logo
    const logoPulseAnim = useRef(new Animated.Value(1)).current;
    const logoRotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animação de pulso para o logo
        Animated.loop(
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
        ).start();

        // Animação de rotação sutil para o logo
        Animated.loop(
            Animated.timing(logoRotateAnim, {
                toValue: 1,
                duration: 15000, // Rotação lenta
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [logoPulseAnim, logoRotateAnim]);

  

    return (
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
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 10,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    logoImage: {
        width: 150,
        height: 50,
        top: 0,
        right: 5,
    },
});