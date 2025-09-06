import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // Importado Platform
import { useTranslation } from 'react-i18next';

import { CLIENT_ROUTES } from '../../../../constants/routes';
import { ProviderDisplayInfo } from '../../../../types/backend/providers';
import { Icons3D } from '../../../../constants/icons3d';
import { PricingType } from '../../../../types/backend/services';
import { ProviderServiceOffering } from '../../../../types/backend/provider-service';

interface RecomendacaoCardProps {
    item: ProviderDisplayInfo;
}

const RecomendacaoCard: React.FC<RecomendacaoCardProps> = ({ item }) => {
    const router = useRouter();
    const { t } = useTranslation();

    if (!item || !item.id || !item.fullName) {
        console.warn('[RecomendacaoCard] Item inválido ou incompleto. Render ignorado:', item);
        return null;
    }

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const onPressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
            friction: 8,
            tension: 100,
        }).start();
    };
    const onPressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
            tension: 100,
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
                    size={11}
                    color="#007AFF"
                    style={styles.ratingStarIcon}
                />
            );
        }
        return <View style={styles.ratingStarContainer}>{stars}</View>;
    };

    const handleCardPress = () => {
        try {
            router.push(CLIENT_ROUTES.PROVIDER_DETAILS(item.id));
        } catch (err) {
            console.error('[RecomendacaoCard] Erro ao navegar:', err);
        }
    };

    const avatarSource = item.avatarUrl
        ? { uri: item.avatarUrl }
        : require('../../../../assets/images/default-avatar.png');

    const formatServicePrice = (service: ProviderServiceOffering) => {
        let priceValue;
        let priceUnit = '';

        const rawPrice = service.price;
        const price = (typeof rawPrice === 'number') ? rawPrice : (rawPrice as any)?.toNumber?.() ?? 0;

        switch (service.pricingType) {
            case PricingType.HOURLY:
                priceValue = price;
                priceUnit = t('common.per_hour_short');
                break;
            case PricingType.BY_SIZE:
                const rawPricePerSqm = service.pricePerSquareMeter;
                const pricePerSqm = (typeof rawPricePerSqm === 'number') ? rawPricePerSqm : (rawPricePerSqm as any)?.toNumber?.() ?? 0;
                priceValue = pricePerSqm > 0 ? pricePerSqm : price;
                priceUnit = t('common.per_sqm_short');
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
            : t('provider_details.price_not_available');
    };

    const firstProviderService = item.providerServices && item.providerServices.length > 0
        ? item.providerServices[0]
        : undefined;

    const mainDisplayedPrice = firstProviderService
        ? formatServicePrice(firstProviderService)
        : t('provider_details.price_not_available');

    let minHourlyPrice: number | null = null;
    let mainPriceIsHourly = firstProviderService?.pricingType === PricingType.HOURLY;

    if (item.providerServices && item.providerServices.length > 0) {
        item.providerServices.forEach(service => {
            if (service.pricingType === PricingType.HOURLY) {
                let hourlyPrice = 0;
                if (service.price && typeof service.price === 'object' && 'toNumber' in service.price) {
                    hourlyPrice = (service.price as any).toNumber();
                } else if (typeof service.price === 'number') {
                    hourlyPrice = service.price;
                }

                if (hourlyPrice > 0) {
                    if (minHourlyPrice === null || hourlyPrice < minHourlyPrice) {
                        minHourlyPrice = hourlyPrice;
                    }
                }
            }
        });
    }

    const categoriesToDisplay: string[] = [];
    if (item.providerServices && item.providerServices.length > 0) {
        if (item.providerServices[0].service?.name) {
            categoriesToDisplay.push(item.providerServices[0].service.name);
        }
    }
    if (categoriesToDisplay.length === 0) {
        if (item.bio?.toLowerCase().includes('comercial')) categoriesToDisplay.push('Comercial');
        if (item.bio?.toLowerCase().includes('escritórios')) categoriesToDisplay.push('Escritório');
        if (categoriesToDisplay.length === 0) {
            categoriesToDisplay.push('Limpeza Geral');
        }
    }
    const displayedCategories = categoriesToDisplay.slice(0, 2);

    return (
        <Animated.View style={[styles.animatedCardContainer, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
                style={styles.cardContentWrapper}
                onPress={handleCardPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={0.8}
            >
                <View style={styles.imageWrapper}>
                    <Image source={avatarSource} style={styles.cardImage} />
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.providerNameContainer}>
                        <Text style={styles.providerName} numberOfLines={1}>{item.fullName}</Text>
                    </View>

                    <Text style={styles.serviceDescription} numberOfLines={2}>
                        {item.bio || "Nenhuma descrição disponível."}
                    </Text>

                    <View style={styles.categoryChipsContainer}>
                        {displayedCategories.map((category, index) => (
                            <View key={index} style={styles.categoryChip}>
                                {/* Conteúdo do chip de categoria, se houver */}
                            </View>
                        ))}
                    </View>

                    <View style={styles.priceAndRatingSection}>
                        <View>
                            <Text style={styles.priceLabel}>A partir de</Text>
                            <Text style={styles.priceValue}>{mainDisplayedPrice}</Text>

                            {minHourlyPrice !== null && !mainPriceIsHourly && (
                                <Text style={styles.hourlyPriceValue}>
                                    {t('common.or')} R$ {minHourlyPrice.toFixed(2).replace('.', ',')}/h
                                </Text>
                            )}
                        </View>

                        <View style={styles.ratingSection}>
                            <LinearGradient
                                colors={['#67adfdec', '#5c93ec','#5c93ec92']}
                                style={styles.plusButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="add" size={22} color="#ffffffc8" />
                            </LinearGradient>

                            {renderStars(item.averageRating)}
                            {item.reviewCount !== undefined && (
                                <Text style={styles.reviewsCountText}>
                                    {item.reviewCount === 0 ? 'Sem Avaliações' : `${item.reviewCount} Avaliações`}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    animatedCardContainer: {
        width: 170,
        marginRight: 15,
        marginBottom: 5,
        borderRadius: 12,
        overflow: 'visible',
        backgroundColor: '#FFFFFF',
        // Sombras avançadas e modernas para o card
        ...Platform.select({
            ios: {
                shadowColor: '#000', // Cor da sombra (preto)
                shadowOffset: { width: 0, height: 6 }, // Deslocamento da sombra (6px para baixo)
                shadowOpacity: 0.08, // Opacidade da sombra (8% visível, bem sutil)
                shadowRadius: 10, // Raio de desfoque da sombra (10px para um efeito difundido)
            },
            android: {
                elevation: 8, // Elevação para Android (simula a profundidade da sombra)
            },
        }),
    },
    cardContentWrapper: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    imageWrapper: {
        width: '100%',
        height: 100,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    infoContainer: {
        padding: 12,
    },
    providerNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    providerName: {
        fontSize: 14,
        fontFamily: 'Montserrat-Regular',
        paddingHorizontal: 0,
        fontWeight: 'bold',
        color: '#2D3748',
        flexShrink: 1,
    },
    docCheckIcon: {
        position: 'absolute',
        top: 2,
        right: 5,
        width: 30,
        height: 30,
        resizeMode: 'contain',
        zIndex: 1,
    },
    serviceDescription: {
        fontSize: 10,
        color: '#6C757D',
        marginBottom: 8,
    },
    metricText: {
        fontSize: 10,
        color: '#555',
        marginBottom: 2,
    },
    categoryChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: -40,
        marginTop: 5,
    },
    categoryChip: {
        backgroundColor: '#E6EEF9',
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 6,
        marginBottom: 4,
    },
    categoryChipText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#000000',
    },
    priceAndRatingSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: -10,
    },
    priceLabel: {
        fontSize: 10,
        color: '#6C757D',
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    hourlyPriceValue: {
        fontSize: 11,
        fontWeight: 'normal',
        color: '#6C757D',
        marginTop: 2,
    },
    ratingSection: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    plusButton: {
        width: 38,
        height: 38,
        left: 12,
        bottom: 48,
        borderRadius: 53,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#212223ff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    ratingStarContainer: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    ratingStarIcon: {
        marginRight: 1,
    },
    reviewsCountText: {
        fontSize: 8,
        color: '#6C757D',
    },
});

export default RecomendacaoCard;