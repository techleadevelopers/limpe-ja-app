import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next'; // Importar useTranslation

import { CLIENT_ROUTES } from '../../../../constants/routes';
import { ProviderDisplayInfo } from '../../../../types/backend/providers';
import { Icons3D } from '../../../../constants/icons3d'; // Importação do Icons3D
import { PricingType } from '../../../../types/backend/services'; // Importar PricingType
import { ProviderServiceOffering } from '../../../../types/backend/provider-service'; // Importar ProviderServiceOffering

interface RecomendacaoCardProps {
    item: ProviderDisplayInfo;
}

const RecomendacaoCard: React.FC<RecomendacaoCardProps> = ({ item }) => {
    const router = useRouter();
    const { t } = useTranslation(); // Inicializar useTranslation

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
                    size={12} 
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

    // Função para formatar o preço de um serviço específico (similar ao ProviderDetailsScreen)
    const formatServicePrice = (service: ProviderServiceOffering) => {
        let priceValue;
        let priceUnit = '';

        const rawPrice = service.price;
        // Converte o valor do Prisma Decimal para Number, se for um objeto
        const price = (typeof rawPrice === 'number') ? rawPrice : (rawPrice as any)?.toNumber?.() ?? 0;

        switch (service.pricingType) {
            case PricingType.HOURLY:
                priceValue = price;
                priceUnit = t('common.per_hour_short'); // Usando tradução
                break;
            case PricingType.BY_SIZE:
                // Prioriza pricePerSquareMeter se disponível e > 0
                const rawPricePerSqm = service.pricePerSquareMeter;
                const pricePerSqm = (typeof rawPricePerSqm === 'number') ? rawPricePerSqm : (rawPricePerSqm as any)?.toNumber?.() ?? 0;
                priceValue = pricePerSqm > 0 ? pricePerSqm : price; // Fallback para price
                priceUnit = t('common.per_sqm_short'); // Usando tradução
                break;
            case PricingType.FIXED_PRICE:
            case PricingType.CUSTOM_QUOTE:
            default:
                priceValue = price;
                priceUnit = ''; // Sem unidade para preço fixo ou customizado
                break;
        }

        return priceValue !== undefined && priceValue !== null && priceValue > 0
            ? `R$ ${priceValue.toFixed(2).replace('.', ',')}${priceUnit}`
            : t('provider_details.price_not_available');
    };

    // Obter o primeiro serviço do provedor para ser o preço principal exibido
    const firstProviderService = item.providerServices && item.providerServices.length > 0
        ? item.providerServices[0]
        : undefined;

    const mainDisplayedPrice = firstProviderService
        ? formatServicePrice(firstProviderService)
        : t('provider_details.price_not_available');

    // Lógica para encontrar o menor preço por hora (para exibir separadamente se o principal não for por hora)
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
        // Prioriza o nome do serviço do primeiro serviço oferecido
        if (item.providerServices[0].service?.name) {
            categoriesToDisplay.push(item.providerServices[0].service.name);
        }
    }
    // Fallback para descrição ou "Limpeza Geral"
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
                    {/* O nome do prestador agora está sozinho neste container */}
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
                            {/* Preço principal (do primeiro serviço, formatado) */}
                            <Text style={styles.priceLabel}>A partir de</Text>
                            <Text style={styles.priceValue}>{mainDisplayedPrice}</Text>
                            
                            {/* Exibir o menor preço por hora, se houver e se o preço principal não for por hora */}
                            {minHourlyPrice !== null && !mainPriceIsHourly && (
                                <Text style={styles.hourlyPriceValue}>
                                    {t('common.or')} R$ {minHourlyPrice.toFixed(2).replace('.', ',')}/h
                                </Text>
                            )}
                        </View>

                        <View style={styles.ratingSection}>
                            <LinearGradient
                                colors={['#67adfd95', '#5c93ec','#5c93ec36']}
                                style={styles.plusButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="add" size={18} color="#fff" />
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
        width: 160,
        marginRight: 15,
        marginBottom: 5,
        borderRadius: 12,
        overflow: 'visible',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 7 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // Sombra para Android
    },
    cardContentWrapper: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden', // Mantém o conteúdo interno do card dentro dos limites
        
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
    // Container para o nome do prestador (agora sem o ícone ao lado no fluxo)
    providerNameContainer: {
        flexDirection: 'row', // Mantido como row caso queira adicionar algo no futuro
        alignItems: 'center',
        marginBottom: 4,
    },
    providerName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2D3748',
        // marginRight removido, pois o ícone não está mais no fluxo
        flexShrink: 1, // Permite que o texto encolha se for muito longo
    },
    // NOVO: Estilo para o ícone docCheck2 com posicionamento absoluto
    docCheckIcon: {
        position: 'absolute', // Posicionamento absoluto
        top: 2, // Ajuste este valor para mover o ícone verticalmente
        right: 5, // Ajuste este valor para mover o ícone horizontalmente
        width: 30, // Largura fixa
        height: 30, // Altura fixa
        resizeMode: 'contain', // Garante que o ícone inteiro seja visível dentro das dimensões
        zIndex: 1, // Garante que o ícone fique acima de outros elementos se houver sobreposição
    },

    
    serviceDescription: {
        fontSize: 9,
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
    // NOVO: Estilo para o preço por hora
    hourlyPriceValue: {
        fontSize: 11, // Um pouco menor que o preço principal
        fontWeight: 'normal',
        color: '#6C757D', // Uma cor mais suave
        marginTop: 2, // Espaçamento em relação ao preço "A partir de"
    },
    ratingSection: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    plusButton: {
        width: 28,
        height: 28,
        left: 12,
        bottom: 28,
        borderRadius: 53,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#212223ff', // Esta cor está em hexadecimal, mas o resto é rgba. Mantenha a consistência.
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