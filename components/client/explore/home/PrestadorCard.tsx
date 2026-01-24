import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Adicionado para o efeito de fade na lateral
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AnimatedReanimated, { Keyframe as ReKeyframe } from 'react-native-reanimated';
import { AppShadows } from '../../../../constants/appStyles'; // Ajuste o caminho conforme necessário
import { Icons3D } from '../../../../constants/icons3d';
import { ProviderDisplayInfo } from '../../../../types/backend/providers';
// Importar os novos formatadores e helpers
import { AnalyticsService } from '../../../../services/analyticsService';
import { formatDistance, getNextAvailableDate } from '../../../../utils/formatters';

interface PrestadorCardProps {
    item: ProviderDisplayInfo;
    onPress: (prestadorId: string) => void;
}


const getNextSlotLabel = (
    slot?: ProviderDisplayInfo['nextAvailable'] | ProviderDisplayInfo['nextSlot'],
): string | null => {
    const nextDate = getNextAvailableDate(slot);
    if (!nextDate) return null;
    const today = new Date();
    const todayStart = new Date(today);
    const slotStart = new Date(nextDate);
    todayStart.setHours(0, 0, 0, 0);
    slotStart.setHours(0, 0, 0, 0);
    const diffDays = Math.round((slotStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayLabel = diffDays === 0 ? 'Hoje' : diffDays === 1 ? 'Amanhã' : days[nextDate.getDay()] || 'Dia';
    const timeLabel = new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(nextDate);
    return `${dayLabel} · ${timeLabel}`;
};

const PrestadorCard: React.FC<PrestadorCardProps> = ({ item, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    // NOVO: Animated.Value que controla a animação de pulso/glow (0 -> 1 -> 0)
    const pulseAnim = useRef(new Animated.Value(0)).current; 
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    // Animação de entrada (fade e slide)
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim]);

    // Animação de pulso contínuo (do anel/glow)
    // 1. Usa a lógica fornecida para criar o loop 0 -> 1 -> 0
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                // Anima de 0 para 1 em 1500ms
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500, // Duração de crescimento do pulso
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                // Anima de 1 de volta para 0 em 1500ms
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 1500, // Duração de encolhimento do pulso
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    // 2. Interpolação para a opacidade do glow
    // Opacidade máxima de 0.5 no meio do ciclo.
    const glowOpacity = pulseAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.5, 0], 
    });

    // 3. Interpolação para a escala do glow
    // O anel cresce de 1 (tamanho normal) para 1.2 (120% do tamanho).
    const glowScale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.2],
    });

    const onPressInCard = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
            friction: 5,
            tension: 80,
        }).start();
    };

    const onPressOutCard = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
        }).start();
    };

    const avatarSource = item.avatarUrl ? { uri: item.avatarUrl } : Icons3D.facial;

    // Distância real vinda do backend (metros); sem fallback mock.
    const distanceLabel =
      typeof item.distance === 'number' && item.distance >= 0
        ? formatDistance(item.distance, undefined)
        : undefined;
    const nextSlotLabel = getNextSlotLabel(item.nextSlot ?? item.nextAvailable);

