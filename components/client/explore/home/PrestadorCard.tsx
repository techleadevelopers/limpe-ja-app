import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View, Easing } from 'react-native';
import AnimatedReanimated, { Keyframe as ReKeyframe } from 'react-native-reanimated';
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

    // Helper para formatar próximo horário (discreto, baseado em data atual)
    const formatNextAvailable = (next: { date: string; time: string } | undefined): string | null => {
        if (!next) return null;
        const today = new Date();
        const nextDate = new Date(next.date);
        const diffDays = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        if (diffDays === 0) return `Hoje, ${next.time}`;
        if (diffDays === 1) return `Amanhã, ${next.time}`;
        return `${days[nextDate.getDay()]} ${next.time}`;
    };

    const renderStars = (rating: number | undefined) => {
        const actualRating = rating ?? 0;
        let iconName: keyof typeof Ionicons.glyphMap = 'star-outline';
        if (actualRating >= 4) iconName = 'star';
        else if (actualRating >= 3) iconName = 'star-half';
        return (
            <View style={styles.starContainer}>
                <Ionicons
                    name={iconName}
                    size={16}
                    color="#5da2ecff" // Mantendo o azul para consistência com o ícone de localização
                    style={styles.starIcon}
                />
            </View>
        );
    };

    const primaryService = item.providerServices && item.providerServices.length > 0 ? item.providerServices[0] : null;
    const specialtyName = primaryService && primaryService.service ? primaryService.service.name : 'Serviço';

    // Distância: alinhar com RecomendacaoCard (sem injeção __DEV__); fallback "0 km" quando ausente/<=0
    const distanceLabel = (typeof item.distance === 'number' && item.distance > 0)
        ? formatDistance(item.distance)
        : '0 km';

    // Label para próximo horário
    const nextAvailableLabel = formatNextAvailable(item.nextAvailable);

    // Usar o helper getFormattedServicePrice
    const servicePrice = primaryService ? getFormattedServicePrice(primaryService, t) : t('provider_details.price_not_available');
    const avatarSource = item.avatarUrl ? { uri: item.avatarUrl } : Icons3D.facial;

    // REMOVIDO: renderAbsoluteLocation()

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

                <View style={styles.imageWrapper}>
                    <Image source={avatarSource} style={styles.cardImage} />
                </View>

                {/* Selo Verificado: Movido para fora do imageWrapper, com zIndex alto para 100% visibilidade */}
                {item.verificationStatus === 'APPROVED' && (
                    <View style={styles.verifiedBadgeOutside}>
                        <Ionicons name="shield-checkmark" size={12} color="#5da2ecff" />
                    </View>

                    {/* Métricas mini: % aceitação e tempo de resposta (fallbacks para novos provedores) */}
                    <View style={styles.metricsRow}>
                        <Ionicons name="checkmark-done" size={12} color="#5da2ecff" />
                        <Text style={styles.metricText} allowFontScaling={false}>
                            {`${Math.round((item.acceptanceRate ?? (item as any)?.metrics?.acceptanceRate ?? providerMetrics.acceptanceRate ?? 1))}%`}
                        </Text>
                        <Text style={styles.metricSep}> · </Text>
                        <Ionicons name="time-outline" size={12} color="#5da2ecff" />
                        <Text style={styles.metricText} allowFontScaling={false}>
                            {`${(item.averageResponseTime ?? (item as any)?.metrics?.averageResponseTime ?? providerMetrics.averageResponseTime ?? 120)} min`}
                        </Text>
                    </View>
                )}

                <View style={styles.detailsContent}>
                    {/* Linha com nome e distância (distância movida para cá, acima da sugestão de horário) */}
                    <View style={styles.nameRow}>
                        <Text style={styles.providerName} numberOfLines={1} allowFontScaling={false}>{item.fullName}</Text>
                        {distanceLabel && (
                            <View style={styles.distancePill}>
                                <Ionicons name="location-outline" size={10} color="#5da2ecff" />
                                <Text style={styles.distancePillText} numberOfLines={1} allowFontScaling={false}>{distanceLabel}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.specialtyText} numberOfLines={1} allowFontScaling={false}>{specialtyName}</Text>

                    {/* Badges premium: Verificado, Top 10%, Resposta rápida (não-intrusivos) */}
                    <View style={styles.badgesRow}>
                        {typeof item.averageRating === 'number' && item.averageRating >= 4.7 && (item.reviewCount ?? 0) >= 25 && (
                            <View style={styles.badge}><Text style={styles.badgeText}>Top 10%</Text></View>
                        )}
                        {typeof item.averageResponseTime === 'number' && item.averageResponseTime > 0 && item.averageResponseTime <= 15 && (
                            <View style={styles.badge}><Text style={styles.badgeText}>Resposta rápida</Text></View>
                        )}
                        {item.backgroundCheckResult ? (
                            <View style={styles.badge}><Text style={styles.badgeText}>Segurança</Text></View>
                        ) : null}
                    </View>

                    {/* COMENTADO: Linha de métricas (Aceitação, Tempo de Resposta - sem distância, que foi movida) - Remove 1% e 180min da interface */}
                    {/* <View style={styles.metricsRow}>
                        {item.acceptanceRate != null && (
                            <>
                                <Text style={styles.metricText} allowFontScaling={false}>✓ {Math.round(item.acceptanceRate)}%</Text>
                                {/* Separador só se houver Tempo de Resposta */}
                                {/* {item.averageResponseTime != null && <Text style={styles.metricSep}> · </Text>} */}
                            {/* </> */}
                        {/* )} */}
                        
                        {/* {item.averageResponseTime != null && (
                            <Text style={styles.metricText} allowFontScaling={false}>⏱ {item.averageResponseTime} min</Text>
                        )} */}
                    {/* </View> */}

                    {/* COMENTADO: Próximo horário disponível (ex: "Dom 09:00") - Remove da interface */}
                    {/* {nextAvailableLabel && (
                        <View style={styles.ratingRow}>
                            <Text style={styles.nextAvailableText} allowFontScaling={false}>{nextAvailableLabel}</Text>
                        </View>
                    )} */}

                    <View style={styles.priceRow}>
                        <Text style={styles.priceText} allowFontScaling={false}>{servicePrice}</Text>
                        {item.averageRating !== undefined && item.reviewCount !== undefined && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                                {renderStars(item.averageRating)}
                                <Text style={styles.reviewsText} allowFontScaling={false}>{`${item.reviewCount ?? 0} Avaliações`}</Text>
                            </View>
                        )}
                    </View>
                </View>
          
            </TouchableOpacity>
        </Animated.View>
        </AnimatedReanimated.View>
    );
};

