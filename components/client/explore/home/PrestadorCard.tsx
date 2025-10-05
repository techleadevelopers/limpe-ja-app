import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View, Easing } from 'react-native';
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
        const stars = [];
        const actualRating = rating ?? 0;
        const fullStars = Math.floor(actualRating);
        const hasHalfStar = actualRating % 1 !== 0;

        for (let i = 0; i < 5; i++) {
            let iconName: keyof typeof Ionicons.glyphMap = 'star-outline';
            if (i < fullStars) iconName = 'star';
            else if (hasHalfStar && i === fullStars) iconName = 'star-half';
            stars.push(
                <Ionicons
                    key={i}
                    name={iconName}
                    size={12}
                    color="#5da2ecff" // Mantendo o azul para consistência com o ícone de localização
                    style={styles.starIcon}
                />
            );
        }
        return <View style={styles.starContainer}>{stars}</View>;
    };

    const primaryService = item.providerServices && item.providerServices.length > 0 ? item.providerServices[0] : null;
    const specialtyName = primaryService && primaryService.service ? primaryService.service.name : 'Serviço';

    // Cálculo de distância
    const safeDistance = __DEV__ && item.distance == null ? 4000 : item.distance;
    const distanceLabel = formatDistance(safeDistance);

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

    return (
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
                {/* REMOVIDO: Renderiza a Distância/Localização no canto superior direito (absoluto) */}

                <View style={styles.imageWrapper}>
                    <Image source={avatarSource} style={styles.cardImage} />
                    {/* Selo Verificado: overlay discreto no avatar, cor azul */}
                    {item.verificationStatus === 'APPROVED' && (
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="shield-checkmark" size={12} color="#5da2ecff" />
                        </View>
                    )}
                </View>
                <View style={styles.detailsContent}>
                    <Text style={styles.providerName} numberOfLines={1} allowFontScaling={false}>{item.fullName}</Text>
                    <Text style={styles.specialtyText} numberOfLines={1} allowFontScaling={false}>{specialtyName}</Text>

                    {/* Linha de métricas (Aceitação, Tempo de Resposta e AGORA Distância Inline) */}
                    <View style={styles.metricsRow}>
                        {item.acceptanceRate != null && (
                            <>
                                <Text style={styles.metricText} allowFontScaling={false}>✓ {Math.round(item.acceptanceRate)}%</Text>
                                {/* Separador só se houver Tempo de Resposta OU Distância/Localização */}
                                {(item.averageResponseTime != null || distanceLabel || item.address?.city) && <Text style={styles.metricSep}> · </Text>}
                            </>
                        )}
                        
                        {item.averageResponseTime != null && (
                            <>
                                <Text style={styles.metricText} allowFontScaling={false}>⏱ {item.averageResponseTime} min</Text>
                                {/* Separador só se houver Distância/Localização E não for o primeiro item */}
                                {(distanceLabel || item.address?.city) && <Text style={styles.metricSep}> · </Text>}
                            </>
                        )}

                        {/* Distância inline (ou bairro·cidade como fallback) */}
                        {distanceLabel ? (
                            <View style={styles.metricInlineLoc}>
                                <Ionicons name="location-outline" size={10} color="#5da2ecff" />
                                <Text style={[styles.metricText, { marginLeft: 4 }]} allowFontScaling={false}>{distanceLabel}</Text>
                            </View>
                        ) : item.address?.city ? (
                            <Text style={styles.metricText} allowFontScaling={false}>
                                {item.address.neighborhood ? `${item.address.neighborhood} · ` : ''}{item.address.city}
                            </Text>
                        ) : null}
                    </View>

                    {item.averageRating !== undefined && item.reviewCount !== undefined && (
                        <View style={styles.ratingRow}>
                            {renderStars(item.averageRating)}
                            {item.reviewCount > 0 && <Text style={styles.reviewsText} allowFontScaling={false}>({item.reviewCount})</Text>}
                        </View>
                    )}
                    <View style={styles.priceRow}>
                        <Text style={styles.priceText} allowFontScaling={false}>{servicePrice}</Text>
                        {/* Chip Próximo Horário: ao lado do preço, condicional */}
                        {nextAvailableLabel && (
                            <Text style={styles.nextAvailableText} allowFontScaling={false}>{nextAvailableLabel}</Text>
                        )}
                    </View>
                </View>
          
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    animatedCardContainer: {
        marginRight: 12,
        marginBottom: 10,
        marginTop: 12,
        borderRadius: 44,
        overflow: 'visible',
        borderRightWidth: 1,
        borderBottomWidth: 1.5,
        borderLeftWidth: 1.1,
        borderTopWidth: 0.2,
        borderColor: '#9cb6df53',
        borderBottomColor: '#9cb6df53',
        borderTopStartRadius: 22,
        borderBottomStartRadius: 22,
        borderTopEndRadius: 22,
        borderBottomEndRadius: 22,
    },
    cardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 230,
        backgroundColor: 'rgba(213, 220, 230, 0.41)',
        borderRadius: 20, // Raio do card 20
        padding: 8, // Densidade maior (padding 8)
        position: 'relative',
    },
    // REMOVIDO: absoluteLocation
    
    imageWrapper: {
        width: 80, // Avatar maior: 64dp
        height: 80, // Avatar maior: 64dp
        borderRadius: 42,
        overflow: 'hidden',
        marginRight: 12,
        backgroundColor: '#E0E0E0',
        // Ring premium: 1.5dp branco + 0.5dp #E8EEF8
        borderWidth: 2, 
        borderColor: '#E8EEF8', 
        padding: 1, // Simula o anel interno branco
        position: 'relative', 
    },
    verifiedBadge: { 
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 2,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderRadius: 32, // Para garantir que a imagem se encaixe no anel
        borderWidth: 1.5, // Simula o anel interno branco
        borderColor: '#FFF',
    },
    detailsContent: {
        flex: 1,
        justifyContent: 'center',
    },
    providerName: {
        fontSize: 15,
        fontWeight: '600', // Nome (15/600)
        color: '#2C3E50',
        marginBottom: 2,
    },
    specialtyText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    // Estilos da linha de métricas (agora com distância inline)
    metricsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        marginBottom: 6,       
        flexWrap: 'wrap'
    },
    metricText: {
        fontSize: 10,
        color: '#555',
        fontWeight: '600', // Fonte 10/600
    },
    metricSep: {
        fontSize: 10,
        color: '#6C757D'
    },
    metricInlineLoc: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 6,
    },
    badge: {
        backgroundColor: '#E8EEF8',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 6,
        marginBottom: 6,
    },
    badgeText: {
        fontSize: 10,
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
        marginRight: 4,
    },
    starIcon: {
        marginRight: 1,
    },
    reviewsText: {
        fontSize: 10,
        color: '#888',
    },
    priceText: {
        fontSize: 15, // Preço grande (14--15/bold)
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
        marginLeft: 8,
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