// Track impression (fire-and-forget)
    useEffect(() => {
        if (item?.id && item.id !== null) {
            AnalyticsService.trackEvent('home_prestador_card_impression', { providerId: item.id! }).catch(() => {});
        }
    }, [item?.id]);

    // Efeito premium de aparição (inspirado em slide-in com leve rotate)
    const enteringKF = new ReKeyframe({
        0: { opacity: 0.0001 },
        100: { opacity: 1 },
    }).duration(520);

    return (
        <AnimatedReanimated.View entering={enteringKF} style={styles.layoutWrapper}>
            {/* Layout wrapper keeps entering separate from the transform animations. */}
            <Animated.View style={[styles.animatedCardContainer,  { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity
                style={styles.cardContainer}
                onPress={() => {
                    if (item?.id && item.id !== null) {
                        AnalyticsService.trackEvent('home_prestador_card_tap', { providerId: item.id! }).catch(() => {});
                        onPress(item.id!);
                    }
                }}
                onPressIn={onPressInCard}
                onPressOut={onPressOutCard}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >

                {/* NOVO: Micro-Pill de Localização/Distância (Sutil e Compacto, flutuando no canto superior direito) */}
                {distanceLabel && (
                    <View style={styles.distancePillSmall}>
                        <View style={styles.distanceRow}>
                            <Ionicons name="location-outline" size={10} color="#5da2ecff" />
                            <Text style={styles.distancePillSmallText} numberOfLines={1} allowFontScaling={false}>
                                {distanceLabel}
                            </Text>
                        </View>
                        {nextSlotLabel && (
                            <Text style={styles.nextSlotText} numberOfLines={1} allowFontScaling={false}>
                                {nextSlotLabel}
                            </Text>
                        )}
                    </View>
                )}

                {/* Selo Verificado: Movido para fora do LinearGradient para evitar corte por overflow: hidden */}
                {item.verificationStatus === 'APPROVED' && (
                    <View style={styles.verifiedBadgeOutside}>
                        <Ionicons name="shield-checkmark" size={12} color="#5da2ecff" />
                    </View>
                )}

                {/* Adicionado: LinearGradient para o fade na lateral direita, degradando para '#F1F2F2' */}
                <LinearGradient
                    colors={['rgba(213, 220, 230, 0.41)', '#F1F2F2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientOverlay}
                >
                    <View style={styles.imageWrapper}>
                        {/* APLICANDO O EFEITO DE PULSO AQUI: usando a opacidade e escala interpoladas */}
                        <Animated.View 
                            style={[
                                styles.pulseRing, 
                                { 
                                    opacity: glowOpacity, 
                                    transform: [{ scale: glowScale }] 
                                }
                            ]} 
                        />
                        <Image source={avatarSource} style={styles.cardImage} />
                    </View>
                </LinearGradient>

            </TouchableOpacity>
            </Animated.View>
        </AnimatedReanimated.View>
    );
};

const styles = StyleSheet.create({
    layoutWrapper: {
        overflow: 'visible',
    },
    animatedCardContainer: {
        marginRight: Platform.OS === 'android' ? 19 : 13,
        left: Platform.OS === 'android' ? -1 : -15,
        top: 0,
        marginBottom: 8,
        marginTop: 12,
        borderRadius: 40,
        overflow: 'visible',
    
        // --- POLIMENTO APLICADO: SOMBRAS E BORDAS ---
        ...AppShadows.card, // Aplicando a Sombra Confortável
        
        // Removendo bordas complexas e redundantes para o look clean
        borderWidth: 0, 
        borderColor: 'transparent',
        borderBottomColor: 'transparent',
        
        borderTopStartRadius: 40,
        borderBottomStartRadius: 40,
        borderTopEndRadius: 40,
        borderBottomEndRadius: 40,
    },
    cardContainer: {
        width: 73,
        height: 73,
        borderRadius: 40,
        padding: 2,
        position: 'relative',
        marginTop: -4,
        marginBottom: -5,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible',
    },
    // NOVO ESTILO: Micro-Pill de Distância (Sutil e Compacto, flutuando no topo direito)
    distancePillSmall: {
        position: 'absolute',
        top: 69,
        right: -11,
        zIndex: 10,
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 5,
        borderRadius: 8,
        maxWidth: '70%',
        overflow: 'hidden',
        ...Platform.select({
            ios: { backgroundColor: 'rgba(255,255,255,0.75)' }, // Blur/white 70-80%
            android: { backgroundColor: 'rgba(255,255,255,0.8)' },
        }),
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    distancePillSmallText: {
        marginLeft: 3,
        fontSize: 8, // Fonte pequena para caber no card reduzido
        fontWeight: '600',
        color: '#334155',
    },
    nextSlotText: {
        marginTop: 1,
        fontSize: 7,
        fontWeight: '500',
        color: '#334155',
        opacity: 0.85,
    },
    // NOVO ESTILO: Overlay de gradiente para fade na lateral direita
    gradientOverlay: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Para manter o formato arredondado do gradiente
        position: 'relative',
    },
    imageWrapper: {
        width: 67,                // reduzido (antes 65)
        height: 67,
        borderRadius: 36.5,
        overflow: 'visible',
        backgroundColor: '#f1f2f1', // tom neutro limpo de fundo
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.8,
        borderColor: '#f1f2f1',
        position: 'relative',
        zIndex: 1,
    },
    pulseRing: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0, // Removido `bottom: 1` para cobrir o wrapper exatamente
        borderRadius: 34, // ⬅️ ATUALIZADO (Mesmo que o imageWrapper)
        backgroundColor: 'transparent',
        borderWidth: 1.5, // ⬅️ MELHORIA: Ligeiramente mais grosso (1.5) para mais presença no pulso
        borderColor: '#b9cfe9bd',
        shadowColor: '#356feeff',
        shadowOpacity: 0.5, // ⬅️ MELHORIA: Aumentado para glow mais visível
        shadowRadius: 15, // ⬅️ MELHORIA: Aumentado para expansão mais suave
        shadowOffset: { width: 0, height: 0 },
        elevation: 0, // Aumentado para Android
        zIndex: 0,
    },
    // ESTILO ATUALIZADO: Badge de Verificação - Posicionado fora do gradient para visibilidade total, no canto inferior direito da imagem para UI premium limpa (evita conflito com distance pill no topo)
    verifiedBadgeOutside: { 
        position: 'absolute',
        bottom: 118,
        right: 8,
        zIndex: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 3,

        
        
        // Limpando as propriedades de sombra e borda antigas
        elevation: 0, // Ajustado para ser sutil, mas visível
        shadowColor: 'transparent', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 3,
        borderWidth: 0, // Borda removida para look mais limpo
        borderColor: 'transparent',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        marginBottom: 2,
        borderRadius: 33,
        borderWidth: 1.5,
        borderColor: '#b9cfe9bd',
        zIndex: 2,
    },
});

export default PrestadorCard;
