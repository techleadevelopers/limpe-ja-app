// providerStyles.ts
import { StyleSheet, Dimensions, Platform } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_HEIGHT = 380; // Altura da imagem de perfil do profissional

// --- Nova Paleta de Cores (Inspirada no Print 2) ---
const COLOR_PRIMARY = '#4A90E2'; // Um azul vibrante para ações principais e destaques (mantido)
const COLOR_ACCENT = '#ADD8E6'; // Um vermelho/rosa vibrante para o preço e coração (inspirado no Print 2)
const COLOR_BACKGROUND = '#E0F2F7'; // Fundo geral da tela, um azul muito claro e suave
const COLOR_CARD_BACKGROUND = '#FFFFFF'; // Fundo de cards e seções principais, branco puro
const COLOR_TEXT_DARK = '#212529'; // Texto principal escuro, para títulos e nomes
const COLOR_TEXT_MEDIUM = '#495057'; // Texto secundário, para descrições e informações
const COLOR_TEXT_LIGHT = '#6C757D'; // Texto terciário, para detalhes menores e datas
const COLOR_BORDER_LIGHT = '#E9ECEF'; // Bordas sutis para elementos
const COLOR_SHADOW = 'rgba(0, 0, 0, 0.08)'; // Sombra suave e discreta (reduzida)
const COLOR_ERROR = '#D32F2F'; // Cor para mensagens de erro
const COLOR_SUCCESS = '#28A745'; // Cor para status de sucesso/verificado
const COLOR_WARNING = '#FFC107'; // Cor para avisos

