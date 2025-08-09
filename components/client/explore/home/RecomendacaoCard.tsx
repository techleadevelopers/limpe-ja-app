// src/app/(client)/explore/components/home/RecomendacaoCard.tsx

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CLIENT_ROUTES } from '../../../../constants/routes';
import { ProviderDisplayInfo } from '../../../../types/backend/providers';

// 1. Importa a imagem
const limpIcon = require('../../../../assets/images/limp-Photoroom.png');

interface RecomendacaoCardProps {
    item: ProviderDisplayInfo;
}

const RecomendacaoCard: React.FC<RecomendacaoCardProps> = ({ item }) => {
    const router = useRouter();

    if (!item || !item.id || !item.fullName) {
        console.warn('[RecomendacaoCard] Item inválido ou incompleto. Render ignorado:', item);
        return null;
    }

    // Animação de escala ao tocar o card
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

    // Função para renderizar as estrelas de avaliação
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
                    size={14}
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

    // --- CORREÇÃO NA LÓGICA DA IMAGEM ---
    // A imagem padrão deve ser um objeto `require` para ser corretamente processada pelo Metro Bundler
    const avatarSource = item.avatarUrl
        ? { uri: item.avatarUrl }
        : require('../../../../assets/images/default-avatar.png');

    // --- CORREÇÃO NA LÓGICA DO PREÇO ---
    const averagePrice = item.providerServices && item.providerServices.length > 0
        ? item.providerServices.reduce((sum, service) => {
            // Lógica para extrair o valor do preço de qualquer um dos campos possíveis
            let priceValue = 0;
            if (service.price && typeof service.price === 'object' && 'toNumber' in service.price) {
                priceValue = (service.price as any).toNumber();
            } else if (typeof service.price === 'number') {
                priceValue = service.price;
            }

            let pricePerRoomValue = 0;
            if (service.pricePerRoom && typeof service.pricePerRoom === 'object' && 'toNumber' in service.pricePerRoom) {
                pricePerRoomValue = (service.pricePerRoom as any).toNumber();
            } else if (typeof service.pricePerRoom === 'number') {
                pricePerRoomValue = service.pricePerRoom;
            }

            let pricePerSquareMeterValue = 0;
            if (service.pricePerSquareMeter && typeof service.pricePerSquareMeter === 'object' && 'toNumber' in service.pricePerSquareMeter) {
                pricePerSquareMeterValue = (service.pricePerSquareMeter as any).toNumber();
            } else if (typeof service.pricePerSquareMeter === 'number') {
                pricePerSquareMeterValue = service.pricePerSquareMeter;
            }
            
            // Retorna o primeiro valor de preço válido que encontrar
            return sum + (priceValue || pricePerRoomValue || pricePerSquareMeterValue);
        }, 0) / item.providerServices.length
        : 0;
    
    // --- Lógica para exibir categorias (Tags) ---
    const categoriesToDisplay: string[] = [];
    if (item.providerServices && item.providerServices.length > 0) {
        // CORREÇÃO: Acessa service.name em vez de serviceType
        if (item.providerServices[0].service?.name) {
            categoriesToDisplay.push(item.providerServices[0].service.name);
        }
    }
    // Fallback para categorias se não houver serviços ou service.name
    if (categoriesToDisplay.length === 0) {
        if (item.bio?.toLowerCase().includes('comercial')) categoriesToDisplay.push('Comercial');
        if (item.bio?.toLowerCase().includes('escritórios')) categoriesToDisplay.push('Escritório');
        // Adicione mais fallbacks genéricos se necessário
        if (categoriesToDisplay.length === 0) {
            categoriesToDisplay.push('Limpeza Geral'); // Categoria padrão se nada for encontrado
        }
    }
    const displayedCategories = categoriesToDisplay.slice(0, 2); // Limita a 2 categorias

    return (
        <Animated.View style={[styles.animatedCardContainer, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity 
                style={styles.cardContentWrapper} 
                onPress={handleCardPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={0.8}
            >
                {/* Área da Imagem */}
                <View style={styles.imageWrapper}>
                    <Image source={avatarSource} style={styles.cardImage} />
                </View>

                {/* Área de Conteúdo */}
                <View style={styles.infoContainer}>
                    <Text style={styles.providerName} numberOfLines={1}>{item.fullName}</Text>
                    
                    <Text style={styles.serviceDescription} numberOfLines={2}>
                        {item.bio || "Nenhuma descrição disponível."}
                    </Text>

                    {/* Tags/Chips de Categoria */}
                    <View style={styles.categoryChipsContainer}>
                        {displayedCategories.map((category, index) => (
                            <View key={index} style={styles.categoryChip}>
                                <Text style={styles.categoryChipText}>{category}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Preço e Avaliação */}
                    <View style={styles.priceAndRatingSection}>
                        <View>
                            <Text style={styles.priceLabel}>A partir de</Text>
                            {averagePrice > 0 ? (
                                <Text style={styles.priceValue}>R$ {averagePrice.toFixed(2).replace('.', ',')}</Text>
                            ) : (
                                <Text style={styles.priceValue}>R$ N/A</Text>
                            )}
                        </View>
                        
                        {/* Avaliação em Estrelas e Contagem de Avaliações */}
                        <View style={styles.ratingSection}>
                            {/* 2. Adiciona a imagem acima das estrelas */}
                            <Image
                                source={limpIcon}
                                style={styles.limpIcon}
                            />
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

// --- ESTILOS DO COMPONENTE ---
const styles = StyleSheet.create({
    animatedCardContainer: {
        // Estilos para o container animado que encapsula o card
        // REDUZIDO A LARGURA PARA 220
        width: 220, // **MODIFICADO: Largura total do card, reduzida de 250 para 220**
        marginRight: 15, // Espaçamento entre os chips
        marginBottom: 15, // Espaçamento vertical entre as linhas de cards
        borderRadius: 12, // Borda arredondada geral do card
        overflow: 'visible', // Necessário para a sombra ser renderizada
        backgroundColor: '#FFFFFF', // Fundo do card
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 }, // Sombra mais para baixo
                shadowOpacity: 0.1, // Sombra sutil
                shadowRadius: 8, // Espalhamento da sombra
            },
            android: {
                elevation: 5, // Elevação para Android
            },
        }),
    },
    cardContentWrapper: {
        width: '100%', // Ocupa toda a largura do animatedCardContainer
        borderRadius: 12,
        overflow: 'hidden', // Importante para que a imagem respeite o borderRadius
 
    },
    imageWrapper: {
        width: '100%',
        height: 150, // Altura da imagem, ajustado para a imagem de referência
        backgroundColor: '#E0E0E0', // Fundo padrão para imagem não carregada
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    likeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1, // Para garantir que fique acima da imagem
    },
    infoContainer: {
        padding: 12, // Padding interno para o conteúdo textual
    },
    providerName: {
        fontSize: 18, // Fonte maior para o nome do provedor
        fontWeight: 'bold',
        color: '#2D3748', // Cor escura para o texto principal
        marginBottom: 4,
        marginTop: 0, // Espaço acima do nome
    },
    serviceDescription: {
        fontSize: 12, // Tamanho menor para a descrição/bio
        color: '#6C757D', // Cinza médio para a descrição
        marginBottom: 15,
        marginTop: 0, // Espaço acima da descrição
    },
    // --- ESTILOS PARA AS TAGS/CHIPS DE CATEGORIA ---
    categoryChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: -48, // Espaço abaixo dos chips
    },
    categoryChip: {
        backgroundColor: '#E6EEF9', // Fundo azul claro para o chip
        borderRadius: 5, // Bordas levemente arredondadas
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 6, // Espaçamento entre os chips
        marginBottom: 4,
    },
    categoryChipText: {
        fontSize: 10, // Texto pequeno para o chip
        fontWeight: '500',
        color: '#000000', // **MODIFICADO: Cor do texto do chip para preto**
    },
    // --- SEÇÃO DE PREÇO E AVALIAÇÃO ---
    priceAndRatingSection: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Alinha preço à esquerda, avaliação à direita
        alignItems: 'flex-end', // Alinha os itens pela base
        marginTop: 8, // Espaço acima desta seção
    },
    priceLabel: {
        fontSize: 12,
        color: '#6C757D',
        marginBottom: 2, // Pequeno espaço entre label e valor
    },
    priceValue: {
        fontSize: 18, // Tamanho grande para o valor
        fontWeight: 'bold',
        color: '#2D3748', // Cor escura para o preço
    },
    noPriceText: {
        fontSize: 14,
        color: '#888',
    },
    ratingSection: {
        // Alinhamento para a imagem e as estrelas
        flexDirection: 'column', // Adicionado para empilhar os itens verticalmente
        alignItems: 'center',    // Centraliza os itens horizontalmente
    },
    // 3. Adiciona o estilo para a imagem limp.png
    limpIcon: {
        width: 76,
        height: 106,
        resizeMode: 'contain',
        right: 5,
        top: 4,
        marginBottom: 0,
    },
    ratingStarContainer: {
        flexDirection: 'row',
        marginBottom: 2, // Espaço entre estrelas e texto de avaliações
    },
    ratingStarIcon: {
        marginRight: 2, // Espaçamento entre as estrelas
    },
    reviewsCountText: {
        fontSize: 11, // Tamanho pequeno para o texto de avaliações
        color: '#6C757D', // Cinza médio
    },
});

export default RecomendacaoCard;