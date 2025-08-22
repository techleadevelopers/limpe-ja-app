// app/(client)/services/category/components/CategoryProviderCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ProviderDisplayInfo, ProviderServiceOffering } from '../types/backend/providers';
import { PricingType } from '../types/backend/services';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface CategoryProviderCardProps { // Renomeado para refletir o novo componente
    item: ProviderDisplayInfo;
    onPress: (prestadorId: string) => void;
}

const CategoryProviderCard: React.FC<CategoryProviderCardProps> = ({ item, onPress }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim]);

    const onPressInCard = () => {
        Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, friction: 8, tension: 100 }).start();
    };

    const onPressOutCard = () => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }).start();
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
                    color="#FFC107"
                    style={styles.starIcon}
                />
            );
        }
        return <View style={styles.starContainer}>{stars}</View>;
    };

    const primaryService = item.providerServices && item.providerServices.length > 0 ? item.providerServices[0] : null;
    const specialtyName = primaryService && primaryService.service ? primaryService.service.name : 'Serviço';

    const getPriceDisplay = () => {
        if (!primaryService) {
            return 'Consultar';
        }

        let priceValue;
        let priceUnit = '';

        const rawPrice = primaryService.price;
        const price = (typeof rawPrice === 'number') ? rawPrice : (rawPrice as any)?.toNumber?.() ?? 0;

        switch (primaryService.pricingType) {
            case PricingType.HOURLY:
                priceValue = price;
                priceUnit = '/h';
                break;
            case PricingType.BY_SIZE:
                priceValue = primaryService.pricePerSquareMeter;
                priceUnit = '/m²';
                break;
            case PricingType.FIXED_PRICE:
            case PricingType.CUSTOM_QUOTE:
            default:
                priceValue = price;
                priceUnit = '';
                break;
        }

        return priceValue !== undefined && priceValue !== null && priceValue > 0
            ? `R$ ${priceValue.toFixed(2).replace('.', ',')}${priceUnit}`
            : 'Consultar';
    };

    const servicePrice = getPriceDisplay();
    const avatarSource = item.avatarUrl ? { uri: item.avatarUrl } : require('/assets/images/default-avatar.png');

    return (
        <Animated.View style={[styles.animatedCardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            <TouchableOpacity
                style={styles.cardContainer}
                onPress={() => onPress(item.id)}
                onPressIn={onPressInCard}
                onPressOut={onPressOutCard}
                activeOpacity={0.8}
            >
                <View style={styles.imageWrapper}>
                    <Image source={avatarSource} style={styles.cardImage} />
                </View>
                <View style={styles.detailsContent}>
                    <Text style={styles.providerName} numberOfLines={1}>{item.fullName}</Text>
                    <Text style={styles.specialtyText} numberOfLines={1}>{specialtyName}</Text>
                    
                    {item.averageRating !== undefined && item.reviewCount !== undefined && (
                        <View style={styles.ratingRow}>
                            {renderStars(item.averageRating)}
                            {item.reviewCount > 0 && <Text style={styles.reviewsText}>({item.reviewCount})</Text>}
                        </View>
                    )}
                    <Text style={styles.priceText}>{servicePrice}</Text>
                </View>
                <TouchableOpacity style={styles.goButton}>
                    <Ionicons name="arrow-forward-sharp" size={20} color="#FFF" />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    animatedCardContainer: {
        // Removido width e marginRight para permitir que ocupe a largura total
        marginHorizontal: 0, // Garante que não há margem horizontal extra do próprio cartão
        marginBottom: 10, // Mantém o espaçamento vertical entre os cartões
        borderRadius: 12,
        overflow: 'visible',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    cardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, // Faz com que ocupe toda a largura disponível
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
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
    priceText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    goButton: {
        backgroundColor: '#1A73E8',
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

export default CategoryProviderCard;