const styles = StyleSheet.create({
    animatedCardContainer: {
        marginRight: 12,
        marginBottom: 10,
        marginTop: 12,
        borderRadius: 64,
        overflow: 'visible',
        borderRightWidth: 1,
        borderBottomWidth: 1.5,
        borderLeftWidth: 1.1,
        borderTopWidth: 0.2,
        borderColor: '#9cb6df53',
        borderBottomColor: '#9cb6df53',
        borderTopStartRadius: 42,
        borderBottomStartRadius: 42,
        borderTopEndRadius: 42,
        borderBottomEndRadius: 42,
    },
    cardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 240,
        height: 60,
        backgroundColor: 'rgba(213, 220, 230, 0.41)',
        borderRadius: 40, // Raio do card 20
        padding: 4, // Densidade maior (padding 8)
        position: 'relative',
    },
    // REMOVIDO: distancePillTopRight (movido para inline com o nome)
    
    // Novo estilo para a linha do nome com distância inline (acima da sugestão de horário)
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    // Estilo do pill de distância (agora inline, sem absolute)
    distancePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        right: 8,
        marginLeft: 8, // Espaçamento à esquerda do nome
    },
    distancePillText: {
        marginLeft: 2,
        fontSize: 10,
        fontWeight: '600',
        color: '#334155',
    },
    
    imageWrapper: {
        width: 80, // Avatar maior: 64dp
        height: 80, // Avatar maior: 64dp
        borderRadius: 40,
        overflow: 'hidden',
        marginRight: 5,
        backgroundColor: '#c1d8f1ff',
        // Ring premium: 1.5dp branco + 0.5dp #E8EEF8
        borderWidth: 2, 
        borderColor: '#E8EEF8', 
        padding: 1, // Simula o anel interno branco
        position: 'relative', 
    },
    // REMOVIDO: verifiedBadge (antigo, dentro da imagem)
    verifiedBadgeOutside: { 
        position: 'absolute',
        top: 18, // Mesma posição relativa à imagem (ajustado para fora do container)
        left: 62, // Posição para sobrepor a imagem (após marginRight:12 da imageWrapper)
        zIndex: 10, // zIndex alto para ficar 100% acima do container
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 2,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
   
        marginBottom: 2,
        borderRadius: 42, // Para garantir que a imagem se encaixe no anel
        borderWidth: 1.5, // Simula o anel interno branco
        borderColor: '#FFF',
    },
    detailsContent: {
        flex: 1,
        justifyContent: 'center',
    },
    providerName: {
        fontSize: 14,
        fontWeight: '600', // Nome (15/600)
        color: '#2C3E50',
        flex: 1, // Para permitir que o nome ocupe o espaço disponível
    },
    specialtyText: {
        fontSize: 11,
        color: '#666',
        marginBottom: 2,
    },
    // Estilos da linha de métricas (agora com distância inline)
    metricsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        marginBottom: 0,       
        flexWrap: 'wrap'
        
    },
    metricText: {
        fontSize: 9,
        color: '#555',
        fontWeight: '600', // Fonte 10/600
    },
    metricSep: {
        fontSize: 9,
        color: '#6C757D'
    },
    // REMOVIDO: metricInlineLoc (movido para absolute no canto)
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 0,
    },
    badge: {
        backgroundColor: '#E8EEF8',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 3,
        marginRight: 6,
        marginBottom: 6,
    },
    badgeText: {
        fontSize: 9,
        color: '#2C3E50',
        fontWeight: '600',
    },
    // Fim dos estilos de métricas

    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    starContainer: {
        flexDirection: 'row',
        marginRight: 2,
    },
    starIcon: {
        marginRight: 1,
        bottom: 2,
    },
    reviewsText: {
        fontSize: 12,
        color: '#888',
        marginRight: 16,
        bottom: 2,
    },
    priceText: {
        fontSize: 14, // Preço grande (14--15/bold)
        fontWeight: 'bold',
        color: '#838891ff',
    },
    priceRow: { 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    nextAvailableText: { // Chip Próximo Horário
        fontSize: 10,
        color: '#6C757D',
        fontWeight: '600', // Fonte 10/600
        backgroundColor: 'rgba(255,255,255,0.5)', // Fundo branco 40--50%
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 8, // Borda-radius 8
        marginLeft: 0,
    },
    goButton: {
        backgroundColor: '#29a2e7b0',
        borderRadius: 25,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 15,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 4,
            },
        }),
    },
});

export default PrestadorCard;
