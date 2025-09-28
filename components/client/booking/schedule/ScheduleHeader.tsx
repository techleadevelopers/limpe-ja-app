// LimpeJaApp/components/client/booking/schedule/ScheduleHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors } from '../../../../constants/appStyles'; // Removido AppShadows se não usado

const { width: SCREEN_WIDTH } = Dimensions.get('window'); // Removido height se não necessário

interface ScheduleHeaderProps {
    onBackPress: () => void;
    headerTitle: string;
    fadeAnim: Animated.Value;
    slideUpAnim: Animated.Value;
    onMenuPress?: () => void;
    showBackButton?: boolean;
}

const HEADER_TOP = Platform.OS === 'ios' ? 52 : 22;

const HERO_GRADIENT_START = '#FFFFFF';
const HERO_GRADIENT_MIDDLE = '#FFFFFF';
const HERO_GRADIENT_END = '#FFFFFF';

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
    onBackPress,
    headerTitle = 'Agendamento',
    fadeAnim,
    slideUpAnim,
    onMenuPress,
    showBackButton = true,
}) => {
    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}>
            <LinearGradient
                colors={[HERO_GRADIENT_START, HERO_GRADIENT_MIDDLE, HERO_GRADIENT_END]}
                start={{ x: 0.0, y: 0.0 }}
                end={{ x: 1.0, y: 1.0 }}
                style={styles.headerGradient}
            >
                {/* Removido o reflex animado completamente para eliminar efeitos visuais desnecessários */}
                
                <View style={{ height: HEADER_TOP }} />

                <View style={styles.headerRow}>
                    {showBackButton ? (
                        <TouchableOpacity
                            onPress={onBackPress}
                            style={styles.iconBtn}
                            // Removida animação de press (scale) para simplicidade e performance
                        >
                            <Ionicons name="chevron-back" size={24} color={AppColors.textBody} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.iconBtn} />
                    )}

                    <Text numberOfLines={1} style={styles.headerTitle}>
                        {headerTitle || 'Agendamento'}
                    </Text>

                    {onMenuPress ? (
                        <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress}>
                            <Ionicons name="ellipsis-vertical" size={24} color={AppColors.textBody} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.iconBtn} />
                    )}
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    headerGradient: {
        // Configurações otimizadas para produção: bordas arredondadas suaves, sombra cross-platform
        paddingBottom: 0,
        borderBottomLeftRadius: 34,
        borderBottomRightRadius: 34,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        paddingHorizontal: 20,
        width: '100%',
        left: 0,
        overflow: 'hidden',
        // Sombra cross-platform (iOS nativa, Android via elevation)
        shadowColor: '#000', // Cor neutra para produção
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4, // Equivalente Android
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 2,
        // Removido 'bottom: 15' para layout mais previsível; use padding/margin se necessário
        paddingHorizontal: 5,
    },
    iconBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        // Adicionado feedback tátil sutil sem animação (use activeOpacity no TouchableOpacity)
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        color: AppColors.textBody,
        fontSize: 16,
        fontWeight: '700',
        // Font family cross-platform otimizada (evita problemas de cursor/web)
        fontFamily: Platform.select({
            ios: 'System',
            android: 'sans-serif-medium', // Mais consistente no Android
        }),
        includeFontPadding: false, // Otimização para Android (evita padding extra)
    },
});

export default ScheduleHeader;