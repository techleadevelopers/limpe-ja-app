// LimpeJaApp/components/client/booking/schedule/ScheduleHeader.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../../../../constants/appStyles'; // Removido AppShadows se não usado

interface ScheduleHeaderProps {
    onBackPress: () => void;
    headerTitle: string;
    fadeAnim: Animated.Value;
    slideUpAnim: Animated.Value;
    onMenuPress?: () => void;
    // Removido showBackButton para forçar exibição sempre
}

const HEADER_TOP = Platform.OS === 'ios' ? 52 : 32;

const HERO_GRADIENT_START = '#FFFFFF';
const HERO_GRADIENT_MIDDLE = '#FFFFFF';
const HERO_GRADIENT_END = '#FFFFFF';

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
    onBackPress,
    headerTitle = 'Agendamento',
    fadeAnim,
    slideUpAnim,
    onMenuPress,
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
                    {/* Sempre exibe o botão de voltar, independentemente de steps */}
                    <TouchableOpacity
                        onPress={onBackPress}
                        style={styles.iconBtn}
                        // Removida animação de press (scale) para simplicidade e performance
                    >
                        <Ionicons name="arrow-back" size={24} color={AppColors.textBody} />
                    </TouchableOpacity>

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
        
        
        paddingHorizontal: 20,
        width: '100%',
        left: 0,
        overflow: 'hidden',
        // Sombra cross-platform (iOS nativa, Android via elevation)
        shadowColor: '#0000004b', // Cor neutra para produção
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 92,
        elevation: 0, // Equivalente Android
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
