import { StyleSheet, Dimensions, Platform } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_HEIGHT = 320; // Altura da imagem de perfil do profissional

// --- Nova Paleta de Cores (Inspirada no Print 2) ---
const COLOR_PRIMARY = '#4A90E2'; // Um azul vibrante para ações principais e destaques (mantido)
const COLOR_ACCENT = '#FF6347'; // Um vermelho/rosa vibrante para o preço e coração (inspirado no Print 2)
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

export const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
       
    },
    centeredFeedback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
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
        paddingBottom: 10, // Espaço para o botão "Agendar Serviço" fixo na parte inferior
        // paddingTop: IMAGE_HEIGHT * 0.7, // Ajuste para que o conteúdo comece abaixo da imagem
    },

    // --- Estilos para a Imagem do Provedor e o Card Principal (inspirado no Print 2) ---
    providerImageContainer: {
        width: SCREEN_WIDTH - 6, // Largura total da tela menos 20 de margem em cada lado
        height: IMAGE_HEIGHT,
        borderBottomLeftRadius: 30, // Cantos mais arredondados para um visual moderno
        overflow: 'hidden', // Garante que a imagem respeite o borderRadius
        marginTop: Platform.OS === 'ios' ? 2: 1,// Ajuste para ficar abaixo do header customizado
        marginBottom: 0, // Permite que o contentArea sobreponha a imagem
        marginHorizontal: 20, // Margem nas laterais
        alignSelf: 'center', // Centraliza o container da imagem
        shadowColor: COLOR_SHADOW, // Sombra suave para o efeito de "card flutuante"
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
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
        paddingHorizontal: 10, // O padding horizontal será aplicado em sub-containers
        paddingTop: 20, //2, // Ajuste para o conteúdo começar abaixo da parte sobreposta da imagem
        backgroundColor: COLOR_CARD_BACKGROUND, // Fundo branco para o conteúdo principal
        borderTopLeftRadius: 30, // Cantos mais arredondados para a transição com a imagem
        borderTopRightRadius: 30,
        marginTop: 0, // Sobrepõe a imagem para criar o efeito de "cartão" que se estende
        minHeight: Dimensions.get('window').height * 0.5, // Garante que o conteúdo ocupe pelo menos metade da tela
        paddingBottom: 20, // Padding para o final do conteúdo
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
        color: COLOR_ACCENT, // Preço em destaque com a nova cor de destaque (vermelho/rosa)
        marginBottom: 10,
    },

    // StarRating Styles (ajustado para ser flexível)
    robustStarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        left: 60,
    },
    robustReviewsText: {
        fontSize: 9, // Tamanho da fonte ajustado
        color: COLOR_TEXT_LIGHT,
        marginLeft: -8,
        top: 13,
        right: 63,
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
    },
    infoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLOR_BACKGROUND, // Fundo do chip mais claro
        paddingVertical: 8, // Padding vertical um pouco maior
        paddingHorizontal: 15, // Padding horizontal um pouco maior
        borderRadius: 20, // Cantos mais arredondados
        borderWidth: 1, // Borda sutil
        borderColor: COLOR_BORDER_LIGHT,
    },
    infoChipText: {
        fontSize: 12, // Tamanho da fonte ajustado
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
        marginTop: 20,
        marginBottom: 30,
        paddingHorizontal: 0, // Removido padding, os botões já têm largura ajustada
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLOR_CARD_BACKGROUND, // Fundo branco
        borderRadius: 15, // Cantos arredondados
        width: (SCREEN_WIDTH - 50 - 30) / 4, // Ajustado a largura para 4 botões com 25px de padding na tela e 10px de gap entre eles
        height: 70,
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
        fontSize: 13,
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
        fontSize: 14,
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
        paddingHorizontal: 20,
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
});