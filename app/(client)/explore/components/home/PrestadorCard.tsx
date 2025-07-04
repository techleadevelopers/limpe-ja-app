// app/(client)/explore/components/home/PrestadorCard.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';

// Importa ProviderDisplayInfo diretamente do caminho correto
import { ProviderDisplayInfo } from '../../../../types/backend/providers';

const SCREEN_WIDTH = Dimensions.get('window').width; // Mantido, mas PrestadorCard não usará diretamente

interface PrestadorCardProps {
    item: ProviderDisplayInfo;
    onPress: (prestadorId: string) => void;
}

const PrestadorCard: React.FC<PrestadorCardProps> = ({ item, onPress }) => {
    // Animações existentes para entrada do card
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

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

    // Animação de feedback ao tocar
    const onPressInCard = () => {
        Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, friction: 8, tension: 100 }).start();
    };

    const onPressOutCard = () => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }).start();
    };

    // Função para renderizar as estrelas de avaliação (ajustadas para tamanho menor)
    const renderStars = (rating: number | undefined) => {
        const stars = [];
        const actualRating = rating ?? 0; // Use ?? para lidar com undefined
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
                    size={12} // Estrelas bem pequenas
                    color="#FFC107" // Amarelo vibrante
                    style={styles.starIcon}
                />
            );
        }
        return <View style={styles.starContainer}>{stars}</View>;
    };

    // Extrai a especialidade e o preço do primeiro serviço oferecido
    const primaryService = item.providerServices && item.providerServices.length > 0 ? item.providerServices[0] : null;
    const specialtyName = primaryService && primaryService.service ? primaryService.service.name : 'Serviço';
    const servicePrice = primaryService ? `R$ ${primaryService.price.toFixed(2).replace('.', ',')}` : 'Consultar';

    // Fonte da imagem do avatar do provedor, com fallback
    const avatarSource = item.avatarUrl ? { uri: item.avatarUrl } : require('../../../../../assets/images/default-avatar.png');

    return (
        <Animated.View style={[styles.animatedCardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            <TouchableOpacity
                style={styles.cardContainer}
                onPress={() => onPress(item.id)} // item.id existe em ProviderDisplayInfo
                onPressIn={onPressInCard}
                onPressOut={onPressOutCard}
                activeOpacity={0.8} // Opacidade ao tocar
            >
                {/* Imagem do Prestador (Circular) */}
                <View style={styles.imageWrapper}>
                    <Image source={avatarSource} style={styles.cardImage} />
                </View>

                {/* Detalhes do Prestador */}
                <View style={styles.detailsContent}>
                    <Text style={styles.providerName} numberOfLines={1}>{item.fullName}</Text>
                    <Text style={styles.specialtyText} numberOfLines={1}>{specialtyName}</Text>
                    
                    {/* Linha de Avaliação (opcional se não quiser mostrar na lista curta) */}
                    {item.averageRating !== undefined && item.reviewCount !== undefined && (
                        <View style={styles.ratingRow}>
                            {renderStars(item.averageRating)}
                            {item.reviewCount > 0 && <Text style={styles.reviewsText}>({item.reviewCount})</Text>}
                        </View>
                    )}

                    <Text style={styles.priceText}>{servicePrice}</Text>
                </View>

                {/* Botão de Navegação "Ir para Perfil" */}
                <TouchableOpacity style={styles.goButton}>
                    <Ionicons name="arrow-forward-sharp" size={20} color="#FFF" />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

// --- ESTILOS DO COMPONENTE ---
const styles = StyleSheet.create({
    animatedCardContainer: {
        marginRight: 12, // Espaçamento entre os cards horizontais
        marginBottom: 10, // Margem inferior se a FlatList for vertical
        borderRadius: 12, // Bordas suaves
        overflow: 'visible', // Permite que a sombra seja renderizada corretamente
        // Sombras suaves e profundas
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
        flexDirection: 'row', // Layout horizontal
        alignItems: 'center',
        width: 280, // Largura fixa para o card horizontal, como a referência
        backgroundColor: '#FFFFFF',
        borderRadius: 12, // Borda arredondada consistente
        padding: 10, // Padding interno do card
    },
    imageWrapper: {
        width: 60, // Tamanho da imagem
        height: 60,
        borderRadius: 30, // Deixa a imagem circular
        overflow: 'hidden', // Importante para o borderRadius
        marginRight: 12, // Espaçamento entre imagem e texto
        backgroundColor: '#E0E0E0', // Cor de fundo para fallback
        borderWidth: 1, // Borda sutil para a imagem
        borderColor: '#F0F0F0',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    detailsContent: {
        flex: 1, // Ocupa o espaço restante
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
        color: '#007AFF', // Azul primário
    },
    goButton: {
        backgroundColor: '#1A73E8', // Azul do Google
        borderRadius: 25, // Botão circular
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 15, // Espaçamento entre o texto e o botão
        // Sombra sutil para o botão de ação
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