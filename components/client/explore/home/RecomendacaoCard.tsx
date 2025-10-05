

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AnimatedReanimated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    withSequence,
    cancelAnimation,
    withDelay
} from 'react-native-reanimated';

import { CLIENT_ROUTES } from '../../../../constants/routes';
import { ProviderDisplayInfo } from '../../../../types/backend/providers';
import { Icons3D } from '../../../../constants/icons3d';
import { PricingType } from '../../../../types/backend/services';
import { ProviderServiceOffering } from '../../../../types/backend/provider-service';
// Importar os novos formatadores e helpers
import { formatDistance } from '../../../../utils/formatters';
import { getFormattedServicePrice, getNumericPriceValue } from '../../../../utils/service-helpers';

const AnimatedCardBackground = AnimatedReanimated.createAnimatedComponent(LinearGradient);
const AnimatedPlusButtonGradient = AnimatedReanimated.createAnimatedComponent(LinearGradient);

interface RecomendacaoCardProps {
    item: ProviderDisplayInfo;
}

const RecomendacaoCard: React.FC<RecomendacaoCardProps> = ({ item }) => {
    const router = useRouter();
    const { t } = useTranslation();

    if (!item || !item.id || !item.fullName) {
        console.warn('[RecomendacaoCard] Item invÃ¡lido ou incompleto. Render ignorado:', item);
        return null;
    }

    // CORRIGIDO: Use Reanimated para scale (compatÃ­vel com AnimatedCardBackground)
    const hoverScale = useSharedValue(1); // SharedValue do Reanimated para scale

    const onPressInCard = () => {
        hoverScale.value = withTiming(1.03, { duration: 200, easing: Easing.out(Easing.ease) });
    };

    const onPressOutCard = () => {
        hoverScale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
    };

    // Estilo animado para scale - CORRIGIDO: Usa interpolate implÃ­cito via useAnimatedStyle para nÃºmero puro
    const hoverScaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: hoverScale.value }], // Garante nÃºmero puro (Reanimated extruda automaticamente)
    }));

    const reflectionTranslateX = useSharedValue(-60);

    useEffect(() => {
        reflectionTranslateX.value = withRepeat(
            withTiming(38 + 60, {
                duration: 1500,
                easing: Easing.linear
            }),
            -1,
            false
        );
    }, []);

    const animatedReflectionStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: reflectionTranslateX.value }],
        };
    });

    const subtleTrembleValue = useSharedValue(0);

    useEffect(() => {
        const SHAKE_AMOUNT = 0.5;
        const SHAKE_DURATION = 50;

        subtleTrembleValue.value = withRepeat(
            withSequence(
                withTiming(SHAKE_AMOUNT, { duration: SHAKE_DURATION, easing: Easing.linear }),
                withTiming(-SHAKE_AMOUNT, { duration: SHAKE_DURATION, easing: Easing.linear }),
                withTiming(0, { duration: SHAKE_DURATION, easing: Easing.linear }),
                withTiming(0, { duration: 4000, easing: Easing.linear })
            ),
            -1,
            false
        );

        return () => {
            cancelAnimation(subtleTrembleValue);
        };
    }, []);

    const subtleTrembleAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: subtleTrembleValue.value },
                { translateY: subtleTrembleValue.value },
            ],
        };
    });

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
                    size={13}
                    color="#5da2ecff"
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

    // --- LÃ³gica para determinar o serviÃ§o principal a ser exibido como "A partir de" ---
    let mainServiceForDisplay: ProviderServiceOffering | undefined = undefined;
    let lowestFixedPrice: number | null = null;

    if (item.providerServices && item.providerServices.length > 0) {
        item.providerServices.forEach(service => {
            if (service.pricingType === PricingType.FIXED_PRICE) {
                const currentPrice = getNumericPriceValue(service);
                if (currentPrice > 0 && (lowestFixedPrice === null || currentPrice < lowestFixedPrice)) {
                    lowestFixedPrice = currentPrice;
                    mainServiceForDisplay = service;
                }
            }
        });

        if (!mainServiceForDisplay) {
            mainServiceForDisplay = item.providerServices[0];
        }
    }

    // Formata a string do preÃ§o principal a ser exibida usando o helper
    const mainDisplayedPrice = mainServiceForDisplay
        ? getFormattedServicePrice(mainServiceForDisplay, t)
        : t('provider_details.price_not_available');

    // ObtÃ©m o valor numÃ©rico do preÃ§o principal para comparaÃ§Ãµes futuras
    const numericMainPrice = mainServiceForDisplay ? getNumericPriceValue(mainServiceForDisplay) : null;

    // --- Calcula menor preÃ§o por hora entre todos os serviÃ§os ---
    let minHourlyPrice: number | null = null;
    if (item.providerServices && item.providerServices.length > 0) {
        item.providerServices.forEach(service => {
            if (service.pricingType === PricingType.HOURLY) {
                const hourlyPrice = getNumericPriceValue(service);
                if (hourlyPrice > 0) {
                    if (minHourlyPrice === null || hourlyPrice < minHourlyPrice) {
                        minHourlyPrice = hourlyPrice;
                    }
                }
            }
        });
    }

    const mainPriceIsExplicitlyHourly = mainServiceForDisplay?.pricingType === PricingType.HOURLY;

    const shouldShowMinHourlyPrice = typeof minHourlyPrice === 'number' && minHourlyPrice > 0 && (
        !mainPriceIsExplicitlyHourly ||
        (mainPriceIsExplicitlyHourly && numericMainPrice !== null && minHourlyPrice < numericMainPrice)
    );

    const categoriesToDisplay: string[] = [];
    if (item.providerServices && item.providerServices.length > 0) {
        if (mainServiceForDisplay?.service?.name) {
            categoriesToDisplay.push(mainServiceForDisplay.service.name);
        } else if (item.providerServices[0].service?.name) {
            categoriesToDisplay.push(item.providerServices[0].service.name);
        }
    }
    if (categoriesToDisplay.length === 0) {
        if (item.bio?.toLowerCase().includes('comercial')) categoriesToDisplay.push('Comercial');
        else if (item.bio?.toLowerCase().includes('escritÃ³rios')) categoriesToDisplay.push('EscritÃ³rio');
        else {
            categoriesToDisplay.push('Limpeza Geral');
        }
    }
    const displayedCategories = categoriesToDisplay.slice(0, 2);

    // Formatar a distÃ¢ncia
    const distanceLabel = formatDistance(item.distance);

    return (
        // CORRIGIDO: Aplica hoverScaleStyle (Reanimated) ao AnimatedCardBackground para compatibilidade
        <AnimatedCardBackground
            colors={['rgba(230, 240, 255, 0.7)', 'rgba(196, 197, 205, 0.23)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.animatedCardContainer, hoverScaleStyle]} // Usa Reanimated style para scale nÃºmero puro
        >
            <TouchableOpacity
                style={styles.cardContentWrapper}
                onPress={handleCardPress}
                onPressIn={onPressInCard}
                onPressOut={onPressOutCard}
                activeOpacity={1}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <View style={styles.imageWrapper}>
                    <Image source={avatarSource} style={styles.cardImage} />
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.providerNameContainer}>
                        <Text style={styles.providerName} numberOfLines={1} allowFontScaling={false}>{item.fullName}</Text>
                    </View>

                    <Text style={styles.serviceDescription} numberOfLines={2} allowFontScaling={false}>
                        {item.bio || "Nenhuma descriÃ§Ã£o disponÃ­vel."}
                    </Text>

                    {distanceLabel && (
                        <View style={styles.distanceRow}>
                            <Ionicons name="location-outline" size={12} color="#6C757D" />
                            <Text style={styles.distanceText} allowFontScaling={false}>{distanceLabel}</Text>
                        </View>
                    )}

                    <View style={styles.categoryChipsContainer}>
                        {displayedCategories.map((category, index) => (
                            <View key={index} style={styles.categoryChip}>
                                {/* ConteÃºdo do chip de categoria, se houver */}
                            </View>
                        ))}
                    </View>

                    <View style={styles.priceAndRatingSection}>
                        <View>
                            <Text style={styles.priceLabel} allowFontScaling={false}>A partir de</Text>
                            <Text style={styles.priceValue} allowFontScaling={false}>{mainDisplayedPrice}</Text>

                            {shouldShowMinHourlyPrice && (
                                <Text style={styles.hourlyPriceValue} allowFontScaling={false}>
                                    {t('common.or')} {getFormattedServicePrice({
                                        // Usar o operador de asserÃ§Ã£o nÃ£o-nula (!) em minHourlyPrice
                                        price: minHourlyPrice!,
                                        pricingType: PricingType.HOURLY,
                                        // Incluir outras propriedades obrigatÃ³rias da interface ProviderServiceOffering
                                        // com valores fictÃ­cios se elas nÃ£o forem usadas por getFormattedServicePrice
                                        id: '', // Exemplo: se 'id' for obrigatÃ³rio
                                        providerId: '', // Exemplo: se 'providerId' for obrigatÃ³rio
                                        serviceId: '', // Exemplo: se 'serviceId' for obrigatÃ³rio
                                    } as ProviderServiceOffering, t)}
                                </Text>
                            )}
                        </View>

                        <View style={styles.ratingSection}>
                            <AnimatedPlusButtonGradient
                                colors={['#73c5f5ff', '#70c0eeee','#4fade4ff']}
                                style={[styles.plusButton, { overflow: 'hidden' }, subtleTrembleAnimatedStyle]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <AnimatedReanimated.View style={[styles.reflectionOverlay, animatedReflectionStyle]}>
                                    <LinearGradient
                                        colors={['transparent', 'rgba(255,255,255,0.7)', 'transparent']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={StyleSheet.absoluteFillObject}
                                    />
                                </AnimatedReanimated.View>
                                <Ionicons name="add" size={22} color="#ffffffc8" />
                            </AnimatedPlusButtonGradient>

                            {renderStars(item.averageRating)}
                            {item.reviewCount !== undefined && (
                                <Text style={styles.reviewsCountText} allowFontScaling={false}>
                                    {item.reviewCount === 0 ? 'Sem AvaliaÃ§Ãµes' : `${item.reviewCount} AvaliaÃ§Ãµes`}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </AnimatedCardBackground>
    );
};

const styles = StyleSheet.create({
    animatedCardContainer: {
        width: 190,
        height: 270,
        marginRight: 15,
        marginBottom: 5,
        marginTop: 8,
        overflow: 'hidden',
        borderRightWidth: 1,
        borderBottomWidth: 0.5,
        borderLeftWidth: 1,
        borderTopWidth: 1,
        borderColor: '#d1d5db53',
        borderRadius: 12,
        borderTopStartRadius: 22,
        borderBottomStartRadius: 22,
        borderTopEndRadius: 22,
        borderBottomEndRadius: 22,
        borderBottomColor: '#d1d5db53',
    },
    cardContentWrapper: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        zIndex: 1,
    },
    imageWrapper: {
        width: '100%',
        height: 120,
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
        fontSize: 16,
        fontFamily: 'Montserrat-Regular',
        paddingHorizontal: 0,
        fontWeight: '700',
        color: '#373e49ff',
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
        fontSize: 12,
        paddingHorizontal: 2,
        fontWeight: Platform.select({
    ios: '300', // Deixa a variante da font cuidar no iOS
    android: 'bold' // Mantém original (leve bold no Android)
  }),
        color: '#6C757D',
        marginBottom: 8,
    },
    metricText: {
        // ... (mantido como estÃ¡)
    },
    categoryChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: -25,
        marginTop: 5,
    },
    categoryChip: {
        backgroundColor: '#E6EEF9',
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 6,
        marginBottom: -10,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
    },
    priceAndRatingSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 2,
        marginTop: 0,
    },
    priceLabel: {
        fontSize: 13,
        color: '#6C757D',
        marginBottom: -2,
    },
    priceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#838891ff',
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

    profileImage: {
        position: 'relative',
        top: -80,
        left: 30,
        width: 47,
        height: 47,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        borderRadius: 20,
        overflow: 'hidden',
        marginRight: 6,
        backgroundColor: 'transparent',
    },

    plusButton: {
        width: 36,
        height: 36,
        left: 15,
        bottom: 60,
        borderRadius: 53,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#1966f5ff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.48,
        shadowRadius: 28,
        elevation: 6,
    },
    reflectionOverlay: {
        position: 'absolute',
        width: 60,
        height: '100%',
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
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        paddingHorizontal: 2,
    },
    distanceText: {
        fontSize: 10,
        color: '#6C757D',
        marginLeft: 4,
    },
});

export default RecomendacaoCard;

