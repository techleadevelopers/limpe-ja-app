import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

interface ScheduleHeaderProps {
    onBackPress: () => void;
    headerTitle: string;
    fadeAnim: Animated.Value;
    slideUpAnim: Animated.Value;
}

const HEADER_TOP = Platform.OS === 'ios' ? 56 : 28;

// Constants for the gradient colors from HeaderSuperior.tsx
const HERO_GRADIENT_START = 'rgba(45, 108, 233, 0.7)';
const HERO_GRADIENT_MIDDLE = 'rgba(73, 127, 236, 0.9)';
const HERO_GRADIENT_END = 'rgba(45, 101, 232, 0.9)';

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({ onBackPress, headerTitle, fadeAnim, slideUpAnim }) => {
    // Shared values for the reflex animation from HeaderSuperior.tsx
    const reflexTranslateX = useSharedValue(-200);
    const reflexTranslateY = useSharedValue(-200);
    const reflexRotate = useSharedValue(0);

    // useEffect for the reflex animation from HeaderSuperior.tsx
    useEffect(() => {
        reflexTranslateX.value = withRepeat(
            withTiming(200, { duration: 4000, easing: Easing.linear }),
            -1,
            true
        );
        reflexTranslateY.value = withRepeat(
            withTiming(200, { duration: 4000, easing: Easing.linear }),
            -1,
            true
        );
        reflexRotate.value = withRepeat(
            withTiming(360, { duration: 8000, easing: Easing.linear }),
            -1,
            true
        );
    }, []);

    // Animated style for the reflex from HeaderSuperior.tsx
    const animatedReflexStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: reflexTranslateX.value },
            { translateY: reflexTranslateY.value },
            { rotateZ: `${reflexRotate.value}deg` },
        ],
    }));

    return (
        <Animated.View
            style={[
                { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
            ]}
        >
            {/* Barra superior em gradiente + borda inferior arredondada (mock-like) */}
            <LinearGradient
                // Updated colors, start, and end from HeaderSuperior.tsx
                colors={[HERO_GRADIENT_START, HERO_GRADIENT_MIDDLE, HERO_GRADIENT_END]}
                start={{ x: 0.0, y: 0.0 }}
                end={{ x: 1.0, y: 1.0 }}
                style={styles.headerGradient} // This style now includes properties from outerContainerGradient
            >
                {/* Animated Reflex from HeaderSuperior.tsx */}
                <Animated.View style={[styles.animatedReflex, animatedReflexStyle]}>
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0)']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.reflexGradient}
                    />
                </Animated.View>

                <View style={{ height: HEADER_TOP }} />

                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={onBackPress} style={styles.iconBtn}>
                        <Ionicons name="chevron-back" size={15} color="#fff" />
                    </TouchableOpacity>

                    <Text numberOfLines={1} style={styles.headerTitle}>{headerTitle}</Text>

                    <View style={styles.iconBtn}>
                        <Ionicons name="ellipsis-vertical" size={14} color="#fff" />
                    </View>
                </View>

                {/* Abas arredondadas (decorativas -- não quebram sua lógica) */}
                <View style={styles.tabsPill}>
                    <View style={[styles.tabItem, styles.tabItemGhost]}>
                        <Text style={styles.tabGhostText}>PONTOS</Text>
                    </View>
                    <View style={[styles.tabItem, styles.tabItemActive]}>
                        <Text style={styles.tabActiveText}>ROUND TRIP</Text>
                    </View>
                    <View style={[styles.tabItem, styles.tabItemGhost]}>
                        <Text style={styles.tabGhostText}>CUPONS</Text>
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    // Updated headerGradient to include properties from HeaderSuperior's outerContainerGradient
    headerGradient: {
        paddingBottom: -30 * 0.95, // Increased paddingBottom
        borderBottomLeftRadius: 44 * 0.95,
        borderBottomRightRadius: 44 * 0.95,
        borderTopLeftRadius: 4 * 0.95, // Added top radii
        borderTopRightRadius: 4 * 0.95, // Added top radii
        paddingHorizontal: 20, // Changed from 16 to 10
        marginBottom: -9 * 0.95, // Added marginBottom
        top: 6, // Added top
        width: '95%', // Added width
        left: 8,
        overflow: 'hidden', // Added overflow
        ...Platform.select({ // Updated shadow/elevation [2, 4, 5, 10, 11]
            ios: {
                shadowColor: 'rgba(0,0,0,0.2)',
                shadowOffset: { width: 0, height: 4 * 0.95 },
                shadowOpacity: 0.8,
                shadowRadius: 4 * 0.95,
            },
            android: {
                elevation: 8 * 0.95,
            },
        }),
    },
    // Styles for animated reflex from HeaderSuperior.tsx
    animatedReflex: {
        ...StyleSheet.absoluteFillObject, // [8]
        width: 200 * 0.95,
        height: 300 * 0.95,
        borderRadius: 150 * 0.95,
        opacity: 0.8,
    },
    reflexGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 150 * 0.95,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 12,
        bottom: 15,
        paddingHorizontal: 25,
    },
    iconBtn: {
        width: 2,
        height: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    },
    tabsPill: {
        marginTop: 6,
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.13)',
        borderRadius: 40,
        padding: 6,
        flexDirection: 'row',
        gap: 6,
        bottom: 20,
    },
    tabItem: {
        borderRadius: 40,
        paddingVertical: 3,
        paddingHorizontal: 6,
        
    },
    tabItemActive: { backgroundColor: '#fff' },
    tabActiveText: {
        color: '#2A72E7',
        fontWeight: '700',
        fontSize: 9,
    },
    tabItemGhost: { backgroundColor: 'transparent' },
    tabGhostText: {
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
        fontSize: 9,
    },
});

export default ScheduleHeader;