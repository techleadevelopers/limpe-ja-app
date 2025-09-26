import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Easing, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    interpolate,
} from 'react-native-reanimated';
import { AppColors, AppShadows } from '../../../../constants/appStyles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ScheduleHeaderProps {
    onBackPress: () => void;
    headerTitle: string;
    fadeAnim: Animated.Value;
    slideUpAnim: Animated.Value;
    onMenuPress?: () => void;
    showBackButton?: boolean;
}

const HEADER_TOP = Platform.OS === 'ios' ? 52 : 22;

// Mudança para tema moderno premium: Gradiente leve de branco para cinza claro, alinhado ao fundo #FAFAFA
const HERO_GRADIENT_START = '#FFFFFF';
const HERO_GRADIENT_MIDDLE = '#FFFFFF';
const HERO_GRADIENT_END = '#FFFFFF';

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({ onBackPress, headerTitle, fadeAnim, slideUpAnim, onMenuPress, showBackButton = true }) => {
    const reflexTranslateX = useSharedValue(-SCREEN_WIDTH * 0.5);
    const reflexTranslateY = useSharedValue(-SCREEN_HEIGHT * 0.3);
    const reflexRotate = useSharedValue(0);

    const backButtonPressAnim = useRef(new Animated.Value(1)).current;

    const onBackPressIn = () => {
        Animated.spring(backButtonPressAnim, {
            toValue: 0.9,
            useNativeDriver: true,
            friction: 3,
            tension: 40,
        }).start();
    };

    const onBackPressOut = () => {
        Animated.spring(backButtonPressAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    useEffect(() => {
        // Manter a animação do reflex para um efeito sutil de brilho, mas adaptado ao tema claro
        reflexTranslateX.value = withRepeat(
            withTiming(SCREEN_WIDTH * 0.5, { duration: 4000, easing: Easing.linear }),
            -1, // -1 para repetição infinita
            true
        );
        reflexTranslateY.value = withRepeat(
            withTiming(SCREEN_HEIGHT * 0.3, { duration: 4000, easing: Easing.linear }),
            -1, // -1 para repetição infinita
            true
        );
        reflexRotate.value = withRepeat(
            withTiming(360, { duration: 8000, easing: Easing.linear }),
            -1, // -1 para repetição infinita
            true
        );
    }, []); // Dependências vazias para rodar apenas uma vez na montagem

    const animatedReflexStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            reflexTranslateX.value,
            [-SCREEN_WIDTH * 0.5, 0, SCREEN_WIDTH * 0.5],
            [0.05, 0.15, 0.05], // Opacidade reduzida para tema claro, efeito mais sutil
            'clamp'
        );

        return {
            transform: [
                { translateX: reflexTranslateX.value },
                { translateY: reflexTranslateY.value },
                { rotateZ: `${reflexRotate.value}deg` },
            ],
            opacity: opacity,
        };
    });

    return (
        <Animated.View
            style={[
                { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
            ]}
        >
            <LinearGradient
                colors={[HERO_GRADIENT_START, HERO_GRADIENT_MIDDLE, HERO_GRADIENT_END]} // Gradiente claro e premium
                start={{ x: 0.0, y: 0.0 }}
                end={{ x: 1.0, y: 1.0 }}
                style={styles.headerGradient}
            >
                {/* Reflex animado adaptado: Agora com gradiente sutil de branco para cinza claro */}
                <Animated.View style={[styles.animatedReflex, animatedReflexStyle]}>
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0)']} // Efeito de brilho mais sutil
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.reflexGradient}
                    />
                </Animated.View>

                <View style={{ height: HEADER_TOP }} />

                <View style={styles.headerRow}>
                    {showBackButton ? (
                        // ✅ Correção: Envolver TouchableOpacity em Animated.View para aplicar transformações
                        <Animated.View style={{ transform: [{ scale: backButtonPressAnim }] }}>
                            <TouchableOpacity
                                onPress={onBackPress}
                                style={styles.iconBtn}
                                onPressIn={onBackPressIn}
                                onPressOut={onBackPressOut}
                            >
                                <Ionicons name="chevron-back" size={24} color={AppColors.textBody} /> {/* Cor escura para tema claro */}
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        <View style={styles.iconBtn} />
                    )}

                    <Text numberOfLines={1} style={styles.headerTitle}>{headerTitle}</Text> {/* Título em cor escura */}

                    {onMenuPress ? (
                        <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress}>
                            <Ionicons name="ellipsis-vertical" size={24} color={AppColors.textBody} /> {/* Cor escura */}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.iconBtn} />
                    )}
                </View>

                {/* Removido o tabsPill com PONTOS, ROUND TRIP e CUPONS, deixando apenas o título e botão de volta */}
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    headerGradient: {
        paddingBottom: 0, // Mantido o padding, mas sem o bottom: 20 do tabsPill
        borderBottomLeftRadius: 34,
        borderBottomRightRadius: 34,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        paddingHorizontal: 20,
        width: '100%',
        left: 0,
        overflow: 'hidden',
                shadowColor: '#2f3344e8', // Cor da sombra
        shadowOffset: { width: 0, height: 1 }, // Deslocamento vertical mais pronunciado
        shadowOpacity: 0.17, // Opacidade aumentada para robustezs
        shadowRadius: 9, // Raio de desfoque para conforto
        elevation: 6, // Elevação aumentada para robustez no Android
    },
    animatedReflex: {
        ...StyleSheet.absoluteFillObject,
        width: SCREEN_WIDTH * 0.5,
        height: SCREEN_HEIGHT * 0.3,
        borderRadius: Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.25,
    },
    reflexGradient: {
        width: '100%',
        height: '100%',
        borderRadius: Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.25,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 2,
        bottom: 15,
        paddingHorizontal: 5,
    },
    iconBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        color: AppColors.textBody, // Cor escura para legibilidade no fundo claro
        fontSize: 16,
        fontWeight: '700',
        fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    },
    // Removidos todos os estilos relacionados ao tabsPill (tabItem, tabItemActive, tabActiveText, tabItemGhost, tabGhostText, tabsPill)
});

export default ScheduleHeader;