export const styles = StyleSheet.create({ // <--- ESTA LINHA É CRUCIAL
    screenContainer: {
        flex: 1,
    },
    centeredFeedback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLOR_BACKGROUND,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: COLOR_TEXT_MEDIUM,
    },
    errorText: {
        fontSize: 17,
        color: COLOR_ERROR,
        textAlign: 'center',
        marginBottom: 25,
    },
    errorBackButton: {
        backgroundColor: COLOR_PRIMARY,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorBackButtonText: {
        color: COLOR_CARD_BACKGROUND,
        fontSize: 16,
        marginLeft: 8,
        fontWeight: '600',
    },
    scrollContentContainer: {
        paddingBottom: 100, // Ajuste para dar espaço ao botão fixo "Agendar Serviço"
    },

    // --- Estilos para a Imagem do Provedor e o Card Principal (inspirado no Print 2) ---
    providerImageContainer: {
        width: SCREEN_WIDTH, // Ocupa a largura total para a imagem principal
        height: IMAGE_HEIGHT,
        overflow: 'hidden',
        marginTop: 0, // Ajuste para ficar no topo
        marginBottom: 0,
        alignSelf: 'center',
    },
    providerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    favoriteButton: {
        position: 'absolute',
        bottom: 15,
        right: 15,
        backgroundColor: COLOR_CARD_BACKGROUND,
        borderRadius: 30,
        padding: 10,
        shadowColor: COLOR_SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },

    // Content Area Styles (para o container principal do conteúdo abaixo da imagem)
    contentArea: {
        // paddingHorizontal: 10, // O padding horizontal será aplicado em sub-containers
        paddingTop: 20,
        backgroundColor: COLOR_CARD_BACKGROUND, // Fundo branco para o conteúdo principal
        borderTopLeftRadius: 30, // Cantos mais arredondados para a transição com a imagem
        borderTopRightRadius: 30,
        marginTop: -30, // Sobrepõe a imagem para criar o efeito de "cartão" que se estende
        minHeight: Dimensions.get('window').height * 0.5, // Garante que o conteúdo ocupe pelo menos metade da tela
        paddingBottom: 20, // Padding para o final do conteúdo
        // Adicionando sombra para o contentArea, já que o providerImageContainer foi alterado
        shadowColor: COLOR_SHADOW,
        shadowOffset: { width: 0, height: -4 }, // Sombra para cima
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
    },

    // Estilos para os botões de navegação (voltar e salvar) no topo do header
    iconButtonBackground: {
        backgroundColor: 'rgba(0,0,0,0.3)', // Fundo escuro translúcido para os botões
        padding: 10,
        borderRadius: 25, // Botões circulares
        alignItems: 'center',
        justifyContent: 'center',
        width: 45, // Tamanho fixo para botões circulares
        height: 45,
    },

    // Estilos para as informações do provedor (nome, localização, preço)
    providerInfoWhiteCard: {
        paddingHorizontal: 25, // Padding horizontal para o conteúdo principal
        marginBottom: 10,
        marginTop: -10, // Já ajustado pelo paddingTop do contentArea
    },
    providerNameRow: { // Novo estilo para a linha que contém nome e estrelas (alinhados horizontalmente)
        flexDirection: 'row',
        justifyContent: 'space-between', // Alinha nome à esquerda e estrelas à direita
        alignItems: 'center',
        marginBottom: 5,
    },
    providerNameWhiteCard: {
        fontSize: 18, // Nome maior e mais proeminente
        fontWeight: '700',
        color: COLOR_TEXT_DARK,
        flexShrink: 1, // Permite que o texto encolha se as estrelas forem muito largas
        marginRight: 10, // Espaço entre o nome e as estrelas
    },
    locationContainerWhiteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    locationTextWhiteCard: {
        fontSize: 14,
        color: COLOR_TEXT_LIGHT,
        marginLeft: 5,
    },
    priceTextWhiteCard: {
        fontSize: 22, // Preço maior e mais proeminente
        fontWeight: '700',
        color: '#4A90E2', // Preço em destaque com a nova cor de destaque (vermelho/rosa)
        marginBottom: 10,
    },

    // StarRating Styles (ajustado para ser flexível)
    robustStarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        // left: 60, // Removido ou ajustado conforme layout final
    },
    robustReviewsText: {
        fontSize: 9, // Tamanho da fonte ajustado
        color: COLOR_TEXT_LIGHT,
        marginLeft: 4, // Ajustado para ficar próximo às estrelas
        // top: 13, // Removido ou ajustado
        // right: 63, // Removido ou ajustado
        fontWeight: '500',
    },
    starIcon: {
        marginRight: 2, // Espaçamento menor entre as estrelas
    },
    starRatingContainer: {
        flexDirection: 'row',
    },

    // InfoChip Styles
    infoChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap', // Permite que os chips quebrem a linha
        gap: 8, // Espaçamento entre os chips (disponível no React Native 0.71+)
        marginBottom: 5, // Espaçamento abaixo dos chips
        paddingHorizontal: 25, // Adicionado para alinhar com outras seções
    },
    infoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        
        paddingVertical: 6, // Padding vertical um pouco maior
        paddingHorizontal: 5, // Padding horizontal um pouco maior
        borderRadius: 20, // Cantos mais arredondados
        borderWidth: 1, // Borda sutil
        borderColor: COLOR_BORDER_LIGHT,
    },
    infoChipText: {
        fontSize: 9, // Tamanho da fonte ajustado
        color: COLOR_TEXT_MEDIUM,
        marginLeft: 6,
        fontWeight: '500',
    },

    // OverviewContent & DetailsContent Common Styles
    tabContentContainer: {
        paddingHorizontal: 25, // Padding horizontal consistente para as seções
        paddingTop: 15,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLOR_TEXT_DARK,
        marginBottom: 10,
        marginTop: 15, // Espaçamento superior para títulos de seção
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 23, // Altura da linha para melhor legibilidade
        color: COLOR_TEXT_MEDIUM,
        textAlign: 'left',
        marginBottom: 25,
    },
    noReviewsText: {
        fontSize: 14,
        color: COLOR_TEXT_LIGHT,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 15,
    },
    // NOVO: Estilos para o container de "sem avaliações"
    noReviewsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        marginBottom: 20,
        backgroundColor: COLOR_BACKGROUND,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLOR_BORDER_LIGHT,
    },
    noReviewsIcon: {
        marginBottom: 10,
        opacity: 0.6,
    },
    noDetailsText: {
        fontSize: 14,
        color: COLOR_TEXT_LIGHT,
        fontStyle: 'italic',
        marginVertical: 10,
    },
    availabilityText: {
        fontSize: 14,
        lineHeight: 21,
        color: COLOR_TEXT_MEDIUM,
    },

    // ActionButtons Styles (Ligar, Chat, Mapa, Share)
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        marginBottom: 10,
        paddingHorizontal: 0, // Removido padding, os botões já têm largura ajustada
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLOR_CARD_BACKGROUND, // Fundo branco
        marginLeft: 5, // Margem esquerda para espaçamento entre os botões
        borderRadius: 15, // Cantos arredondados
        width: (SCREEN_WIDTH - 50 - 30) / 4, // Ajustado a largura para 4 botões com 25px de padding na tela e 10px de gap entre eles
        height: 60, // Altura
        borderWidth: 1, // Borda sutil
        borderColor: COLOR_BORDER_LIGHT,
        shadowColor: COLOR_SHADOW, // Sombra sutil para os botões
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonText: {
        fontSize: 10,
        color: COLOR_TEXT_MEDIUM,
        marginTop: 5,
        fontWeight: '600',
    },
    // Novos estilos para botões desabilitados
    disabledActionButton: {
        backgroundColor: '#F1F3F5', // Cor de fundo para botão desabilitado
        borderColor: '#DEE2E6',
    },
    disabledActionButtonText: {
        color: '#ADB5BD', // Cor do texto para botão desabilitado
    },

    // ReviewCard Styles
    reviewCard: {
        backgroundColor: COLOR_CARD_BACKGROUND, // Fundo branco para o card de review
        borderRadius: 15, // Cantos mais arredondados
        padding: 20, // Padding interno maior
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLOR_BORDER_LIGHT,
        shadowColor: COLOR_SHADOW, // Sombra para o card de review
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    reviewerImage: {
        width: 45, // Tamanho maior para a imagem do reviewer
        height: 45,
        borderRadius: 22.5, // Circular
        marginRight: 12,
        borderWidth: 1, // Borda sutil para a imagem
        borderColor: COLOR_BORDER_LIGHT,
    },
    reviewerImagePlaceholder: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        marginRight: 12,
        backgroundColor: COLOR_BORDER_LIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewHeaderText: {
        flex: 1,
    },
    reviewerName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLOR_TEXT_DARK,
    },
    reviewRatingDate: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    reviewDate: {
        fontSize: 12,
        color: COLOR_TEXT_LIGHT,
    },
    reviewComment: {
        fontSize: 14,
        lineHeight: 22, // Altura da linha para melhor legibilidade
        color: COLOR_TEXT_MEDIUM,
    },

    addReviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14, // Padding maior
        borderRadius: 12, // Mais arredondado
        backgroundColor: COLOR_PRIMARY + '20', // Um tom mais claro do azul para o fundo (com opacidade)
        marginTop: 20, // Mais espaço acima
        marginBottom: 20, // Mais espaço abaixo
        borderWidth: 1,
        borderColor: COLOR_PRIMARY + '50', // Borda sutil (com opacidade)
    },
    addReviewButtonText: {
        color: COLOR_PRIMARY, // Texto na cor primária
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },

    // Service Item Card Styles (para detalhes de serviços específicos)
    serviceItemCard: {
        backgroundColor: COLOR_CARD_BACKGROUND,
        padding: 15,
        borderRadius: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLOR_BORDER_LIGHT,
        shadowColor: COLOR_SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLOR_TEXT_DARK,
        marginBottom: 4,
    },
    serviceDescription: {
        fontSize: 14,
        color: COLOR_TEXT_MEDIUM,
        marginBottom: 6,
    },
    servicePriceTag: {
        fontSize: 10,
        fontWeight: '700',
        color: COLOR_PRIMARY,
        alignSelf: 'flex-end',
    },

    // BookServiceButton Styles (botão "Agendar Serviço" fixo na parte inferior)
    bookNowButtonWrapper: {
        position: 'absolute',
        bottom: 0, // Fixado na parte inferior da tela
        left: 0,
        right: 0,
        paddingHorizontal: 10,
        paddingTop: 15, // Padding superior para o conteúdo
        paddingBottom: Platform.OS === 'ios' ? 30 : 20, // Ajuste para o safe area do iOS
        backgroundColor: COLOR_CARD_BACKGROUND,
        borderTopWidth: 1,
        borderTopColor: COLOR_BORDER_LIGHT,
        shadowColor: COLOR_SHADOW,
        shadowOffset: { width: 0, height: -3 }, // Sombra para cima
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 8,
    },
    bookServiceButtonGradient: {
        borderRadius: 15, // Mais arredondado, conforme Print 2
    },
    bookServiceButton: {
        paddingVertical: 16, // Padding maior para um botão mais "clicável"
        borderRadius: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLOR_PRIMARY, // Cor primária para o botão de ação principal
    },
    bookServiceButtonText: {
        color: COLOR_CARD_BACKGROUND, // Texto branco
        fontSize: 18, // Texto maior
        fontWeight: '700',
    },
    // NOVOS ESTILOS PARA MENSAGEM DE AUSÊNCIA DE SERVIÇOS
    noServicesMessage: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLOR_WARNING + '20', // Fundo sutil de aviso (com opacidade)
        padding: 15,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLOR_WARNING + '50', // Borda sutil (com opacidade)
        elevation: 5,
    },
    noServicesMessageText: {
        color: COLOR_TEXT_DARK, // Texto escuro para melhor contraste
        fontSize: 14,
        textAlign: 'center',
    },

    // --- NOVOS ESTILOS PARA MINI SESSÃO DE FOTOS ---
    photoSectionContainer: {
        backgroundColor: COLOR_CARD_BACKGROUND,
        paddingVertical: 35,
        paddingBottom: 10,
        marginBottom: 20, // Espaço abaixo da seção de fotos
    },
    photoSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        left: 4, // Espaço à direita para o scroll horizontal
        paddingHorizontal: 25, // Alinhar com o padding de outras seções
        marginBottom: 10,
        bottom: 20, // Ajuste de margem para ficar logo abaixo da imagem principal
    },
    photoSectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLOR_TEXT_DARK,
    },
    photoSectionRating: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLOR_BACKGROUND, // Fundo claro para a avaliação
        borderRadius: 15,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    photoSectionRatingText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLOR_TEXT_MEDIUM,
        marginLeft: 5,
    },
    photoScrollView: {
        paddingLeft: 15, // Começar as fotos com o mesmo alinhamento
    },
    thumbnailContainer: {
        width: 70, // Largura da thumbnail
        height: 70, // Altura da thumbnail
        left: 15, // Espaço à direita para o scroll horizontal
        borderRadius: 10, // Bordas arredondadas para as miniaturas
        overflow: 'hidden',
        marginRight: 7, // Espaço entre as miniaturas
        borderWidth: 1,
        borderColor: COLOR_BORDER_LIGHT,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    // NOVO: Estilos para o card de ofertas (movidos para cá)
    offerCard: {
        backgroundColor: '#F8F8F8',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    offerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    offerDescription: {
        fontSize: 14,
        color: '#555',
        marginBottom: 10,
    },
    offerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    offerDiscount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#E53935', // Cor para desconto
    },
    copyCouponButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    copyCouponButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 5,
    },
});