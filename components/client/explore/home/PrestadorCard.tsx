import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View, Easing } from 'react-native';
import AnimatedReanimated, { Keyframe as ReKeyframe } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient'; // Adicionado para o efeito de fade na lateral
import { useTranslation } from 'react-i18next';

import { ProviderDisplayInfo } from '../../../../types/backend/providers';
import { useProviderMetrics } from '../../../../hooks/useProviderMetrics';
import { PricingType } from '../../../../types/backend/services';
import { Icons3D } from '../../../../constants/icons3d';
// Importar os novos formatadores e helpers
import { formatDistance } from '../../../../utils/formatters';
import { getFormattedServicePrice } from '../../../../utils/service-helpers';
import { AnalyticsService } from '../../../../services/analyticsService';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PrestadorCardProps {
    item: ProviderDisplayInfo;
    onPress: (prestadorId: string) => void;
}

const PrestadorCard: React.FC<PrestadorCardProps> = ({ item, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pulseScaleAnim = useRef(new Animated.Value(1)).current; // Novo Animated.Value só para o pulso do anel
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const { t } = useTranslation();
    const providerMetrics = useProviderMetrics(item.id);

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

    // Animação de pulso contínuo (só no anel, sem interferir no scale do card) - Ajustado para pulso mais sutil e menor (1.1 ao invés de 1.15)
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseScaleAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseScaleAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseScaleAnim]);

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

    // Distância: alinhar com RecomendacaoCard (sem injeâão __DEV__); fallback "0 km" quando ausente/<=0
    const distanceLabel = (typeof item.distance === 'number' && item.distance > 0)
        ? formatDistance(item.distance)
        : '0 km';

    // Track impression (fire-and-forget)
    useEffect(() => {
        if (item?.id) {
            AnalyticsService.trackEvent('home_prestador_card_impression', { providerId: item.id }).catch(() => {});
        }
    }, [item?.id]);

    // Efeito premium de aparição (inspirado em slide-in com leve rotate)
    const hash = (item?.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const side = (hash % 2 === 0) ? 1 : -1; // direita/esquerda alternado
    const amp = (hash % 3) + 1; // 1..3
    const initialRotate = `${side * (5 * amp)}deg`;
    const enteringKF = new ReKeyframe({
        0: { opacity: 0.0001, transform: [{ scale: 0.85 }, { rotate: initialRotate }, { translateY: 14 }] },
        100: { opacity: 1, transform: [{ scale: 1 }, { rotate: '0deg' }, { translateY: 0 }] },
    }).duration(520);

    return (
        <AnimatedReanimated.View entering={enteringKF}>
        <Animated.View style={[styles.animatedCardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            <TouchableOpacity
                style={styles.cardContainer}
                onPress={() => {
                    AnalyticsService.trackEvent('home_prestador_card_tap', { providerId: item.id }).catch(() => {});
                    onPress(item.id);
                }}
                onPressIn={onPressInCard}
                onPressOut={onPressOutCard}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >

                {/* NOVO: Micro-Pill de Localização/Distância (Sutil e Compacto, flutuando no canto superior direito) */}
                {distanceLabel && (
                    <View style={styles.distancePillSmall}>
                        <Ionicons name="location-outline" size={10} color="#5da2ecff" />
                        <Text style={styles.distancePillSmallText} numberOfLines={1} allowFontScaling={false}>
                            {distanceLabel}
                        </Text>
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
                        {/* Efeito de pulso premium (agora dentro do imageWrapper, partindo da borda da imagem) */}
                        <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseScaleAnim }] }]} />
                        <Image source={avatarSource} style={styles.cardImage} />
                    </View>
                </LinearGradient>

            </TouchableOpacity>
        </Animated.View>
        </AnimatedReanimated.View>
    );
};

