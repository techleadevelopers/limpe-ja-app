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
    cancelAnimation
} from 'react-native-reanimated';

import { CLIENT_ROUTES } from '../../../../constants/routes';
import { ProviderDisplayInfo } from '../../../../types/backend/providers';
import { Icons3D } from '../../../../constants/icons3d';
import { PricingType } from '../../../../types/backend/services';
import { ProviderServiceOffering } from '../../../../types/backend/provider-service';

const AnimatedCardBackground = AnimatedReanimated.createAnimatedComponent(LinearGradient);
const AnimatedPlusButtonGradient = AnimatedReanimated.createAnimatedComponent(LinearGradient);

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

    // --- Nova animação para o efeito de hover (apenas escala) ---
    const hoverScaleAnim = useRef(new Animated.Value(1)).current; // 1: estado normal

    const onPressInCard = () => {
        Animated.spring(hoverScaleAnim, {
            toValue: 1.03, // Leve zoom de 3% ao "hover"
            useNativeDriver: true,
            friction: 5, // Mais "mola" para um efeito mais vivo
            tension: 100, // Retorno rápido
        }).start();
    };

    const onPressOutCard = () => {
        Animated.spring(hoverScaleAnim, {
            toValue: 1, // Retorna ao estado normal
            useNativeDriver: true,
            friction: 5,
            tension: 100,
        }).start();
    };
    // --- Fim da nova animação ---

    // --- Animação do Reflexo no Botão Plus ---
    const reflectionTranslateX = useSharedValue(-60);

    useEffect(() => {
        reflectionTranslateX.value = withRepeat(
            withTiming(38 + 60, { // Ajustado para cobrir toda a largura do botão + reflexo
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
    // --- Fim da Animação do Reflexo ---

    // --- Animação do Tremor Sutil no Botão Plus (replicando o efeito do CarouselBannerItem) ---
    const subtleTrembleValue = useSharedValue(0);

    useEffect(() => {
        const SHAKE_AMOUNT = 0.5; // 0.5 pixels para um movimento muito sutil
        const SHAKE_DURATION = 50; // 50ms para um movimento rápido

        subtleTrembleValue.value = withRepeat(
            withSequence(
                // Move ligeiramente para um lado (ex: direita/baixo)
                withTiming(SHAKE_AMOUNT, { duration: SHAKE_DURATION, easing: Easing.linear }),
                // Move para o lado oposto (ex: esquerda/cima)
                withTiming(-SHAKE_AMOUNT, { duration: SHAKE_DURATION, easing: Easing.linear }),
                // Retorna ao centro
                withTiming(0, { duration: SHAKE_DURATION, easing: Easing.linear }),
                // Pausa de 4 segundos antes de repetir
                withTiming(0, { duration: 4000, easing: Easing.linear })
            ),
            -1, // Repete indefinidamente
            false // Não inverte a sequência
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
    // --- Fim da Animação do Tremor Sutil ---

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
        <AnimatedCardBackground
            colors={['#FDFEFF', '#F0F4F8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            // Aplica o estilo de escala para o hover
            style={[styles.animatedCardContainer, { transform: [{ scale: hoverScaleAnim }] }]}
        >
            <TouchableOpacity
                style={styles.cardContentWrapper}
                onPress={handleCardPress}
                onPressIn={onPressInCard} // Usa o novo handler para o zoom
                onPressOut={onPressOutCard} // Usa o novo handler para o zoom
                activeOpacity={1} // Desabilita a opacidade padrão do TouchableOpacity para que a animação seja controlada
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
                            <AnimatedPlusButtonGradient
                                colors={['#67adfdec', '#5c93ec','#5c93ec92']}
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
                                <Text style={styles.reviewsCountText}>
                                    {item.reviewCount === 0 ? 'Sem Avaliações' : `${item.reviewCount} Avaliações`}
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
        width: 170,
        marginRight: 15,
        marginBottom: 5,
        marginTop: 8,
        overflow: 'hidden',
        
        borderTopStartRadius: 22,
        borderBottomStartRadius: 22,
        borderTopEndRadius: 22,
        borderBottomEndRadius: 22,
        borderBottomColor: '#45484b56',

        borderRadius: 12,
        borderBottomWidth: 0.1,
        borderLeftColor: '#45484b56',
        borderLeftWidth: 1,
        // Propriedades de sombra mantidas exatamente como fornecidas
        shadowColor: '#45484b56', // Cor da sombra
        shadowOffset: { width: -1, height: 1 }, // Deslocamento vertical mais pronunciado
        shadowOpacity: 1.55, // Opacidade aumentada para robustezs
        shadowRadius: 20, // Raio de desfoque para conforto
        elevation: 6, // Elevação aumentada para robustez no Android
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
        // ... (mantido como está)
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
        shadowColor: '#000', // Cor da sombra
        shadowOffset: { width: 7, height: 14 }, // Deslocamento vertical mais pronunciado
        shadowOpacity: 0.28, // Opacidade aumentada para robustez
        shadowRadius: 15, // Raio de desfoque para conforto
        elevation: 6, // Elevação aumentada para robustez no Android
    },
    reflectionOverlay: {
        position: 'absolute',
        width: 60, // Largura do reflexo
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
});

export default RecomendacaoCard;