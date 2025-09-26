import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View, Easing } from 'react-native';
import { useTranslation } from 'react-i18next'; // Adicionar useTranslation

import { ProviderDisplayInfo } from '../../../../types/backend/providers';
import { PricingType } from '../../../../types/backend/services';
import { Icons3D } from '../../../../constants/icons3d';
// Importar os novos formatadores e helpers
import { formatDistance } from '../../../../utils/formatters';
import { getFormattedServicePrice } from '../../../../utils/service-helpers';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PrestadorCardProps {
    item: ProviderDisplayInfo;
    onPress: (prestadorId: string) => void;
}

const PrestadorCard: React.FC<PrestadorCardProps> = ({ item, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const { t } = useTranslation(); // Inicializar useTranslation

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
                    color="#1a7bbbff"
                    style={styles.starIcon}
                />
            );
        }
        return <View style={styles.starContainer}>{stars}</View>;
    };

    const primaryService = item.providerServices && item.providerServices.length > 0 ? item.providerServices[0] : null;
    const specialtyName = primaryService && primaryService.service ? primaryService.service.name : 'Serviço';

    // Usar o helper getFormattedServicePrice
    const servicePrice = primaryService ? getFormattedServicePrice(primaryService, t) : t('provider_details.price_not_available');
    const avatarSource = item.avatarUrl ? { uri: item.avatarUrl } : Icons3D.facial;

    // Usar o formatador para a distância
    const distanceLabel = formatDistance(item.distance);

    return (
        <Animated.View style={[styles.animatedCardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            <TouchableOpacity
                style={styles.cardContainer}
                onPress={() => onPress(item.id)}
                onPressIn={onPressInCard}
                onPressOut={onPressOutCard}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <View style={styles.imageWrapper}>
                    <Image source={avatarSource} style={styles.cardImage} />
                </View>
                <View style={styles.detailsContent}>
                    <Text style={styles.providerName} numberOfLines={1} allowFontScaling={false}>{item.fullName}</Text>
                    <Text style={styles.specialtyText} numberOfLines={1} allowFontScaling={false}>{specialtyName}</Text>

                    {distanceLabel && (
                        <View style={styles.distanceRow}>
                            <Ionicons name="location-outline" size={12} color="#888" />
                            <Text style={styles.distanceText} allowFontScaling={false}>{distanceLabel}</Text>
                        </View>
                    )}

                    {item.averageRating !== undefined && item.reviewCount !== undefined && (
                        <View style={styles.ratingRow}>
                            {renderStars(item.averageRating)}
                            {item.reviewCount > 0 && <Text style={styles.reviewsText} allowFontScaling={false}>({item.reviewCount})</Text>}
                        </View>
                    )}
                    <Text style={styles.priceText} allowFontScaling={false}>{servicePrice}</Text>
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
        borderBottomWidth: 5.5,
        borderLeftWidth: 5.1,
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
        width: 190,
        backgroundColor: 'rgba(213, 220, 230, 0.41)',
        borderRadius: 44,
        padding: 10,
    },
    imageWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        marginRight: 12,
        backgroundColor: '#E0E0E0',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    detailsContent: {
        flex: 1,
        justifyContent: 'center',
    },
    providerName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 2,
    },
    specialtyText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
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
    metricText: {
        fontSize: 10,
        color: '#555',
        marginBottom: 2,
    },
    priceText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#838891ff',
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
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    distanceText: {
        fontSize: 10,
        color: '#888',
        marginLeft: 4,
    },
});

export default PrestadorCard;