const styles = StyleSheet.create({
    animatedCardContainer: {
        marginRight: 9,
        left: 2,
        top: 0,
        marginBottom: 11,
        marginTop: 12,
        borderRadius: 42,
        overflow: 'visible',
   
        borderColor: '#9cb6df53',
        borderBottomColor: '#9cb6df53',
        borderTopStartRadius: 42,
        borderBottomStartRadius: 42,
        borderTopEndRadius: 42,
        borderBottomEndRadius: 42,
    },
    cardContainer: {
        width: 76, // Reduzido para caber apenas a imagem (80 + padding mínimo)
        height: 76, // Quadrado para fundo redondo
        // Removido backgroundColor - agora gerenciado pelo LinearGradient
        borderRadius: 42, // Full round (metade da width/height)
        padding: 2, // Padding mínimo ao redor da imagem
        position: 'relative',
        marginTop: -4,
        marginBottom: -5,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible', // Garantir que o pulso e badges cresçam para fora sem corte
    },
    // NOVO ESTILO: Micro-Pill de Distância (Sutil e Compacto, flutuando no topo direito)
    distancePillSmall: {
        position: 'absolute',
        top: 69,
        right: -11,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 3,
        paddingVertical: 1,
        borderRadius: 8,
        maxWidth: '60%',
        overflow: 'hidden',
        ...Platform.select({
            ios: { backgroundColor: 'rgba(255,255,255,0.75)' }, // Blur/white 70-80%
            android: { backgroundColor: 'rgba(255,255,255,0.8)' },
        }),
        // sombra sutilíssima (shadowOpacity 0.06, elevation 2)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 2,
    },
    distancePillSmallText: {
        marginLeft: 1.5,
        fontSize: 8, // Fonte pequena para caber no card reduzido
        fontWeight: '600',
        color: '#334155',
    },
    // NOVO ESTILO: Overlay de gradiente para fade na lateral direita
    gradientOverlay: {
        width: '100%',
        height: '100%',
        borderRadius: 42,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Para manter o formato arredondado do gradiente
        position: 'relative',
    },
    imageWrapper: {
        width: 62,                // reduzido (antes 65)
        height: 62,
        borderRadius: 34,
        overflow: 'visible',
        backgroundColor: '#f8fbff', // tom neutro limpo de fundo
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.8,
        borderColor: 'rgba(230,240,255,0.9)',
        position: 'relative',
        zIndex: 1,
    },
    pulseRing: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 34, // mesmo arredondamento do imageWrapper/cardImage
        backgroundColor: 'transparent', // Fundo transparente para só mostrar a borda
        borderWidth: 0.8, // Ligeiramente mais grosso para visibilidade no pulso
        borderColor: '#5dcdeca1', // MESMA COR da borda da imagem, para harmonia perfeita
        shadowColor: '#5dbfecff', // Ajustado para matching com a cor da borda (glow verde-azulado translúcido)
        shadowOpacity: 0.4, // Aumentado para glow mais visível no pulso
        shadowRadius: 12, // Raio maior para efeito de expansão suave
        shadowOffset: { width: 0, height: 0 },
        elevation: 4, // Elevação Android para profundidade
        zIndex: 0, // Fica POR TRÁS da imagem (zIndex 2), iniciando coberto e expandindo para fora
    },
    // ESTILO ATUALIZADO: Badge de Verificação - Posicionado fora do gradient para visibilidade total, no canto inferior direito da imagem para UI premium limpa (evita conflito com distance pill no topo)
    verifiedBadgeOutside: { 
        position: 'absolute',
        bottom: 118, // Posicionado no inferior direito da imagem (espaçamento premium: 8px da borda)
        right: 8, // Alinhado perfeitamente com a borda direita do card/imagem
        zIndex: 20, // zIndex ainda mais alto para sobrepor tudo (incluindo gradient e pulse)
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Fundo branco semi-translúcido para premium clean UI
        borderRadius: 12, // Bordas mais arredondadas para look moderno e premium
        padding: 3, // Padding ligeiramente maior para espaçamento interno clean
        elevation: 6, // Sombra mais pronunciada no Android para profundidade
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15, // Sombra sutil mas visível para elevação premium
        shadowRadius: 4,
        // Borda sutil premium em todas as bordas do badge
        borderWidth: 0.5,
        borderColor: 'rgba(93, 162, 236, 0.3)', // Borda azul translúcida para harmonizar com o tema
      
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        marginBottom: 2,
        borderRadius: 34, // Ajustado para matching exato com imageWrapper (antes 40, agora 34 para clean)
        borderWidth: 1.5, // Simula o anel interno
        borderColor: '#2dc4c475', // Cor solicitada na borda da imagem
        zIndex: 2, // Acima do pulso para não interferir (pulso fica por trás)
    },
});

export default PrestadorCard;
